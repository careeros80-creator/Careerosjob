# Phase 7A — Pre-Submission Eligibility & Channel Verification (OLIHA, Sukhi)

Read-only for the database and application workflow. This phase created one report (this file) and no other writes. **No approval, submission, email, Gmail, draft, employer contact, form completion, file upload, `pilot_decide.js`, `mark_sent`, or status mutation occurred.**

## Decision summary

| Application | Posting | Eligibility (Who-can-apply) | Channel | Fit | **Decision** |
|---|---|---|---|---|---|
| **OLIHA MUNIZ BOUTIQUE AND HAIR INC.** — hairstylist — ON | OPEN | **ELIGIBLE_TO_APPLY_FROM_OUTSIDE_CANADA** | JOB_BANK_DIRECT_APPLY | STRONG_CORE_MATCH / PARTIAL_FULL_TASK_MATCH | **`ELIGIBLE_FOR_EXPLICIT_APPROVAL`** |
| **Sukhi Laser Beauty Salon & Academy Ltd.** — hairstylist — BC | OPEN | **INELIGIBLE_WITHOUT_CURRENT_WORK_AUTHORIZATION** | JOB_BANK_DIRECT_APPLY | PARTIAL_MATCH | **`HOLD_WORK_AUTHORIZATION`** |

Blades & Scissors and Glamour Touch remain HOLD (not in scope).

> The OLIHA decision authorizes nothing by itself — it does **not** approve or submit the application. Sukhi is placed on HOLD because its posting restricts applicants to those already authorized to work in Canada.

## Step 1 — frozen identities (production DB)

| Field | OLIHA | Sukhi |
|---|---|---|
| package ID | `49342a54-2488-44b9-a1b0-c4b989f94d08` | `54e663b2-225e-46ad-88c9-4edd38d1aab9` |
| Job Bank ID | JOBBANK_50074303 | JOBBANK_50023156 |
| package status | **prepared** | **prepared** |
| source URL | https://www.jobbank.gc.ca/jobposting/50074303 | https://www.jobbank.gc.ca/jobposting/50023156 |
| canonical URL | https://www.jobbank.gc.ca/jobsearch/jobposting/50074303 | https://www.jobbank.gc.ca/jobsearch/jobposting/50023156 |
| employer | OLIHA MUNIZ BOUTIQUE AND HAIR INC. | Sukhi Laser Beauty Salon & Academy Ltd. |
| title | hairstylist | hairstylist |
| province | ON | BC |
| CV version/checksum | v7 `master_cv@v5.4` `a4b06624…` | v7 `master_cv@v5.4` `a4b06624…` |
| letter version/checksum | v7 `3d74e830…` | v7 `7516ccfc…` |

All identities and document selections match the expected values. No discrepancy.

## Step 2 — authoritative live-posting verification

| Field | OLIHA | Sukhi |
|---|---|---|
| retrieval (real UTC) | 2026-08-20T15:36:12Z | 2026-08-20T15:36:15Z |
| original URL | /jobposting/50074303 | /jobposting/50023156 |
| redirect chain | 1 redirect → /jobsearch/jobposting/50074303 | 1 redirect → /jobsearch/jobposting/50023156 |
| HTTP status | 200 | 200 |
| content hash (sha256 of fetched HTML) | `1aabdf5c08ff1640be2b0904b6237b02d701e237fc6fe7d186f35329332cb354` | `05a1bc4ebac468c428ac9cfa6675b79cf625c729fe61ca15098beb4c52b2143d` |
| employer (posting) | OLIHA MUNIZ BOUTIQUE AND HAIR INC. | Sukhi Laser Beauty Salon & Academy Ltd. |
| title | hairstylist | hairstylist |
| city / province | Mississauga / ON | Surrey / BC |
| wage | $37.00/hour CAD (schema baseSalary) | $38.84/hour CAD (schema baseSalary) — see note |
| employment type | Permanent, Full time | Permanent, Full time |
| vacancies | 1 | 1 |
| posting date | not exposed in static markup | not exposed in static markup |
| valid-through (Advertised until) | 2026-08-30 | 2026-08-27 |
| **status** | **OPEN** (affirmative: "Advertised until 2026-08-30", no closed/expired marker) | **OPEN** (affirmative: "Advertised until 2026-08-27", no closed/expired marker) |

Note: the content hash covers session-varying tokens in the page, so it differs run-to-run; it is recorded for provenance of this fetch. The wage value was read from a hidden schema span and may reflect the occupation's job-market figure rather than the posting's displayed wage (a separate "Median wage" widget is also present); wage does not affect the eligibility decision.

## Step 3 — "Who can apply" (verbatim)

Selector: heading **"Who can apply for this job?"** + following `<ul>` (Job Bank structured eligibility list).

**OLIHA** — *"The employer accepts applications from:"*
- "Canadian citizens and permanent or temporary residents of Canada"
- **"other candidates, with or without a valid Canadian work permit"**

→ **ELIGIBLE_TO_APPLY_FROM_OUTSIDE_CANADA.** The posting explicitly accepts candidates *with or without a valid Canadian work permit*. This is **application eligibility only**; it does **not** prove LMIA, sponsorship, a work permit, C16, employer willingness to complete immigration procedures, or current authorization to work.

**Sukhi** — *"You can apply if you are:"*
- "a Canadian citizen"
- "a permanent resident of Canada"
- "a temporary resident of Canada with a valid work permit"

→ **INELIGIBLE_WITHOUT_CURRENT_WORK_AUTHORIZATION.** Applicants are limited to Canadian citizens, permanent residents, or temporary residents holding a **valid work permit**. Samira, based in Morocco without a Canadian work permit, is not within the posting's stated eligible applicants.

## Step 4 — application channel

Both postings: *"This job posting was posted directly by the employer on Job Bank"*, apply method **Direct Apply** (3× "Direct Apply" markers, no external email or website apply link in the authoritative posting).

| Attribute | OLIHA | Sukhi |
|---|---|---|
| channel | **JOB_BANK_DIRECT_APPLY** | **JOB_BANK_DIRECT_APPLY** |
| application URL/email | Job Bank "Apply now / Direct Apply" on the canonical posting; **no** published email or employer website apply link | same |
| login required | Yes (Job Bank / GCKey sign-in to submit) | Yes |
| usable from outside Canada | Yes (online) | Yes (online) |
| requested documents | none itemised in the static posting (Direct Apply attaches résumé/cover letter at submission) | same |
| screening questions | none exposed in the static posting | same |
| reference/job number | Job Bank posting number 50074303 | 50023156 |
| subject-line instructions | n/a (Direct Apply, not email) | n/a |
| deadline | 2026-08-30 | 2026-08-27 |
| cover letter requested | not explicitly stated | not explicitly stated |
| proof of certification/work permit requested | not explicitly stated | not explicitly stated |

No Submit was clicked, no application started/saved, no login, no upload, no draft, no email sent, no enriched/guessed email used.

## Step 5 — screening & qualification (requirement-to-evidence)

Duty importance is not labelled on Job Bank → task-level `REQUIREMENT_IMPORTANCE_UNKNOWN`; unlabelled tasks are treated as neither mandatory nor optional.

| Dimension | OLIHA | Sukhi |
|---|---|---|
| education | MATCH_VERIFIED (hairdressing + esthetics diplomas) | MATCH_VERIFIED |
| experience | MATCH_USER_CONFIRMED (17 years) | MATCH_USER_CONFIRMED |
| language (English) | MATCH_USER_CONFIRMED (good working proficiency) | MATCH_USER_CONFIRMED |
| hairstyling duties (cut/colour/style/treatments/consult) | MATCH_USER_CONFIRMED | MATCH_USER_CONFIRMED |
| perming / permanent wave | NOT_EVIDENCED | NOT_EVIDENCED |
| bleaching / frosting | posting requirement — NOT a candidate skill (framed as posting task only) | posting requirement — NOT a candidate skill |
| barbering | NOT_APPLICABLE (not required) | NOT_APPLICABLE |
| extensions | NOT_EVIDENCED | NOT_APPLICABLE |
| wigs / hairpieces | NOT_EVIDENCED | NOT_APPLICABLE |
| supervision | MATCH_USER_CONFIRMED (owner-manager, qualitative, no team size) | NOT_APPLICABLE |
| provincial trade/licensing | NOT_APPLICABLE to *applying* (ON hairstylist = voluntary certification; any equivalency is an employment-stage matter) | NOT_APPLICABLE to applying (BC hairstylist non-compulsory) |
| work-authorization eligibility | **ELIGIBLE_TO_APPLY** (posting accepts outside-Canada candidates) | **INELIGIBLE** (posting requires valid work permit / status) |
| requested availability/location | relocation stated conditionally; NOT_APPLICABLE as a gate | same |
| **overall fit** | **STRONG_CORE_MATCH / PARTIAL_FULL_TASK_MATCH** | **PARTIAL_MATCH** |

Historical LMIA data is employer intelligence only and was **not** used in any eligibility classification.

## Step 6 — document / channel compatibility (no file changes)

- Deliverable SHA-256 **match Phase 6D exactly**: CV.pdf `cc681c49…`, CV.docx `a4851b99…`, OLIHA letter.pdf `38b037cd…`, Sukhi letter.pdf `75137789…`.
- PDFs contain **selectable text** (CV 3211 chars, OLIHA 1634, Sukhi 1677).
- OLIHA channel would receive `Samira_Benaciri_Cover_Letter_OLIHA.*` + CV; Sukhi channel would receive `Samira_Benaciri_Cover_Letter_Sukhi.*` + CV — correct pairing.
- Filenames are professional and channel-appropriate; PDF ≤ 72 KB (well within any channel limit).
- Internal review bundles (`*_Review.pdf`) are **not** selected for employer submission and must never be uploaded.
- Direct Apply accepts PDF résumé/cover-letter attachments; no format conversion is required (no conversion/upload performed here).

## Step 7 — final decisions & rationale

- **OLIHA → `ELIGIBLE_FOR_EXPLICIT_APPROVAL`.** Posting affirmatively OPEN; employer/title/location match; eligibility **explicitly accepts candidates with or without a valid Canadian work permit**; official channel resolved (Direct Apply); documents compatible and hash-matched; no unevidenced duty is proven mandatory; no unsupported claim is needed to apply (the letter honestly scopes skills + supervision). *This does not approve or submit the application.*
- **Sukhi → `HOLD_WORK_AUTHORIZATION`.** Posting OPEN and fit PARTIAL, but the "Who can apply" section restricts applicants to Canadian citizens / permanent residents / temporary residents with a valid work permit. Samira does not currently hold Canadian work authorization, so she is not within the stated eligible applicants. Do not apply to Sukhi under the current posting.

## Unresolved risks

- OLIHA eligibility is *application* eligibility only — it is not sponsorship, LMIA, a work permit, or C16, and confers no current authorization to work. Any offer would still require a separate, employer-supported work-authorization process.
- OLIHA Direct Apply requires a Job Bank / GCKey account sign-in at submission (a human action, out of scope here).
- Perming, wig/hairpiece work, and appointment booking remain NOT_EVIDENCED for OLIHA (importance unknown); the application does not claim them.
- Sukhi could become applicable only if Samira obtains valid Canadian work authorization, or if the employer republishes with outside-Canada eligibility.

## Step 8 — integrity verification

- Production (`data_source='production' AND is_deleted=false`): **56 prepared / 0 approved / 0 sent / 6 rejected**.
- OLIHA (JOBBANK_50074303) and Sukhi (JOBBANK_50023156): **`prepared`**.
- `application_packages` rows created/updated 2026-08-20: **0**. `production_actions` on 2026-08-20: **0**.
- **Zero DB mutations; zero approval/send/mark_sent actions; zero Gmail actions; zero drafts; zero form submissions; zero uploads; zero employer contact.**

## Repository writes (this phase)

- `PHASE_7A_PRE_SUBMISSION_VERIFICATION.md` — this report (only file written to the repository). No code or verification-code changed.

**Stop.** No application approved or submitted. OLIHA is verified `ELIGIBLE_FOR_EXPLICIT_APPROVAL` (awaiting your explicit approval in a later phase); Sukhi is `HOLD_WORK_AUTHORIZATION`.
