/**
 * services/pilot/facts.js
 *
 * Candidate-fact integrity registry + generation gates for Samira Benaciri.
 * Facts are marked with an evidence status and are NEVER auto-resolved. Document
 * generation is blocked while material facts remain CONFLICTING or MISSING.
 *
 * status: VERIFIED_BY_DOCUMENT | USER_DECLARED | CONFLICTING | MISSING | UNSUPPORTED
 */
const FACTS = {
  full_name:        { value: 'Samira Benaciri', status: 'VERIFIED_BY_DOCUMENT', source: 'authenticated Supabase account + master_cv@v4' },
  email:            { value: 'samirabenaciri88@gmail.com', status: 'VERIFIED_BY_DOCUMENT', source: 'authenticated auth.users + pilot_profile' },
  phone:            { value: null, status: 'MISSING', note: 'not present in any canonical source — must NOT be invented' },
  city_country:     { value: null, status: 'MISSING', note: 'Salé / Rabat, Morocco declared externally; absent from canonical CV' },
  experience_duration: { value: null, status: 'CONFLICTING', variants: ['15 years (canonical CV headline + experience 2011–2026)', '18 years (external)', '10+ years (external)', '2020–2024 only (external)'], source: 'master_cv@v4 vs external declarations' },
  current_employer: { value: null, status: 'CONFLICTING', variants: ["Salon d'esthétique (canonical placeholder)", 'ASY Beauty Salon, Salé (external)'] },
  previous_employer:{ value: null, status: 'CONFLICTING', variants: ['Salon de coiffure 2011–2026 (canonical)', 'Top 2000, Rabat 2013–2015 (external)'] },
  esthetics_qualification: { value: 'Formation en esthétique', status: 'USER_DECLARED', note: 'no diploma name / institution / date on file' },
  hairdressing_qualification: { value: 'Coiffeuse', status: 'USER_DECLARED' },
  skill_hydrafacial:   { status: 'USER_DECLARED', source: 'master_cv@v4 skills' },
  skill_microneedling: { status: 'USER_DECLARED', source: 'master_cv@v4 skills' },
  skill_carbon_laser:  { status: 'USER_DECLARED', source: 'master_cv@v4 skills (Laser Carbone)' },
  skill_permanent_makeup: { status: 'USER_DECLARED', source: 'master_cv@v4 skills (Maquillage Permanent)' },
  skill_microblading:  { status: 'USER_DECLARED', source: 'master_cv@v4 skills' },
  skill_event_hairstyles: { status: 'USER_DECLARED', source: 'master_cv@v4 experience bullet (Coiffures événementielles)' },
  skill_nails:         { status: 'MISSING', note: 'no nail/manicure skill in canonical CV — must NOT be claimed' },
  availability_date:   { status: 'MISSING' },
  visa_status:         { status: 'MISSING', note: 'work_authorization UNKNOWN; prior "visa valide 2028" was UNSUPPORTED and removed' },
  language_arabic:     { value: 'Native', status: 'USER_DECLARED', note: 'binding fact' },
  language_english:    { value: 'Good working proficiency', status: 'USER_DECLARED', note: 'binding fact; no CEFR/IELTS/CLB' },
  language_french:     { value: 'Beginner', status: 'USER_DECLARED', note: 'binding fact' },
};

// A fact may be asserted in generated documents only if it is verified or a
// binding user-declared value (never CONFLICTING / MISSING / UNSUPPORTED).
function canAssert(key) {
  const f = FACTS[key]; if (!f) return false;
  return f.status === 'VERIFIED_BY_DOCUMENT' || (f.status === 'USER_DECLARED');
}
function canClaimExperienceDuration() { return FACTS.experience_duration.status === 'VERIFIED_BY_DOCUMENT'; }
function verifiedContact() {
  const out = {};
  for (const k of ['email', 'phone']) if (FACTS[k].status === 'VERIFIED_BY_DOCUMENT' && FACTS[k].value) out[k] = FACTS[k].value;
  return out; // { email: ... } — phone excluded (MISSING)
}
// Material facts that block honest generation while unresolved.
function generationReadiness() {
  const material = ['experience_duration', 'current_employer'];
  const blockers = material.filter(k => FACTS[k].status === 'CONFLICTING').map(k => `${k} CONFLICTING`);
  if (FACTS.phone.status === 'MISSING') blockers.push('phone MISSING (cannot be invented; needed for a complete application)');
  return { ready: blockers.length === 0, blockers };
}

module.exports = { FACTS, canAssert, canClaimExperienceDuration, verifiedContact, generationReadiness };
