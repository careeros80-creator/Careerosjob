/**
 * connectors/sources/JobBankSource.js
 *
 * VS2 — Job Bank as the REFERENCE implementation of the Connector interface.
 *
 * Thin adapter over the frozen VS1 connectors/JobBankConnector.js (used as-is,
 * not modified). HTML fetching is injected via ctx.fetch so the source stays
 * unit-testable and network-free in tests.
 */
const { Connector } = require('../base/Connector');
const { JobBankConnector } = require('../JobBankConnector');

class JobBankSource extends Connector {
  constructor() {
    super({ name: 'jobbank', flag: 'jobbank_connector_enabled', provider: 'Job Bank Canada' });
    this.impl = new JobBankConnector(); // VS1 connector, unchanged
  }

  /** Config/reachability check: every search URL must be a valid jobbank URL. */
  validate() {
    const errors = [];
    const cfgs = this.impl.searchConfigs();
    if (!cfgs.length) errors.push('no search configs');
    for (const c of cfgs) {
      try {
        const u = new URL(c.url);
        if (!/jobbank\.gc\.ca$/.test(u.hostname)) errors.push(`unexpected host: ${u.hostname}`);
      } catch { errors.push(`invalid url: ${c.url}`); }
    }
    return { ok: errors.length === 0, errors };
  }

  /** Source raw article → CanonicalJob (delegates to the VS1 connector). */
  normalizeSource(raw) { return this.impl.toCanonical(raw); }

  /**
   * @param ctx.fetch async (url) => htmlString
   * @returns { jobs: CanonicalJob[] } de-duplicated by external_id within the run
   */
  async discoverJobs(ctx = {}) {
    const fetchHtml = ctx.fetch;
    if (typeof fetchHtml !== 'function') throw new Error('jobbank: ctx.fetch (url→html) is required');

    const seen = new Set();
    const jobs = [];
    for (const cfg of this.impl.searchConfigs()) {
      const html = await fetchHtml(cfg.url);
      for (const job of this.impl.processSearchPage(html, cfg.url)) {
        if (seen.has(job.external_id)) continue;
        seen.add(job.external_id);
        jobs.push(job);
      }
    }
    return { jobs };
  }
}

module.exports = { JobBankSource };
