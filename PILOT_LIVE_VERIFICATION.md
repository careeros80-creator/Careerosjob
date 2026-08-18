# Pilot Live Verification (Phase 3) — 59 Active Applications

Read-only verification with genuine per-fetch UTC timestamps. Generated 2026-08-18T16:08:57.297Z. Parser jobbank-parser-1.1.0.
**No approval, send, Gmail, draft, or employer contact. DB mutations were limited to the Phase-3 allowlist (3 closed → rejected; province ON for 50009104; verification note for 50008048).**

- Evidence fetch-timestamp range: **2026-08-18T15:49:04Z … 2026-08-18T15:55:57Z** (all real; hardcoded 2026-08-14 removed; validated by services/pilot/evidence.js).
- Candidate (binding): Arabic native, English good working proficiency, French **beginner**. **C16 UNKNOWN** (not confirmed/possible).

## LMIA dataset provenance (official)
- Dataset: **Temporary Foreign Worker Program (TFWP): Positive Labour Market Impact Assessment (LMIA) Employers** (`90fed587-1364-4f33-a9ee-208181dc0b97`)
- File: `tfwp_2020q3_positive_en.csv` · Period: **2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)**
- URL: https://open.canada.ca/data/dataset/90fed587-1364-4f33-a9ee-208181dc0b97/resource/d7f10890-cfd4-4b15-baa7-d40bad38343b/download/tfwp_2020q3_positive_en.csv
- Retrieved: 2026-08-18T16:00:13Z · sha256 `d1a5510c62125955ff54c08454a19b3d29dff3a4538f9d31a3ea54856f27877f`
- Note: Historical positive LMIA is employer intelligence only and does not prove sponsorship for the current job.

| Signal | Value |
|---|---|
| Live OPEN / CLOSED / UNREACHABLE | 52 / 3 / 4 |
| Verified employers (named on official posting) | 55 / 59 |
| Verified employer EMAIL | 0 |
| Verified non-email application channel | 52 |
| Unresolved contact | 7 |
| A1 / A2 / B / C | 0 / 51 / 5 / 3 |
| Alberta compulsory-trade blockers | 4 |
| LMIA CONFIRMED / CANDIDATE_REVIEW / NO_MATCH / UNKNOWN | 0 / 1 / 58 / 0 |

LMIA is employer intelligence only; historical positive LMIA does NOT prove sponsorship for the current job, and "no match" is NOT "refused/impossible/unwilling".

---

## A1 — Ready (all gates verified) (0)
_none_

---

## A2 — Strong match, blocked by verification (51)

#### Alchemy on Lorne Inc — hairstylist  `A2`

- **ID:** `8cd92519-1c76-4300-8101-26845895d1dd` (JOBBANK_50015850)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50015850 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50015850
- **fetched_at_utc:** 2026-08-18T15:53:04Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50015850 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `bc7269ad740a560fe6dd4f1b…` · **classification:** OPEN
- **Province/City:** ON / Sudbury (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $17.60 to $22.00 hourly (to be negotiated)
- **Language:** English (compatible) · **Website:** http://www.alchemyonlorne.com
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Allan Parss Salon — hairstylist  `A2`

- **ID:** `d5e9abef-5d28-42cf-9247-8b63bbf67285` (JOBBANK_50064256)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50064256 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50064256
- **fetched_at_utc:** 2026-08-18T15:51:41Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50064256 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `4a56a2ed2ddb27d451c10a7b…` · **classification:** OPEN
- **Province/City:** ON / Toronto (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $35,200.00 to $105,902.57 annually
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=35798597ab825d4c&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Bella Brows & Spa — esthetician  `A2`

- **ID:** `9f43325c-3b8f-4476-9814-9ddd6d434cc6` (JOBBANK_50023594)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50023594 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50023594
- **fetched_at_utc:** 2026-08-18T15:49:34Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50023594 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `269229eb6e16ce2046d99040…` · **classification:** OPEN
- **Province/City:** AB / Edmonton (AB) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $36.00 hourly
- **Language:** English (compatible) · **Website:** http://www.bellabrowsspa.com
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Blades & Scissors Hair Salon Ltd. — hairstylist  `A2`

- **ID:** `fb7f4c41-d75f-4520-8936-983ff2d0a2ae` (JOBBANK_50071923)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50071923 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50071923
- **fetched_at_utc:** 2026-08-18T15:53:46Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50071923 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `e5938b0e40c89d880c77f18d…` · **classification:** OPEN
- **Province/City:** BC / Delta (BC) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $32.00 hourly
- **Language:** English (compatible) · **Website:** https://bookedin.com/book/bladesscissors-unisex-hair-salon
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Brush Salon — hairstylist apprentice  `A2`

- **ID:** `93ecd702-9e02-4d38-8c07-fb4e29b0a7fd` (JOBBANK_50046351)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50046351 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50046351
- **fetched_at_utc:** 2026-08-18T15:51:59Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50046351 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `539171698bf72081823d7c63…` · **classification:** OPEN
- **Province/City:** BC / Vancouver (BC) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $17.85 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=4ae8cee2e51a1aad&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** CANDIDATE_MATCH_REQUIRES_REVIEW — name+province match but occupation differs (0124-Advertising, marketing and public r) — not confirmed; dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Chatters Salon Tillicum Mall — hairstylist  `A2`

- **ID:** `ec00c6f7-8cac-48ad-99e7-9f5d389118ee` (JOBBANK_50070741)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50070741 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50070741
- **fetched_at_utc:** 2026-08-18T15:51:12Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50070741 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `6cfc14760b3cca9e018de832…` · **classification:** OPEN
- **Province/City:** BC / Victoria (BC) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $21.00 hourly
- **Language:** English (compatible) · **Website:** https://forces.ca/en/paid-education/?utm_campaign=caf_job_posts&amp;utm_medium=digital&amp;utm_source=jobbank
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Cleopatras Rituals — esthetician  `A2`

- **ID:** `ef96411c-4927-4b45-b732-678312528069` (JOBBANK_50065482)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50065482 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50065482
- **fetched_at_utc:** 2026-08-18T15:49:04Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50065482 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `72c8e9379c2582c1b7d394eb…` · **classification:** OPEN
- **Province/City:** BC / Kelowna (BC) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $21.00 hourly
- **Language:** English (compatible) · **Website:** http://www.cleopatrasrituals.com
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Eden Day Spa and Salon Inc — hairstylist  `A2`

- **ID:** `2eac856e-67d1-4f9b-a472-536b56a154d8` (JOBBANK_50076149)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50076149 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50076149
- **fetched_at_utc:** 2026-08-18T15:53:49Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50076149 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `babb482ae75bcf535268c8d3…` · **classification:** OPEN
- **Province/City:** NB / Campbellton (NB) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $21.00 to $25.00 hourly (to be negotiated)
- **Language:** English (compatible) · **Website:** http://www.workingnb.ca/
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Exhale Spa - St Anthony — esthetician  `A2`

- **ID:** `32314aa4-b7c2-40cd-b2af-8c215a145b5c` (JOBBANK_50008987)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50008987 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50008987
- **fetched_at_utc:** 2026-08-18T15:50:12Z · **http:** 0 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50008987 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `n/a (unreachable)` · **classification:** UNREACHABLE
- **Province/City:** NL / St. Anthony (NL) · **NOC/TEER:** — · **Wage:** $16.50 hourly
- **Language:** unknown (compatible) · **Website:** none
- **Application channel:** UNREACHABLE
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** live posting UNREACHABLE — status UNKNOWN (not inferred).

#### First Choice Haircutters — hairstylist  `A2`

- **ID:** `930fda11-ae36-49d4-b3ea-b9e2b6fc18e6` (JOBBANK_50045919)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50045919 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50045919
- **fetched_at_utc:** 2026-08-18T15:52:05Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50045919 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `75f52065d561f2f47345bc60…` · **classification:** OPEN
- **Province/City:** ON / Orillia (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $17.60 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=2fab5b7c4b3f7710&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### First Choice Haircutters — hairstylist  `A2`

- **ID:** `e10618f2-9bb6-4a5a-bf53-3088253a3834` (JOBBANK_50045672)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50045672 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50045672
- **fetched_at_utc:** 2026-08-18T15:52:02Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50045672 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `672618310d6a16d4f46760d4…` · **classification:** OPEN
- **Province/City:** ON / Vaughan (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $18.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=b65595c431e24527&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Fish Hair Salon — stylist, hair  `A2`

- **ID:** `fc2f869b-07c5-4a33-bdd8-36e6c55ec0e9` (JOBBANK_50072349)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50072349 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50072349
- **fetched_at_utc:** 2026-08-18T15:53:08Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50072349 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `baf53f614e2a5f626f997091…` · **classification:** OPEN
- **Province/City:** BC / Victoria (BC) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** 50% commission per sale
- **Language:** English (compatible) · **Website:** http://Fishhairsalon.com
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Galaxy Beauty Lounge — stylist, hair  `A2`

- **ID:** `6541c9db-818c-41fe-9e5d-0b10a5b19aa8` (JOBBANK_50042798)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50042798 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50042798
- **fetched_at_utc:** 2026-08-18T15:52:23Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50042798 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `0ddef8678654bac46cd954bc…` · **classification:** OPEN
- **Province/City:** BC / Surrey (BC) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $40,000.00 to $60,000.00 annually
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=f9a1ebe2f193ec08&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Galaxy Beauty Lounge — esthetician  `A2`

- **ID:** `9c586669-4f82-48ed-82b1-8a2b3a6f6a84` (JOBBANK_50042802)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50042802 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50042802
- **fetched_at_utc:** 2026-08-18T15:49:29Z · **http:** 0 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50042802 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `n/a (unreachable)` · **classification:** UNREACHABLE
- **Province/City:** BC / Surrey (BC) · **NOC/TEER:** — · **Wage:** $40,000.00 to $60,000.00 annually
- **Language:** unknown (compatible) · **Website:** none
- **Application channel:** UNREACHABLE
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** live posting UNREACHABLE — status UNKNOWN (not inferred).

#### Glamour touch studio inc — esthetician  `A2`

- **ID:** `803aa648-7bba-41f1-926c-bfb153abb37d` (JOBBANK_50015027)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50015027 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50015027
- **fetched_at_utc:** 2026-08-18T15:49:49Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50015027 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `2d55da7ed50d1e679628808d…` · **classification:** OPEN
- **Province/City:** BC / South Surrey (BC) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $19.50 to $21.50 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=3539a3e3913bac73&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Hairnation salon & spa — stylist, hair  `A2`

- **ID:** `f9cb0b62-88b7-4df5-b83a-4b1efeae7f84` (JOBBANK_50015303)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50015303 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50015303
- **fetched_at_utc:** 2026-08-18T15:52:43Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50015303 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `0edb77e92f7acb2dc2016b48…` · **classification:** OPEN
- **Province/City:** SK / Saskatoon (SK) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $16.00 to $35.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=4c961e4d009d22ad&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Hammam Spa by Céla — esthetician  `A2`

- **ID:** `fb728be9-54a6-465c-83b8-ed68699e142c` (JOBBANK_50048153)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50048153 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50048153
- **fetched_at_utc:** 2026-08-18T15:49:28Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50048153 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `932ba2591f68db753547c957…` · **classification:** OPEN
- **Province/City:** ON / Toronto (ON) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $14.00 to $27.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-23/2496048/hammam-spa-by-cela/esthetician/toronto?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=23
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Healing Waters Spa — esthetician  `A2`

- **ID:** `8aae9e78-f723-40c0-9872-e5237fd76e25` (JOBBANK_50046311)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50046311 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50046311
- **fetched_at_utc:** 2026-08-18T15:49:05Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50046311 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `03873792705b9b0cebdc4a26…` · **classification:** OPEN
- **Province/City:** AB / Edmonton (AB) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $17.00 to $23.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=948d6c00fae2ab1d&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### JC Hair Boutique — hairstylist  `A2`

- **ID:** `dda0dca8-655d-49ab-9c59-4f91eabc9390` (JOBBANK_50014792)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50014792 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50014792
- **fetched_at_utc:** 2026-08-18T15:52:46Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50014792 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `3d7194e84adf13ef104a6dbe…` · **classification:** OPEN
- **Province/City:** ON / Toronto (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $17.60 to $47.37 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=bc7b9f2f4bd211fc&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### JUVENEX LASER & DAY SPA INC — esthetician  `A2`

- **ID:** `e954ca0d-d88d-4a82-a809-f27da86c76c6` (JOBBANK_50028962)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50028962 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50028962
- **fetched_at_utc:** 2026-08-18T15:50:04Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50028962 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `f55c07c7a581018daffff59c…` · **classification:** OPEN
- **Province/City:** ON / Brampton (ON) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $36.92 hourly
- **Language:** English (compatible) · **Website:** https://forces.ca/en/paid-education/?utm_campaign=caf_job_posts&amp;utm_medium=digital&amp;utm_source=jobbank
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Kontour Medical Aesthetics — esthetician  `A2`

- **ID:** `ae0bc560-a78a-4c1d-a9c4-8b0831c58047` (JOBBANK_50072412)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50072412 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50072412
- **fetched_at_utc:** 2026-08-18T15:52:51Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50072412 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `9d30fef0d459bc453231b18b…` · **classification:** OPEN
- **Province/City:** ON / London (ON) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $17.95 to $22.00 hourly (to be negotiated)
- **Language:** English (compatible) · **Website:** http://www.kntr.ca
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### KURVES BROW BAR — esthetician  `A2`

- **ID:** `5c89f14a-5036-4597-9185-b972cc62fd5f` (JOBBANK_50009104)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50009104 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50009104
- **fetched_at_utc:** 2026-08-18T15:50:40Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50009104 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `3f5cffbcc3cd71beae7bc6c2…` · **classification:** OPEN
- **Province/City:** ON / Ottawa (ON) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $18.00 to $22.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=299c172f75869e57&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Lakeview Hecla Resort — esthetician  `A2`

- **ID:** `ff6b74c9-fddd-40fe-9c42-ddae8008aaad` (JOBBANK_50039833)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50039833 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50039833
- **fetched_at_utc:** 2026-08-18T15:49:05Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50039833 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `e00a8ffb9701ad914fd6159c…` · **classification:** OPEN
- **Province/City:** MB / Winnipeg (MB) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $20.00 to $25.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=1aa52cd5f032cc1f&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### MSKIN MED & BODY CLINIC — esthetician  `A2`

- **ID:** `a392552e-708b-43dc-9079-7947bf006a7e` (JOBBANK_50073947)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50073947 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50073947
- **fetched_at_utc:** 2026-08-18T15:53:24Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50073947 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `6291851a1137bd2758181f0f…` · **classification:** OPEN
- **Province/City:** AB / Calgary (AB) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $15.00 to $36.99 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=75cb9a8991807176&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### NORTH INK TATTOO AND HAIRCUT — hairstylist  `A2`

- **ID:** `b109ea58-9e29-4d79-9a57-7b8b2cbdfd3c` (JOBBANK_50018859)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50018859 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50018859
- **fetched_at_utc:** 2026-08-18T15:52:30Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50018859 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `910841ac858c11b2df77bbe9…` · **classification:** OPEN
- **Province/City:** SK / La Ronge (SK) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $25.00 hourly
- **Language:** English (compatible) · **Website:** https://www.saskatchewan.ca/residents/jobs-working-and-training/saskjobs-career-services
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### OLIHA MUNIZ BOUTIQUE AND HAIR INC. — hairstylist  `A2`

- **ID:** `49342a54-2488-44b9-a1b0-c4b989f94d08` (JOBBANK_50074303)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50074303 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50074303
- **fetched_at_utc:** 2026-08-18T15:53:52Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50074303 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `433de59a5d39904e80d8d20c…` · **classification:** OPEN
- **Province/City:** ON / Mississauga (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $37.00 hourly
- **Language:** English (compatible) · **Website:** https://olihamuniz.com/
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Paradise Wellness — esthetician  `A2`

- **ID:** `2964f6cb-75eb-4e21-a647-9244dec15ae3` (JOBBANK_49991692)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/49991692 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/49991692
- **fetched_at_utc:** 2026-08-18T15:51:47Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/49991692 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `c04c61924b8b5df808084862…` · **classification:** OPEN
- **Province/City:** ON / Mississauga (ON) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $20.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=5796670dadfd66f9&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Robert Ashley Hair Design — hairstylist  `A2`

- **ID:** `b6e0b9c5-06e8-4028-bccf-f670ab4ecd8e` (JOBBANK_50072828)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50072828 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50072828
- **fetched_at_utc:** 2026-08-18T15:53:07Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50072828 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `80e35a2a94fc55a213c44c10…` · **classification:** OPEN
- **Province/City:** ON / Toronto (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $20.00 hourly + 10% commission per sale
- **Language:** English (compatible) · **Website:** https://forces.ca/en/paid-education/?utm_campaign=caf_job_posts&amp;utm_medium=digital&amp;utm_source=jobbank
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Salon Kanako — hairstylist  `A2`

- **ID:** `94479d5f-e165-4a0e-b56d-e26182744ba5` (JOBBANK_50059809)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50059809 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50059809
- **fetched_at_utc:** 2026-08-18T15:51:43Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50059809 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `d5808dc1d71f4ca5765dd23b…` · **classification:** OPEN
- **Province/City:** BC / Vancouver (BC) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $18.25 to $22.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=f4ab16031d52ac53&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Sarita Salon n Spa — hairstylist  `A2`

- **ID:** `13c9ad12-6f4a-4304-91f2-58fcacfd87df` (JOBBANK_50036566)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50036566 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50036566
- **fetched_at_utc:** 2026-08-18T15:52:24Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50036566 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `07eed33d5003adcc042df22b…` · **classification:** OPEN
- **Province/City:** ON / London (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $17.60 to $25.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=757c83330aa040a2&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Skin Solution — esthetician  `A2`

- **ID:** `a7d7015f-ec32-4088-a2cc-f900388a05be` (JOBBANK_50038856)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50038856 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50038856
- **fetched_at_utc:** 2026-08-18T15:49:21Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50038856 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `41bc4d623f65af4a71018203…` · **classification:** OPEN
- **Province/City:** ON / Hamilton (ON) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $22.00 to $25.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=994a04b62a44a361&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Snip & Style Salon — esthetician  `A2`

- **ID:** `5bcca6c6-288d-48e8-8d00-b73565c67f90` (JOBBANK_50005418)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50005418 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50005418
- **fetched_at_utc:** 2026-08-18T15:51:26Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50005418 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `f93f773891a011047f21bcd7…` · **classification:** OPEN
- **Province/City:** ON / Toronto (ON) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $18.00 to $25.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=abe1d8177e66deb9&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Ste. Anne's Spa — esthetician  `A2`

- **ID:** `8ef09020-72cf-4672-a424-46ee6fd6814b` (JOBBANK_50001121)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50001121 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50001121
- **fetched_at_utc:** 2026-08-18T15:49:39Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50001121 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `4db189a356544e0d4b0db722…` · **classification:** OPEN
- **Province/City:** ON / Grafton (ON) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $30.89 hourly
- **Language:** unknown (compatible) · **Website:** https://www.ziprecruiter.com/kn/AAKMyLlfxzeTiErMAY770XPJCQdvEQJ6UpjdQOVZgoATL-tWz_vbtXc9mBCU5esn5v4A_BuPXd7bXF-Pu9_IQ_4sq4USdIPhMewielSOgFH3DXrj4SiyqRjT64ePF1kPfjyBHAuPb2TmuWOkrbdF0XjY7aHjBj0zmbBi-hOk10xdNZkHX3ZuRFyBMV-AXMlUG8OYcntRyOwmUmvoe_6GmnhH3EWiKHxz3l32BvG5Pl-PlaLlmsnHaGaHFK_alnJWZEWfOQ2rWnbTSk4jJfiMtLOcAo8qWulHIUv4pMzR5QPxNrc_E99zRd1X7HgDhAWV2caSNXVHJDvILgGmFmMuOhGpzaV1hWZRKe7kGLz6c6Z9psa5NMQz7RWtpBHS16-X_oRmEkZ2mRvhflKGGxMz7Z5kV7qlAXgvs8W7uNKo8XzYGKAx2g?tsid=122036320
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Sukhi Laser Beauty Salon & Academy Ltd. — hairstylist  `A2`

- **ID:** `54e663b2-225e-46ad-88c9-4edd38d1aab9` (JOBBANK_50023156)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50023156 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50023156
- **fetched_at_utc:** 2026-08-18T15:52:29Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50023156 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `5ddb1eb589e6a5860912a0d3…` · **classification:** OPEN
- **Province/City:** BC / Surrey (BC) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $38.84 hourly
- **Language:** English (compatible) · **Website:** https://forces.ca/en/paid-education/?utm_campaign=caf_job_posts&amp;utm_medium=digital&amp;utm_source=jobbank
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### The Beauty Room & Co — esthetician  `A2`

- **ID:** `fbcce7d5-15c1-4a55-8253-448dbdcbbe25` (JOBBANK_50057010)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50057010 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50057010
- **fetched_at_utc:** 2026-08-18T15:49:05Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50057010 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `f7da92b3d290b8488dcee590…` · **classification:** OPEN
- **Province/City:** ON / Kingston (ON) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $20.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=f19b9b94db0f248b&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### The Style Merchant — esthetician  `A2`

- **ID:** `705d95a1-9f29-431d-999f-4e230d6a13aa` (JOBBANK_50002059)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50002059 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50002059
- **fetched_at_utc:** 2026-08-18T15:51:29Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50002059 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `be7f224ea0d4dd10231e84bd…` · **classification:** OPEN
- **Province/City:** NS / Yarmouth (NS) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** 50% commission per piece
- **Language:** English (compatible) · **Website:** http://www.thestylemerchant.ca
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `185f1812-7cea-4ba7-b8cf-106a9a1ece88` (JOBBANK_50076072)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50076072 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50076072
- **fetched_at_utc:** 2026-08-18T15:55:57Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50076072 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `dfb5a298de6fe1668924c9b6…` · **classification:** OPEN
- **Province/City:** BC / Langford (BC) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3616987/tommy-gun-s-original-barbershop/barber-stylist/langford?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `903517db-238a-4f5f-a0b3-65d3867141fa` (JOBBANK_50051646)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50051646 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50051646
- **fetched_at_utc:** 2026-08-18T15:52:14Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50051646 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `e11077a6717aca8ecfc40902…` · **classification:** OPEN
- **Province/City:** MB / Winnipeg (MB) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/2905311/tommy-gun-s-original-barbershop/barber-stylist/winnipeg?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `7ba764cc-9824-4efe-9b68-684b1afb7177` (JOBBANK_50051643)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50051643 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50051643
- **fetched_at_utc:** 2026-08-18T15:52:10Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50051643 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `6a45b77cf765f6e1f9d44d9d…` · **classification:** OPEN
- **Province/City:** ON / St. Catharines (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3101605/tommy-gun-s-original-barbershop/barber-stylist/st-catharines?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `e96fc574-031f-457b-9de9-8fb965e5368b` (JOBBANK_50051630)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50051630 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50051630
- **fetched_at_utc:** 2026-08-18T15:52:05Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50051630 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `199c6795fad23b0472198294…` · **classification:** OPEN
- **Province/City:** ON / Ottawa (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3101603/tommy-gun-s-original-barbershop/barber-stylist/ottawa?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `37c34bd3-cc5b-496b-8d99-e8f33415edaa` (JOBBANK_50076028)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50076028 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50076028
- **fetched_at_utc:** 2026-08-18T15:54:31Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50076028 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `452ed48592b8628c8a41a63d…` · **classification:** OPEN
- **Province/City:** ON / Mississauga (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3616982/tommy-gun-s-original-barbershop/barber-stylist/mississauga?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `15abdb09-294f-416e-9d2f-a314f0268786` (JOBBANK_50076035)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50076035 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50076035
- **fetched_at_utc:** 2026-08-18T15:55:18Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50076035 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `467c291badc4f9dac028fc6b…` · **classification:** UNREACHABLE
- **Province/City:** BC / North Vancouver (BC) · **NOC/TEER:** — · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** none
- **Application channel:** NOT_FOUND
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** live posting UNREACHABLE — status UNKNOWN (not inferred).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `172bf3f9-ea07-49e7-b927-b4cbc3191910` (JOBBANK_50075942)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50075942 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50075942
- **fetched_at_utc:** 2026-08-18T15:53:22Z · **http:** 0 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50075942 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `n/a (unreachable)` · **classification:** UNREACHABLE
- **Province/City:** NB / Moncton (NB) · **NOC/TEER:** — · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** none
- **Application channel:** UNREACHABLE
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** live posting UNREACHABLE — status UNKNOWN (not inferred).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `fe3fbf1e-8fab-49d4-b267-5d6cd9e53580` (JOBBANK_50075943)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50075943 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50075943
- **fetched_at_utc:** 2026-08-18T15:53:37Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50075943 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `d4daa6337d547f770844ed1d…` · **classification:** OPEN
- **Province/City:** ON / Vaughan (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3616974/tommy-gun-s-original-barbershop/barber-stylist/vaughan?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `ea39acb2-55ca-4117-aaa6-cb8527be3fff` (JOBBANK_50075965)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50075965 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50075965
- **fetched_at_utc:** 2026-08-18T15:53:53Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50075965 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `93b00b842499901ccd520ef9…` · **classification:** OPEN
- **Province/City:** BC / Chilliwack (BC) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3616978/tommy-gun-s-original-barbershop/barber-stylist/chilliwack?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `08718312-29fa-40f6-99a7-fd5924986f01` (JOBBANK_50075987)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50075987 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50075987
- **fetched_at_utc:** 2026-08-18T15:54:00Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50075987 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `f91f3f252fdd17f811edb5ef…` · **classification:** OPEN
- **Province/City:** BC / Abbotsford (BC) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3616972/tommy-gun-s-original-barbershop/barber-stylist/abbotsford?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `b114b2f1-5faf-4759-a657-c94bf579f9e2` (JOBBANK_50075990)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50075990 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50075990
- **fetched_at_utc:** 2026-08-18T15:54:50Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50075990 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `ff5258d4f7040deb1db10d34…` · **classification:** OPEN
- **Province/City:** BC / Burnaby (BC) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3616986/tommy-gun-s-original-barbershop/barber-stylist/burnaby?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `ff8518ec-80ba-47b0-b73c-7034ecbf1a84` (JOBBANK_50076002)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50076002 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50076002
- **fetched_at_utc:** 2026-08-18T15:54:17Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50076002 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `5d9d3155abbe4f23dd136f61…` · **classification:** OPEN
- **Province/City:** PE / Charlottetown (PE) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3616985/tommy-gun-s-original-barbershop/barber-stylist/charlottetown?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Tommy Gun's Original Barbershop — hairstylist  `A2`

- **ID:** `cd880ed5-3a2c-4cd7-a06e-de665209aed4` (JOBBANK_50076022)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50076022 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50076022
- **fetched_at_utc:** 2026-08-18T15:54:58Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50076022 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `1e5253dc9de434630d50dec0…` · **classification:** OPEN
- **Province/City:** ON / Oshawa (ON) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3616984/tommy-gun-s-original-barbershop/barber-stylist/oshawa?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Urban Retreat — esthetician  `A2`

- **ID:** `e1e6b37d-ab2a-456b-9029-d40006e018fb` (JOBBANK_50004198)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50004198 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50004198
- **fetched_at_utc:** 2026-08-18T15:50:57Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50004198 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `cdb83b34e87adaae1dea1dce…` · **classification:** OPEN
- **Province/City:** AB / Edmonton (AB) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $15.00 to $35.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=540aa93e9de0b193&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

#### Vibrant Salon & Spa — esthetician  `A2`

- **ID:** `dde6d1dc-191e-4bd7-baf6-6c5b4f200903` (JOBBANK_50013112)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50013112 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50013112
- **fetched_at_utc:** 2026-08-18T15:51:13Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50013112 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `63438535fea1a2ee56591f09…` · **classification:** OPEN
- **Province/City:** NB / Fredericton (NB) · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $19.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=09cc57d7f7ff0f01&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ A2:** work authorization UNKNOWN + independent employer verification (C16 UNKNOWN).

---

## B — Substantive blocker (5)

#### Executive Spa Group — hairstylist  `B`

- **ID:** `a77a97ae-3d6a-432f-8cc0-9b70214839e1` (JOBBANK_50046539)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50046539 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50046539
- **fetched_at_utc:** 2026-08-18T15:51:54Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50046539 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `21798b0db282666b0acf87d7…` · **classification:** OPEN
- **Province/City:** AB / Edmonton (AB) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $21.00 to $26.00 hourly (to be negotiated)
- **Language:** English (compatible) · **Website:** https://executivespagroup.com
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ B:** Alberta hairstylist = compulsory-certification trade → licensing blocker.

#### Kreeva Hair and Beauty Salon — hairstylist  `B`

- **ID:** `aebb689d-b01a-4bc3-ae0a-fdae55bd7add` (JOBBANK_50054946)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50054946 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50054946
- **fetched_at_utc:** 2026-08-18T15:51:46Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50054946 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `8444f05ac1f981e1f1cec6a7…` · **classification:** OPEN
- **Province/City:** AB / Calgary (AB) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $37.50 hourly
- **Language:** English (compatible) · **Website:** https://forces.ca/en/paid-education/?utm_campaign=caf_job_posts&amp;utm_medium=digital&amp;utm_source=jobbank
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ B:** Alberta hairstylist = compulsory-certification trade → licensing blocker.

#### KURVES BROW BAR — esthetician  `B`

- **ID:** `90dd3b10-125f-4e61-bd83-ffce893d4cde` (JOBBANK_50008048)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50008048 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50008048
- **fetched_at_utc:** 2026-08-18T15:49:04Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50008048 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `e77834757aa29dcefe0fa450…` · **classification:** OPEN
- **Province/City:** ? / Location · **NOC/TEER:** 63211 / TEER 3 · **Wage:** $17.60 to $20.00 hourly
- **Language:** unknown (compatible) · **Website:** https://ca.indeed.com/viewjob?jk=ce62c1dc1d83bcd1&amp;sid=cajb&amp;kw=cajb
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ B:** province unresolved (posting has no location).

#### Tommy Gun's Original Barbershop — hairstylist  `B`

- **ID:** `6929e6d4-70c0-4d35-9ade-8f0bcde1c11d` (JOBBANK_50075971)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50075971 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50075971
- **fetched_at_utc:** 2026-08-18T15:54:28Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50075971 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `891221e80678926e46859d30…` · **classification:** OPEN
- **Province/City:** AB / Red Deer (AB) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3616981/tommy-gun-s-original-barbershop/barber-stylist/red-deer?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ B:** Alberta hairstylist = compulsory-certification trade → licensing blocker.

#### Tommy Gun's Original Barbershop — hairstylist  `B`

- **ID:** `f6523d58-82d1-44d8-a55c-5850db22401d` (JOBBANK_50076017)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50076017 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50076017
- **fetched_at_utc:** 2026-08-18T15:54:53Z · **http:** 200 · **redirects:** 0 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobposting/50076017 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `6ffa6aba9e312ce9105b1358…` · **classification:** OPEN
- **Province/City:** AB / Lethbridge (AB) · **NOC/TEER:** 63210 / TEER 3 · **Wage:** $14.00 to $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://www.careerbeacon.com/en/job-1/3616983/tommy-gun-s-original-barbershop/barber-stylist/lethbridge?utm_campaign=feeds&amp;utm_source=jobbank&amp;utm_medium=Careerbeacon&amp;origin=1
- **Application channel:** JOB_BANK_APPLICATION_CHANNEL — Apply directly on Job Bank
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ B:** Alberta hairstylist = compulsory-certification trade → licensing blocker.

---

## C — Reject (closed / role mismatch) (3)

#### David Scott Beauty Inc — hairstylist  `C`

- **ID:** `c4142445-c31a-4b2b-8f9e-99ceda8d6bf8` (JOBBANK_50054559)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50054559 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50054559
- **fetched_at_utc:** 2026-08-18T15:51:48Z · **http:** 410 · **redirects:** 1 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobpostingexpired;jsessionid=7DA199D389BEF364487A6844775C1C29.jobsearch76 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `5c96dcf2233e78cb123d5c32…` · **classification:** CLOSED
- **Province/City:** ON / Perth (ON) · **NOC/TEER:** — · **Wage:** $23.69 hourly
- **Language:** unknown (compatible) · **Website:** https://forces.ca/en/paid-education/?utm_campaign=caf_job_posts&amp;utm_medium=digital&amp;utm_source=jobbank
- **Application channel:** NOT_FOUND
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ C:** posting affirmatively closed/expired.

#### Doria Salon & Spa — hairstylist  `C`

- **ID:** `f11a1979-0458-44ca-9627-da8ffb4402b8` (JOBBANK_50024503)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50024503 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50024503
- **fetched_at_utc:** 2026-08-18T15:53:02Z · **http:** 410 · **redirects:** 1 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobpostingexpired;jsessionid=4FD8962213124845FEEB71781F0537D4.jobsearch75 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `e2dd360ec2bfe05ec438d415…` · **classification:** CLOSED
- **Province/City:** BC / Surrey (BC) · **NOC/TEER:** — · **Wage:** $19.00 to $25.00 hourly
- **Language:** unknown (compatible) · **Website:** https://forces.ca/en/paid-education/?utm_campaign=caf_job_posts&amp;utm_medium=digital&amp;utm_source=jobbank
- **Application channel:** NOT_FOUND
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ C:** posting affirmatively closed/expired.

#### FRANCESCA SALON AND SPA — esthetician  `C`

- **ID:** `a68cf0f7-63dc-4fd2-aca7-ac57e798275f` (JOBBANK_50023529)
- **Evidence:** https://www.jobbank.gc.ca/jobposting/50023529 → canonical https://www.jobbank.gc.ca/jobsearch/jobposting/50023529
- **fetched_at_utc:** 2026-08-18T15:50:12Z · **http:** 410 · **redirects:** 1 redirect(s) -> https://www.jobbank.gc.ca/jobsearch/jobpostingexpired;jsessionid=8EF99F5EA303DAD291008870E98548D4.jobsearch75 · **parser:** jobbank-parser-1.1.0
- **content_hash:** `968837affe2f2b618ee34256…` · **classification:** CLOSED
- **Province/City:** ON / Toronto (ON) · **NOC/TEER:** — · **Wage:** $30.00 hourly
- **Language:** unknown (compatible) · **Website:** https://forces.ca/en/paid-education/?utm_campaign=caf_job_posts&amp;utm_medium=digital&amp;utm_source=jobbank
- **Application channel:** NOT_FOUND
- **LMIA:** NO_MATCH_FOUND_IN_DATASET (dataset 2020 Q3 (most recent employer-level list published; program stopped employer-level publication after 2020Q3)) · **C16:** UNKNOWN · **work auth:** UNKNOWN
- **→ C:** posting affirmatively closed/expired.

---
