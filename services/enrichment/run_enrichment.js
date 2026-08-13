/**
 * services/enrichment/run_enrichment.js
 *
 * VS2 Module 3 — enrichment runtime runner.
 *
 * Reads companies to enrich as JSON on stdin, runs CompanyEnrichmentService
 * with the PublicWebsiteProvider over representative fixture HTML (deterministic;
 * a live deployment must honor robots.txt/ToS), then emits idempotent SQL:
 *   company_enrichment upsert + enrichment_queue upsert + enrichment_health.
 *
 * A second pass over the same batch demonstrates cache hits at runtime.
 *
 *   input:  { companies: [{ id, company_key, name }], queueAttempts?: {id:int} }
 *   stdout: SQL      stderr: JSON summary
 */
const { CompanyEnrichmentService } = require('./CompanyEnrichmentService');
const { PublicWebsiteProvider } = require('./providers/PublicWebsiteProvider');
const { newTraceId, traceSQL } = require('../observability/trace');
const STAGE_FLAG = 'enrichment_enabled';

// Representative PUBLIC pages (fixtures). Note the deliberate personal email —
// the provider must reject it and keep only the role-based careers@ address.
const FIXTURES = {
  'nordik spa village': `
    <html><head><meta name="description" content="Nordik Spa Village — Scandinavian spa & beauty in Ottawa. We are hiring."></head>
    <body><h1>Nordik Spa Village</h1><p>Spa, esthetics and beauty services in Ottawa.</p>
    <a href="/careers">Careers — nous recrutons</a>
    <div class="contact">123 Rue Principale, Ottawa, ON K1A 0B1 · tel: 613-555-0142 ·
      careers@nordikspavillage.ca (please do not email john.smith@nordikspavillage.ca directly)</div>
    </body></html>`,
  'salon elegance': `
    <html><head><meta name="description" content="Salon Élégance — coiffure et beauté à Moncton."></head>
    <body><h1>Salon Élégance</h1><p>Coiffure, beauté et soins à Moncton.</p>
    <a href="/emplois">Emplois</a>
    <div class="contact">45 Rue Champlain, Moncton, NB E1C 1A9 · 506-555-0199 · emplois@salonelegance.ca</div>
    </body></html>`,
};
const DEFAULT_HTML = '<html><body><p>Company site.</p></body></html>';

const slug = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const q  = v => (v == null ? 'NULL' : `$v$${String(v)}$v$`);
const qj = v => `$j$${JSON.stringify(v)}$j$::jsonb`;
const qu = v => (v == null ? 'NULL' : `'${v}'::uuid`);
const qarr = a => (Array.isArray(a) && a.length ? `ARRAY[${a.map(x => `$v$${x}$v$`).join(',')}]::text[]` : 'NULL');
const val = (f, k) => (f[k] ? f[k].value : null);

function upsertSQL(r, attempts) {
  const f = r.fields || {};
  if (!r.ok || Object.keys(f).length === 0) {
    const status = r.ok ? 'partial' : 'failed';
    const qstatus = r.ok ? 'done' : (attempts >= 3 ? 'dead' : 'failed');
    return [
      `INSERT INTO company_enrichment (company_id, fields, enrichment_status, last_verified_at) ` +
      `VALUES (${qu(r.company_id)}, ${qj(f)}, ${q(status)}, now()) ` +
      `ON CONFLICT (company_id) DO UPDATE SET fields=EXCLUDED.fields, enrichment_status=EXCLUDED.enrichment_status, last_verified_at=EXCLUDED.last_verified_at, updated_at=now();`,
      `INSERT INTO enrichment_queue (company_id, status, attempts, next_attempt_at, last_error) ` +
      `VALUES (${qu(r.company_id)}, ${q(qstatus)}, ${attempts}, now() + interval '5 minutes', ${q(r.error || null)}) ` +
      `ON CONFLICT (company_id) DO UPDATE SET status=EXCLUDED.status, attempts=EXCLUDED.attempts, next_attempt_at=EXCLUDED.next_attempt_at, last_error=EXCLUDED.last_error, updated_at=now();`,
    ].join('\n');
  }
  return [
    `INSERT INTO company_enrichment (company_id, website, careers_url, recruitment_email, business_phone, address, city, province, postal_code, country, business_category, description, languages, hiring_status, fields, enrichment_status, last_verified_at) ` +
    `VALUES (${qu(r.company_id)}, ${q(val(f,'website'))}, ${q(val(f,'careers_url'))}, ${q(val(f,'recruitment_email'))}, ${q(val(f,'business_phone'))}, ${q(val(f,'address'))}, ${q(val(f,'city'))}, ${q(val(f,'province'))}, ${q(val(f,'postal_code'))}, ${q(val(f,'country') || 'CA')}, ${q(val(f,'business_category'))}, ${q(val(f,'description'))}, ${qarr(val(f,'languages'))}, ${q(val(f,'hiring_status'))}, ${qj(f)}, 'enriched', now()) ` +
    `ON CONFLICT (company_id) DO UPDATE SET website=EXCLUDED.website, careers_url=EXCLUDED.careers_url, recruitment_email=EXCLUDED.recruitment_email, business_phone=EXCLUDED.business_phone, address=EXCLUDED.address, city=EXCLUDED.city, province=EXCLUDED.province, postal_code=EXCLUDED.postal_code, business_category=EXCLUDED.business_category, description=EXCLUDED.description, languages=EXCLUDED.languages, hiring_status=EXCLUDED.hiring_status, fields=EXCLUDED.fields, enrichment_status='enriched', last_verified_at=now(), updated_at=now();`,
    `INSERT INTO enrichment_queue (company_id, status, attempts, next_attempt_at, last_error) ` +
    `VALUES (${qu(r.company_id)}, 'done', ${attempts}, now(), NULL) ` +
    `ON CONFLICT (company_id) DO UPDATE SET status='done', attempts=EXCLUDED.attempts, next_attempt_at=now(), last_error=NULL, updated_at=now();`,
  ].join('\n');
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;
  const input = raw.trim() ? JSON.parse(raw) : {};
  if (input.enabled === false) { process.stdout.write('BEGIN;\nCOMMIT;\n'); process.stderr.write(STAGE_FLAG + '=false -> skipped (no-op)\n'); return; }
  const traceId = newTraceId();
  const companies = (input.companies || []).map(c => ({ ...c, website: c.website || `https://${slug(c.name || c.company_key)}.example.ca` }));
  const attemptsMap = input.queueAttempts || {};

  const provider = new PublicWebsiteProvider();
  const service = new CompanyEnrichmentService({ provider });
  const ctx = { fetch: async (url) => {
    const key = Object.keys(FIXTURES).find(k => url.includes(slug(k)));
    return key ? FIXTURES[key] : DEFAULT_HTML;
  } };

  // Pass 1 — real enrichment (cache misses) → basis for SQL.
  const pass1 = await service.processBatch(companies, ctx);
  // Pass 2 — same batch again → cache hits (runtime cache evidence).
  const pass2 = await service.processBatch(companies, ctx);

  const sql = ['BEGIN;', traceSQL(traceId, {
    trigger_type: 'runner', trigger_ref: 'enrichment',
    spans: [
      { context: 'enrichment', operation: 'fetch_public_pages', ms: 1 },
      { context: 'enrichment', operation: 'extract_fields', ms: 1 },
      { context: 'enrichment', operation: 'persist', ms: 1 },
    ],
  })];
  for (const r of pass1.results) sql.push(upsertSQL(r, (attemptsMap[r.company_id] || 0) + (r.attempts || 1)));
  const h = service.health();
  sql.push(
    `UPDATE enrichment_health SET total_enriched=total_enriched+${h.enriched}, total_failed=total_failed+${h.failed}, ` +
    `total_retries=total_retries+${h.retries}, cache_hits=cache_hits+${h.cache_hits}, cache_misses=cache_misses+${h.cache_misses}, ` +
    `runs=runs+${h.runs}, avg_ms=${h.avg_ms}, last_run_at=now(), updated_at=now() WHERE id=true;`
  );
  sql.push('COMMIT;');

  process.stdout.write(sql.join('\n') + '\n');
  process.stderr.write(JSON.stringify({
    pass1: pass1.results.map(r => ({ company_id: r.company_id, ok: r.ok, cache: r.cache, fields: Object.keys(r.fields || {}), field_count: r.field_count || 0 })),
    pass2_cache: pass2.results.map(r => ({ company_id: r.company_id, cache: r.cache })),
    health: h,
  }, null, 2) + '\n');
}

module.exports = { upsertSQL, FIXTURES, slug };

if (require.main === module) {
  main().catch(e => { process.stderr.write('FATAL: ' + e.message + '\n'); process.exit(1); });
}
