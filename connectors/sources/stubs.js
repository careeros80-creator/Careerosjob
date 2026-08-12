/**
 * connectors/sources/stubs.js
 *
 * VS2 — DOCUMENTED STUBS for future providers.
 *
 * These implement the Connector interface but perform NO scraping. Where a
 * provider's Terms of Service prohibit automated collection, the stub stays
 * permanently disabled and documents why. Where an official API exists, the
 * stub records that it is pending credentials/implementation.
 *
 * A stub never fetches, never scrapes, and returns zero jobs.
 */
const { Connector } = require('../base/Connector');

const STUB_META = [
  {
    name: 'indeed', flag: 'indeed_connector_enabled', provider: 'Indeed',
    implementation_status: 'disabled',
    reason: 'Indeed Terms of Service prohibit automated scraping/crawling of listings.',
    official_api: 'No open jobs-search API; Publisher/Employer APIs are deprecated or partner-gated. Do NOT scrape.',
  },
  {
    name: 'linkedin', flag: 'linkedin_connector_enabled', provider: 'LinkedIn',
    implementation_status: 'disabled',
    reason: 'LinkedIn User Agreement prohibits scraping and automated access.',
    official_api: 'Talent/Jobs APIs require partner approval. Do NOT scrape.',
  },
  {
    name: 'jooble', flag: 'jooble_connector_enabled', provider: 'Jooble',
    implementation_status: 'pending_api_key',
    reason: 'Official Jooble API is available and ToS-permitted; requires an API key not yet provisioned.',
    official_api: 'https://jooble.org/api/about — request a free API key, then implement discoverJobs().',
  },
  {
    name: 'direct', flag: 'direct_connector_enabled', provider: 'Company / salon career pages',
    implementation_status: 'deferred',
    reason: 'Per-site crawling must honor each site\'s robots.txt and Terms; enable only ToS-permitted sites.',
    official_api: 'N/A — uses the VS1 WebsiteConnector with per-site allowlist + robots.txt checks (future).',
  },
];

class StubConnector extends Connector {
  constructor(meta) {
    super({ name: meta.name, flag: meta.flag, provider: meta.provider });
    this.meta = meta;
    this._metrics.status = 'stub';
    this.isStub = true;
  }

  validate() {
    return { ok: false, errors: [`stub (${this.meta.implementation_status}): ${this.meta.reason}`] };
  }

  normalizeSource() {
    throw new Error(`${this.name} is a documented stub — not implemented (${this.meta.reason})`);
  }

  /** Never scrapes. Returns nothing, with the documented reason attached. */
  async discoverJobs() {
    return { jobs: [], stub: true, reason: this.meta.reason };
  }
}

function stubConnectors() {
  return STUB_META.map(m => new StubConnector(m));
}

module.exports = { StubConnector, stubConnectors, STUB_META };
