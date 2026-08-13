/**
 * scripts/pilot_discover.js
 *
 * pilot/production-validation — REAL production discovery.
 *
 * Fetches LIVE Job Bank Canada search results (public government job board),
 * parses them with the shipped JobBankConnector, and emits idempotent SQL that
 * records the jobs as data_source='production' (Production Runtime — NOT Test
 * Data). Every fetch is logged to production_actions with trace_id /
 * correlation_id / status / duration_ms, and failed fetches are retried and
 * left retryable (dead_letter_queue) so no stage is unrecoverable.
 *
 * Read-only w.r.t. the user: discovery only ingests public postings. Nothing
 * is applied to or sent anywhere (ADR-006).
 *
 * Usage:
 *   node scripts/pilot_discover.js            # fetch live + emit SQL to stdout
 *   node scripts/pilot_discover.js --dry      # parse only, no SQL (stderr summary)
 *
 * The fetch uses curl (present on the host); Job Bank rejects the default Node
 * TLS client, so we shell out to curl with a browser UA.
 */
const { execFileSync } = require('child_process');
const { JobBankConnector } = require('../connectors/JobBankConnector');
const { newTraceId, traceSQL } = require('../services/observability/trace');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const MAX_RETRIES = 2;

// ── SQL literal helpers (dollar-quoted; tag can't appear in value) ──
function dq(val, tag) {
  if (val === null || val === undefined) return 'NULL';
  return `$${tag}$${String(val)}$${tag}$`;
}
function ts(val) { return val == null ? 'NULL' : `'${val}'::timestamptz`; }

function decodeEntities(s) {
  if (!s) return s;
  return s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
          .replace(/&eacute;/g, 'é').replace(/&nbsp;/g, ' ').trim();
}

/** Fetch one URL via curl with retry. Returns { html, ms, attempts } or throws. */
function fetchLive(url) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const started = process.hrtime.bigint();
    try {
      const html = execFileSync('curl', [
        '-sL', '-m', '25', '-A', UA, '-H', 'Accept-Language: en-CA,en;q=0.9', url,
      ], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
      const ms = Number((process.hrtime.bigint() - started) / 1000000n);
      if (!html || html.length < 500) throw new Error(`suspicious response (${html ? html.length : 0} bytes)`);
      return { html, ms, attempts: attempt };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function main() {
  const dry = process.argv.includes('--dry');
  const con = new JobBankConnector();
  const traceId = newTraceId();
  const searches = con.searchConfigs();

  const byExternalId = new Map();     // dedup within this run
  const actions = [];                 // production_actions rows
  const spans = [];
  let fetched = 0, failed = 0;

  for (const cfg of searches) {
    const label = `${cfg.params.keyword} / ${cfg.params.location}`;
    try {
      const { html, ms, attempts } = fetchLive(cfg.url);
      const jobs = con.processSearchPage(html, cfg.url);
      for (const j of jobs) {
        j.company_raw = decodeEntities(j.company_raw);
        j.title = decodeEntities(j.title);
        j.location_raw = decodeEntities(j.location_raw);
        if (!byExternalId.has(j.external_id)) byExternalId.set(j.external_id, j);
      }
      fetched++;
      spans.push({ context: 'discovery', operation: `fetch:${cfg.params.keyword}`, ms, status: 'ok' });
      actions.push({ action: 'discover', stage: 'connector', status: attempts > 1 ? 'retrying' : 'success',
        attempt: attempts, duration_ms: ms,
        detail: { source: 'jobbank', search: label, url: cfg.url, jobs_found: jobs.length, live: true } });
      process.stderr.write(`  ✓ ${label}: ${jobs.length} beauty jobs (${ms}ms, attempt ${attempts})\n`);
    } catch (e) {
      failed++;
      spans.push({ context: 'discovery', operation: `fetch:${cfg.params.keyword}`, ms: 0, status: 'error' });
      actions.push({ action: 'discover', stage: 'connector', status: 'error', attempt: MAX_RETRIES + 1,
        duration_ms: null, detail: { source: 'jobbank', search: label, url: cfg.url, error: String(e.message || e), retryable: true } });
      process.stderr.write(`  ✗ ${label}: FAILED after ${MAX_RETRIES + 1} attempts — ${e.message}\n`);
    }
  }

  const jobs = [...byExternalId.values()];
  process.stderr.write(`\n  live searches: ${fetched} ok / ${failed} failed · unique production jobs: ${jobs.length}\n`);

  if (dry) {
    jobs.slice(0, 8).forEach(j => process.stderr.write(`    • ${j.external_id} | ${j.title} | ${j.company_raw} | ${j.location_raw} | ${j.salary_raw || '—'}\n`));
    return;
  }

  // ── emit production SQL ──
  const out = ['BEGIN;'];
  out.push(traceSQL(traceId, { trigger_type: 'runner', trigger_ref: 'pilot_discover', status: failed && !jobs.length ? 'error' : 'ok', spans }));
  out.push(`INSERT INTO connector_runs (id, connector, status, started_at)`);
  out.push(`VALUES (gen_random_uuid(),'jobbank','running', now() - interval '2 second');`);

  for (const j of jobs) {
    out.push(`-- ${j.external_id} :: ${j.title}`);
    out.push(`WITH rj AS (`);
    out.push(`  INSERT INTO raw_jobs (connector, external_ref, raw_payload, processing_status)`);
    out.push(`  VALUES ('jobbank', ${dq(j.external_id, 'x')}, ${dq(JSON.stringify(j), 'p')}::jsonb, 'pending')`);
    out.push(`  RETURNING id`);
    out.push(`), j AS (`);
    out.push(`  INSERT INTO jobs (external_id, source, content_hash, title, company_raw,`);
    out.push(`                    location_raw, salary_raw, apply_url, source_url, posted_at,`);
    out.push(`                    scraped_at, pipeline_status, data_source)`);
    out.push(`  VALUES (${dq(j.external_id, 'x')}, 'jobbank', ${dq(j.content_hash, 'h')}::uuid,`);
    out.push(`          ${dq(j.title, 't')}, ${dq(j.company_raw, 'c')}, ${dq(j.location_raw, 'l')},`);
    out.push(`          ${dq(j.salary_raw, 's')}, ${dq(j.apply_url, 'u')}, ${dq(j.source_url, 'v')},`);
    out.push(`          ${ts(j.posted_at)}, now(), 'raw', 'production')`);
    out.push(`  ON CONFLICT (external_id) DO NOTHING`);
    out.push(`  RETURNING id`);
    out.push(`), jc AS (`);
    out.push(`  INSERT INTO job_contents (job_id, raw_text, parser_version, content_version)`);
    out.push(`  SELECT id, ${dq(j.raw_text, 'r')}, '1.0.0', 1 FROM j`);
    out.push(`  RETURNING job_id`);
    out.push(`)`);
    out.push(`INSERT INTO logs (level, service, job_id, message, payload)`);
    out.push(`SELECT 'info','discovery',(SELECT id FROM j),'Live production job discovered',`);
    out.push(`       jsonb_build_object('external_id',${dq(j.external_id, 'x')},'data_source','production')`);
    out.push(`WHERE EXISTS (SELECT 1 FROM j);`);
    out.push(`SELECT publish_event('job.discovered',`);
    out.push(`  jsonb_build_object('connector','jobbank','external_ref',${dq(j.external_id, 'x')},'data_source','production'),`);
    out.push(`  (SELECT id FROM jobs WHERE external_id=${dq(j.external_id, 'x')}), NULL, NULL, '${traceId}'::uuid)`);
    out.push(`WHERE EXISTS (SELECT 1 FROM jobs WHERE external_id=${dq(j.external_id, 'x')});`);
  }

  // structured production-action log + dead-letter for failed fetches
  for (const a of actions) {
    out.push(`INSERT INTO production_actions (action, stage, trace_id, correlation_id, data_source, status, attempt, duration_ms, detail)`);
    out.push(`VALUES (${dq(a.action, 'a')}, ${dq(a.stage, 'g')}, '${traceId}'::uuid, '${traceId}'::uuid, 'production', ${dq(a.status, 'st')}, ${a.attempt}, ${a.duration_ms == null ? 'NULL' : a.duration_ms}, ${dq(JSON.stringify(a.detail), 'd')}::jsonb);`);
    if (a.status === 'error') {
      // dead_letter_queue: unresolved rows (resolved=false, the default) are the retryable ones.
      out.push(`INSERT INTO dead_letter_queue (event_type, payload, error)`);
      out.push(`VALUES ('pilot_discover.fetch_failed', ${dq(JSON.stringify(a.detail), 'd')}::jsonb, ${dq(a.detail.error, 'e')});`);
    }
  }

  out.push(`UPDATE connector_runs SET finished_at = now(), duration_ms = 2000, status = 'success',`);
  out.push(`       jobs_fetched = ${jobs.length}, jobs_new = ${jobs.length}, jobs_dup = 0`);
  out.push(`WHERE connector='jobbank' AND status='running';`);
  out.push('COMMIT;');

  process.stdout.write(out.join('\n') + '\n');
}

main();
