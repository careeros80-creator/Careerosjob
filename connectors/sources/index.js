/**
 * connectors/sources/index.js
 *
 * VS2 — builds the default Connector Registry. Adding a provider = register a
 * new source here (or push a stub into stubs.js). The discovery pipeline reads
 * the registry dynamically and never hardcodes provider logic.
 */
const { ConnectorRegistry } = require('../registry');
const { JobBankSource } = require('./JobBankSource');
const { stubConnectors } = require('./stubs');

/** All source factories the registry knows about. */
function allSources() {
  return [
    new JobBankSource(),   // reference implementation
    ...stubConnectors(),   // documented, disabled/pending stubs
  ];
}

function buildRegistry() {
  const registry = new ConnectorRegistry();
  for (const source of allSources()) registry.register(source);
  return registry;
}

module.exports = { buildRegistry, allSources };
