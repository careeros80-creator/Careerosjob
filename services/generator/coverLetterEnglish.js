/**
 * services/generator/coverLetterEnglish.js
 *
 * Deterministic English cover-letter generator (≈250–350 words). Professional
 * Canadian style, tailored to the exact employer + role, distinct for
 * hairstylist vs esthetician. Uses ONLY verified facts (17 years, ASY Beauty
 * ownership, verified contact). No immigration/C16/LMIA/work-authorization
 * claim; no language-level claim beyond what the master states.
 */
const { checksum, wordCount } = require('./util');
const { isEsthetician } = require('./cvEnglish');
const MODEL = 'deterministic-en-template-v1';

function generateEnglishCoverLetter(master, job = {}, company = {}) {
  const employer = String(company.name || company.company_raw || job.company_raw || 'your salon').replace(/\s*\.\s*$/, '').trim();
  const title = job.title || 'this position';
  const c = master.contact || {};
  const esth = isEsthetician(title);

  const opening =
    `I am writing to apply for the ${title} position at ${employer}. As a beauty professional with 17 years of experience in ` +
    (esth ? "esthetics and women's hairdressing" : "women's hairdressing and esthetics") +
    ` — and owner-manager of my own salon, ASY Beauty, in Salé since 2021 — I would bring hands-on skill and a genuine commitment to client care to your team.`;

  const body = esth
    ? `My esthetics practice covers facial and beauty care, make-up, microblading and permanent make-up, and advanced esthetic services, all supported by careful client consultation and consistent hygiene standards. I take the time to understand each client's goals and to recommend the right service, then deliver results they can rely on. I also draw on my hairdressing background to offer well-rounded beauty services, and I keep my techniques current through ongoing professional training.`
    : `My hands-on expertise spans haircutting, colouring, styling, and hair treatments, together with attentive client consultation and consistent hygiene standards. I enjoy translating each client's preferences into a finished look and building the kind of trust that turns first-time visitors into regulars. I complement my hairdressing with esthetic services such as make-up and permanent make-up, and I keep my skills current through ongoing professional training.`;

  const ownership =
    `Running ASY Beauty has strengthened my salon operations, appointment and client management, and service-quality supervision. I am used to keeping a busy salon organized, maintaining high standards, and making sure every client leaves satisfied. Over the years I have built a loyal client base through reliable, personalized service, and I would be glad to bring that same dedication to your salon.`;

  const closingFit =
    `I am confident my experience aligns well with the needs of ${employer}, and I would welcome the opportunity to contribute. I am currently based in Salé, Morocco, and available to relocate promptly after receiving a formal offer of employment and completing the required Canadian work-authorization process. Thank you for considering my application; I would be glad to discuss how I can support your team.`;

  const content = [
    'Dear Hiring Manager,', '',
    opening, '',
    body, '',
    ownership, '',
    closingFit, '',
    'Sincerely,',
    master.name,
    c.phone,
    c.email,
  ].join('\n') + '\n';

  return {
    doc_type: 'cover_letter', content, checksum: checksum(content), word_count: wordCount(content),
    model: MODEL, source_master: 'cover_letter_en_template@v1', prompt_version: 'writer-en-1.0.0',
    company_name: employer,
  };
}

module.exports = { generateEnglishCoverLetter, LETTER_EN_MODEL: MODEL };
