/**
 * tests/pilot/test_decisions.js — human approval state machine (decisions.js).
 * Enforces ADR-006: send only after approve. Run: node tests/pilot/test_decisions.js
 */
const { decide, isTerminal } = require('../../services/pilot/decisions');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };

console.log('\n[ legal transitions ]');
check(decide('prepared', 'approve').to === 'approved', 'prepared --approve--> approved');
check(decide('prepared', 'reject').to === 'rejected', 'prepared --reject--> rejected');
check(decide('approved', 'send').to === 'sent', 'approved --send--> sent');
check(decide('approved', 'reject').to === 'rejected', 'approved --reject--> rejected (change mind)');

console.log('\n[ ADR-006: send requires prior approval ]');
const s1 = decide('prepared', 'send');
check(s1.ok === false && /ADR-006/.test(s1.error), 'prepared --send--> BLOCKED with ADR-006 message');
const s2 = decide('rejected', 'send');
check(s2.ok === false, 'rejected --send--> blocked');

console.log('\n[ terminal states are final ]');
check(decide('sent', 'approve').ok === false, 'sent --approve--> blocked (terminal)');
check(decide('sent', 'reject').ok === false, 'sent --reject--> blocked (terminal)');
check(decide('rejected', 'approve').ok === false, 'rejected --approve--> blocked (terminal)');
check(isTerminal('sent') && isTerminal('rejected'), 'sent + rejected are terminal');
check(!isTerminal('prepared') && !isTerminal('approved'), 'prepared + approved are not terminal');

console.log('\n[ input validation ]');
check(decide('bogus', 'approve').ok === false, 'unknown status rejected');
check(decide('prepared', 'bogus').ok === false, 'unknown action rejected');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
