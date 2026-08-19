/**
 * services/pilot/facts.js
 *
 * Candidate-fact integrity registry + generation gates for Samira Benaciri.
 * Phase 5: previously-conflicting facts are RESOLVED to the user-confirmed
 * binding values. Facts are still never auto-resolved silently; excluded/missing
 * facts remain non-assertable so generation cannot claim them.
 *
 * status: VERIFIED_BY_DOCUMENT | USER_CONFIRMED | USER_DECLARED |
 *         CONFLICTING | MISSING | UNSUPPORTED | EXCLUDED_NOT_CONFIRMED
 */
const ASSERTABLE = new Set(['VERIFIED_BY_DOCUMENT', 'USER_CONFIRMED', 'USER_DECLARED']);

const FACTS = {
  full_name:        { value: 'Samira Benaciri', status: 'VERIFIED_BY_DOCUMENT', source: 'authenticated account + candidate' },
  email:            { value: 'samirabenaciri88@gmail.com', status: 'VERIFIED_BY_DOCUMENT', source: 'authenticated auth.users + pilot_profile' },
  phone:            { value: '+212 6 62 79 32 95', status: 'USER_DECLARED', source: 'candidate binding fact (Phase 5)' },
  city_country:     { value: 'Salé, Morocco', status: 'USER_DECLARED', source: 'candidate binding fact' },
  relocation:       { value: 'Available to relocate promptly after a formal offer and completion of the required Canadian work-authorization process.', status: 'USER_DECLARED' },
  experience_duration: { value: '17 years (July 2009 – August 2026)', status: 'USER_CONFIRMED', source: 'candidate-confirmed continuous timeline + documented 2009 hairdressing status + ASY Beauty ownership since 2021' },
  current_employer: { value: 'ASY Beauty, Salé — Owner-Manager | Senior Hairdresser & Esthetician (Sept 2021–present)', status: 'USER_CONFIRMED', source: 'registered in candidate name; activity start 2021-09-01' },
  previous_employers: { value: 'Salon Cléopâtre, Salé (2015–2021); Salon Top 2000, Rabat (2013–2015); Salon La Manucure, Rabat (2009–2013); Salon Al Amira intern, Salé (2009)', status: 'USER_CONFIRMED' },
  esthetics_qualification: { value: 'Diploma in Esthetics — Assoc. de Solidarité Sociale et Artisanale Mohammedia (2019-09-17)', status: 'USER_CONFIRMED' },
  hairdressing_qualification: { value: "Diploma in Women's Hairdressing — École Nito de Coiffure et d'Esthétique, Salé", status: 'USER_CONFIRMED' },
  // assertable skills (verified training / confirmed timeline)
  skill_womens_hairdressing: { status: 'USER_CONFIRMED' },
  skill_haircutting_styling: { status: 'USER_CONFIRMED' },
  skill_hair_colouring:      { status: 'USER_CONFIRMED' },
  skill_hair_treatments:     { status: 'USER_CONFIRMED' },
  skill_event_styling:       { status: 'USER_CONFIRMED' },
  skill_facials:             { status: 'USER_CONFIRMED' },
  skill_makeup:              { status: 'USER_CONFIRMED' },
  skill_microblading:        { status: 'USER_CONFIRMED', source: 'Maison Joulla training 2022-11-29' },
  skill_permanent_makeup:    { status: 'USER_CONFIRMED', source: 'Ozone Plus 2016' },
  skill_advanced_esthetics:  { status: 'USER_CONFIRMED', source: 'Al-Majd Academy 35h 2023' },
  skill_client_consultation: { status: 'USER_CONFIRMED' },
  skill_cosmetic_products:   { status: 'USER_CONFIRMED', source: 'AM Prod Cosmétique training 2019-11' },
  skill_salon_management:    { status: 'USER_CONFIRMED', source: 'ASY Beauty ownership' },
  // NON-assertable (must never appear in documents)
  skill_hydrafacial:   { status: 'EXCLUDED_NOT_CONFIRMED', note: 'not confirmed in fact registry' },
  skill_microneedling: { status: 'EXCLUDED_NOT_CONFIRMED' },
  skill_carbon_laser:  { status: 'EXCLUDED_NOT_CONFIRMED' },
  skill_ipl:           { status: 'EXCLUDED_NOT_CONFIRMED' },
  skill_nails:         { status: 'MISSING', note: 'no nail/manicure skill confirmed' },
  skill_lash_extensions: { status: 'EXCLUDED_NOT_CONFIRMED' },
  visa_status:  { value: 'V-1 multiple-entry visitor visa valid to 2028-09-12', status: 'VERIFIED_BY_DOCUMENT', note: 'VISITOR visa — NOT work authorization; number never stored; NOT included in CV' },
  language_arabic:  { value: 'Native', status: 'USER_DECLARED' },
  language_english: { value: 'Good working proficiency', status: 'USER_DECLARED', note: 'no CEFR/IELTS/CLB' },
  language_french:  { value: 'Beginner', status: 'USER_DECLARED' },
};

function canAssert(key) { const f = FACTS[key]; return !!f && ASSERTABLE.has(f.status); }
function experienceStatement() { return FACTS.experience_duration.status === 'USER_CONFIRMED' ? FACTS.experience_duration.value : null; }
function verifiedContact() { return { name: FACTS.full_name.value, email: FACTS.email.value, phone: FACTS.phone.value, location: FACTS.city_country.value }; }
function assertableSkills() { return Object.keys(FACTS).filter(k => k.startsWith('skill_') && canAssert(k)).map(k => k.replace('skill_', '')); }
function forbiddenSkills() { return Object.keys(FACTS).filter(k => k.startsWith('skill_') && !canAssert(k)).map(k => k.replace('skill_', '')); }
function generationReadiness() {
  const material = ['experience_duration', 'current_employer', 'phone', 'email'];
  const blockers = material.filter(k => !canAssert(k)).map(k => `${k} not assertable (${FACTS[k].status})`);
  return { ready: blockers.length === 0, blockers };
}

module.exports = { FACTS, canAssert, experienceStatement, verifiedContact, assertableSkills, forbiddenSkills, generationReadiness };
