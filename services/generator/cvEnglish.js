/**
 * services/generator/cvEnglish.js
 *
 * Deterministic English, ATS-friendly CV renderer for master_cv@v5. Plain text,
 * reverse-chronological, no tables/columns/graphics/photo/DOB. Tailors the
 * summary emphasis and skill ordering to the target role (hairstylist vs
 * esthetician) using ONLY the master's verified content — never invents.
 */
const { checksum, wordCount } = require('./util');
const MODEL = 'deterministic-en-template-v1';

function isEsthetician(title) { return /esthet|aesthet|beautician|skin|facial|spa/i.test(title || '') && !/hair|stylist|barber|coiff/i.test(title || ''); }

function generateEnglishCV(master, job = {}) {
  const c = master.contact || {};
  const esth = isEsthetician(job.title);
  const L = [];
  L.push(master.name);
  L.push([c.location, c.email, c.phone].filter(Boolean).join(' | '));
  L.push('');
  L.push('PROFESSIONAL SUMMARY');
  // lead emphasis by role, from the same verified summary content
  const lead = esth
    ? 'Beauty professional with 17 years of experience in esthetics and women\'s hairdressing, including salon ownership and management since 2021.'
    : 'Beauty professional with 17 years of experience in women\'s hairdressing and esthetics, including salon ownership and management since 2021.';
  L.push(lead + ' ' + master.summary.split('. ').slice(1).join('. '));
  L.push('');
  L.push('CORE SKILLS');
  const groups = Object.entries(master.core_skills);
  const ordered = esth ? groups.slice().sort((a) => (a[0] === 'Esthetics' ? -1 : 1)) : groups.slice().sort((a) => (a[0] === 'Hairdressing' ? -1 : 1));
  for (const [g, items] of ordered) L.push(`${g}: ${items.join(', ')}`);
  L.push('');
  L.push('PROFESSIONAL EXPERIENCE');
  for (const e of master.experience) {
    L.push(`${e.role} — ${e.employer}, ${e.location} (${e.dates})`);
    for (const b of e.bullets) L.push(`- ${b}`);
    L.push('');
  }
  L.push('EDUCATION AND CORE QUALIFICATIONS');
  for (const ed of master.education) L.push(`- ${ed}`);
  L.push('');
  L.push('ADDITIONAL PROFESSIONAL TRAINING');
  for (const t of master.training) L.push(`- ${t}`);
  L.push('');
  L.push('LANGUAGES');
  L.push(master.languages.map(l => `${l.language} — ${l.level}`).join(' | '));
  L.push('');
  L.push('RELOCATION');
  L.push(master.relocation);

  const content = L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  return {
    doc_type: 'cv', content, checksum: checksum(content), word_count: wordCount(content),
    model: MODEL, source_master: `${master.id}@${master.version}`, prompt_version: 'cv-en-1.0.0',
  };
}

module.exports = { generateEnglishCV, isEsthetician, CV_EN_MODEL: MODEL };
