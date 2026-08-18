/**
 * services/generator/coverLetterGenerator.js
 *
 * VS2 M4 — deterministic cover-letter personalization from a template.
 * Uses ONLY company-level facts (name / city / province / description) + job
 * title. Unknown values are OMITTED — never fabricated. A different company or
 * job yields a different letter.
 */
const { checksum, wordCount } = require('./util');

const MODEL = 'deterministic-template-v1';

/** Replace {{k}}; then drop any line that still has an unresolved {{k}} (unknown → omit). */
function fillTemplate(template, values) {
  let out = template.replace(/\{\{(\w+)\}\}/g, (m, k) => (values[k] != null ? String(values[k]) : m));
  out = out.split('\n').filter(line => !/\{\{\w+\}\}/.test(line)).join('\n');
  return out.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function generateCoverLetter(template, master, company = {}, job = {}, opts = {}) {
  const name = company.name || company.company_raw || null;
  const loc = [company.city, company.province].filter(Boolean).join(', ');

  // Company sentence uses ONLY known facts; null → the line is omitted.
  let companySentence = null;
  if (name && (loc || company.description)) {
    const bits = [];
    bits.push(loc ? `Je m'intéresse particulièrement à votre établissement situé à ${loc}` : `Je m'intéresse particulièrement à ${name}`);
    if (company.description) bits.push(String(company.description).replace(/\s+/g, ' ').trim());
    companySentence = bits.join(' — ') + '.';
  }

  const topSkills = (opts.topSkills && opts.topSkills.length ? opts.topSkills : master.skills).slice(0, 3).join(', ');

  const values = {
    job_title: job.title || 'ce poste',
    at_company: name ? ` chez ${name}` : '',        // inline-optional (keeps the line)
    company_sentence: companySentence,               // line-optional (dropped if null)
    top_skills: topSkills,
    candidate_name: master.name,
  };

  const content = fillTemplate(template, values);
  return {
    doc_type: 'cover_letter',
    content,
    checksum: checksum(content),
    word_count: wordCount(content),
    model: MODEL,
    source_master: 'cover_letter_template@v2',
    prompt_version: opts.prompt_version || 'writer-1.0.0',
    company_name: name,
  };
}

module.exports = { generateCoverLetter, fillTemplate, LETTER_MODEL: MODEL };
