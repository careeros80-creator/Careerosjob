/**
 * services/pilot/decisions.js
 *
 * pilot/production-validation — the human approval state machine for
 * application packages. This is the single tested source of truth; the CLI
 * (scripts/pilot_decide.js) and any future UI must route every transition
 * through decide().
 *
 * ADR-006 is enforced here:
 *   • a package can only be SENT after a human APPROVED it,
 *   • nothing transitions automatically — decide() is only ever called in
 *     response to an explicit human action,
 *   • 'send' records that the human sent it manually; it does NOT send anything.
 *
 * States:  prepared → approved → sent
 *          prepared → rejected            (declined before approval)
 *          approved → rejected            (changed mind before sending)
 * Terminal: sent, rejected.
 */
const STATES = ['prepared', 'approved', 'sent', 'rejected'];
const ACTIONS = ['approve', 'reject', 'send'];

// allowed[current][action] = nextState
const TRANSITIONS = {
  prepared: { approve: 'approved', reject: 'rejected' },
  approved: { send: 'sent', reject: 'rejected' },
  sent: {},        // terminal
  rejected: {},    // terminal
};

/**
 * @returns {{ok:true, from, action, to}} | {{ok:false, error, from, action}}
 */
function decide(current, action) {
  if (!STATES.includes(current)) return { ok: false, error: `unknown current status '${current}'`, from: current, action };
  if (!ACTIONS.includes(action)) return { ok: false, error: `unknown action '${action}'`, from: current, action };
  const to = TRANSITIONS[current] && TRANSITIONS[current][action];
  if (!to) {
    // Make the ADR-006 guard explicit in the error.
    if (action === 'send' && current !== 'approved') {
      return { ok: false, error: `ADR-006: cannot send from '${current}' — a human must APPROVE first`, from: current, action };
    }
    return { ok: false, error: `illegal transition: ${current} --${action}-->`, from: current, action };
  }
  return { ok: true, from: current, action, to };
}

const isTerminal = (status) => TRANSITIONS[status] && Object.keys(TRANSITIONS[status]).length === 0;

module.exports = { decide, isTerminal, STATES, ACTIONS, TRANSITIONS };
