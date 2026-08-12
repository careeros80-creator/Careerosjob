/**
 * services/enrichment/providers/EnrichmentProvider.js
 *
 * VS2 Module 3 — base enrichment provider interface.
 *
 * A provider returns COMPANY-LEVEL public fields only:
 *   enrich(company, ctx) → { source, fields: { <field>: { value, confidence } } }
 *
 * The service stamps each field with source + last_updated. Providers must
 * never return personal-contact data (personal names/emails/phones).
 */
class EnrichmentProvider {
  constructor({ name, source } = {}) {
    if (!name) throw new Error('EnrichmentProvider requires a name');
    this.name = name;
    this.source = source || name;
  }

  // eslint-disable-next-line no-unused-vars
  async enrich(company, ctx) { throw new Error(`${this.name}.enrich() not implemented`); }
}

module.exports = { EnrichmentProvider };
