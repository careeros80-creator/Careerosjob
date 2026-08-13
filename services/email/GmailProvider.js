/**
 * services/email/GmailProvider.js
 *
 * VS2 M5 — Gmail source. Auth is OAuth 2.0 ONLY: client id/secret + a refresh
 * token, all referenced via Supabase Vault keys (secret_refs) — the user's
 * PASSWORD is never requested or stored.
 *
 * Live inbox access is not available in this environment, so fetchMessages()
 * accepts an injected message list (ctx.messages) for deterministic runs
 * (labelled Test Data). Without OAuth config + injected messages it refuses to
 * invent data.
 */
class GmailProvider {
  constructor({ config = {} } = {}) {
    this.authType = 'oauth2';
    // Vault references only — e.g. { clientIdRef, clientSecretRef, refreshTokenRef }
    this.config = config;
  }

  isConfigured() { return Boolean(this.config.refreshTokenRef); }

  async fetchMessages(ctx = {}) {
    if (Array.isArray(ctx.messages)) return ctx.messages;         // injected (Test Data)
    if (!this.isConfigured()) {
      throw new Error('Gmail OAuth not configured (refresh_token reference missing) — no live inbox, no fabricated data');
    }
    throw new Error('live Gmail fetch is not implemented in this environment');
  }
}

module.exports = { GmailProvider };
