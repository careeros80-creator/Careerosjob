/**
 * services/email/GmailProvider.js
 *
 * VS2 M5 / pilot — Gmail source. Auth is OAuth 2.0 ONLY: client id/secret + a
 * refresh token. The user's PASSWORD is never requested, handled, or stored
 * (ADR-006 + safety). Access is READ-ONLY — this provider only lists and reads
 * messages; it never sends, replies, or modifies the mailbox.
 *
 * Provenance / auto-transition:
 *   • When OAuth credentials are present (env or injected config), fetchMessages
 *     pulls REAL messages from the Gmail API → provenance() === 'production'.
 *   • When they are absent, the pipeline falls back to injected fixtures
 *     (ctx.messages) → provenance() === 'test' ("Pending Pilot User").
 *   • The moment the pilot user provides the refresh token, the SAME code path
 *     returns Production Runtime data — no code change required.
 *
 * It NEVER invents data: with no credentials and no injected messages it throws.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

class GmailProvider {
  /**
   * @param {object} config { clientId, clientSecret, refreshToken, query, maxResults }
   *   Only OAuth fields — never a password. Values are secrets; keep them in
   *   env / Vault, never in the repo.
   */
  constructor({ config = {} } = {}) {
    this.authType = 'oauth2';
    this.config = config;
  }

  /** Build from environment. Only OAuth client/secret/refresh-token — never a password. */
  static fromEnv(env = process.env) {
    return new GmailProvider({
      config: {
        clientId:     env.GMAIL_CLIENT_ID     || null,
        clientSecret: env.GMAIL_CLIENT_SECRET || null,
        refreshToken: env.GMAIL_REFRESH_TOKEN || null,
        query:        env.GMAIL_QUERY         || 'category:primary newer_than:30d',
        maxResults:   Number(env.GMAIL_MAX_RESULTS || 25),
      },
    });
  }

  isConfigured() {
    const c = this.config;
    return Boolean(c.clientId && c.clientSecret && c.refreshToken);
  }

  /** 'production' when real OAuth creds are present, else 'test' (fixtures). */
  provenance() { return this.isConfigured() ? 'production' : 'test'; }

  /** Exchange the refresh token for a short-lived access token. OAuth only. */
  async getAccessToken() {
    if (!this.isConfigured()) throw new Error('Gmail OAuth not configured');
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
      grant_type: 'refresh_token',
    });
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) throw new Error(`Gmail token exchange failed: HTTP ${res.status} ${await res.text()}`);
    const json = await res.json();
    if (!json.access_token) throw new Error('Gmail token exchange returned no access_token');
    return json.access_token;
  }

  /**
   * Return inbound messages in the internal shape the EmailIntelligenceService
   * consumes. Injected fixtures (ctx.messages) short-circuit as Test Data.
   */
  async fetchMessages(ctx = {}) {
    if (Array.isArray(ctx.messages)) return ctx.messages;   // injected fixtures (Test Data)
    if (!this.isConfigured()) {
      throw new Error('Gmail OAuth not configured (client id/secret + refresh token missing) — no live inbox, no fabricated data');
    }
    const token = await this.getAccessToken();
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const listUrl = `${GMAIL_API}/messages?q=${encodeURIComponent(this.config.query)}&maxResults=${this.config.maxResults}`;
    const listRes = await fetch(listUrl, auth);
    if (!listRes.ok) throw new Error(`Gmail list failed: HTTP ${listRes.status}`);
    const list = await listRes.json();
    const ids = (list.messages || []).map(m => m.id);

    const messages = [];
    for (const id of ids) {
      const mRes = await fetch(`${GMAIL_API}/messages/${id}?format=full`, auth);
      if (!mRes.ok) continue;                 // skip unreadable; never fabricate
      messages.push(GmailProvider.mapGmailMessage(await mRes.json()));
    }
    return messages;
  }

  // ── mapping (pure; unit-testable without network) ──────────

  /** Map a raw Gmail API message resource to the internal message shape. */
  static mapGmailMessage(m) {
    const headers = {};
    for (const h of (m.payload?.headers || [])) headers[h.name.toLowerCase()] = h.value;
    const received = m.internalDate ? new Date(Number(m.internalDate)).toISOString()
                   : (headers['date'] ? new Date(headers['date']).toISOString() : null);
    return {
      gmail_message_id: m.id,
      gmail_thread_id:  m.threadId || null,
      from_address:     headers['from'] || null,
      subject:          headers['subject'] || null,
      body_text:        GmailProvider.extractText(m.payload),
      received_at:      received,
      attachments:      GmailProvider.extractAttachments(m.payload),
    };
  }

  /** Walk the MIME tree for the first text/plain part (base64url-decoded). */
  static extractText(payload) {
    if (!payload) return null;
    const decode = (data) => data ? Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8') : '';
    const walk = (part) => {
      if (!part) return null;
      if (part.mimeType === 'text/plain' && part.body?.data) return decode(part.body.data);
      for (const p of (part.parts || [])) { const t = walk(p); if (t) return t; }
      return null;
    };
    return walk(payload) || (payload.body?.data ? decode(payload.body.data) : null);
  }

  /** Collect attachment filenames (metadata only — bodies are not downloaded). */
  static extractAttachments(payload) {
    const out = [];
    const walk = (part) => {
      if (!part) return;
      if (part.filename) out.push({ filename: part.filename, mime_type: part.mimeType || null });
      for (const p of (part.parts || [])) walk(p);
    };
    walk(payload);
    return out;
  }
}

module.exports = { GmailProvider };
