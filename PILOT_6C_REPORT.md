# Phase 6C — Surgical Evidence Cleanup (before/after)

**NOT read-only.** Repository files and `generated_documents` / `pilot_documents` rows were changed. **No** application/package/job status change, approval, send, Gmail, draft, or employer contact. Production unchanged: **56 prepared / 0 approved / 0 sent / 6 rejected**. Regression **42/42 before and after**.

## Corrections applied
1. **Sukhi** — bleach/frosting reframed as **posting tasks**, never claimed. Candidate skills stated as colouring, highlights, tints, rinses, cutting, styling, consultation. Bleach/frost/perming remain NOT_EVIDENCED.
2. **Legacy details removed** from Cléopâtre / Top 2000 / La Manucure ("regular clientele", "Advised clients on hair care", "Supported client reception and salon organization", "Maintained workstation hygiene and prepared client services") → each role now the single confirmed line **"Provided women's hairdressing and general esthetic services."**
3. **OLIHA** — qualitative supervision kept; duplication with the generic owner-manager paragraph removed; no appointment booking/scheduling; no team size.
4. **Glamour** — duplicated service/supervision paragraphs removed; conservative + **HOLD**; no microblading/permanent make-up as posting-matched keywords.
5. **Chamber of Handicrafts credential** — **withheld** from the rendered CV (exact document title + issue date not yet verified from the source); moved to a non-rendered `_review_notes` entry.
6. **Al Amira** — "Salon Al Amira, Salé, Morocco — **2009, six-month internship**"; overlap-warning review note preserved; no months invented.

## Exact before → after
| Location | Before | After |
|---|---|---|
| CV · Cléopâtre | "…general esthetic services **to a regular clientele.**" / "**Advised clients on hair care** and performed make-up services." | "Provided women's hairdressing and general esthetic services." |
| CV · Top 2000 | "Provided cutting, colouring, and styling services." / "**Supported client reception and salon organization.**" | "Provided women's hairdressing and general esthetic services." |
| CV · La Manucure | "Performed women's hairdressing and general beauty services." / "**Maintained workstation hygiene and prepared client services.**" | "Provided women's hairdressing and general esthetic services." |
| CV · Al Amira dates | "2009 \| 6-month internship" | "2009, six-month internship" |
| CV · Credential | "PROFESSIONAL CREDENTIALS — … Chamber of Handicrafts, Salé (2009)" | **withheld** → `_review_notes` |
| Sukhi letter | "…**applying bleach, tints, and rinses to colour, frost, or streak hair** … which are **services I provide**…" | "Your posting includes colour and lightening work such as **bleaching and frosting**. **My own experience is in colouring, highlights, tints, and rinses** …" |
| Operations (all letters) | "…I **personally provide hairdressing and esthetic services, supervise the salon's day-to-day work and service quality**…" | "…I run my own salon and work directly with clients, holding myself to consistent hygiene standards. I tailor each service to the client's preferences." |
| OLIHA letter | "…supervise day-to-day work and service quality **while continuing to cut, colour, treat, and style hair myself**." | "…where I **oversee** the day-to-day work and service quality." |
| Glamour letter | "…I **deliver these services myself and supervise the salon's day-to-day work and service quality**. I would welcome…" | "Because your posting does not set out the specific duties for this role, I have kept this application to my confirmed esthetic background. I would welcome…" |

## Evidence scan (DB latest target docs)
| Term | Result |
|---|---|
| bleach / frost total | 1 (the Sukhi **posting-frame** sentence only) |
| bleach/frost claimed as candidate experience | **0** |
| perming / permanent wave / straighten / lissage | **0** |
| regular clientele / hair-care advice / reception / salon organization | **0** |
| stock / product ordering / appointment scheduling | **0** |
| Chamber of Handicrafts rendered in any CV | **0** |
| quantified team/staff claim | **0** |

## Versions (DB-verified; history preserved v1–v7)
- CVs **v7** `master_cv@v5.4` — hairstylist `a4b0662463802c3c` (Sukhi/Blades/OLIHA), esthetician `cbdc4c45b19dcf2d` (Glamour), 427 words.
- Letters `cover_letter_en_template@v2` — Sukhi **v7** `7516ccfc5ad227e2` (269w), Blades **v7** `fcd2b4ceddccf4ee` (277w), OLIHA **v7** `3d74e83020850741` (259w), Glamour **v6** `6fc8695881380107` (244w).
- master_cv JSON `pilot_documents` **v6** (`authored_v5.4`).
- Max pairwise letter similarity 0.627; Glamour distinct (0.39–0.41).

## Job-fit (unchanged from 6B)
OLIHA **STRONG_CORE_MATCH / PARTIAL_FULL_TASK_MATCH**; Sukhi **PARTIAL_MATCH**; Blades **PARTIAL_MATCH / HOLD**; Glamour **UNRESOLVED / HOLD**.

## Repository & DB writes (accurate — NOT read-only)
- **Repo files:** `services/pilot/facts.js`, `services/generator/masters/master_cv_v5.json`, `services/generator/coverLetterEnglish.js`, `tests/pilot/test_candidate_facts.js`, `tests/pilot/test_english_docs.js`, `PILOT_ENGLISH_DOCS.md`, `PILOT_6C_REPORT.md`.
- **DB rows inserted (documents only):** `pilot_documents` +1 (master_cv v6); `generated_documents` +8 (CV v7 ×4, letter v7 ×3, letter v6 Glamour). **No** UPDATE/DELETE; **no** application/package/job status change.
