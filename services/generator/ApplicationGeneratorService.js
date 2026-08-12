/**
 * services/generator/ApplicationGeneratorService.js
 *
 * VS2 M4 — orchestrates the tailored application package for one job:
 * customized CV + cover letter (versioned, checksummed, traceable), ATS report,
 * and a match explanation. Idempotent: identical inputs → identical checksums →
 * same version. Nothing is auto-sent (ADR-006): status = 'prepared'.
 */
const { generateCV } = require('./cvGenerator');
const { generateCoverLetter } = require('./coverLetterGenerator');
const { atsReport, matchExplanation } = require('./ats');

/** Same content → keep version; changed → bump; new → 1. */
function versionFor(newChecksum, existing) {
  if (!existing) return 1;
  if (existing.checksum === newChecksum) return existing.version;
  return existing.version + 1;
}

class ApplicationGeneratorService {
  constructor({ now = () => new Date().toISOString() } = {}) { this.now = now; }

  generatePackage({ master, template, job, company = {}, atsKeywords = [], prefs = {}, existing = {} }) {
    if (!master || !template || !job) throw new Error('generatePackage requires master, template, job');

    const cv = generateCV(master, job, { keywords: prefs.keywords });
    const ats = atsReport(cv.content, job, atsKeywords);
    const match = matchExplanation(ats);
    const letter = generateCoverLetter(template, master, company, job, { topSkills: cv.emphasized });

    const stamp = this.now();
    cv.version = versionFor(cv.checksum, existing.cv);
    letter.version = versionFor(letter.checksum, existing.cover_letter);
    cv.generated_at = stamp;
    letter.generated_at = stamp;

    return {
      package: {
        job_id: job.id,
        company_id: company.id || null,
        status: 'prepared', // human approves before send — never auto-sent
        match_score: match.score,
        match_explanation: match.explanation,
        metadata: { ats: { coverage_pct: ats.coverage_pct, length_words: ats.length_words, missing: ats.keywords_missing } },
      },
      cv,
      cover_letter: letter,
      ats,
      match,
    };
  }
}

module.exports = { ApplicationGeneratorService, versionFor };
