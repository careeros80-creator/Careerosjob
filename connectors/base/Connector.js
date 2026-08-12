/**
 * connectors/base/Connector.js
 *
 * VS2 — generic Connector interface. Every source (Job Bank, Jooble, …)
 * exposes the SAME API so the discovery pipeline never hardcodes a provider:
 *
 *   discoverJobs(ctx) → { jobs: CanonicalJob[], errors? }   (async; fetches)
 *   validate()        → { ok, errors }                       (config/reachability)
 *   health()          → { status, last_success_at, ... }     (metrics snapshot)
 *   normalizeSource(raw) → CanonicalJob                       (source raw → canonical)
 *
 * Subclasses MUST implement discoverJobs() and normalizeSource().
 * validate()/health() have sensible defaults. Rolling metrics are recorded via
 * _record() and surfaced by health() + persisted to connector_health.
 */
class Connector {
  constructor({ name, flag, provider } = {}) {
    if (!name) throw new Error('Connector requires a name');
    this.name = name;
    this.flag = flag || `${name}_connector_enabled`;
    this.provider = provider || name;
    this._metrics = {
      status: 'unknown',
      last_success_at: null,
      last_failure_at: null,
      jobs_discovered: 0,
      jobs_inserted: 0,
      duplicates: 0,
      runs: 0,
      total_ms: 0,
    };
  }

  // eslint-disable-next-line no-unused-vars
  async discoverJobs(ctx) { throw new Error(`${this.name}.discoverJobs() not implemented`); }
  // eslint-disable-next-line no-unused-vars
  normalizeSource(raw) { throw new Error(`${this.name}.normalizeSource() not implemented`); }

  validate() { return { ok: true, errors: [] }; }

  health() {
    const m = this._metrics;
    return {
      connector: this.name,
      status: m.status,
      last_success_at: m.last_success_at,
      last_failure_at: m.last_failure_at,
      jobs_discovered: m.jobs_discovered,
      jobs_inserted: m.jobs_inserted,
      duplicates: m.duplicates,
      runs: m.runs,
      avg_ms: m.runs ? Math.round(m.total_ms / m.runs) : 0,
    };
  }

  /** Fold one run's outcome into the rolling metrics. */
  _record({ ok, ms = 0, discovered = 0, inserted = 0, duplicates = 0, at }) {
    const m = this._metrics;
    m.runs += 1;
    m.total_ms += ms;
    m.jobs_discovered += discovered;
    m.jobs_inserted += inserted;
    m.duplicates += duplicates;
    if (ok) { m.status = 'healthy'; m.last_success_at = at || null; }
    else    { m.status = 'down';    m.last_failure_at = at || null; }
  }
}

module.exports = { Connector };
