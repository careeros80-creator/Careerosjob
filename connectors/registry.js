/**
 * connectors/registry.js
 *
 * VS2 — Connector Registry + isolated multi-source discovery.
 *
 * The pipeline iterates whatever is registered — it never names a provider.
 * discoverAll():
 *   - gates each connector on its feature flag (via injected isEnabled)
 *   - times each run
 *   - RUNS EACH CONNECTOR IN ISOLATION: a throw is caught, recorded as
 *     `failed`, and the loop continues. One connector can never stop another.
 */
class ConnectorRegistry {
  constructor() { this._c = new Map(); }

  register(connector) {
    if (!connector || !connector.name) throw new Error('register() needs a named connector');
    if (this._c.has(connector.name)) throw new Error(`connector already registered: ${connector.name}`);
    this._c.set(connector.name, connector);
    return this;
  }

  get(name) { return this._c.get(name); }
  list() { return [...this._c.values()]; }
  names() { return [...this._c.keys()]; }

  /**
   * @param {object} ctx
   *   ctx.isEnabled(flag) → bool|Promise<bool>  (default: all enabled)
   *   ctx.now()  → ISO string                   (default: real clock)
   *   ctx.clock()→ ms epoch for timing          (default: Date.now)
   *   plus anything a connector needs (e.g. ctx.fetch)
   * @returns per-connector results — never throws for a connector failure.
   */
  async discoverAll(ctx = {}) {
    const isEnabled = ctx.isEnabled || (() => true);
    const now = ctx.now || (() => new Date().toISOString());
    const clock = ctx.clock || (() => Date.now());
    const results = [];

    for (const c of this.list()) {
      // Flag gate — a broken flag lookup disables (fail-closed), never throws.
      let enabled = false;
      try { enabled = await isEnabled(c.flag); } catch { enabled = false; }
      if (!enabled) {
        results.push({ connector: c.name, flag: c.flag, status: 'disabled', jobs: [], fetched: 0, ms: 0 });
        continue;
      }

      const start = clock();
      try {
        const r = (await c.discoverJobs(ctx)) || {};
        const jobs = Array.isArray(r.jobs) ? r.jobs : [];
        const ms = clock() - start;
        c._record({ ok: true, ms, discovered: jobs.length, at: now() });
        results.push({
          connector: c.name, flag: c.flag,
          status: r.stub ? 'stub' : 'success',
          jobs, fetched: jobs.length, errors: r.errors || [], reason: r.reason || null, ms,
        });
      } catch (e) {
        // ── ISOLATION BOUNDARY: swallow, record, keep going ──
        const ms = clock() - start;
        c._record({ ok: false, ms, at: now() });
        results.push({ connector: c.name, flag: c.flag, status: 'failed', error: e.message, jobs: [], fetched: 0, ms });
      }
    }
    return results;
  }
}

module.exports = { ConnectorRegistry };
