/**
 * tests/pilot/test_gmail_oauth.js — Gmail OAuth logic (GmailOAuth.js).
 * Pure/injected fetch — no network, no consent. Run: node tests/pilot/test_gmail_oauth.js
 */
const { GmailOAuth, TOKEN_URL, REVOKE_URL, AUTH_URL } = require('../../services/pilot/oauth/GmailOAuth');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };

// records the last request; returns a scripted response
function fakeFetch(response) {
  const calls = [];
  const impl = async (url, opts) => { calls.push({ url, opts }); return response; };
  impl.calls = calls;
  return impl;
}
const jsonRes = (ok, body, status = ok ? 200 : 400) => ({
  ok, status, json: async () => body, text: async () => JSON.stringify(body),
});

const base = { clientId: 'CID.apps.googleusercontent.com', clientSecret: 'SEC', redirectUri: 'http://localhost:53682/oauth/callback' };

(async () => {
  console.log('\n[ buildAuthUrl ]');
  const o = new GmailOAuth(base);
  const url = o.buildAuthUrl('state123');
  check(url.startsWith(AUTH_URL), 'points at Google auth endpoint');
  check(url.includes('client_id=CID.apps.googleusercontent.com'), 'includes client_id');
  check(url.includes('redirect_uri=http%3A%2F%2Flocalhost%3A53682%2Foauth%2Fcallback'), 'includes encoded redirect_uri');
  check(url.includes('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly'), 'read-only Gmail scope');
  check(url.includes('access_type=offline') && url.includes('prompt=consent'), 'offline + consent → guarantees refresh_token');
  check(url.includes('response_type=code') && url.includes('state=state123'), 'code flow with state');

  console.log('\n[ isConfigured ]');
  check(o.isConfigured() === true, 'configured with id/secret/redirect');
  check(new GmailOAuth({}).isConfigured() === false, 'unconfigured without creds');

  console.log('\n[ exchangeCode ]');
  const f1 = fakeFetch(jsonRes(true, { access_token: 'AT', refresh_token: 'RT', expires_in: 3599 }));
  const tok = await new GmailOAuth({ ...base, fetchImpl: f1 }).exchangeCode('authcode');
  check(tok.refresh_token === 'RT' && tok.access_token === 'AT', 'returns access + refresh token');
  check(f1.calls[0].url === TOKEN_URL, 'posts to token endpoint');
  check(/grant_type=authorization_code/.test(f1.calls[0].opts.body) && /code=authcode/.test(f1.calls[0].opts.body), 'body has grant_type=authorization_code + code');
  check(/client_secret=SEC/.test(f1.calls[0].opts.body), 'body carries client_secret (server-side only)');

  let threw = false;
  try { await new GmailOAuth({ ...base, fetchImpl: fakeFetch(jsonRes(true, { access_token: 'AT' })) }).exchangeCode('c'); }
  catch (e) { threw = /no refresh_token/.test(e.message); }
  check(threw, 'missing refresh_token → throws (reconnect guidance)');

  threw = false;
  try { await new GmailOAuth({ ...base, fetchImpl: fakeFetch(jsonRes(false, { error: 'invalid_request' })) }).exchangeCode('c'); }
  catch (e) { threw = /token exchange failed/.test(e.message); }
  check(threw, 'non-ok exchange → throws');

  console.log('\n[ refreshAccessToken + expired-token recovery ]');
  const f2 = fakeFetch(jsonRes(true, { access_token: 'AT2', expires_in: 3599 }));
  const r = await new GmailOAuth({ ...base, fetchImpl: f2 }).refreshAccessToken('RT');
  check(r.access_token === 'AT2', 'refresh yields a new access token');
  check(/grant_type=refresh_token/.test(f2.calls[0].opts.body), 'body has grant_type=refresh_token');

  let reconnect = null;
  try { await new GmailOAuth({ ...base, fetchImpl: fakeFetch(jsonRes(false, { error: 'invalid_grant' })) }).refreshAccessToken('RT'); }
  catch (e) { reconnect = e.needsReconnect; }
  check(reconnect === true, 'invalid_grant → error flagged needsReconnect (expired/revoked → reconnect)');

  console.log('\n[ revokeToken ]');
  const f3 = fakeFetch({ ok: true, status: 200 });
  const rev = await new GmailOAuth({ ...base, fetchImpl: f3 }).revokeToken('RT');
  check(rev.ok === true, 'revoke returns ok');
  check(f3.calls[0].url.startsWith(REVOKE_URL) && f3.calls[0].url.includes('token=RT'), 'calls revoke endpoint with token');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
