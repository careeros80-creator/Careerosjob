/**
 * services/generator/immigration/eligibility.js
 *
 * Canonical immigration-eligibility logic. Immigration wording may be derived
 * ONLY from verified structured evidence. Nothing is inferred from nationality
 * or native language. Quebec is a hard exclusion. C16 is never CONFIRMED
 * without a verified current rule AND candidate evidence; if the official rule
 * could not be retrieved (see c16_rule.json), status is UNKNOWN and all
 * affirmative wording is blocked.
 */
const rule = require('./c16_rule.json');

function isQuebecExcluded(province) {
  return String(province || '').trim().toUpperCase() === 'QC';
}

/**
 * @returns 'NOT_APPLICABLE' | 'UNKNOWN' | 'POSSIBLE' | 'CONFIRMED'
 * CONFIRMED requires a verified rule AND explicit candidate evidence of every
 * criterion; POSSIBLE requires a verified rule; otherwise UNKNOWN.
 */
function c16Status({ province, ruleVerified = rule.status !== 'UNKNOWN', candidateEvidence = {} } = {}) {
  if (isQuebecExcluded(province)) return 'NOT_APPLICABLE';
  if (!ruleVerified || rule.status === 'UNKNOWN') return 'UNKNOWN';
  const meetsFrench = candidateEvidence.frenchMeetsThreshold === true;
  const hasOffer = candidateEvidence.offerNumber === true;
  if (meetsFrench && hasOffer && candidateEvidence.outsideQuebec === true) return 'CONFIRMED';
  if (meetsFrench) return 'POSSIBLE';
  return 'UNKNOWN';
}

function affirmativeWordingAllowed() {
  return rule.affirmative_wording_allowed === true;
}

module.exports = { isQuebecExcluded, c16Status, affirmativeWordingAllowed, rule };
