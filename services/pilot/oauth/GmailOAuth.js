/**
 * services/pilot/oauth/GmailOAuth.js
 *
 * pilot/production-validation — Gmail OAuth 2.0 (authorization-code flow).
 * OAuth ONLY: client id/secret + redirect URI. No passwords, ever. Read-only
 * Gmail scope. This module is pure/injectable (pass fetchImpl in tests); it
 * performs no I/O of its own beyond the HTTP calls it is asked to make.
 *
 * Flow the pilot user completes:
 *   1. buildAuthUrl()      → the Google consent URL (opens in the browser)
 *   2. [USER CONSENT]      ← Google redirects to redirect_uri with ?code=...
 *   3. exchangeCode(code)  → { access_token, refresh_token, expires_in }
 *   4. refreshAccessToken(refresh_token) → new access_token when expired
 *   5. revokeToken(token)  → disconnect
 *
 * The refresh_token is the durable credential; it is stored in .env
 * (git-ignored) / Vault by the connect script — never in the database, never
 * in the repo.
 */
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const DEFAULT_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

class GmailOAuth {
  constructor({ clientId, clientSecret, redirectUri, scope, fetchImpl } = {}) {
    this.clientId = clientId || null;
    this.clientSecret = clientSecret || null;
    this.redirectUri = redirectUri || null;
    this.scope = scope || DEFAULT_SCOPE;
    this._fetch = fetchImpl || ((...a) => fetch(...a));
  }

  static fromEnv(env = process.env) {
    return new GmailOAuth({
      clientId: env.GMAIL_CLIENT_ID || null,
      clientSecret: env.GMAIL_CLIENT_SECRET || null,
      redirectUri: env.GMAIL_REDIRECT_URI || 'http://localhost:53682/oauth/callback',
      scope: env.GMAIL_SCOPE || DEFAULT_SCOPE,
    });
  }

  isConfigured() { return Boolean(this.clientId && this.clientSecret && this.redirectUri); }

  /** The consent URL. access_type=offline + prompt=consent guarantees a refresh_token. */
  buildAuthUrl(state) {
    if (!this.clientId || !this.redirectUri) throw new Error('GmailOAuth: clientId + redirectUri required');
    const p = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    });
    if (state) p.set('state', state);
    return `${AUTH_URL}?${p.toString()}`;
  }

  /** Exchange the authorization code for tokens (includes refresh_token). */
  async exchangeCode(code) {
    if (!this.isConfigured()) throw new Error('GmailOAuth not configured (client id/secret/redirect)');
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });
    const res = await this._fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`token exchange failed: HTTP ${res.status} ${await res.text()}`);
    const json = await res.json();
    if (!json.refresh_token) {
      throw new Error('no refresh_token returned — revoke prior grant and retry with prompt=consent');
    }
    return json; // { access_token, refresh_token, expires_in, scope, token_type }
  }

  /** Get a fresh access token from a stored refresh token (expired-token recovery). */
  async refreshAccessToken(refreshToken) {
    if (!this.isConfigured()) throw new Error('GmailOAuth not configured');
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
    });
    const res = await this._fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`token refresh failed: HTTP ${res.status} ${text}`);
      // invalid_grant => the refresh token was revoked/expired → the user must reconnect.
      err.needsReconnect = /invalid_grant/i.test(text);
      throw err;
    }
    return res.json(); // { access_token, expires_in, scope, token_type }
  }

  /** Revoke a token (access or refresh) — disconnect flow. */
  async revokeToken(token) {
    const res = await this._fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { ok: res.ok, status: res.status };
  }
}

module.exports = { GmailOAuth, AUTH_URL, TOKEN_URL, REVOKE_URL, DEFAULT_SCOPE };
