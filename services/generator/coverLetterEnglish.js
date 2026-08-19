/**
 * services/generator/coverLetterEnglish.js  (v2 — Phase 5C)
 *
 * Deterministic English cover-letter generator (220–300 words). Genuinely
 * tailored per employer: the role skills paragraph is scoped to evidenced
 * services only, and an employer-specific paragraph (job.tailoring.specific),
 * derived from the live posting's advertised duties, is injected so the three
 * hairstylist letters are NOT template clones.
 *
 * Removed (Phase 5C): all unsupported promotional claims — "busy salon",
 * "every client leaves satisfied", "loyal client base", "results they can rely
 * on". No microblading / permanent make-up in hairstylist letters. No
 * facials / waxing / nails / lashes / devices / medical aesthetics in the
 * esthetician letter. No immigration / C16 / LMIA / work-authorization claim.
 */
const { checksum, wordCount } = require('./util');
const { isEsthetician } = require('./cvEnglish');
const MODEL = 'deterministic-en-template-v2';

const oneDot = (s) => String(s).replace(/\s*\.*\s*$/, '') + '.'; // exactly one terminal period (no "Ltd.." / missing ".")

// Role skills paragraph — evidenced services ONLY.
function skillsParagraph(esth) {
  return esth
    ? "My esthetics work covers general esthetic care and make-up application, delivered with careful client consultation and consistent hygiene standards. I also draw on my hairdressing background to offer well-rounded beauty services, and I keep my techniques current through ongoing professional training."
    : "My hands-on hairdressing covers women's haircutting, colouring — including highlights, tints, and rinses — styling and finishing, together with hair and scalp treatments. I consult with each client to agree on the result before I begin, and I keep to consistent hygiene and sanitation practices throughout.";
}

// De-claimed operations paragraph — factual, no volume/retention/satisfaction claims.
function operationsParagraph() {
  return "As the owner-manager of ASY Beauty, I handle appointment scheduling, client consultations, stock coordination, and day-to-day salon operations while maintaining consistent service and hygiene standards. I provide personalized service based on each client's preferences.";
}

function generateEnglishCoverLetter(master, job = {}, company = {}) {
  const employer = String(company.name || company.company_raw || job.company_raw || 'your salon').trim();
  const title = job.title || 'this position';
  const c = master.contact || {};
  const esth = isEsthetician(title);
  const tailoring = job.tailoring || {};

  const opening = oneDot(
    `I am writing to apply for the ${title} position at ${employer}`) +
    ` As a beauty professional with 17 years of experience in ` +
    (esth ? "esthetics and women's hairdressing" : "women's hairdressing and esthetics") +
    ` — and owner-manager of my own salon, ASY Beauty, in Salé since 2021 — I would bring hands-on skill and a genuine commitment to client care to your team.`;

  // employer-specific paragraph (authored from the posting's real duties); required for a tailored letter.
  const specific = tailoring.specific
    ? String(tailoring.specific).trim()
    : `Your posting for a ${title} matches my day-to-day work, and I would welcome the chance to contribute to ${oneDot(employer).replace(/\.$/, '')}.`;

  const closing =
    `I would welcome the opportunity to bring this experience to ` + oneDot(employer) +
    ` I am based in Salé, Morocco, and available to relocate after receiving a formal job offer and completing the required Canadian work-authorization process.` +
    ` Thank you for considering my application; I would be glad to discuss how I can contribute to your team.`;

  const content = [
    'Dear Hiring Manager,', '',
    opening, '',
    skillsParagraph(esth), '',
    specific, '',
    operationsParagraph(), '',
    closing, '',
    'Sincerely,',
    master.name,
    c.phone,
    c.email,
  ].join('\n') + '\n';

  return {
    doc_type: 'cover_letter', content, checksum: checksum(content), word_count: wordCount(content),
    model: MODEL, source_master: 'cover_letter_en_template@v2', prompt_version: 'writer-en-2.0.0',
    company_name: employer,
  };
}

module.exports = { generateEnglishCoverLetter, LETTER_EN_MODEL: MODEL };
