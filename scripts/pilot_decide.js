/**
 * scripts/pilot_decide.js
 *
 * pilot/production-validation — the HUMAN approval action. A person runs this
 * to approve / reject / mark-sent one application package. It never sends an
 * application and is never called automatically (ADR-006).
 *
 *   node scripts/pilot_decide.js <package_id> <approve|reject|send> [note] [--actor=name]
 *
 * It emits a guarded, idempotent transaction to stdout (apply with psql):
 *   • the UPDATE only fires when the package is in a legal source state
 *     (WHERE status IN (...)), so 'send' is impossible unless a human already
 *     'approved' the package — the ADR-006 guard is enforced in SQL too.
 *   • a production_actions row is logged (trace_id + correlation_id + status),
 *     with data_source inherited from the package's job (production vs test).
 * If the package is in the wrong state, 0 rows change and nothing is logged.
 */
const { decide, TRANSITIONS, ACTIONS } = require('../services/pilot/decisions');

const argv = process.argv.slice(2);
const actorArg = argv.find(a => a.startsWith('--actor='));
const actor = actorArg ? actorArg.split('=')[1] : 'pilot';
const positional = argv.filter(a => !a.startsWith('--'));
const [pkgId, action, note] = positional;

function fail(msg, code = 2) { process.stderr.write(`ERROR: ${msg}\n`); process.exit(code); }

if (!pkgId || !action) fail('usage: pilot_decide.js <package_id> <approve|reject|send> [note] [--actor=name]');
if (!ACTIONS.includes(action)) fail(`unknown action '${action}' (allowed: ${ACTIONS.join(', ')})`);

// Legal source states for this action, and its single target state.
const froms = Object.keys(TRANSITIONS).filter(s => TRANSITIONS[s][action]);
const to = TRANSITIONS[froms[0]][action];
const tsCol = { approve: 'approved_at', reject: 'rejected_at', send: 'sent_at' }[action];
const actionName = action === 'send' ? 'mark_sent' : action;

// Sanity: every legal source state maps to the same target (state machine invariant).
for (const f of froms) {
  const r = decide(f, action);
  if (!r.ok || r.to !== to) fail(`state machine inconsistency for ${f} --${action}--> ${r.to}`);
}

const dq = (v, t) => (v == null ? 'NULL' : `$${t}$${v}$${t}$`);
const noteSql = note ? dq(note, 'nt') : 'NULL';
const fromsList = froms.map(s => `'${s}'`).join(', ');

const sql = `BEGIN;
WITH t AS (SELECT gen_random_uuid() AS tid),
upd AS (
  UPDATE application_packages p
     SET status = '${to}',
         ${tsCol} = now(),
         decided_by = ${dq(actor, 'ac')},
         decision_note = ${noteSql},
         updated_at = now()
   WHERE p.id = ${dq(pkgId, 'id')}::uuid
     AND p.status IN (${fromsList})          -- ADR-006 guard: illegal source state => 0 rows
  RETURNING p.id, p.job_id
)
INSERT INTO production_actions (action, stage, trace_id, correlation_id, data_source, status, detail)
SELECT '${actionName}', 'pilot', (SELECT tid FROM t), (SELECT tid FROM t),
       COALESCE((SELECT data_source FROM jobs j WHERE j.id = upd.job_id), 'test'),
       'success',
       jsonb_build_object('package_id', upd.id::text, 'to', '${to}', 'actor', ${dq(actor, 'ac')}, 'note', ${noteSql})
FROM upd;
COMMIT;`;

process.stdout.write(sql + '\n');
process.stderr.write(`pilot_decide: package ${pkgId} · ${action} -> '${to}' (only if status IN {${froms.join(', ')}}) · actor=${actor}\n`);
