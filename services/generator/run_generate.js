/**
 * services/generator/run_generate.js
 *
 * VS2 M4 — application-package runtime runner. Loads the read-only Master CV +
 * cover-letter template from disk, reads jobs/companies/ats_keywords/existing
 * versions as JSON on stdin, generates a package per job, and emits idempotent
 * SQL (application_packages + generated_documents + application_ats).
 *
 *   input: { jobs:[{id,title,raw_text,company:{...}}], atsKeywords:[{keyword}],
 *            existing:{ jobId:{cv:{checksum,version}, cover_letter:{...}} } }
 */
const fs = require('fs');
const path = require('path');
const { ApplicationGeneratorService } = require('./ApplicationGeneratorService');
const { newTraceId, traceSQL } = require('../observability/trace');
const STAGE_FLAG = 'generator_enabled';

const MASTER = JSON.parse(fs.readFileSync(path.join(__dirname, 'masters', 'master_cv.json'), 'utf8'));
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'masters', 'cover_letter_template.txt'), 'utf8');

const q  = (v) => (v == null ? 'NULL' : `$g$${String(v)}$g$`);
const qi = (v) => (v == null ? 'NULL' : String(Math.trunc(v)));
const qn = (v) => (v == null ? 'NULL' : String(v));
const qu = (v) => (v == null ? 'NULL' : `'${v}'::uuid`);
const qarr = (a) => (Array.isArray(a) && a.length ? `ARRAY[${a.map(x => `$g$${x}$g$`).join(',')}]::text[]` : `ARRAY[]::text[]`);
const pkgRef = (jobId) => `(SELECT id FROM application_packages WHERE job_id=${qu(jobId)})`;

function docSQL(jobId, d) {
  return `INSERT INTO generated_documents (package_id, job_id, doc_type, version, content, checksum, word_count, source_master, model, prompt_version) ` +
    `VALUES (${pkgRef(jobId)}, ${qu(jobId)}, ${q(d.doc_type)}, ${qi(d.version)}, ${q(d.content)}, ${q(d.checksum)}, ${qi(d.word_count)}, ${q(d.source_master)}, ${q(d.model)}, ${q(d.prompt_version)}) ` +
    `ON CONFLICT (job_id, doc_type, checksum) DO NOTHING;`;
}

function packageSQL(jobId, p, ats) {
  return [
    `INSERT INTO application_packages (job_id, company_id, status, match_score, match_explanation, metadata) ` +
    `VALUES (${qu(jobId)}, ${qu(p.company_id)}, ${q(p.status)}, ${qi(p.match_score)}, ${q(p.match_explanation)}, $g$${JSON.stringify(p.metadata)}$g$::jsonb) ` +
    `ON CONFLICT (job_id) DO UPDATE SET company_id=EXCLUDED.company_id, status=EXCLUDED.status, match_score=EXCLUDED.match_score, match_explanation=EXCLUDED.match_explanation, metadata=EXCLUDED.metadata, updated_at=now();`,
    `DELETE FROM application_ats WHERE job_id=${qu(jobId)};`,
    `INSERT INTO application_ats (package_id, job_id, keywords_required, keywords_matched, keywords_missing, coverage_pct, readability, length_words) ` +
    `VALUES (${pkgRef(jobId)}, ${qu(jobId)}, ${qarr(ats.keywords_required)}, ${qarr(ats.keywords_matched)}, ${qarr(ats.keywords_missing)}, ${qn(ats.coverage_pct)}, ${qn(ats.readability)}, ${qi(ats.length_words)});`,
  ].join('\n');
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;
  const input = raw.trim() ? JSON.parse(raw) : {};
  if (input.enabled === false) { process.stdout.write('BEGIN;\nCOMMIT;\n'); process.stderr.write(STAGE_FLAG + '=false -> skipped (no-op)\n'); return; }
  const jobs = input.jobs || [];
  const atsKeywords = input.atsKeywords || [];
  const existing = input.existing || {};

  const service = new ApplicationGeneratorService();
  const traceId = newTraceId();
  const sql = ['BEGIN;', traceSQL(traceId, {
    trigger_type: 'runner', trigger_ref: 'generator',
    spans: [
      { context: 'generator', operation: 'generate_cv', ms: 1 },
      { context: 'generator', operation: 'generate_cover_letter', ms: 1 },
      { context: 'generator', operation: 'ats_report', ms: 1 },
      { context: 'generator', operation: 'persist', ms: 1 },
    ],
  })];
  const summary = [];
  for (const job of jobs) {
    const company = job.company || {};
    const pkg = service.generatePackage({ master: MASTER, template: TEMPLATE, job, company, atsKeywords, existing: existing[job.id] || {} });
    sql.push(packageSQL(job.id, pkg.package, pkg.ats));
    sql.push(docSQL(job.id, pkg.cv));
    sql.push(docSQL(job.id, pkg.cover_letter));
    summary.push({
      job_id: job.id, company: pkg.cover_letter.company_name,
      cv: { version: pkg.cv.version, words: pkg.cv.word_count, checksum: pkg.cv.checksum.slice(0, 12) },
      letter: { version: pkg.cover_letter.version, words: pkg.cover_letter.word_count, checksum: pkg.cover_letter.checksum.slice(0, 12) },
      ats: { coverage: pkg.ats.coverage_pct, required: pkg.ats.keywords_required, missing: pkg.ats.keywords_missing },
      match_score: pkg.package.match_score,
    });
  }
  sql.push('COMMIT;');
  process.stdout.write(sql.join('\n') + '\n');
  process.stderr.write(JSON.stringify({ master: `${MASTER.id}@${MASTER.version}`, packages: summary }, null, 2) + '\n');
}

module.exports = { packageSQL, docSQL, MASTER, TEMPLATE };

if (require.main === module) {
  main().catch(e => { process.stderr.write('FATAL: ' + e.message + '\n'); process.exit(1); });
}
