# Pilot Live Verification — Phase 3 SUPERSEDING Correction

Read-only. Generated 2026-08-18T16:08:57.297Z. Supersedes the LMIA analysis in commit 1979b50 (which used only 2020Q3).
**No approval, send, Gmail, draft, or employer contact. Production unchanged: prepared 56 / approved 0 / sent 0 / rejected 6.**

## Before → after (this correction)
| | Before (1979b50) | After |
|---|---|---|
| LMIA coverage | 1 quarter (2020Q3) | **36 quarters 2014..2026Q1** (368,550 rows) |
| LMIA classes | CONFIRMED 0 / CANDIDATE 1 / NO_MATCH 58 | **EXACT_COMPATIBLE 5 / NO_MATCH_WITHIN_VERIFIED_COVERAGE 54 / UNKNOWN 0** |
| Wage integrity | not checked | **18 WAGE_ANOMALY_REQUIRES_REVIEW** |
| Shortlist #4 | Hammam Spa ($14–27) | **flagged wage-anomaly, removed from clean shortlist** |

## LMIA coverage & gaps
- Dataset **Temporary Foreign Worker Program (TFWP): Positive Labour Market Impact Assessment (LMIA) Employers List** (`90fed587-1364-4f33-a9ee-208181dc0b97`), package modified 2026-07-22.
- Ingested **36** employer-level quarters, range **2014..2026Q1**, latest **2026Q1**, **368,550** unique rows.
- **Gaps (not searched):** 2023Q1 (XLS), 2023Q2 (XLS), 2023Q3 (XLS) — XLS binary, no CSV/XLSX alternative published. Provenance + SHA-256 per resource in `docs/LMIA_PROVENANCE.json`.
- Prior 2020Q3-only analysis marked **SUPERSEDED_INCOMPLETE_DATASET_COVERAGE** (preserved).

## EXACT_COMPATIBLE_HISTORY (5) — employer intelligence only, NOT current sponsorship
- **Blades & Scissors Hair Salon Ltd.** (BC) — positive LMIA 2024Q1: 6341-Hairstylists and barbers @ Delta, BC V4C 6P7. *(historical; does not prove sponsorship for this posting.)*
- **Brush Salon** (BC) — positive LMIA 2016: 6341-Hairstylists and barbers @ Vancouver, BC V6B 1E4. *(historical; does not prove sponsorship for this posting.)*
- **Glamour touch studio inc** (BC) — positive LMIA 2020Q1: 6341-Hairstylists and barbers @ Surrey, V4A5A4. *(historical; does not prove sponsorship for this posting.)*
- **OLIHA MUNIZ BOUTIQUE AND HAIR INC.** (ON) — positive LMIA 2024Q2: 63210-Hairstylists and barbers @ Mississauga, ON L4T 1A6. *(historical; does not prove sponsorship for this posting.)*
- **Sukhi Laser Beauty Salon & Academy Ltd.** (BC) — positive LMIA 2024Q1, 2024Q2: 6341-Hairstylists and barbers @ Surrey, BC V3W 1R1. *(historical; does not prove sponsorship for this posting.)*

## WAGE_ANOMALY_REQUIRES_REVIEW (18)
Lower bound below the applicable provincial minimum (reference: {"ON":17.6,"BC":17.85,"AB":15,"MB":16,"SK":15.35,"NS":15.7,"NB":15.65,"NL":16,"PE":16.5}; reference values (2025-2026) — official provincial-source verification pending; ON 17.60 confirmed per instruction (2026-08-18)). Not ranked as clean until wage structure / commission basis / employee category / legality verified.
- **Allan Parss Salon** (ON) $35,200.00 to $105,902.57 annually → lower **$16.92** < min **$17.6** · https://www.jobbank.gc.ca/jobposting/50064256
- **Hammam Spa by Céla** (ON) $14.00 to $27.00 hourly → lower **$14** < min **$17.6** · https://www.jobbank.gc.ca/jobposting/50048153
- **Robert Ashley Hair Design** (ON) $20.00 hourly + 10% commission per sale → lower **$10** < min **$17.6** · https://www.jobbank.gc.ca/jobposting/50072828
- **Tommy Gun's Original Barbershop** (BC) $14.00 to $30.00 hourly → lower **$14** < min **$17.85** · https://www.jobbank.gc.ca/jobposting/50076072
- **Tommy Gun's Original Barbershop** (MB) $14.00 to $30.00 hourly → lower **$14** < min **$16** · https://www.jobbank.gc.ca/jobposting/50051646
- **Tommy Gun's Original Barbershop** (ON) $14.00 to $30.00 hourly → lower **$14** < min **$17.6** · https://www.jobbank.gc.ca/jobposting/50051643
- **Tommy Gun's Original Barbershop** (ON) $14.00 to $30.00 hourly → lower **$14** < min **$17.6** · https://www.jobbank.gc.ca/jobposting/50051630
- **Tommy Gun's Original Barbershop** (ON) $14.00 to $30.00 hourly → lower **$14** < min **$17.6** · https://www.jobbank.gc.ca/jobposting/50076028
- **Tommy Gun's Original Barbershop** (BC) $14.00 to $30.00 hourly → lower **$14** < min **$17.85** · https://www.jobbank.gc.ca/jobposting/50076035
- **Tommy Gun's Original Barbershop** (NB) $14.00 to $30.00 hourly → lower **$14** < min **$15.65** · https://www.jobbank.gc.ca/jobposting/50075942
- **Tommy Gun's Original Barbershop** (ON) $14.00 to $30.00 hourly → lower **$14** < min **$17.6** · https://www.jobbank.gc.ca/jobposting/50075943
- **Tommy Gun's Original Barbershop** (BC) $14.00 to $30.00 hourly → lower **$14** < min **$17.85** · https://www.jobbank.gc.ca/jobposting/50075965
- **Tommy Gun's Original Barbershop** (AB) $14.00 to $30.00 hourly → lower **$14** < min **$15** · https://www.jobbank.gc.ca/jobposting/50075971
- **Tommy Gun's Original Barbershop** (BC) $14.00 to $30.00 hourly → lower **$14** < min **$17.85** · https://www.jobbank.gc.ca/jobposting/50075987
- **Tommy Gun's Original Barbershop** (BC) $14.00 to $30.00 hourly → lower **$14** < min **$17.85** · https://www.jobbank.gc.ca/jobposting/50075990
- **Tommy Gun's Original Barbershop** (PE) $14.00 to $30.00 hourly → lower **$14** < min **$16.5** · https://www.jobbank.gc.ca/jobposting/50076002
- **Tommy Gun's Original Barbershop** (AB) $14.00 to $30.00 hourly → lower **$14** < min **$15** · https://www.jobbank.gc.ca/jobposting/50076017
- **Tommy Gun's Original Barbershop** (ON) $14.00 to $30.00 hourly → lower **$14** < min **$17.6** · https://www.jobbank.gc.ca/jobposting/50076022

## Corrected manual-review shortlist (A2, open, verified channel, wage OK)
1. **Blades & Scissors Hair Salon Ltd.** (BC) — hairstylist · $32.00 hourly · channel JOB_BANK_APPLICATION_CHANNEL · LMIA EXACT_COMPATIBLE_HISTORY ✓ · C16 UNKNOWN
2. **Brush Salon** (BC) — hairstylist apprentice · $17.85 hourly · channel JOB_BANK_APPLICATION_CHANNEL · LMIA EXACT_COMPATIBLE_HISTORY ✓ · C16 UNKNOWN
3. **Glamour touch studio inc** (BC) — esthetician · $19.50 to $21.50 hourly · channel JOB_BANK_APPLICATION_CHANNEL · LMIA EXACT_COMPATIBLE_HISTORY ✓ · C16 UNKNOWN
4. **OLIHA MUNIZ BOUTIQUE AND HAIR INC.** (ON) — hairstylist · $37.00 hourly · channel JOB_BANK_APPLICATION_CHANNEL · LMIA EXACT_COMPATIBLE_HISTORY ✓ · C16 UNKNOWN
5. **Sukhi Laser Beauty Salon & Academy Ltd.** (BC) — hairstylist · $38.84 hourly · channel JOB_BANK_APPLICATION_CHANNEL · LMIA EXACT_COMPATIBLE_HISTORY ✓ · C16 UNKNOWN
6. **Alchemy on Lorne Inc** (ON) — hairstylist · $17.60 to $22.00 hourly (to be negotiated) · channel JOB_BANK_APPLICATION_CHANNEL · LMIA NO_MATCH_WITHIN_VERIFIED_COVERAGE · C16 UNKNOWN
7. **Bella Brows & Spa** (AB) — esthetician · $36.00 hourly · channel JOB_BANK_APPLICATION_CHANNEL · LMIA NO_MATCH_WITHIN_VERIFIED_COVERAGE · C16 UNKNOWN
8. **Chatters Salon Tillicum Mall** (BC) — hairstylist · $21.00 hourly · channel JOB_BANK_APPLICATION_CHANNEL · LMIA NO_MATCH_WITHIN_VERIFIED_COVERAGE · C16 UNKNOWN
9. **Cleopatras Rituals** (BC) — esthetician · $21.00 hourly · channel JOB_BANK_APPLICATION_CHANNEL · LMIA NO_MATCH_WITHIN_VERIFIED_COVERAGE · C16 UNKNOWN
10. **Eden Day Spa and Salon Inc** (NB) — hairstylist · $21.00 to $25.00 hourly (to be negotiated) · channel JOB_BANK_APPLICATION_CHANNEL · LMIA NO_MATCH_WITHIN_VERIFIED_COVERAGE · C16 UNKNOWN

_All shortlist items remain blocked by work-authorization verification (C16 UNKNOWN). LMIA history is intelligence only._

## Live status (evidence 2026-08-18T15:49:04Z … 2026-08-18T15:55:57Z)
OPEN 52 / CLOSED 3 / UNREACHABLE 4 · A1 0 / A2 51 / B 5 / C 3