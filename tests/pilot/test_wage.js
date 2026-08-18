/**
 * tests/pilot/test_wage.js — minimum-wage effective-date correctness.
 * Blocks stale minimums and wage-compliant-below-minimum. Run: node tests/pilot/test_wage.js
 */
const { minWageFor, classifyWage, isSupersededMinimum } = require('../../services/pilot/wage');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const REVIEW = '2026-08-18';

console.log('\n[ BC effective-date correction ]');
check(minWageFor('BC', '2026-08-18').rate === 18.25, 'BC minimum on 2026-08-18 is $18.25 (post 2026-06-01)');
check(minWageFor('BC', '2026-01-01').rate === 17.85, 'BC minimum on 2026-01-01 was $17.85 (pre-increase)');
check(isSupersededMinimum('BC', 17.85, REVIEW), '$17.85 is a SUPERSEDED BC minimum as of 2026-08-18');
check(minWageFor('ON', '2026-08-18').rate === 17.60, 'ON minimum is $17.60 (confirmed)');

console.log('\n[ Brush Salon $17.85 BC → below minimum (not compliant) ]');
const brush = classifyWage('$17.85 hourly', 'BC', { reviewDate: REVIEW });
check(brush.category === 'A_WAGE_BELOW_MINIMUM', 'BC $17.85 is A_WAGE_BELOW_MINIMUM against $18.25');
check(brush.effective_review === true, 'flagged EFFECTIVE_DATE_REQUIRES_REVIEW (equals superseded min / posting date unverified)');

console.log('\n[ a wage at/above the applicable minimum is compliant ]');
check(classifyWage('$32.00 hourly', 'BC', { reviewDate: REVIEW }).category === 'D_WAGE_COMPLIANT', 'BC $32 is compliant');
check(classifyWage('$18.25 hourly', 'BC', { postingDate: '2026-08-04' }).category === 'D_WAGE_COMPLIANT', 'BC $18.25 with a dated posting is compliant');
// stale-minimum guard: a posting advertised in the current period cannot use the old rate to pass
check(classifyWage('$17.85 hourly', 'BC', { postingDate: '2026-08-04' }).category === 'A_WAGE_BELOW_MINIMUM', 'a current-period BC posting at $17.85 is NOT compliant (no stale-minimum pass)');

console.log('\n[ wage-structure categories ]');
check(classifyWage('$20.00 hourly + 10% commission per sale', 'ON', { reviewDate: REVIEW }).category === 'C_COMMISSION_STRUCTURE_REQUIRES_REVIEW', 'base + commission → C (not below-min for the %)');
check(classifyWage('$35,200.00 to $105,902.57 annually', 'ON', { reviewDate: REVIEW }).category === 'B_ANNUAL_WAGE_REQUIRES_HOURS', 'annual salary → B (no 2,080 assumption)');
check(classifyWage('$14.00 to $27.00 hourly', 'ON', { reviewDate: REVIEW }).category === 'A_WAGE_BELOW_MINIMUM', 'ON $14 lower bound → below minimum');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
