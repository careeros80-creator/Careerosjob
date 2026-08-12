/**
 * services/enrichment/CompanyEnrichmentService.js
 *
 * VS2 Module 3 — Company Enrichment Service.
 *
 * Wraps an enrichment provider with: caching (TTL), a retry policy
 * (maxAttempts), health metrics, and per-company runtime isolation. Pure and
 * deterministic (clock/now injectable) so unit/retry/cache/failure tests need
 * no network and no DB. Every field is stamped with source + last_updated;
 * results are idempotent (upsert by company_id downstream).
 */
class CompanyEnrichmentService {
  constructor({
    provider,
    cache = new Map(),
    ttlMs = 60 * 60 * 1000,
    maxAttempts = 3,
    now = () => new Date().toISOString(),
    clock = () => Date.now(),
  } = {}) {
    if (!provider) throw new Error('CompanyEnrichmentService requires a provider');
    this.provider = provider;
    this.cache = cache;
    this.ttlMs = ttlMs;
    this.maxAttempts = maxAttempts;
    this.now = now;
    this.clock = clock;
    this.metrics = { enriched: 0, failed: 0, retries: 0, cache_hits: 0, cache_misses: 0, runs: 0, total_ms: 0 };
  }

  _key(company) { return company.company_key || company.website || company.id; }

  _stamp(fields = {}, source) {
    const at = this.now();
    const out = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = { value: v.value, confidence: v.confidence == null ? 0.5 : v.confidence, source, last_updated: at };
    }
    return out;
  }

  /** Cache + retry for a single company. Never throws (returns {ok:false,...}). */
  async enrichOne(company, ctx = {}) {
    const key = this._key(company);
    const cached = this.cache.get(key);
    if (cached && cached.expires > this.clock()) {
      this.metrics.cache_hits += 1;
      return { ok: true, company_id: company.id, fields: cached.fields, source: cached.source, cache: 'hit', attempts: 0 };
    }
    this.metrics.cache_misses += 1;

    let attempts = 0;
    let lastError = null;
    while (attempts < this.maxAttempts) {
      attempts += 1;
      try {
        const res = (await this.provider.enrich(company, ctx)) || { fields: {} };
        const source = res.source || this.provider.source;
        const fields = this._stamp(res.fields || {}, source);
        this.cache.set(key, { fields, source, expires: this.clock() + this.ttlMs });
        this.metrics.retries += attempts - 1;
        const enrichedCount = Object.keys(fields).length;
        return {
          ok: true, company_id: company.id, fields, source, cache: 'miss', attempts,
          field_count: enrichedCount, stub: res.stub || false, note: res.note || null, reason: res.reason || null,
        };
      } catch (e) {
        lastError = e.message;
      }
    }
    this.metrics.retries += attempts - 1;
    return { ok: false, company_id: company.id, error: lastError, attempts };
  }

  /** Process a batch with per-company isolation. */
  async processBatch(companies = [], ctx = {}) {
    this.metrics.runs += 1;
    const t0 = this.clock();
    const results = [];
    for (const company of companies) {
      let r;
      try { r = await this.enrichOne(company, ctx); }
      catch (e) { r = { ok: false, company_id: company.id, error: e.message, attempts: 0 }; } // isolation
      if (r.ok) this.metrics.enriched += 1; else this.metrics.failed += 1;
      results.push(r);
    }
    this.metrics.total_ms += this.clock() - t0;
    return { results, health: this.health() };
  }

  health() {
    const m = this.metrics;
    return {
      enriched: m.enriched, failed: m.failed, retries: m.retries,
      cache_hits: m.cache_hits, cache_misses: m.cache_misses,
      runs: m.runs, avg_ms: m.runs ? Math.round(m.total_ms / m.runs) : 0,
    };
  }
}

module.exports = { CompanyEnrichmentService };
