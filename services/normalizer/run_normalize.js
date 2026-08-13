/**
 * services/normalizer/run_normalize.js
 *
 * VS2 — Normalization pipeline: raw → cleaned.
 *
 * `planNormalization()` is the single, pure source of truth (unit/integration
 * tested). `renderSQL()` turns a plan into SQL that is applied to the isolated
 * Supabase project via psql — same dependency-free pattern as VS1's seed step.
 *
 * Pipeline per raw job:
 *   normalize (province/city/salary/title/company)
 *   → resolve/create company (companies + company_identities)
 *   → detect cross-provider duplicate (dedup_key)
 *   → UPDATE jobs (pipeline_status raw → cleaned | duplicate)
 *   → emit job.cleaned event (outbox)
 *
 * CLI:  node run_normalize.js < input.json   (prints SQL to stdout)
 *   input.json = { rawJobs:[...], identities:[{normalized_name,company_id}], dedupKeys:[...] }
 */

const crypto = require('crypto');
const { normalizeJob } = require('./normalize');

const PARSER_VERSION = '1.0.0';

/** Pure planner — deterministic given its inputs (uuids aside). */
function planNormalization({ rawJobs = [], identities = [], dedupKeys = [] } = {}) {
  const idMap = new Map(identities.map(i => [i.normalized_name, i.company_id]));
  const seen = new Set(dedupKeys);
  const plan = { companies: [], identities: [], jobUpdates: [], events: [], metrics: {} };

  for (const job of rawJobs) {
    const n = normalizeJob(job);

    // ── resolve or create company ──
    let companyId = n.company_key ? idMap.get(n.company_key) || null : null;
    if (n.company_key && !companyId) {
      companyId = crypto.randomUUID();
      idMap.set(n.company_key, companyId);
      plan.companies.push({ id: companyId, name: n.company_clean, city: n.city, province: n.province });
      plan.identities.push({
        company_id: companyId, raw_name: job.company_raw, normalized_name: n.company_key,
        city: n.city, province: n.province, source: job.source || 'jobbank',
      });
    }

    // ── cross-provider dedup ──
    const isDup = n.dedup_key ? seen.has(n.dedup_key) : false;
    if (n.dedup_key && !isDup) seen.add(n.dedup_key);
    const status = isDup ? 'duplicate' : 'cleaned';

    plan.jobUpdates.push({
      job_id: job.id, external_id: job.external_id, content_hash: job.content_hash,
      company_id: companyId, city: n.city, province: n.province,
      salary_min: n.salary_min, salary_max: n.salary_max, salary_currency: n.salary_currency,
      dedup_key: n.dedup_key, is_duplicate: isDup, pipeline_status: status,
    });
    plan.events.push({
      type: 'job.cleaned', job_id: job.id, external_id: job.external_id,
      payload: { job_id: job.id, content_hash: job.content_hash, parser_version: PARSER_VERSION, is_duplicate: isDup },
    });
  }

  const u = plan.jobUpdates;
  plan.metrics = {
    jobs_seen: u.length,
    jobs_cleaned: u.filter(j => j.pipeline_status === 'cleaned').length,
    duplicates: u.filter(j => j.is_duplicate).length,
    with_province: u.filter(j => j.province).length,
    with_city: u.filter(j => j.city).length,
    with_salary: u.filter(j => j.salary_min != null).length,
    with_company: u.filter(j => j.company_id).length,
    companies_created: plan.companies.length,
    events_job_cleaned: plan.events.length,
  };
  return plan;
}

const { newTraceId, traceSQL } = require('../observability/trace');
const STAGE_FLAG = 'normalization_enabled';

// ── SQL rendering (dollar-quoted; values never contain the $v$ tag) ──
const q  = v => (v == null ? 'NULL' : `$v$${String(v)}$v$`);
const qi = v => (v == null ? 'NULL' : String(Math.trunc(v)));
const qb = v => (v ? 'true' : 'false');
const qu = v => (v == null ? 'NULL' : `'${v}'::uuid`);

function renderSQL(plan, traceId = null) {
  const L = ['BEGIN;'];
  if (traceId) L.push(traceSQL(traceId, {
    trigger_type: 'runner', trigger_ref: 'normalization',
    spans: [
      { context: 'normalization', operation: 'plan', ms: 1 },
      { context: 'normalization', operation: 'persist_jobs', ms: 1 },
      { context: 'normalization', operation: 'emit_job_cleaned', ms: 1 },
    ],
  }));

  for (const c of plan.companies) {
    L.push(`INSERT INTO companies (id, name, city, province) VALUES (${qu(c.id)}, ${q(c.name)}, ${q(c.city)}, ${q(c.province)});`);
  }
  for (const i of plan.identities) {
    L.push(`INSERT INTO company_identities (company_id, raw_name, normalized_name, city, province, source) VALUES (${qu(i.company_id)}, ${q(i.raw_name)}, ${q(i.normalized_name)}, ${q(i.city)}, ${q(i.province)}, ${q(i.source)});`);
  }
  for (const j of plan.jobUpdates) {
    L.push(
      `UPDATE jobs SET company_id=${qu(j.company_id)}, city=${q(j.city)}, province=${q(j.province)}, ` +
      `salary_min=${qi(j.salary_min)}, salary_max=${qi(j.salary_max)}, salary_currency=${q(j.salary_currency)}, ` +
      `dedup_key=${q(j.dedup_key)}, is_duplicate=${qb(j.is_duplicate)}, pipeline_status=${q(j.pipeline_status)}, ` +
      `updated_at=now() WHERE id=${qu(j.job_id)};`
    );
  }
  for (const e of plan.events) {
    L.push(
      `SELECT publish_event('job.cleaned', jsonb_build_object(` +
      `'job_id', ${qu(e.job_id)}, ` +
      `'raw_job_id', (SELECT id FROM raw_jobs WHERE external_ref=${q(e.external_id)} ORDER BY created_at DESC LIMIT 1), ` +
      `'content_hash', ${q(e.payload.content_hash)}::uuid, ` +
      `'parser_version', ${q(e.payload.parser_version)}, ` +
      `'is_duplicate', ${qb(e.payload.is_duplicate)}), ${qu(e.job_id)}${traceId ? `, NULL, NULL, '${traceId}'::uuid` : ''});`
    );
  }
  L.push('COMMIT;');
  return L.join('\n') + '\n';
}

module.exports = { planNormalization, renderSQL, PARSER_VERSION };

// ── CLI ──
if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => (raw += d));
  process.stdin.on('end', () => {
    const input = raw.trim() ? JSON.parse(raw) : {};
    if (input.enabled === false) { process.stdout.write('BEGIN;\nCOMMIT;\n'); process.stderr.write(STAGE_FLAG + '=false -> skipped (no-op)\n'); return; }
    const traceId = newTraceId();
    const plan = planNormalization(input);
    process.stdout.write(renderSQL(plan, traceId));
    process.stderr.write(`normalized ${plan.metrics.jobs_seen} job(s): cleaned=${plan.metrics.jobs_cleaned} dup=${plan.metrics.duplicates} companies+${plan.metrics.companies_created} events=${plan.metrics.events_job_cleaned} trace=${traceId}\n`);
  });
}
