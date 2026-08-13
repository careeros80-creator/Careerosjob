/**
 * services/pilot/retry.js
 *
 * pilot/production-validation — retryable error recovery. Wraps any fallible
 * async stage (connector fetch, enrichment, generation, Gmail) so a transient
 * failure is retried with exponential backoff instead of aborting the pilot.
 * After the retries are exhausted it throws an error carrying `.attempts` and
 * `.cause`, so the caller can dead-letter the stage (making it retryable later).
 *
 * `sleep` is injectable so tests run without real delay.
 */
async function withRetry(fn, opts = {}) {
  const { retries = 2, baseDelayMs = 200, factor = 2, onRetry = () => {}, sleep } = opts;
  const wait = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  let attempt = 0;
  let lastErr;
  while (attempt <= retries) {
    attempt++;
    try {
      const value = await fn(attempt);
      return { value, attempts: attempt };
    } catch (e) {
      lastErr = e;
      if (attempt > retries) break;
      onRetry(e, attempt);
      await wait(baseDelayMs * Math.pow(factor, attempt - 1));
    }
  }
  const err = new Error(`withRetry exhausted after ${attempt} attempt(s): ${lastErr && lastErr.message}`);
  err.attempts = attempt;
  err.cause = lastErr;
  throw err;
}

module.exports = { withRetry };
