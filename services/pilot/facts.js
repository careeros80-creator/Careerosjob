/**
 * services/pilot/facts.js
 *
 * Candidate-fact integrity registry + generation gates for Samira Benaciri.
 *
 * Phase 5C provenance correction:
 *  - A prior CV is NOT independent documentary evidence. The professional
 *    timeline (Al Amira, La Manucure, Top 2000, Cléopâtre) is USER_CONFIRMED
 *    from the candidate-confirmed timeline, not VERIFIED_BY_DOCUMENT.
 *  - ASY Beauty ownership/activity-start rests on official registration
 *    (VERIFIED_BY_OFFICIAL_DOCUMENT); current operation + daily duties are
 *    USER_CONFIRMED.
 *  - Skills carry an EVIDENCE class so a training certificate is never read as
 *    professional practice.
 *
 * status:   VERIFIED_BY_DOCUMENT | VERIFIED_BY_OFFICIAL_DOCUMENT | USER_CONFIRMED
 *         | USER_DECLARED | CONFLICTING | MISSING | UNSUPPORTED | EXCLUDED_NOT_CONFIRMED
 *         | TRAINING_ONLY_NOT_PRACTICE
 * evidence (skills only): BOTH | PRACTICE_USER_CONFIRMED | TRAINING_VERIFIED | UNSUPPORTED
 */
const ASSERTABLE = new Set(['VERIFIED_BY_DOCUMENT', 'VERIFIED_BY_OFFICIAL_DOCUMENT', 'USER_CONFIRMED', 'USER_DECLARED']);
// A skill may appear in outgoing Core Skills only when its practice is supported.
const OUTGOING_EVIDENCE = new Set(['BOTH', 'PRACTICE_USER_CONFIRMED']);

const FACTS = {
  full_name:        { value: 'Samira Benaciri', status: 'VERIFIED_BY_DOCUMENT', source: 'authenticated account + identity documents' },
  email:            { value: 'samirabenaciri88@gmail.com', status: 'USER_CONFIRMED', source: 'authenticated auth.users + pilot_profile' },
  phone:            { value: '+212 6 62 79 32 95', status: 'USER_DECLARED', source: 'candidate binding fact (Phase 5)' },
  city_country:     { value: 'Salé, Morocco', status: 'USER_DECLARED', source: 'candidate binding fact' },
  relocation:       { value: 'Available to relocate after receiving a formal job offer and completing the required Canadian work-authorization process.', status: 'USER_DECLARED' },

  experience_duration: { value: '17 years (July 2009 – August 2026)', status: 'USER_CONFIRMED', source: 'Candidate-confirmed professional timeline' },
  current_employer: { value: 'ASY Beauty, Salé — Owner-Manager | Senior Hairdresser & Esthetician (Sept 2021–present)', status: 'VERIFIED_BY_OFFICIAL_DOCUMENT', source: 'official business registration in candidate name (ownership + activity start 2021-09); current operation and daily duties USER_CONFIRMED' },
  previous_employers: { value: 'Salon Cléopâtre, Salé (2015–2021); Salon Top 2000, Rabat (2013–2015); Salon La Manucure, Rabat (July 2009–2013); Salon Al Amira intern, Salé (2009, 6-month)', status: 'USER_CONFIRMED', source: 'Candidate-confirmed professional timeline (a prior CV is not independent documentary evidence)' },
  esthetics_qualification: { value: 'Diploma in Esthetics — Assoc. de Solidarité Sociale et Artisanale Mohammedia (2019-09-17)', status: 'VERIFIED_BY_DOCUMENT', source: 'diploma' },
  hairdressing_qualification: { value: "Diploma in Women's Hairdressing — École Nito de Coiffure et d'Esthétique, Salé", status: 'VERIFIED_BY_DOCUMENT', source: 'diploma' },
  craft_registration: { value: 'Professional hairdressing/craft registration — Chamber of Handicrafts, Salé (2009)', status: 'VERIFIED_BY_DOCUMENT', source: 'chamber registration (credential, not an academic diploma)' },

  // ---- skills carry an evidence class; only practice-supported skills go in outgoing Core Skills ----
  // practice supported (BOTH = diploma/training + confirmed timeline; PRACTICE = confirmed timeline)
  skill_womens_hairdressing: { status: 'USER_CONFIRMED', evidence: 'BOTH', source: "Diploma in Women's Hairdressing + confirmed timeline" },
  skill_haircutting_styling: { status: 'USER_CONFIRMED', evidence: 'BOTH', source: 'diploma + confirmed timeline' },
  skill_hair_colouring:      { status: 'USER_CONFIRMED', evidence: 'PRACTICE_USER_CONFIRMED', source: 'confirmed hairdressing timeline' },
  skill_hair_treatments:     { status: 'USER_CONFIRMED', evidence: 'PRACTICE_USER_CONFIRMED', source: 'confirmed hairdressing timeline' },
  skill_hair_scalp_care:     { status: 'USER_CONFIRMED', evidence: 'PRACTICE_USER_CONFIRMED', source: 'confirmed hairdressing timeline' },
  skill_client_consultation: { status: 'USER_CONFIRMED', evidence: 'PRACTICE_USER_CONFIRMED', source: 'confirmed timeline' },
  skill_general_esthetic_care: { status: 'USER_CONFIRMED', evidence: 'BOTH', source: 'Diploma in Esthetics + confirmed esthetician role' },
  skill_makeup:              { status: 'USER_CONFIRMED', evidence: 'BOTH', source: 'Make-up Artist training + confirmed esthetician role' },
  skill_salon_management:    { status: 'USER_CONFIRMED', evidence: 'PRACTICE_USER_CONFIRMED', source: 'ASY Beauty ownership/management' },
  skill_appointment_management: { status: 'USER_CONFIRMED', evidence: 'PRACTICE_USER_CONFIRMED', source: 'ASY Beauty ownership/management' },
  skill_hygiene_safety:      { status: 'USER_CONFIRMED', evidence: 'PRACTICE_USER_CONFIRMED', source: 'confirmed salon operations' },

  // training verified, professional practice NOT separately confirmed -> Additional Training only, never Core Skills
  skill_microblading:        { status: 'TRAINING_ONLY_NOT_PRACTICE', evidence: 'TRAINING_VERIFIED', note: 'Maison Joulla training 2022-11-29; practice awaiting candidate confirmation' },
  skill_permanent_makeup:    { status: 'TRAINING_ONLY_NOT_PRACTICE', evidence: 'TRAINING_VERIFIED', note: 'Ozone Plus 2016; practice awaiting candidate confirmation' },
  skill_advanced_esthetics:  { status: 'TRAINING_ONLY_NOT_PRACTICE', evidence: 'TRAINING_VERIFIED', note: 'Al-Majd Academy 35h 2023; techniques not enumerated -> use general esthetic care' },
  skill_event_styling:       { status: 'TRAINING_ONLY_NOT_PRACTICE', evidence: 'TRAINING_VERIFIED', note: 'hairstyling training; separate event-styling practice awaiting confirmation' },
  skill_cosmetic_products:   { status: 'TRAINING_ONLY_NOT_PRACTICE', evidence: 'TRAINING_VERIFIED', note: 'AM Prod training 2019-11' },

  // unsupported / excluded -> never in any document
  skill_facials:       { status: 'UNSUPPORTED', evidence: 'UNSUPPORTED', note: 'specific facials not separately evidenced; use general esthetic care' },
  skill_barbering:     { status: 'UNSUPPORTED', evidence: 'UNSUPPORTED', note: 'beard/mustache work — not evidenced (women\'s hairdressing)' },
  skill_hair_extensions: { status: 'UNSUPPORTED', evidence: 'UNSUPPORTED', note: 'not evidenced' },
  skill_wig_work:      { status: 'UNSUPPORTED', evidence: 'UNSUPPORTED', note: 'wig/hairpiece styling not evidenced' },
  skill_hydrafacial:   { status: 'EXCLUDED_NOT_CONFIRMED', evidence: 'UNSUPPORTED', note: 'not confirmed in fact registry' },
  skill_microneedling: { status: 'EXCLUDED_NOT_CONFIRMED', evidence: 'UNSUPPORTED' },
  skill_carbon_laser:  { status: 'EXCLUDED_NOT_CONFIRMED', evidence: 'UNSUPPORTED' },
  skill_ipl:           { status: 'EXCLUDED_NOT_CONFIRMED', evidence: 'UNSUPPORTED' },
  skill_nails:         { status: 'MISSING', evidence: 'UNSUPPORTED', note: 'no nail/manicure skill confirmed' },
  skill_lash_extensions: { status: 'EXCLUDED_NOT_CONFIRMED', evidence: 'UNSUPPORTED' },

  visa_status:  { value: 'visitor visa', status: 'VERIFIED_BY_DOCUMENT', note: 'VISITOR visa — NOT work authorization; number never stored; NOT included in any document' },
  language_arabic:  { value: 'Native', status: 'USER_DECLARED' },
  language_english: { value: 'Good working proficiency', status: 'USER_DECLARED', note: 'no CEFR/IELTS/CLB' },
  language_french:  { value: 'Beginner', status: 'USER_DECLARED' },
};

function canAssert(key) {
  const f = FACTS[key];
  if (!f) return false;
  if (key.startsWith('skill_')) return OUTGOING_EVIDENCE.has(f.evidence); // skills gate on practice evidence
  return ASSERTABLE.has(f.status);
}
function experienceStatement() { return FACTS.experience_duration.status === 'USER_CONFIRMED' ? FACTS.experience_duration.value : null; }
function verifiedContact() { return { name: FACTS.full_name.value, email: FACTS.email.value, phone: FACTS.phone.value, location: FACTS.city_country.value }; }
function skillEvidence(key) { const f = FACTS[key]; return f ? f.evidence : null; }
// practice-supported skills — the only ones allowed in outgoing Core Skills / letters
function outgoingSkills() { return Object.keys(FACTS).filter(k => k.startsWith('skill_') && OUTGOING_EVIDENCE.has(FACTS[k].evidence)).map(k => k.replace('skill_', '')); }
// training verified but practice unconfirmed — Additional Training only; reported as awaiting confirmation
function trainingOnlySkills() { return Object.keys(FACTS).filter(k => k.startsWith('skill_') && FACTS[k].evidence === 'TRAINING_VERIFIED').map(k => k.replace('skill_', '')); }
function awaitingPracticeConfirmation() { return trainingOnlySkills(); }
// truly unsupported — must never appear anywhere
function unsupportedSkills() { return Object.keys(FACTS).filter(k => k.startsWith('skill_') && FACTS[k].evidence === 'UNSUPPORTED').map(k => k.replace('skill_', '')); }
// back-compat aliases
function assertableSkills() { return outgoingSkills(); }
function forbiddenSkills() { return unsupportedSkills(); }
function generationReadiness() {
  const material = ['experience_duration', 'current_employer', 'phone', 'email'];
  const blockers = material.filter(k => !canAssert(k)).map(k => `${k} not assertable (${FACTS[k].status})`);
  return { ready: blockers.length === 0, blockers };
}

module.exports = {
  FACTS, canAssert, experienceStatement, verifiedContact,
  skillEvidence, outgoingSkills, trainingOnlySkills, awaitingPracticeConfirmation, unsupportedSkills,
  assertableSkills, forbiddenSkills, generationReadiness,
};
