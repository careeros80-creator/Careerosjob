# Phase 6D — Candidate Sign-off & Final Document Export

**Phase 6D created final document files and repository reports. It performed zero DB mutations, zero application approvals, zero sends, zero Gmail actions and zero employer contacts.**

Scope: finalize the two approved applications (OLIHA, Sukhi) as ATS document files and record the human reviewer's content sign-off. Blades and Glamour remain HOLD. No application-status mutation.

## 1. Live posting revalidation (public read-only GET)

| Field | OLIHA | Sukhi |
|---|---|---|
| job id | `20566ed4-9789-4180-b521-a49b420932c8` (JOBBANK_50074303) | `47fdc954-0dec-4f74-aa38-2ddb55092ce6` (JOBBANK_50023156) |
| source URL | https://www.jobbank.gc.ca/jobposting/50074303 | https://www.jobbank.gc.ca/jobposting/50023156 |
| canonical URL | https://www.jobbank.gc.ca/jobsearch/jobposting/50074303 | https://www.jobbank.gc.ca/jobsearch/jobposting/50023156 |
| HTTP status | 200 | 200 |
| fetched_at_utc | 2026-08-20T12:33:32Z | 2026-08-20T12:33:37Z |
| content hash (sha256) | `55c534793622268f5442917e97a42b96fe598d784fa5317c1a539282f09c93b7` | `f01ae71f6ed47a30e898e8922ac13a1c37d158fa0e4658c3150d75cf37db5531` |
| employer | OLIHA MUNIZ BOUTIQUE AND HAIR INC. | Sukhi Laser Beauty Salon & Academy Ltd. |
| job title | hairstylist | hairstylist |
| province | ON | BC |
| valid through | 2026-08-30 | 2026-08-27 |
| **classification** | **OPEN** | **OPEN** |

Public GET only — no login, no form action, no employer contact.

## 2. Source DB documents (verified before export)

| Document | version | source_master | full SHA-256 checksum |
|---|---|---|---|
| Hairstylist CV | v7 | master_cv@v5.4 | `a4b0662463802c3c5b72c7dc39e9ad602179f3d34fe0669db5d4e396830e6f25` |
| OLIHA cover letter | v7 | cover_letter_en_template@v2 | `3d74e83020850741a6a181e1bc266052c6ff9f987e4c2b0193fd65f6b0202bf1` |
| Sukhi cover letter | v7 | cover_letter_en_template@v2 | `7516ccfc5ad227e2d698dc84c6935314bb81b48e9161afe1c74ee80d9ab1a844` |

Prefixes match the required identities `a4b06624` / `3d74e830` / `7516ccfc`. Approved text dumped byte-faithfully (file hashes equal the DB checksums).

## 3. Candidate sign-off method

No dedicated document-review / candidate-sign-off table or column exists in the schema (only `application_packages.approved_at`, which is application approval and off-limits). Per scope, **no schema was invented and no DB row was written.** The sign-off is recorded **in this report only**:

> **Decision:** `CANDIDATE_CONTENT_APPROVED` — Samira's candidate facts and the final Phase-6C document content (CV v7 `master_cv@v5.4`; OLIHA letter v7; Sukhi letter v7, checksums above) are approved by the human reviewer. **Actor:** human candidate/reviewer. This approves document *content* only. It does **not** approve any application and does not authorize sending, Gmail, drafts, employer contact, form submission, or `pilot_decide.js`.

## 4. Word COM capability result

The `Word.Application` COM ProgID on this machine resolves to **WPS Office (v12.0-compatible)**. Capability test (temporary file, deleted): valid DOCX created ✓; selectable Unicode text ✓; `Salé`/`Cléopâtre`/`École`/employer name preserved ✓; `ExportAsFixedFormat` → PDF ✓; reopen DOCX without repair ✓; `pdftotext` extracts selectable accented text ✓. (One instance is used per file — the suite is unstable across multiple documents in a single COM session.)

## 5. Generated files (exact paths)

Directory: `C:\Users\redab\OneDrive\Desktop\career-os\final_output\phase_6d\` (git-ignored build artifacts).

| # | File | Type | Pages | Size (bytes) | SHA-256 |
|---|---|---|---|---|---|
| 1 | Samira_Benaciri_CV_Hairstylist.docx | employer-facing | 2 | 12414 | `a4851b99e38de8a57fa966261efb227a7f2fa396afe47541d643804ca6886d92` |
| 2 | Samira_Benaciri_CV_Hairstylist.pdf | employer-facing | 2 | 71124 | `cc681c49319508d1c3048ba631fa59e1e718b523ea94ba925342d7b2bc6c4c15` |
| 3 | Samira_Benaciri_Cover_Letter_OLIHA.docx | employer-facing | 1 | 11133 | `2e08b8b4d53b3d6e26e408c6bf13274b0c6b58402fe3d196c9a8eba573c67323` |
| 4 | Samira_Benaciri_Cover_Letter_OLIHA.pdf | employer-facing | 1 | 37971 | `38b037cd00fe3a762594eb573d07b03bb81c4963e623cbb4f8c80ee65ddb2b2c` |
| 5 | Samira_Benaciri_Cover_Letter_Sukhi.docx | employer-facing | 1 | 11142 | `1cfa1f36af277b23d03b3b49b622f634f7789aff135c3ba3e895d0c64ea00bf3` |
| 6 | Samira_Benaciri_Cover_Letter_Sukhi.pdf | employer-facing | 1 | 37050 | `75137789d8264f0adf9f5c3ad7f3c7836e22b1c52372ba29b406c287176d59b8` |
| 7 | Samira_Benaciri_Application_OLIHA_Review.pdf | internal review | 3 | 76001 | `4d2a9de460f5298fe50c1155358f28c4df0a2a11bbdffdc1e22e0e93e8857a86` |
| 8 | Samira_Benaciri_Application_Sukhi_Review.pdf | internal review | 3 | 75255 | `27e39b3638d149bee40bfbccf415023b9dcf55b53af6ca5c8c85b6b40f898f41` |

Employer-facing CV and letters are separate files. Review bundles (CV + relevant letter) are internal only.

## 6. Normalized-text comparison (independent extraction)

Approved normalized-text SHA-256: CV `21eb43f4c751e36ccc2ddd46afd53480270d6ecde8f8c6d02b20d4569d3d1651` · OLIHA `f0da027e337c11b45ce0d379f7787461c1bb0b895250eb9bde37352cd414b92c` · Sukhi `cab2192495c4cefccf6a5f25695a9e2e620fe9a5366cba563e6f4c0b6265553f`.

| File | DOCX vs approved | PDF vs approved |
|---|---|---|
| CV | **IDENTICAL** (strict) | **MATCH — line-wrap only** (identical char sequence 2639/2639; only `owner-manager` and `23–24` wrap points differ, an ignorable line-wrap artifact) |
| OLIHA letter | **IDENTICAL** | **IDENTICAL** |
| Sukhi letter | **IDENTICAL** | **IDENTICAL** |

No missing/added words, no changed numbers, employer names, phone, email or dropped accents. **No material difference.**

## 7. Visual QA (rendered pages inspected — not metadata)

Pages rendered headlessly with `Windows.Data.Pdf` (WinRT) to PNG and inspected:
- **CV p1/p2:** single-column ATS; name + contact at top (`Salé, Morocco | samirabenaciri88@gmail.com | +212 6 62 79 32 95`, unsplit); bold headings; bullets; accents correct (Salé, Cléopâtre, École, Gérante, Esthétique); em dashes and apostrophes well-formed; LANGUAGES/RELOCATION on p2; no photo/tables/graphics/icons/bars; no clipped text, no overflow, no orphan heading, no blank/accidental page. 2 pages.
- **OLIHA letter:** 1 page; addressed to OLIHA MUNIZ BOUTIQUE AND HAIR INC. only; supervision paragraph; signature block intact; no split.
- **Sukhi letter:** 1 page; addressed to Sukhi Laser Beauty Salon & Academy Ltd. only; bleaching/frosting framed as the posting's requirement (not candidate experience); "Laser" only in the employer name; signature block intact.
- OLIHA documents contain only OLIHA's letter; Sukhi only Sukhi's. Page counts satisfy the contract (CV ≤ 2; letters = 1).

## 8. Claim scan (extracted PDF text) — PASS

Zero forbidden candidate claims for: C16, LMIA, sponsorship, authorized to work, work permit held, visitor visa, perming, permanent wave, straightening, lissage, barbering, beard, moustache, hair extensions, wigs, hairpieces, nails, eyelashes, HydraFacial, microneedling, IPL, laser-as-skill. Only allowed exceptions present: `Laser` inside the verified Sukhi employer name; `bleaching`/`frosting` only as Sukhi's posting requirement (Sukhi files only). "Permanent make-up" appears only as Samira's confirmed esthetics skill/training. The relocation sentence references the *"required Canadian work-authorization process"* (a future requirement, not a claim of holding authorization).

## 9. Regression & state

- Regression: **42/42 PASS** (full suite).
- Production (`data_source='production' AND is_deleted=false`): **56 prepared / 0 approved / 0 sent / 6 rejected**.
- OLIHA (JOBBANK_50074303) and Sukhi (JOBBANK_50023156) packages: **`prepared`** (approved_at, sent_at, decided_by all NULL).
- `application_packages` rows created/updated 2026-08-20: **0**. `production_actions` on 2026-08-20: **0**. `applications` sent rows: 2 (pre-existing test), 0 with provider message id. `gmail_connections`: pending, no scopes/token.
- No approval, send, mark_sent, Gmail, draft, or employer-contact action from Phase 6D.

## 10. Repository writes (this phase)

Committed:
- `scripts/export/build_ats_docs.ps1` — ATS DOCX+PDF export (Word/WPS COM).
- `scripts/export/render_pdf.ps1` — headless PDF→PNG (WinRT) for visual QA.
- `scripts/export/verify_export.js` — text-integrity + claim scan.
- `.gitignore` — adds `final_output/` (employer-facing binaries not tracked).
- `CANDIDATE_SIGNOFF_PHASE_6D.md` — this report.

Not committed (build artifacts): the 8 files under `final_output/phase_6d/` (paths + hashes above).

## Confirmation

- **Zero DB mutations** (all DB access was read-only under `default_transaction_read_only`).
- **Zero application-status mutations**; OLIHA and Sukhi remain `prepared`; Blades and Glamour remain HOLD at the review layer with no package-status change.
- No approval, send, Gmail, draft, form submission, or employer contact occurred.
- The eight files and this report are the Phase 6D deliverables. Do not approve or send OLIHA or Sukhi.
