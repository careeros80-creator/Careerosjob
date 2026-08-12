/**
 * services/generator/cvGenerator.js
 *
 * VS2 M4 — deterministic CV customization. Reorders/surfaces skills from the
 * Master CV that are relevant to the job. NEVER mutates the master and NEVER
 * invents content — it only selects and reorders what the master already
 * contains. (Pluggable: an LLM writer could implement the same signature.)
 */
const { checksum, wordCount, stripAccents } = require('./util');

const MODEL = 'deterministic-template-v1';

function generateCV(master, job = {}, opts = {}) {
  const jobText = stripAccents(`${job.title || ''} ${job.raw_text || ''} ${(opts.keywords || []).join(' ')}`.toLowerCase());

  // Skills relevant to this job float to the top (copy — never mutate master).
  const skills = [...master.skills];
  const matched = skills.filter(s => jobText.includes(stripAccents(s.toLowerCase())));
  const rest = skills.filter(s => !matched.includes(s));
  const ordered = [...matched, ...rest];

  const lines = [];
  lines.push(master.name);
  lines.push(master.headline);
  if (job.title) lines.push(`Candidature ciblée : ${job.title}`);
  lines.push('', 'PROFIL', master.summary);
  lines.push('', 'COMPÉTENCES (priorisées pour ce poste)', ordered.join(' · '));
  lines.push('', 'EXPÉRIENCE');
  for (const e of master.experience) {
    lines.push(`- ${e.title}, ${e.org} (${e.years})`);
    for (const b of e.bullets) lines.push(`  • ${b}`);
  }
  lines.push('', 'LANGUES : ' + master.languages.join(', '));
  lines.push('ADMISSIBILITÉ : ' + master.eligibility);

  const content = lines.join('\n').trim() + '\n';
  return {
    doc_type: 'cv',
    content,
    checksum: checksum(content),
    word_count: wordCount(content),
    model: MODEL,
    source_master: `${master.id}@${master.version}`,
    prompt_version: opts.prompt_version || 'cv-1.0.0',
    emphasized: matched,
  };
}

module.exports = { generateCV, CV_MODEL: MODEL };
