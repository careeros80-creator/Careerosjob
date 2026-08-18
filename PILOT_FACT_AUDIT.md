# Pilot Phase 4B — Candidate-Fact Integrity Audit + BC Wage Correction

Read-only. Generated 2026-08-18T22:33:04.368Z. **No document regeneration, no approval/send/Gmail/draft/contact, no status mutation.** Production prepared 56 / approved 0 / sent 0 / rejected 6.

## BC minimum-wage correction
- Official: BC general minimum **$17.85 → $18.25/hour effective 2026-06-01**; applies to hourly/salary/commission/incentive (top-up required). Source: https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/wages/minimum-wage. Retrieved (review date) 2026-08-18. Category: general (applies to hourly/salary/commission/incentive).
- On 2026-08-18 the applicable BC minimum is **$18.25**. All BC postings re-checked against $18.25, not the superseded $17.85.
- **Brush Salon $17.85 → A_WAGE_BELOW_MINIMUM** (equals the superseded BC minimum → EFFECTIVE_DATE_REQUIRES_REVIEW), recommendation **HOLD**, removed from any "wage-compliant" list.

## Wage recount (BC $18.25) — before → after
| Category | Before | After |
|---|---|---|
| A_WAGE_BELOW_MINIMUM | 16 | 17 |
| B_ANNUAL_WAGE_REQUIRES_HOURS | 3 | 3 |
| C_COMMISSION_STRUCTURE_REQUIRES_REVIEW | 3 | 3 |
| D_WAGE_COMPLIANT | 36 | 35 |
| E_WAGE_UNKNOWN | 1 | 1 |

### Postings whose class changed (1)
- **Brush Salon** (BC) $17.85 hourly: D_WAGE_COMPLIANT → **A_WAGE_BELOW_MINIMUM** — hourly lower $17.85 < BC min $18.25 (eff 2026-06-01) — equals a SUPERSEDED BC minimum → likely stale posting, EFFECTIVE_DATE_REQUIRES_REVIEW

## Candidate-fact conflict matrix
| Fact | Status | Value / variants | Canonical source |
|---|---|---|---|
| full_name | **VERIFIED_BY_DOCUMENT** | Samira Benaciri | authenticated Supabase account + master_cv@v4 |
| email | **VERIFIED_BY_DOCUMENT** | samirabenaciri88@gmail.com | authenticated auth.users + pilot_profile |
| phone | **MISSING** | — | not present in any canonical source — must NOT be invented |
| city_country | **MISSING** | — | Salé / Rabat, Morocco declared externally; absent from canonical CV |
| experience_duration | **CONFLICTING** | 15 years (canonical CV headline + experience 2011–2026) — VS — 18 years (external) — VS — 10+ years (external) — VS — 2020–2024 only (external) | master_cv@v4 vs external declarations |
| current_employer | **CONFLICTING** | Salon d'esthétique (canonical placeholder) — VS — ASY Beauty Salon, Salé (external) |  |
| previous_employer | **CONFLICTING** | Salon de coiffure 2011–2026 (canonical) — VS — Top 2000, Rabat 2013–2015 (external) |  |
| esthetics_qualification | **USER_DECLARED** | Formation en esthétique | no diploma name / institution / date on file |
| hairdressing_qualification | **USER_DECLARED** | Coiffeuse |  |
| skill_hydrafacial | **USER_DECLARED** | — | master_cv@v4 skills |
| skill_microneedling | **USER_DECLARED** | — | master_cv@v4 skills |
| skill_carbon_laser | **USER_DECLARED** | — | master_cv@v4 skills (Laser Carbone) |
| skill_permanent_makeup | **USER_DECLARED** | — | master_cv@v4 skills (Maquillage Permanent) |
| skill_microblading | **USER_DECLARED** | — | master_cv@v4 skills |
| skill_event_hairstyles | **USER_DECLARED** | — | master_cv@v4 experience bullet (Coiffures événementielles) |
| skill_nails | **MISSING** | — | no nail/manicure skill in canonical CV — must NOT be claimed |
| availability_date | **MISSING** | — |  |
| visa_status | **MISSING** | — | work_authorization UNKNOWN; prior "visa valide 2028" was UNSUPPORTED and removed |
| language_arabic | **USER_DECLARED** | Native | binding fact |
| language_english | **USER_DECLARED** | Good working proficiency | binding fact; no CEFR/IELTS/CLB |
| language_french | **USER_DECLARED** | Beginner | binding fact |

**Generation readiness: BLOCKED_BY_CANDIDATE_FACTS** — blockers: experience_duration CONFLICTING; current_employer CONFLICTING; phone MISSING (cannot be invented; needed for a complete application).
Verified contact usable now: {"email":"samirabenaciri88@gmail.com"} (phone intentionally omitted — MISSING).

---

## Document-generation readiness — preferred four
### Sukhi Laser Beauty Salon & Academy Ltd. — hairstylist (BC/Surrey (BC))  →  **BLOCKED_BY_CANDIDATE_FACTS**
- **App ID:** `54e663b2-225e-46ad-88c9-4edd38d1aab9` (JOBBANK_50023156) · live OPEN · wage $38.84 hourly → D_WAGE_COMPLIANT · LMIA EXACT_COMPATIBLE_HISTORY_RECENT
- **Verified facts safe to use:** name "Samira Benaciri"; email samirabenaciri88@gmail.com; languages (Arabic native / English good working proficiency / French beginner); declared skills relevant to this role: Coiffure, Balayage, Coiffures événementielles.
- **Unresolved (do NOT use):** exact experience duration (CONFLICTING 15/18/10+/2020-2024); real employer names/dates (ASY / Top 2000 vs canonical placeholders); phone (MISSING); city/country (MISSING); availability (MISSING); visa/work-authorization (UNKNOWN); nails (not in skills).
- **Duties matching verified skills:** cutting, colour, balayage, event styling (all from canonical CV, USER_DECLARED).
- **Duties that must NOT be claimed:** nail/manicure services; any certification/diploma name; exact years of experience; bilingual/fluent language; visa/work rights.
- **Required document language:** ENGLISH (BC English-market; candidate English = good working proficiency).
- **Contact safe to include:** email only (no phone).
- **Licensing:** BC — no compulsory-trade blocker (hairstylist compulsory only in AB).
- **Recommendation:** BLOCKED_BY_CANDIDATE_FACTS — resolve experience timeline + contact before generating.

### Blades & Scissors Hair Salon Ltd. — hairstylist (BC/Delta (BC))  →  **BLOCKED_BY_CANDIDATE_FACTS**
- **App ID:** `fb7f4c41-d75f-4520-8936-983ff2d0a2ae` (JOBBANK_50071923) · live OPEN · wage $32.00 hourly → D_WAGE_COMPLIANT · LMIA EXACT_COMPATIBLE_HISTORY_RECENT
- **Verified facts safe to use:** name "Samira Benaciri"; email samirabenaciri88@gmail.com; languages (Arabic native / English good working proficiency / French beginner); declared skills relevant to this role: Coiffure, Balayage, Coiffures événementielles.
- **Unresolved (do NOT use):** exact experience duration (CONFLICTING 15/18/10+/2020-2024); real employer names/dates (ASY / Top 2000 vs canonical placeholders); phone (MISSING); city/country (MISSING); availability (MISSING); visa/work-authorization (UNKNOWN); nails (not in skills).
- **Duties matching verified skills:** cutting, colour, balayage, event styling (all from canonical CV, USER_DECLARED).
- **Duties that must NOT be claimed:** nail/manicure services; any certification/diploma name; exact years of experience; bilingual/fluent language; visa/work rights.
- **Required document language:** ENGLISH (BC English-market; candidate English = good working proficiency).
- **Contact safe to include:** email only (no phone).
- **Licensing:** BC — no compulsory-trade blocker (hairstylist compulsory only in AB).
- **Recommendation:** BLOCKED_BY_CANDIDATE_FACTS — resolve experience timeline + contact before generating.

### OLIHA MUNIZ BOUTIQUE AND HAIR INC. — hairstylist (ON/Mississauga (ON))  →  **BLOCKED_BY_CANDIDATE_FACTS**
- **App ID:** `49342a54-2488-44b9-a1b0-c4b989f94d08` (JOBBANK_50074303) · live OPEN · wage $37.00 hourly → D_WAGE_COMPLIANT · LMIA EXACT_COMPATIBLE_HISTORY_RECENT
- **Verified facts safe to use:** name "Samira Benaciri"; email samirabenaciri88@gmail.com; languages (Arabic native / English good working proficiency / French beginner); declared skills relevant to this role: Coiffure, Balayage, Coiffures événementielles.
- **Unresolved (do NOT use):** exact experience duration (CONFLICTING 15/18/10+/2020-2024); real employer names/dates (ASY / Top 2000 vs canonical placeholders); phone (MISSING); city/country (MISSING); availability (MISSING); visa/work-authorization (UNKNOWN); nails (not in skills).
- **Duties matching verified skills:** cutting, colour, balayage, event styling (all from canonical CV, USER_DECLARED).
- **Duties that must NOT be claimed:** nail/manicure services; any certification/diploma name; exact years of experience; bilingual/fluent language; visa/work rights.
- **Required document language:** ENGLISH (ON English-market; candidate English = good working proficiency).
- **Contact safe to include:** email only (no phone).
- **Licensing:** ON — no compulsory-trade blocker (hairstylist compulsory only in AB).
- **Recommendation:** BLOCKED_BY_CANDIDATE_FACTS — resolve experience timeline + contact before generating.

### Glamour touch studio inc — esthetician (BC/South Surrey (BC))  →  **BLOCKED_BY_CANDIDATE_FACTS**
- **App ID:** `803aa648-7bba-41f1-926c-bfb153abb37d` (JOBBANK_50015027) · live OPEN · wage $19.50 to $21.50 hourly → D_WAGE_COMPLIANT · LMIA EXACT_COMPATIBLE_HISTORY_OLDER
- **Verified facts safe to use:** name "Samira Benaciri"; email samirabenaciri88@gmail.com; languages (Arabic native / English good working proficiency / French beginner); declared skills relevant to this role: HydraFacial, Microneedling, Laser Carbone, IPL, Soins du visage, Épilation.
- **Unresolved (do NOT use):** exact experience duration (CONFLICTING 15/18/10+/2020-2024); real employer names/dates (ASY / Top 2000 vs canonical placeholders); phone (MISSING); city/country (MISSING); availability (MISSING); visa/work-authorization (UNKNOWN); nails (not in skills).
- **Duties matching verified skills:** facials/advanced skin care, IPL/laser, waxing, permanent makeup/microblading (all from canonical CV, USER_DECLARED).
- **Duties that must NOT be claimed:** nail/manicure services; any certification/diploma name; exact years of experience; bilingual/fluent language; visa/work rights.
- **Required document language:** ENGLISH (BC English-market; candidate English = good working proficiency).
- **Contact safe to include:** email only (no phone).
- **Licensing:** BC — no compulsory-trade blocker (hairstylist compulsory only in AB).
- **Recommendation:** BLOCKED_BY_CANDIDATE_FACTS — resolve experience timeline + contact before generating.

### Brush Salon — separate HOLD (not in preferred four)
- `93ecd702-9e02-4d38-8c07-fb4e29b0a7fd` (JOBBANK_50046351) — apprentice role · wage $17.85 hourly → **A_WAGE_BELOW_MINIMUM** (BC min $18.25) · LMIA EXACT_COMPATIBLE_HISTORY_OLDER (2016). **HOLD** until posting age / wage adjustment / documented legal interpretation is confirmed.

---

## Proposed English cover-letter template requirements (NOT generated)
- Plain professional English consistent with "good working proficiency"; never native/fluent/bilingual/certified/IELTS/CLB/CEFR.
- No C16 / LMIA-exempt / sponsorship / work-authorization claim.
- Only verified contact details (email; no invented phone).
- Accurate employer name + position (from the live posting).
- Only verified/declared skills; **omit exact experience duration** while conflicting (use "experienced" not "15/18 years").
- No visa/work-rights statement unless separately verified.
- Distinct content per occupation (esthetician vs hairstylist) — no identical letters.