# Pilot Phase 4A — LMIA Gap Closure + Wage Semantics + 5 Dossiers

Read-only. Generated 2026-08-18T16:08:57.297Z. **No approval/send/Gmail/draft/employer-contact; no status or document mutation.** Production prepared 56 / approved 0 / sent 0 / rejected 6.

## LMIA coverage (now complete)
- **39 quarters** 2014→2026Q1, **472,224 rows**, **no gaps**.
- 2023Q1–Q3 were catalogue-labelled XLS but are actually **OOXML/zip** — parsed (17,109 / 16,170 / 18,558 rows). Provenance (src+converted SHA-256) in `docs/LMIA_PROVENANCE.json`.
- **None of the 54 unmatched employers appear in 2023Q1–Q3.** Unmatched are now **NO_MATCH_WITHIN_COMPLETE_VERIFIED_COVERAGE**.
- Classes: NO_MATCH_WITHIN_COMPLETE_VERIFIED_COVERAGE 54 · EXACT_COMPATIBLE_HISTORY_RECENT 3 · EXACT_COMPATIBLE_HISTORY_OLDER 2

## Wage categories (all 59)
- A_WAGE_BELOW_MINIMUM: **16**
- B_ANNUAL_WAGE_REQUIRES_HOURS: **3**
- C_COMMISSION_STRUCTURE_REQUIRES_REVIEW: **3**
- D_WAGE_COMPLIANT: **36**
- E_WAGE_UNKNOWN: **1**

_Reference minimums: ON $17.6✓, BC $17.85, AB $15, MB $16, SK $15.35, NS $15.7, NB $15.65, NL $16, PE $16. ESDC federal minimum-wage database (srv116) unreachable (HTTP 000) at 2026-08-18; ON $17.60 confirmed per instruction; other provinces are the current published provincial rates and REQUIRE official verification._

---

## Five manual-review dossiers (ranked)
### 1. Sukhi Laser Beauty Salon & Academy Ltd. — hairstylist (BC/Surrey (BC))  →  **REVISE_DOCUMENTS**
- **Application ID:** `54e663b2-225e-46ad-88c9-4edd38d1aab9` (JOBBANK_50023156) · status `prepared`
- **Posting:** https://www.jobbank.gc.ca/jobposting/50023156 · live **OPEN** (until 2026-08-27) · fetched 2026-08-18T15:52:29Z
- **Role/NOC:** hairstylist · NOC 63210/TEER 3 · **Province/City:** BC/Surrey (BC)
- **Wage:** $38.84 hourly → **D_WAGE_COMPLIANT** (hourly lower $38.84 ≥ BC min $17.85)
- **Language req:** English (compatible) · **Channel:** JOB_BANK_APPLICATION_CHANNEL · **Website:** https://forces.ca/en/paid-education/?utm_campaign=caf_job_posts&amp;utm_medium=digital&amp;utm_source=jobbank
- **Employer identity:** named on official Job Bank posting + website (evidence: posting)
- **LMIA history:** EXACT_COMPATIBLE_HISTORY_RECENT — RECENT (≤3y), repetition 2, quarters 2024Q1, 2024Q2
  - 2024Q1: Sukhi Laser Beauty Salon & Academy Ltd. | British Columbia | 6341-Hairstylists and barbers | Surrey, BC V3W 1R1
  - 2024Q2: Sukhi Laser Beauty Salon & Academy Ltd. | British Columbia | 63210-Hairstylists and barbers | Surrey, BC V3W 1R1
- **Compatibility w/ proven skills:** hairstyling/esthetics — compatible with proven hairdressing/esthetics
- **Licensing:** BC — no compulsory-trade blocker for BC
- **Work authorization:** UNRESOLVED (C16 UNKNOWN; not confirmed/possible)
- **CV:** v2 `0d94139422d1` (master_cv@v4) · **Cover letter:** v2 `7630e6be2485` (cover_letter_template@v2)
- **Unsupported-claim scan:** CV clean · cover letter clean (no C16/LMIA/native/bilingual/fluent/work-auth)
- **Proposed edits (NOT applied):**
  - LANGUAGE: cover letter (and CV) are in FRENCH; posting market is BC (English) and candidate English=Good/French=Beginner → generate ENGLISH documents.
  - CONTACT: cover letter has no candidate contact block (phone/email/city) → add before any send.
- **Exact blockers:** work-authorization UNRESOLVED (overarching); document language mismatch (FR vs EN market).

### 2. Blades & Scissors Hair Salon Ltd. — hairstylist (BC/Delta (BC))  →  **REVISE_DOCUMENTS**
- **Application ID:** `fb7f4c41-d75f-4520-8936-983ff2d0a2ae` (JOBBANK_50071923) · status `prepared`
- **Posting:** https://www.jobbank.gc.ca/jobposting/50071923 · live **OPEN** (until 2026-09-03) · fetched 2026-08-18T15:53:46Z
- **Role/NOC:** hairstylist · NOC 63210/TEER 3 · **Province/City:** BC/Delta (BC)
- **Wage:** $32.00 hourly → **D_WAGE_COMPLIANT** (hourly lower $32 ≥ BC min $17.85)
- **Language req:** English (compatible) · **Channel:** JOB_BANK_APPLICATION_CHANNEL · **Website:** https://bookedin.com/book/bladesscissors-unisex-hair-salon
- **Employer identity:** named on official Job Bank posting + website (evidence: posting)
- **LMIA history:** EXACT_COMPATIBLE_HISTORY_RECENT — RECENT (≤3y), repetition 1, quarters 2024Q1
  - 2024Q1: Blades & Scissors Hair Salon Ltd. | British Columbia | 6341-Hairstylists and barbers | Delta, BC V4C 6P7
- **Compatibility w/ proven skills:** hairstyling/esthetics — compatible with proven hairdressing/esthetics
- **Licensing:** BC — no compulsory-trade blocker for BC
- **Work authorization:** UNRESOLVED (C16 UNKNOWN; not confirmed/possible)
- **CV:** v2 `0d94139422d1` (master_cv@v4) · **Cover letter:** v2 `11c2aa27e4d6` (cover_letter_template@v2)
- **Unsupported-claim scan:** CV clean · cover letter clean (no C16/LMIA/native/bilingual/fluent/work-auth)
- **Proposed edits (NOT applied):**
  - LANGUAGE: cover letter (and CV) are in FRENCH; posting market is BC (English) and candidate English=Good/French=Beginner → generate ENGLISH documents.
  - CONTACT: cover letter has no candidate contact block (phone/email/city) → add before any send.
- **Exact blockers:** work-authorization UNRESOLVED (overarching); document language mismatch (FR vs EN market).

### 3. OLIHA MUNIZ BOUTIQUE AND HAIR INC. — hairstylist (ON/Mississauga (ON))  →  **REVISE_DOCUMENTS**
- **Application ID:** `49342a54-2488-44b9-a1b0-c4b989f94d08` (JOBBANK_50074303) · status `prepared`
- **Posting:** https://www.jobbank.gc.ca/jobposting/50074303 · live **OPEN** (until 2026-08-30) · fetched 2026-08-18T15:53:52Z
- **Role/NOC:** hairstylist · NOC 63210/TEER 3 · **Province/City:** ON/Mississauga (ON)
- **Wage:** $37.00 hourly → **D_WAGE_COMPLIANT** (hourly lower $37 ≥ ON min $17.6)
- **Language req:** English (compatible) · **Channel:** JOB_BANK_APPLICATION_CHANNEL · **Website:** https://olihamuniz.com/
- **Employer identity:** named on official Job Bank posting + website (evidence: posting)
- **LMIA history:** EXACT_COMPATIBLE_HISTORY_RECENT — RECENT (≤3y), repetition 1, quarters 2024Q2
  - 2024Q2: OLIHA MUNIZ BOUTIQUE AND HAIR INC. | Ontario | 63210-Hairstylists and barbers | Mississauga, ON L4T 1A6
- **Compatibility w/ proven skills:** hairstyling/esthetics — compatible with proven hairdressing/esthetics
- **Licensing:** ON — no compulsory-trade blocker for ON
- **Work authorization:** UNRESOLVED (C16 UNKNOWN; not confirmed/possible)
- **CV:** v2 `0d94139422d1` (master_cv@v4) · **Cover letter:** v2 `76588f925504` (cover_letter_template@v2)
- **Unsupported-claim scan:** CV clean · cover letter clean (no C16/LMIA/native/bilingual/fluent/work-auth)
- **Proposed edits (NOT applied):**
  - LANGUAGE: cover letter (and CV) are in FRENCH; posting market is ON (English) and candidate English=Good/French=Beginner → generate ENGLISH documents.
  - CONTACT: cover letter has no candidate contact block (phone/email/city) → add before any send.
- **Exact blockers:** work-authorization UNRESOLVED (overarching); document language mismatch (FR vs EN market).

### 4. Glamour touch studio inc — esthetician (BC/South Surrey (BC))  →  **REVISE_DOCUMENTS**
- **Application ID:** `803aa648-7bba-41f1-926c-bfb153abb37d` (JOBBANK_50015027) · status `prepared`
- **Posting:** https://www.jobbank.gc.ca/jobposting/50015027 · live **OPEN** · fetched 2026-08-18T15:49:49Z
- **Role/NOC:** esthetician · NOC 63211/TEER 3 · **Province/City:** BC/South Surrey (BC)
- **Wage:** $19.50 to $21.50 hourly → **D_WAGE_COMPLIANT** (hourly lower $19.5 ≥ BC min $17.85)
- **Language req:** unknown (compatible) · **Channel:** JOB_BANK_APPLICATION_CHANNEL · **Website:** https://ca.indeed.com/viewjob?jk=3539a3e3913bac73&amp;sid=cajb&amp;kw=cajb
- **Employer identity:** named on official Job Bank posting + website (evidence: posting)
- **LMIA history:** EXACT_COMPATIBLE_HISTORY_OLDER — OLDER (>3y), repetition 2, quarters 2020Q1, 2023Q2
  - 2020Q1: Glamour Touch Studio Inc. | British Columbia | 6341-Hairstylists and barbers | Surrey, V4A5A4
  - 2023Q2: Glamour Touch Studio | British Columbia | 6562-Estheticians, electrologists and related occupations | Surrey, BC V4A 5A4
- **Compatibility w/ proven skills:** hairstyling/esthetics — compatible with proven hairdressing/esthetics
- **Licensing:** BC — no compulsory-trade blocker for BC
- **Work authorization:** UNRESOLVED (C16 UNKNOWN; not confirmed/possible)
- **CV:** v2 `83b942e23066` (master_cv@v4) · **Cover letter:** v2 `2e0084883ee4` (cover_letter_template@v2)
- **Unsupported-claim scan:** CV clean · cover letter clean (no C16/LMIA/native/bilingual/fluent/work-auth)
- **Proposed edits (NOT applied):**
  - LANGUAGE: cover letter (and CV) are in FRENCH; posting market is BC (English) and candidate English=Good/French=Beginner → generate ENGLISH documents.
  - CONTACT: cover letter has no candidate contact block (phone/email/city) → add before any send.
- **Exact blockers:** work-authorization UNRESOLVED (overarching); document language mismatch (FR vs EN market).

### 5. Brush Salon — hairstylist apprentice (BC/Vancouver (BC))  →  **HOLD**
- **Application ID:** `93ecd702-9e02-4d38-8c07-fb4e29b0a7fd` (JOBBANK_50046351) · status `prepared`
- **Posting:** https://www.jobbank.gc.ca/jobposting/50046351 · live **OPEN** · fetched 2026-08-18T15:51:59Z
- **Role/NOC:** hairstylist apprentice · NOC 63210/TEER 3 · **Province/City:** BC/Vancouver (BC)
- **Wage:** $17.85 hourly → **D_WAGE_COMPLIANT** (hourly lower $17.85 ≥ BC min $17.85)
- **Language req:** unknown (compatible) · **Channel:** JOB_BANK_APPLICATION_CHANNEL · **Website:** https://ca.indeed.com/viewjob?jk=4ae8cee2e51a1aad&amp;sid=cajb&amp;kw=cajb
- **Employer identity:** named on official Job Bank posting + website (evidence: posting)
- **LMIA history:** EXACT_COMPATIBLE_HISTORY_OLDER — OLDER (>3y), repetition 1, quarters 2016
  - 2016: Brush Salon Inc. |  | 6341-Hairstylists and barbers | Vancouver, BC V6B 1E4
- **Compatibility w/ proven skills:** hairstyling/esthetics — compatible with proven hairdressing/esthetics
- **Licensing:** BC — no compulsory-trade blocker for BC
- **Work authorization:** UNRESOLVED (C16 UNKNOWN; not confirmed/possible)
- **CV:** v2 `145b1568ff67` (master_cv@v4) · **Cover letter:** v2 `681c07f386fc` (cover_letter_template@v2)
- **Unsupported-claim scan:** CV clean · cover letter clean (no C16/LMIA/native/bilingual/fluent/work-auth)
- **Proposed edits (NOT applied):**
  - LANGUAGE: cover letter (and CV) are in FRENCH; posting market is BC (English) and candidate English=Good/French=Beginner → generate ENGLISH documents.
  - ROLE LEVEL: posting is an APPRENTICE role; candidate has 15y experience → confirm level/overqualification before applying.
  - CONTACT: cover letter has no candidate contact block (phone/email/city) → add before any send.
- **Exact blockers:** work-authorization UNRESOLVED (overarching); document language mismatch (FR vs EN market); role-level mismatch (apprentice).
