# Application Generator (VS2 — Module 4)

Builds a **prepared** application package per job: a customized CV + cover
letter, an ATS report, and a match explanation. **Nothing is auto-sent**
(ADR-006) — a human approves before submission.

## Deterministic writer (no LLM, no fabrication)
The generator is a deterministic template writer. The CV only **reorders/selects**
skills the Master already contains; the cover letter only fills **known**
company-level facts and **omits unknowns**. This structurally prevents
fabrication. The interface is pluggable — an LLM writer could implement the same
`generateCV` / `generateCoverLetter` signatures later.

## Inputs (read-only)
- `masters/master_cv.json` — Master CV (never mutated)
- `masters/cover_letter_template.txt` — `{{placeholder}}` template; a line whose
  placeholder is unknown is dropped
- job, company profile (name/city/province/public description), ATS vocabulary

## Outputs (migration 016)
- `application_packages` — status `prepared` (→ `approved`/`sent` by a human), match_score + explanation
- `generated_documents` — CV + cover letter, **versioned + sha256 checksum + traceable**
  (`source_master`, `model`, `prompt_version`, `generated_at`). `UNIQUE(job_id,doc_type,checksum)`
- `application_ats` — required/matched/missing keywords, coverage %, readability, length
- `application_metrics` view

## Traceability & versioning
Every document stores its source master (`master_cv@v3`), generator model,
prompt version, timestamp, an incrementing version, and a checksum. Identical
inputs → identical checksum → **same version** (idempotent); the DB insert is
guarded by the checksum so re-runs never duplicate.

## Cover letter — company personalization only
Uses company name / city / province / public description / job title. Never
personal contacts. Unknown fields are omitted, so no value is invented.

## Tests
`tests/generator/` — `test_cv` (9), `test_cover_letter` (12), `test_ats` (10),
`test_versioning` (11), `test_idempotency` (5); `tests/integration/test_application.js` (14).
