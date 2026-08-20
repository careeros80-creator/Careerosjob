# Phase 6B — Candidate-Fact Correction & Regeneration (before/after)

**NOT read-only.** Repository files and `generated_documents` / `pilot_documents` rows were changed. **No** application/package/job status change, approval, send, Gmail, draft, or employer contact. Production baseline unchanged: **56 prepared / 0 approved / 0 sent / 6 rejected**.

## Candidate confirmations applied
- **Microblading** → BOTH (training document-verified + practice USER_CONFIRMED).
- **Permanent make-up** → BOTH (esthetics only; never hair perming/permanent wave).
- **Make-up application** → PRACTICE_USER_CONFIRMED.
- **ASY supervision** → PRACTICE_USER_CONFIRMED, stated conservatively; **team size never quantified**.
- **Remain UNKNOWN:** hair perming/waving, straightening/lissage, exact 2009 internship months, ASY appointment scheduling, ASY stock/product ordering, worker count, nails/eyelashes/barbering/beard/extensions/wigs/hairpieces, HydraFacial/microneedling/IPL/laser.

## Fact-registry diff (summary)
| Skill | Before | After |
|---|---|---|
| microblading | TRAINING_VERIFIED | **BOTH** |
| permanent_makeup | TRAINING_VERIFIED | **BOTH** (esthetics only) |
| makeup | BOTH | **PRACTICE_USER_CONFIRMED** |
| salon_management | PRACTICE (ownership/management) | **PRACTICE — supervises day-to-day work + service quality; team size UNKNOWN** |
| appointment_management | PRACTICE (outgoing) | **UNKNOWN / UNSUPPORTED** |
| stock_coordination | — | **UNKNOWN / UNSUPPORTED (new)** |
| perming_waving | (absent) | **UNKNOWN / UNSUPPORTED (explicit)** |
| straightening | — | **UNKNOWN / UNSUPPORTED (new)** |

## Master CV: `master_cv@v5.2` → **`master_cv@v5.3`** (prior versions preserved)
- **Esthetics Core Skills**: added **Microblading, Permanent make-up** (now confirmed practice).
- Certificates for both **kept** under Additional Training.
- **Salon operations** Core Skills trimmed to **Service-quality supervision, Hygiene and safety** (removed "Daily salon operations", "Appointment and client management", "Stock and product coordination").
- ASY experience reworded: "Own and run ASY Beauty as owner-manager (Gérante)"; "Personally provide … including … make-up, microblading, and permanent make-up"; "Supervise the salon's day-to-day work and maintain service-quality and hygiene standards". **Removed** scheduling/client-bookings and stock/product ordering. **No team size.**
- Salon Al Amira reduced to the single conservative line: "Practical training in women's hairdressing and general esthetic services."
- 2009 internship-month ambiguity preserved as a **`_review_notes`** entry (not rendered into the CV); **no invented months**.
- Perming / straightening: absent everywhere.

## Occupation-specific CVs
- **Hairstylist CV** (hairdressing first): microblading & permanent make-up appear **only under Esthetics skills + Additional Training**, not as hairstylist requirements.
- **Esthetician CV** (esthetics first): microblading, permanent make-up, make-up shown as confirmed practical skills.
- No implication that a training certificate proves Canadian licensing/equivalency.

## Cover letters (before → after)
| Employer | Change | Words (before→after) | New checksum |
|---|---|---|---|
| Sukhi | removed "services I perform **daily**" → "services I provide"; perming still absent | 281 → 281 | `0dd81a2c4253866b` |
| Blades | removed **straightening**; kept honest barbering/extensions/wig/perm limitation | 283 → 282 | `c2da2e8e0b5f5cc8` |
| OLIHA | removed **appointment booking + scheduling**; supervision kept **qualitative, no team size** | 276 → 273 | `23d16337c7e60a3b` |
| Glamour | **HOLD**; removed "managing a full appointment schedule"; no microblading/permanent-make-up keywords (no posting evidence) | 263 → 266 | `19290c1c7997fb91` |
- Shared operations paragraph de-scoped for **all** letters: removed appointment scheduling + stock coordination; kept "personally provide services + supervise day-to-day work and service quality + hygiene".
- Max pairwise trigram similarity **0.616**; Glamour distinct (0.40–0.42).

## Job-fit classifications
| Employer | Before | After |
|---|---|---|
| OLIHA | STRONG_MATCH | **STRONG_CORE_MATCH / PARTIAL_FULL_TASK_MATCH** (perm, wig, booking appointments unevidenced) |
| Sukhi | PARTIAL_MATCH | **PARTIAL_MATCH** |
| Blades | PARTIAL_MATCH | **PARTIAL_MATCH / HOLD** |
| Glamour | UNRESOLVED | **UNRESOLVED / HOLD** |

## Validation gates (all PASS)
8/8 generation gates pass; document scans clean. **DB-document scan on the latest target docs = 0** for: perming/permanent wave, straightening/lissage, beard/moustache, extensions/wigs/hairpieces, HydraFacial/microneedling/IPL/manicure/pedicure, microblading/permanent-make-up **in any cover letter**, "laser" outside the Sukhi employer name, "barbering" outside the Blades disclaimer. No C16/LMIA/sponsorship/visa/work-auth claim; no native/fluent/bilingual claim; no invented data.

## Versions & checksums (latest, DB-verified)
- Master CV JSON: `pilot_documents` master_cv **v5** (`authored_v5.3`).
- CVs: **v6** (`master_cv@v5.3`) — hairstylist `8ea92cb746027f23` (Sukhi/Blades/OLIHA), esthetician `e9d3186e51ad09bd` (Glamour). 468 words.
- Letters: **v6** (Sukhi/Blades/OLIHA), **v5** (Glamour) — `cover_letter_en_template@v2`.
- History preserved: CV v1–v6, cover_letter v1–v6 all present.

## Repository & DB changes (accurate)
- **Repo files changed:** `services/pilot/facts.js`, `services/generator/masters/master_cv_v5.json`, `services/generator/coverLetterEnglish.js`, `tests/pilot/test_candidate_facts.js`, `tests/pilot/test_english_docs.js`, `PILOT_ENGLISH_DOCS.md`, `PILOT_6B_REPORT.md`.
- **DB rows inserted (documents only):** `pilot_documents` +1 (master_cv v5); `generated_documents` +8 (4 CV v6, 3 letter v6, 1 letter v5). **No** UPDATE/DELETE; **no** application/package/job status change.
- Regression: **42/42 before and after**.

**This operation modified files and inserted document rows — it was not read-only.** No approval, send, Gmail, draft, or employer contact occurred; production remains 56 prepared / 0 approved / 0 sent / 6 rejected.
