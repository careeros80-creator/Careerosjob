/**
 * scripts/pilot_gmail_revoke.js
 *
 * pilot/production-validation — Gmail OAuth revoke (disconnect). Revokes the
 * stored refresh token at Google, removes it from .env, and prints the SQL to
 * set gmail_connections back to 'pending'. OAuth only; never fabricates.
 *
 * Run:  node scripts/pilot_gmail_revoke.js
 */
const fs = require('fs');
const path = require('path');
const { GmailOAuth } = require('../services/pilot/oauth/GmailOAuth');

const ENV_PATH = path.join(__dirname, '..', '.env');

function removeEnv(key) {
  if (!fs.existsSync(ENV_PATH)) return;
  const txt = fs.readFileSync(ENV_PATH, 'utf8').replace(new RegExp(`^${key}=.*\\n?`, 'm'), '');
  fs.writeFileSync(ENV_PATH, txt);
}

async function main() {
  const token = process.env.GMAIL_REFRESH_TOKEN;
  if (!token) { process.stderr.write('nothing to revoke — GMAIL_REFRESH_TOKEN not set.\n'); process.exit(0); }

  const oauth = GmailOAuth.fromEnv();
  const result = await oauth.revokeToken(token);
  removeEnv('GMAIL_REFRESH_TOKEN');

  process.stdout.write(
    `Gmail revoke: HTTP ${result.status} (${result.ok ? 'revoked' : 'already invalid'}); GMAIL_REFRESH_TOKEN removed from .env.\n` +
    `Apply to reset the connection:\n` +
    `  UPDATE gmail_connections SET status='pending', email=NULL, connected_at=NULL, ` +
    `scopes=ARRAY[]::text[], last_error=NULL, updated_at=now();\n`);
  process.exit(0);
}

main().catch(e => { process.stderr.write('FATAL: ' + e.message + '\n'); process.exit(1); });
