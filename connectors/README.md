# Connectors (VS2 — Multi-Source Discovery)

Provider-independent discovery. The pipeline reads the **registry** and never
hardcodes a provider.

## Interface (`base/Connector.js`)
Every connector exposes:
- `discoverJobs(ctx)` → `{ jobs: CanonicalJob[], errors? }` (async; HTML/fetch injected via `ctx.fetch`)
- `validate()` → `{ ok, errors }`
- `health()` → rolling metrics snapshot
- `normalizeSource(raw)` → `CanonicalJob`

## Registry (`registry.js`)
`ConnectorRegistry.discoverAll(ctx)`:
- gates each connector on its **feature flag** via `ctx.isEnabled(flag)` (fail-closed if the lookup throws)
- times each run
- **runs every connector in isolation** — a throw is caught, recorded as `failed`, and the loop continues. One connector can never stop another.

## Sources (`sources/`)
- `JobBankSource.js` — reference implementation, thin adapter over the frozen VS1 `JobBankConnector` (unchanged).
- `stubs.js` — documented, non-scraping stubs:
  | connector | status | why |
  |---|---|---|
  | indeed | disabled | ToS prohibits scraping; no open jobs API |
  | linkedin | disabled | User Agreement prohibits scraping; partner-gated APIs |
  | jooble | pending_api_key | official ToS-permitted API; needs a key |
  | direct | deferred | per-site robots.txt/ToS allowlist required |
- `index.js` — `buildRegistry()`.

## Health persistence
`services/discovery/run_discovery.js` runs the registry with flags read from
`feature_flags`, then records one `connector_runs` row per connector that ran
(INSERT running → UPDATE finished), firing `update_connector_health` so
`connector_health` holds last success/failure, jobs found/new/dup, run counts,
and average latency.

## Enabling a connector
Flip its `*_connector_enabled` row in `feature_flags` — **no code change**.
ToS-forbidden providers stay stubs and are never implemented.

## Tests
`tests/connectors/test_registry.js` (17), `tests/connectors/test_isolation.js`
(12 — failure sim + isolation + fail-closed flags),
`tests/integration/test_multi_source.js` (12).
