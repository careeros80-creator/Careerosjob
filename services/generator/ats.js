/**
 * services/generator/ats.js
 *
 * VS2 M4 — ATS keyword report. Extracts required keywords from the job (using
 * the known ats_keywords vocabulary), then measures how well the generated CV
 * covers them, plus readability + length.
 */
const { wordCount, readability, stripAccents } = require('./util');

/** Keywords from the job text that exist in the known ats_keywords vocabulary. */
function extractKeywords(job = {}, atsKeywords = []) {
  const text = stripAccents(`${job.title || ''} ${job.raw_text || ''}`.toLowerCase());
  const found = [];
  for (const k of atsKeywords) {
    const kw = (k.keyword || k).toLowerCase();
    if (text.includes(stripAccents(kw))) found.push(kw);
  }
  return [...new Set(found)];
}

function atsReport(cvContent, job = {}, atsKeywords = []) {
  const required = extractKeywords(job, atsKeywords);
  const cv = stripAccents(String(cvContent).toLowerCase());
  const matched = required.filter(k => cv.includes(stripAccents(k)));
  const missing = required.filter(k => !matched.includes(k));
  const coverage = required.length ? Math.round((matched.length / required.length) * 1000) / 10 : 0;
  return {
    keywords_required: required,
    keywords_matched: matched,
    keywords_missing: missing,
    coverage_pct: coverage,
    readability: readability(cvContent),
    length_words: wordCount(cvContent),
  };
}

function matchExplanation(ats) {
  const total = ats.keywords_required.length;
  const m = ats.keywords_matched.length;
  const score = total ? Math.round((m / total) * 100) : (ats.length_words > 0 ? 60 : 0);
  const explanation = total
    ? `ATS : ${m}/${total} mots-clés couverts (${ats.coverage_pct}%).` +
      (ats.keywords_missing.length ? ` Manquants : ${ats.keywords_missing.join(', ')}.` : ' Aucun manquant.')
    : `Aucun mot-clé ATS détecté dans l'offre ; CV de ${ats.length_words} mots.`;
  return { score, explanation };
}

module.exports = { atsReport, extractKeywords, matchExplanation };
