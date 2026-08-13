/**
 * tests/pilot/test_retry.js — retryable error recovery (services/pilot/retry.js).
 * Run: node tests/pilot/test_retry.js
 */
const { withRetry } = require('../../services/pilot/retry');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const noSleep = () => Promise.resolve();

(async () => {
  console.log('\n[ withRetry ]');

  const r1 = await withRetry(async () => 'ok', { sleep: noSleep });
  check(r1.value === 'ok' && r1.attempts === 1, 'succeeds on first try → attempts=1');

  let n = 0;
  const r2 = await withRetry(async () => { n++; if (n < 3) throw new Error('transient'); return 'done'; },
    { retries: 3, sleep: noSleep });
  check(r2.value === 'done' && r2.attempts === 3, 'fail twice then succeed → attempts=3');

  let retried = 0;
  try {
    await withRetry(async () => { throw new Error('always'); },
      { retries: 2, sleep: noSleep, onRetry: () => retried++ });
    check(false, 'exhaust should throw');
  } catch (e) {
    check(e.attempts === 3, 'exhaust → throws with .attempts = retries+1');
    check(e.cause && e.cause.message === 'always', 'throws carrying .cause (original error)');
    check(retried === 2, 'onRetry fired once per retry (2)');
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
