/**
 * services/discovery/run_discovery.js
 *
 * VS2 — registry-driven multi-source discovery runner (runtime).
 *
 * Reads feature flags + existing external_ids as JSON on stdin, runs the
 * Connector Registry with an injected fetch (representative Job Bank markup so
 * the run is deterministic and never live-scrapes), then emits SQL that records
 * ONE connector_runs row per connector that ran → the update_connector_health
 * trigger persists per-connector health. A human summary goes to stderr.
 *
 *   input:  { flags: {flag: bool}, existingExternalIds: [..] }
 *   stdout: SQL (connector_runs inserts/updates)
 *   stderr: JSON summary { results, health }
 */
const crypto = require('crypto');
const { buildRegistry } = require('../../connectors/sources');

const SAMPLE_HTML = `
<html><body>
<article class="resultJobItem" data-id="4287165">
  <span class="noctitle">Esthetician</span><span class="business">Nordik Spa Village</span>
  <span class="location">Ottawa, ON</span><span class="salary">$38.00 to $44.00 hourly</span>
  <time datetime="2026-08-09T12:00:00Z"></time>
</article>
<article class="resultJobItem" data-id="4291822">
  <span class="noctitle">Hairstylist</span><span class="business">Salon Élégance</span>
  <span class="location">Moncton, NB</span><span class="salary">$21.00 hourly</span>
</article>
</body></html>`;

const c = (v) => (v == null ? 'NULL' : `$v$${String(v)}$v$`);
const i = (v) => (v == null ? 'NULL' : String(Math.trunc(v)));

function connectorRunSQL(r, jobsNew, jobsDup) {
  const runStatus = r.status === 'failed' ? 'failed' : 'success';
  // INSERT then a SEPARATE UPDATE (explicit id): a single-statement CTE that
  // inserts-then-updates the same row would not see its own insert, so the
  // finished_at NULL→NOT NULL transition (which fires update_connector_health)
  // would never happen.
  const id = crypto.randomUUID();
  return (
    `INSERT INTO connector_runs (id, connector, status, started_at) ` +
    `VALUES ('${id}', ${c(r.connector)}, 'running', now() - ((${i(r.ms)})::text||' milliseconds')::interval);\n` +
    `UPDATE connector_runs SET finished_at=now(), duration_ms=${i(r.ms)}, status=${c(runStatus)}, ` +
    `jobs_fetched=${i(r.fetched)}, jobs_new=${i(jobsNew)}, jobs_dup=${i(jobsDup)}, ` +
    `error_detail=${c(r.error || null)} WHERE id='${id}';`
  );
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;
  const input = raw.trim() ? JSON.parse(raw) : {};
  const flags = input.flags || {};
  const existing = new Set(input.existingExternalIds || []);

  const registry = buildRegistry();
  const results = await registry.discoverAll({
    fetch: async () => SAMPLE_HTML,
    isEnabled: (flag) => flags[flag] === true,
  });

  const sql = ['BEGIN;'];
  const summary = [];
  for (const r of results) {
    let jobsNew = 0, jobsDup = 0;
    if (r.jobs && r.jobs.length) {
      for (const j of r.jobs) (existing.has(j.external_id) ? jobsDup++ : jobsNew++);
    }
    if (r.status !== 'disabled') sql.push(connectorRunSQL(r, jobsNew, jobsDup)); // record ran/failed only
    summary.push({ connector: r.connector, flag: r.flag, status: r.status, fetched: r.fetched, new: jobsNew, dup: jobsDup, ms: r.ms, reason: r.reason || null, error: r.error || null });
  }
  sql.push('COMMIT;');

  process.stdout.write(sql.join('\n') + '\n');
  process.stderr.write(JSON.stringify({
    registry: registry.names(),
    results: summary,
    health: registry.list().map(x => x.health()),
  }, null, 2) + '\n');
}

main().catch(e => { process.stderr.write('FATAL: ' + e.message + '\n'); process.exit(1); });
