/**
 * scripts/pilot_setup.js
 *
 * pilot/production-validation — one-time (idempotent) pilot setup. Creates the
 * pilot profile, default preferences, and IMPORTS the Master CV + cover-letter
 * template into pilot_documents (real content, checksummed, never overwritten),
 * and records the Gmail connection as 'pending' (OAuth not yet configured).
 *
 * Emits idempotent SQL to stdout; a human applies it. No fabricated data — the
 * profile name and languages come from the real Master CV; roles/locations are
 * the real discovery targets (editable later by the pilot user).
 *
 *   node scripts/pilot_setup.js > /tmp/pilot_setup.sql
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const masterPath = path.join(__dirname, '..', 'services', 'generator', 'masters', 'master_cv.json');
const tmplPath = path.join(__dirname, '..', 'services', 'generator', 'masters', 'cover_letter_template.txt');
const master = fs.readFileSync(masterPath, 'utf8');
const template = fs.readFileSync(tmplPath, 'utf8');
const masterObj = JSON.parse(master);

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const NAME = masterObj.name || 'Pilot User';
const langs = (masterObj.languages || [])
  .map(l => (typeof l === 'string' ? l : (l.language || l.name || '')))
  .filter(Boolean);
const roles = ['Esthetician', 'Hairstylist', 'Beautician', 'Makeup Artist'];
const locations = ['Ontario', 'British Columbia', 'New Brunswick'];

const dq = (v, t) => `$${t}$${v}$${t}$`;
const arr = (a) => (a.length ? `ARRAY[${a.map(x => dq(x, 'a')).join(',')}]::text[]` : 'ARRAY[]::text[]');
const PID = `(SELECT id FROM pilot_profile WHERE display_name=${dq(NAME, 'n')} LIMIT 1)`;

const out = ['BEGIN;'];
out.push(`INSERT INTO pilot_profile (display_name, is_active) SELECT ${dq(NAME, 'n')}, true WHERE NOT EXISTS (SELECT 1 FROM pilot_profile WHERE display_name=${dq(NAME, 'n')});`);
out.push(`INSERT INTO pilot_preferences (pilot_id, target_roles, target_locations, languages) SELECT ${PID}, ${arr(roles)}, ${arr(locations)}, ${arr(langs)} ON CONFLICT (pilot_id) DO NOTHING;`);
out.push(`INSERT INTO pilot_documents (pilot_id, doc_kind, format, content, checksum, source) SELECT ${PID}, 'master_cv', 'json', ${dq(master, 'M')}, ${dq(sha(master), 'c')}, 'imported' ON CONFLICT (pilot_id, doc_kind, checksum) DO NOTHING;`);
out.push(`INSERT INTO pilot_documents (pilot_id, doc_kind, format, content, checksum, source) SELECT ${PID}, 'cover_letter_template', 'text', ${dq(template, 'T')}, ${dq(sha(template), 'c')}, 'imported' ON CONFLICT (pilot_id, doc_kind, checksum) DO NOTHING;`);
out.push(`INSERT INTO gmail_connections (pilot_id, status) SELECT ${PID}, 'pending' ON CONFLICT (pilot_id) DO NOTHING;`);
out.push('COMMIT;');

process.stdout.write(out.join('\n') + '\n');
process.stderr.write(`pilot setup: profile='${NAME}' · master_cv sha=${sha(master).slice(0, 12)} · template sha=${sha(template).slice(0, 12)} · langs=[${langs.join(', ')}] · gmail=pending\n`);
