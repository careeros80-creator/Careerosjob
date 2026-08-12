/**
 * services/enrichment/providers/registryStubs.js
 *
 * VS2 Module 3 — DOCUMENTED provider stubs for government / third-party
 * business registries. These do NOT scrape. Where an official, ToS-permitted
 * API exists, the stub records what is required to implement it; it never
 * extracts data from a source whose Terms prohibit automated access.
 */
const { EnrichmentProvider } = require('./EnrichmentProvider');

const REGISTRY_STUBS = [
  {
    name: 'canada_open_registry', source: 'canada_open_registry',
    provider: 'Canada — Open Government business datasets',
    implementation_status: 'pending_dataset_integration',
    reason: 'ToS-permitted open data; integrate the official dataset/API rather than scraping any portal.',
    official_api: 'https://open.canada.ca/ — federal/provincial open business datasets.',
  },
  {
    name: 'opencorporates', source: 'opencorporates',
    provider: 'OpenCorporates',
    implementation_status: 'pending_api_key',
    reason: 'Official API available under ToS with attribution; requires an API key (not provisioned).',
    official_api: 'https://api.opencorporates.com/ — API token + attribution required.',
  },
];

class RegistryStubProvider extends EnrichmentProvider {
  constructor(meta) { super({ name: meta.name, source: meta.source }); this.meta = meta; this.isStub = true; }
  async enrich() { return { source: this.source, fields: {}, stub: true, reason: this.meta.reason }; }
}

function registryStubProviders() {
  return REGISTRY_STUBS.map(m => new RegistryStubProvider(m));
}

module.exports = { RegistryStubProvider, registryStubProviders, REGISTRY_STUBS };
