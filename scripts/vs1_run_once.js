/**
 * scripts/vs1_run_once.js
 *
 * Reproduces the DB side-effects of n8n/workflows/vs1_discovery.json,
 * driving the REAL JobBankConnector so external_id + content_hash are
 * produced by the shipped connector code (not hand-authored).
 *
 * It processes JobBank-shaped search HTML (same structure the connector's
 * regexes target) and emits SQL that runs the workflow's node sequence:
 *   raw_jobs → jobs (dedup on external_id) → job_contents →
 *   publish_event('job.discovered') → logs, plus a connector_runs
 *   success record so the connector_health trigger fires.
 *
 * Usage:  node scripts/vs1_run_once.js > /tmp/vs1_seed.sql
 *
 * NOTE: a genuine LIVE fetch from jobbank.gc.ca is the manual n8n run
 * (Step 3). This uses representative sample markup so the demonstration
 * is deterministic; the parsing/hashing/dedup is all real connector code.
 */

const { JobBankConnector } = require('../connectors/JobBankConnector');
const { newTraceId, traceSQL } = require('../services/observability/trace');
const TRACE_ID = newTraceId();

// Representative Job Bank search-results markup (structure the connector parses).
const SEARCH_HTML = `
<html><body>
<article class="resultJobItem" data-id="4287165">
  <span class="noctitle">Esthetician</span>
  <span class="business">Nordik Spa Village</span>
  <span class="location">Ottawa, ON</span>
  <span class="salary">$38.00 to $44.00 hourly</span>
  <time datetime="2026-08-09T12:00:00Z"></time>
</article>
<article class="resultJobItem" data-id="4291822">
  <span class="noctitle">Hairstylist</span>
  <span class="business">Salon Élégance</span>
  <span class="location">Moncton, NB</span>
  <span class="salary">$21.00 hourly</span>
  <time datetime="2026-08-10T09:30:00Z"></time>
</article>
</body></html>`;

const con = new JobBankConnector();
const jobs = con.processSearchPage(SEARCH_HTML, 'https://www.jobbank.gc.ca/jobsearch/jobsearch');

// Dollar-quote helper: pick a tag that cannot appear in the value.
function dq(val, tag) {
  if (val === null || val === undefined) return 'NULL';
  return `$${tag}$${String(val)}$${tag}$`;
}
function ts(val) { return val === null || val === undefined ? 'NULL' : `'${val}'::timestamptz`; }

const out = [];
out.push('BEGIN;');
out.push(traceSQL(TRACE_ID, {
  trigger_type: 'runner', trigger_ref: 'discovery_seed',
  spans: [
    { context: 'discovery', operation: 'fetch', ms: 1 },
    { context: 'discovery', operation: 'parse_canonical', ms: 1 },
    { context: 'discovery', operation: 'insert_jobs', ms: 1 },
    { context: 'discovery', operation: 'emit_job_discovered', ms: 1 },
  ],
}));
out.push(`-- connector run start (mirrors log_start node)`);
out.push(`INSERT INTO connector_runs (id, connector, status, started_at)`);
out.push(`VALUES ('11111111-1111-4111-8111-111111111111','jobbank','running', now() - interval '1 second');`);
out.push('');

let n = 0;
for (const j of jobs) {
  n++;
  const payload = JSON.stringify({
    raw_job_id: '__RAWID__', connector: j.source,
    external_ref: j.external_id, fetched_at: j.fetched_at
  });
  out.push(`-- ${j.external_id} :: ${j.title}`);
  out.push(`WITH rj AS (`);
  out.push(`  INSERT INTO raw_jobs (connector, external_ref, raw_payload, processing_status)`);
  out.push(`  VALUES ('jobbank', ${dq(j.external_id,'x')}, ${dq(JSON.stringify(j),'p')}::jsonb, 'pending')`);
  out.push(`  RETURNING id`);
  out.push(`), j AS (`);
  out.push(`  INSERT INTO jobs (external_id, source, content_hash, title, company_raw,`);
  out.push(`                    location_raw, salary_raw, apply_url, source_url, posted_at,`);
  out.push(`                    scraped_at, pipeline_status)`);
  out.push(`  VALUES (${dq(j.external_id,'x')}, 'jobbank', ${dq(j.content_hash,'h')}::uuid,`);
  out.push(`          ${dq(j.title,'t')}, ${dq(j.company_raw,'c')}, ${dq(j.location_raw,'l')},`);
  out.push(`          ${dq(j.salary_raw,'s')}, ${dq(j.apply_url,'u')}, ${dq(j.source_url,'v')},`);
  out.push(`          ${ts(j.posted_at)}, now(), 'raw')`);
  out.push(`  ON CONFLICT (external_id) DO NOTHING`);
  out.push(`  RETURNING id`);
  out.push(`), jc AS (`);
  out.push(`  INSERT INTO job_contents (job_id, raw_text, parser_version, content_version)`);
  out.push(`  SELECT id, ${dq(j.raw_text,'r')}, '1.0.0', 1 FROM j`);
  out.push(`  RETURNING job_id`);
  out.push(`)`);
  out.push(`INSERT INTO logs (level, service, job_id, message, payload)`);
  out.push(`SELECT 'info','discovery',(SELECT id FROM j),'New job inserted',`);
  out.push(`       jsonb_build_object('external_id',${dq(j.external_id,'x')},'title',${dq(j.title,'t')})`);
  out.push(`WHERE EXISTS (SELECT 1 FROM j);`);
  // publish_event must be its own top-level statement: a non-referenced,
  // non-data-modifying CTE is not guaranteed to be evaluated by Postgres.
  out.push(`SELECT publish_event('job.discovered',`);
  out.push(`  jsonb_build_object('raw_job_id',(SELECT id FROM raw_jobs WHERE external_ref=${dq(j.external_id,'x')} ORDER BY created_at DESC LIMIT 1),`);
  out.push(`    'connector','jobbank','external_ref',${dq(j.external_id,'x')},'fetched_at', now()),`);
  out.push(`  (SELECT id FROM jobs WHERE external_id=${dq(j.external_id,'x')}), NULL, NULL, '${TRACE_ID}'::uuid)`);
  out.push(`WHERE EXISTS (SELECT 1 FROM jobs WHERE external_id=${dq(j.external_id,'x')});`);
  out.push('');
}

out.push(`-- connector run finish → fires update_connector_health trigger`);
out.push(`UPDATE connector_runs SET finished_at = now(), duration_ms = 900, status = 'success',`);
out.push(`       jobs_fetched = ${n}, jobs_new = ${n}, jobs_dup = 0`);
out.push(`WHERE id = '11111111-1111-4111-8111-111111111111';`);
out.push('COMMIT;');

process.stdout.write(out.join('\n') + '\n');
process.stderr.write(`parsed ${jobs.length} beauty job(s): ${jobs.map(j=>j.external_id).join(', ')}\n`);
