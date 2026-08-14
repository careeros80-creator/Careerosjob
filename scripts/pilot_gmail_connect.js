/**
 * scripts/pilot_gmail_connect.js
 *
 * pilot/production-validation — Gmail OAuth connect (+ reconnect). Runs a local
 * one-shot callback server, sends the pilot user through Google consent, then
 * exchanges the code for tokens and STORES the refresh token in .env
 * (git-ignored). OAuth only, read-only Gmail scope. Never fabricates.
 *
 * Prerequisites (user-provided, one time):
 *   - a Google Cloud OAuth *Web* client (Gmail API enabled)
 *   - GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET in .env
 *   - the client's Authorized redirect URI set to GMAIL_REDIRECT_URI
 *     (default http://localhost:53682/oauth/callback)
 *
 * Run:  node scripts/pilot_gmail_connect.js
 * It prints a consent URL, waits for the redirect, stores the refresh token,
 * prints the SQL to mark gmail_connections 'connected', then exits.
 * Re-running is the reconnect flow (prompt=consent mints a fresh refresh token).
 *
 * This script STOPS at Google consent — that step is the pilot user's.
 */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { GmailOAuth } = require('../services/pilot/oauth/GmailOAuth');

const ENV_PATH = path.join(__dirname, '..', '.env');

function upsertEnv(key, value) {
  let txt = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  txt = re.test(txt) ? txt.replace(re, line) : (txt.replace(/\s*$/, '') + `\n${line}\n`);
  fs.writeFileSync(ENV_PATH, txt);
}

async function main() {
  const oauth = GmailOAuth.fromEnv();
  if (!oauth.clientId || !oauth.clientSecret) {
    process.stderr.write(
      'READY FOR USER CONSENT — blocked on credentials.\n' +
      'Provide a Google OAuth client first:\n' +
      '  1. Google Cloud Console → APIs & Services → enable Gmail API\n' +
      '  2. Create OAuth client (type: Web application)\n' +
      `  3. Add Authorized redirect URI: ${oauth.redirectUri}\n` +
      '  4. Put GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env\n' +
      '  5. Re-run: node scripts/pilot_gmail_connect.js\n');
    process.exit(3);
  }

  const url = new URL(oauth.redirectUri);
  const port = Number(url.port || 80);
  const state = crypto.randomBytes(16).toString('hex');

  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    if (reqUrl.pathname !== url.pathname) { res.writeHead(404); res.end('not found'); return; }

    const err = reqUrl.searchParams.get('error');
    const code = reqUrl.searchParams.get('code');
    const gotState = reqUrl.searchParams.get('state');

    if (err) { res.writeHead(400); res.end(`OAuth error: ${err}`); finish(1, `consent error: ${err}`); return; }
    if (gotState !== state) { res.writeHead(400); res.end('state mismatch'); finish(1, 'state mismatch (possible CSRF)'); return; }
    if (!code) { res.writeHead(400); res.end('missing code'); finish(1, 'missing authorization code'); return; }

    try {
      const tokens = await oauth.exchangeCode(code);
      upsertEnv('GMAIL_REFRESH_TOKEN', tokens.refresh_token);

      // fetch the connected mailbox address (within gmail.readonly)
      let email = null;
      try {
        const pr = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (pr.ok) email = (await pr.json()).emailAddress || null;
      } catch { /* non-fatal */ }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h2>Gmail connected ✓</h2><p>You can close this tab and return to the terminal.</p>');

      process.stdout.write(
        `\n✓ Gmail connected${email ? ` as ${email}` : ''}. refresh_token stored in .env (GMAIL_REFRESH_TOKEN).\n\n` +
        `Apply this to mark the connection in the database:\n` +
        `  UPDATE gmail_connections SET status='connected', email=${email ? `'${email}'` : 'email'}, ` +
        `connected_at=now(), scopes=ARRAY['${oauth.scope}']::text[], last_error=NULL, updated_at=now();\n`);
      finish(0);
    } catch (e) {
      res.writeHead(500); res.end('token exchange failed');
      process.stdout.write(`\n✗ token exchange failed: ${e.message}\n` +
        `  UPDATE gmail_connections SET status='error', last_error=$e$${e.message}$e$, updated_at=now();\n`);
      finish(1, e.message);
    }
  });

  function finish(code, msg) {
    if (msg) process.stderr.write(`${msg}\n`);
    setTimeout(() => { server.close(); process.exit(code); }, 200);
  }

  server.listen(port, () => {
    const authUrl = oauth.buildAuthUrl(state);
    process.stderr.write(
      `Gmail OAuth connect — listening on ${oauth.redirectUri}\n\n` +
      `READY FOR USER CONSENT. Open this URL in your browser and approve:\n\n${authUrl}\n\n` +
      `Waiting for the redirect…\n`);
  });
}

main().catch(e => { process.stderr.write('FATAL: ' + e.message + '\n'); process.exit(1); });
