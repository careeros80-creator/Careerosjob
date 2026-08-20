# Phase 7C1 — OLIHA Job Bank Direct Apply Preflight (read-only)

**Final status: `AUTHENTICATION_REQUIRED_NO_ACTION`.**

The OLIHA Direct Apply application form is behind a Job Bank / GCKey sign-in. No authenticated Job Bank session is available in this environment, and authentication, account creation, and starting an application are all forbidden in this phase. The interactive form fields therefore could not be inspected without a forbidden action. **Zero uploads, drafts, submissions, data entry, consents, employer contacts, or DB mutations occurred.**

## Inspection timestamp
- Fresh public GET + browser inspection: **2026-08-20T~17:56Z** (UTC).

## Frozen identities (production DB)
- OLIHA package `49342a54-2488-44b9-a1b0-c4b989f94d08` · JOBBANK_50074303 · status **`approved`** · **`sent_at` NULL** · channel JOB_BANK_DIRECT_APPLY.
- CV v7 `master_cv@v5.4`: `a4b0662463802c3c5b72c7dc39e9ad602179f3d34fe0669db5d4e396830e6f25`
- OLIHA cover letter v7: `3d74e83020850741a6a181e1bc266052c6ff9f987e4c2b0193fd65f6b0202bf1` (linked only to the OLIHA job; no review bundle or other-employer document in the package).
- On-disk PDFs unchanged: CV.pdf `cc681c49…`, OLIHA letter.pdf `38b037cd…`; both selectable text.

## Posting status & eligibility (fresh)
- HTTP 200 → canonical `/jobsearch/jobposting/50074303`; employer/title match; **Mississauga, ON**; Permanent, Full time; 1 vacancy; salary **$37.00 hourly / 35–40 h per week**; posted Aug 13 2026 by a licensed third-party; **advertised until 2026-08-30**; affirmatively **OPEN**.
- "Who can apply for this job?": "Canadian citizens and permanent or temporary residents of Canada" · **"other candidates, with or without a valid Canadian work permit"** → permission to apply from outside Canada only (not LMIA/sponsorship/work authorization/permit eligibility/C16/guaranteed employer support).
- Job Bank displayed a geo-warning modal: *"It looks like you are visiting Job Bank from outside Canada … you can't apply for every job … most Canadian employers will not hire you if you do not have a valid visa or work permit."* Consistent with the apply-eligible-but-not-authorized position.

## Authentication / session outcome (no secrets)
- **Not signed in.** A "Sign in" link is present; no "Sign out" / account element exists. No authenticated Job Bank session.
- No credentials, cookies, tokens, or session identifiers were read, printed, or stored.
- The **"You have successfully applied for this job through Job Bank!"** text in the page source is a **hidden server template element** (`class="message message-info … wb-inv"`, rendered width 0 — the GC WET invisible class). It is **not** displayed and does **not** indicate a submitted application. No application exists for this session.

## Application workflow map (partial — form behind auth)
Inspectable read-only (public posting):
- **Direct Apply** button is the real control (opens in-page `#direct-apply-popup`). The popup is empty in the static DOM; **no `<input type=file>` slots**, screening fields, declarations, or submit controls are present pre-authentication. The full multi-step form (contact, questions, résumé/cover-letter slots, review, final submit, application ID) loads only **after sign-in**.
- Posting-stated requirements (which typically drive the screening/eligibility questions):
  - Languages: **English**
  - Education: **Registered Apprenticeship certificate or equivalent experience**
  - Experience: **2 years to less than 3 years**
  - Work location: on site (noisy); "Willing to relocate"
  - Tasks (9): book appointments; cut/trim; shampoo; other treatment (waving, straightening, tinting + scalp massage); **supervise other stylists/staff**; apply bleach/tints/dyes/rinses (colour/frost/streak); clean/style **wigs & hairpieces**; cut/trim/taper/curl/**wave/perm**/style; suggest compatible style.
  - Personal suitability: dependability, flexibility, judgement, reliability, team player.

Not inspectable without authentication: exact form steps, required/optional field list, contact fields, work-authorization question wording, screening questions, résumé/cover-letter slot specs, accepted file formats/max sizes/filename rules, declarations/consent text, auto-save/draft-on-continue behaviour, review screen, final-submit control location, pre-submission application ID.

## Field-by-field compatibility (vs canonical evidence)
| Field / requirement | Classification | Note |
|---|---|---|
| Education (apprenticeship **or equivalent experience**) | `MATCH_USER_CONFIRMED` | qualifies via 17 years' experience + diplomas (equivalent-experience path; employer's judgment) |
| Experience (2–3 years) | `READY_VERIFIED` | 17 years exceeds |
| Language (English) | `READY_VERIFIED` | "good working proficiency"; any self-rating field → `NEEDS_USER_INPUT` |
| Hairstyling core (cut/colour/style/treatments/consult) | `READY_VERIFIED` | evidenced in CV |
| Supervision | `READY_VERIFIED` | owner-manager (qualitative, no team size) |
| Perming / wave, wig & hairpiece work, bleach/frost | `NOT_APPLICABLE` to eligibility; if a screening question asks "can you perform…", → `NEEDS_USER_INPUT` | must not be claimed; not evidenced |
| Contact info (name/email/phone) | `NEEDS_USER_INPUT` | values exist in CV; form entry is a user action |
| **Work-authorization question** | `NEEDS_USER_INPUT` (truthful) | must answer honestly; **claiming current Canadian authorization / permit / PR / citizenship / LMIA / C16 = `UNSUPPORTED_CLAIM` and is rejected** |
| Relocation | `READY_VERIFIED` | "only after a formal offer and completion of the required Canadian work-authorization process" |
| Screening questions (unknown) | `NEEDS_USER_INPUT` | not inspectable pre-auth |

No `BLOCKING_CONFLICT` that would force an unsupported claim to apply (the posting explicitly permits applying without a work permit). The blocker is **authentication**, not a qualification conflict.

## Document-slot compatibility (no upload performed)
- Frozen PDFs are PDF, selectable text, small (CV 71 KB, OLIHA letter 38 KB), correctly named, correct employer letter (OLIHA), no review bundle/internal report. Full SHA-256 re-verified equal to the frozen identities.
- Accepted formats / size limits / filename rules could **not** be confirmed (form behind auth). No rename/convert/compress/regenerate performed.

## Required user inputs still outstanding
1. Job Bank / GCKey **sign-in** (human; credential entry is prohibited for the agent).
2. Contact fields; work-authorization question (truthful, no authorization claim); any screening questions.
3. Attach CV + **OLIHA** cover letter; accept required declarations/consent.
4. Review screen → final **Submit**.

## Exact next action requiring separate authorization
Authenticated Direct Apply: sign in to Job Bank/GCKey, complete the form, attach the two frozen documents, and submit. This requires credential entry / authentication, which the agent must not perform — it is a **human/candidate action** (or a separately-authorized Phase 7C2 in which the agent still cannot enter credentials). Final-submit boundary was **not** reached.

## Zero-mutation proof
- OLIHA remains `approved`, `sent_at` NULL. Production 1 approved / 55 prepared / 0 sent / 6 rejected (unchanged from Phase 7B). Sukhi/Blades/Glamour `prepared`.
- Today's 1 package update + 1 `production_actions` row are Phase 7B's approval (17:04:07); **Phase 7C1 changed no rows and created no actions**.
- **DB rows changed: 0. External drafts created: 0. Files uploaded: 0. Applications submitted: 0. Emails / employer contacts: 0.** No sign-in, no account creation, no profile change, no consent accepted, no CAPTCHA/MFA interaction, no button that could create/save/submit an application was clicked.

## Repository writes
- `PHASE_7C1_OLIHA_DIRECT_APPLY_PREFLIGHT.md` (this report). No code changed.
