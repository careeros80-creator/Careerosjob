# Phase 8 — Email-Application Package: Verification Report

Files only. **No approval, send, mark_sent, Gmail draft, employer contact, upload, submission, or workflow/DB status mutation occurred. Zero DB writes.**

## Scope outcome
- **OLIHA — DELIVERED** (verified approved artifacts copied byte-for-byte; not regenerated).
- **SUKH — HELD** (Job Bank posting expired; live-evidence gate failed; per user decision, no Sukh documents were generated).

## Source files & versions
- CV: `master_cv@v5.4`, generated_documents `d734ccc2-cd2b-4fc5-a7bc-8c7be748766e` v7 — `DOCUMENT_IDENTITY_SHA256` prefix `a4b0662463802c3c`.
- OLIHA cover letter: `cover_letter_en_template@v2`, generated_documents `63619897-93e5-4979-bb54-97ac2cad0b33` v7 — `DOCUMENT_IDENTITY_SHA256` prefix `3d74e83020850741`.
- Physical source: `final_output/phase_6d/` (the approved final PDFs/DOCX). Copied unchanged into this folder.

## OLIHA checksum verification outcome — PASS
- **Existing final PDFs match the expected identities exactly**, so they were copied byte-for-byte (no regeneration, no alteration):
  - `Samira_Benaciri_CV_Hairstylist.pdf` → `cc681c49319508d1c3048ba631fa59e1e718b523ea94ba925342d7b2bc6c4c15` ✔ (expected)
  - `Samira_Benaciri_Cover_Letter_OLIHA.pdf` → `38b037cd00fe3a762594eb573d07b03bb81c4963e623cbb4f8c80ee65ddb2b2c` ✔ (expected)
- **Source-text (`DOCUMENT_IDENTITY`) checksums** `a4b0662…` (CV) and `3d74e830…` (letter) were fully verified in Phase 7C1A by recomputing `sha256(utf8(generated_documents.content))`; the content is immutable and no DB write has occurred since. The Docker/Postgres engine was **offline during this phase**, so a fresh live DB re-read was not performed; this is inconsequential because (a) the exported PDFs whose bytes match `cc681c49…`/`38b037cd…` derive from that exact content, and (b) this phase runs **zero DB operations**.

## Final files — full SHA-256, sizes, pages, words
| File | Type | Bytes | Pages | Words | SHA-256 |
|---|---|---:|---:|---:|---|
| `Samira_Benaciri_CV_Hairstylist_OLIHA.pdf` | PDF | 71124 | 2 | 406 | `cc681c49319508d1c3048ba631fa59e1e718b523ea94ba925342d7b2bc6c4c15` |
| `Samira_Benaciri_CV_Hairstylist_OLIHA.docx` | DOCX | 12414 | 2 | 406 | `a4851b99e38de8a57fa966261efb227a7f2fa396afe47541d643804ca6886d92` |
| `Samira_Benaciri_Cover_Letter_OLIHA.pdf` | PDF | 37971 | 1 | 254 | `38b037cd00fe3a762594eb573d07b03bb81c4963e623cbb4f8c80ee65ddb2b2c` |
| `Samira_Benaciri_Cover_Letter_OLIHA.docx` | DOCX | 11133 | 1 | 254 | `2e08b8b4d53b3d6e26e408c6bf13274b0c6b58402fe3d196c9a8eba573c67323` |
| `APPLICATION_EMAILS.md` | md | — | — | — | `65e29b465b0cd8493b0ae4e99bb777e5d20e53fbcf9aaccdde7eeb41f2a0fdfa` |

(The two DOCX are the exact source DOCX of the two PDFs — selectable-text counterparts for human editing; the PDFs remain the final employer-facing files. The CV DOCX/PDF share the CV's identity; the letter DOCX/PDF share the letter's identity.)

## Visual quality gate — PASS
Rendered every OLIHA PDF page to images (WinRT `Windows.Data.Pdf`) and inspected:
- Both open successfully; valid `%PDF-`; selectable text (CV 3211 chars, letter 1634 chars).
- **CV = 2 pages; letter = 1 page** (within limits) — authoritative PageCount from the renderer.
- Single-column ATS, clear bold headings, consistent margins; no clipping/overlap, no blank page, no orphan heading, no split contact block.
- Correct accents and punctuation (Salé, Cléopâtre, École, Gérante, Esthétique, Solidarité, Cosmétique; em dashes; straight apostrophes).
- No photograph; no tables/graphics/skill bars; real contact only.
- Filenames and content identify the correct employer; the CV is the canonical v7 content.

## Live-posting evidence — Sukh (gate FAILED)
- URL: `https://www.jobbank.gc.ca/jobsearch/jobposting/50105335` (displayed #`3650670`).
- Retrieval (UTC): 2026-08-21T11:57:02Z. **HTTP 410 (Gone)** → redirected to `.../jobsearch/jobpostingexpired`. Confirmed across three URL variants (short, canonical, displayed-number) — all HTTP 410. Page content: "no longer available" / "expired".
- Fetched-page content hash (expired page): `a57f9dcb3d19b4b578d38ca187c5275a58cd84271ac8ecc4194dba64df3d57d6`.
- Employer/title/location/wage/vacancies/tasks could **not** be confirmed from a live posting. Per the user's decision, Sukh is **HELD**; no Sukh CV/letter/email was generated; the prior "Sukhi Laser Beauty Salon" letter was **not** reused (different employer).

## Unsupported-claim scan — PASS (0)
OLIHA CV + letter scanned for: C16, LMIA, sponsorship, authorized to work, work permit, permanent resident, Canadian citizen, immediate availability, Canadian licence/Red Seal, native/fluent French, bilingual, beard/moustache, barbering, wigs/hairpieces, extensions, invented metrics (`%`, `$`, "team of N"), and sensitive identifiers (passport/CIN/visa number/DOB). **0 hits.** The approved relocation sentence ("…after receiving a formal job offer and completing the required Canadian work-authorization process") was correctly **not** flagged.

## Cross-employer contamination scan — PASS
- OLIHA CV: 0 occurrences of Sukh/Sukhi/Blades/Glamour or other-employer names.
- OLIHA cover letter: 0 other-employer names; names **OLIHA MUNIZ BOUTIQUE AND HAIR INC.** (×3) only.

## Database / workflow state
- This phase performed **zero DB operations** (no reads-that-mutate, no writes). No `application_packages`, `generated_documents`, `production_actions`, `applications`, `emails`, or `outbox` row was created or changed.
- Last confirmed production state (Phase 7C3, 2026-08-21): OLIHA `approved` / `sent_at` NULL; production **1 approved / 55 prepared / 0 sent / 6 rejected**; Sukhi/Blades/Glamour `prepared`. Unchanged by this phase.

## Explicit confirmations
- 0 approvals · 0 sends · 0 Gmail drafts · 0 employer contacts · 0 uploads · 0 submissions · 0 workflow-status mutations · 0 DB writes.
- Existing document history preserved; the approved OLIHA source text was not overwritten (verified, copied only).

## Output folder
`final_output/phase_8_email_applications/` — contains: the two OLIHA PDFs, the two OLIHA DOCX, `APPLICATION_EMAILS.md`, `VERIFICATION_REPORT.md`. (No Sukh files — held.)
