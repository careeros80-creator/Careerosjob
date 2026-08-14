import { useEffect, useState } from 'react';
import { supabase, isConfigured } from './supabaseClient';

/**
 * Production Readiness page. Each item is READY / PENDING / FAILED based ONLY on
 * runtime verification:
 *   - Supabase/Database: a successful read of pilot_readiness proves reachability
 *   - Discovery/Normalization/Generation/Email/Observability: booleans from the
 *     pilot_readiness view (production rows only)
 *   - Gmail: gmail_connections.status
 *   - Auth: whether a session is currently established
 * Nothing is hard-coded; a fetch error surfaces as FAILED.
 */
const ORDER = [
  ['Auth', 'auth'],
  ['Gmail', 'gmail'],
  ['Supabase', 'supabase'],
  ['Database', 'database'],
  ['Discovery', 'discovery'],
  ['Normalization', 'normalization'],
  ['Generation', 'generation'],
  ['Email', 'email'],
  ['Observability', 'observability'],
];

function Badge({ state }) {
  const map = {
    READY: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    PENDING: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    FAILED: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  };
  return <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold ${map[state] || map.PENDING}`}>{state}</span>;
}

export default function Readiness({ session }) {
  const [row, setRow] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | unconfigured
  const [error, setError] = useState('');

  async function load() {
    if (!isConfigured) { setStatus('unconfigured'); return; }
    setStatus('loading'); setError('');
    try {
      const { data, error } = await supabase.from('pilot_readiness').select('*').maybeSingle();
      if (error) throw error;
      setRow(data || {});
      setStatus('ready');
    } catch (e) { setError(e.message || String(e)); setStatus('error'); }
  }
  useEffect(() => { load(); }, []);

  const reachable = status === 'ready';
  const gmail = row?.gmail_status;
  const states = {
    auth: session ? 'READY' : 'PENDING',
    gmail: gmail === 'connected' ? 'READY' : gmail === 'error' ? 'FAILED' : 'PENDING',
    supabase: status === 'error' ? 'FAILED' : reachable ? 'READY' : 'PENDING',
    database: status === 'error' ? 'FAILED' : row?.db_ready ? 'READY' : 'PENDING',
    discovery: reachable ? (row?.discovery_ready ? 'READY' : 'PENDING') : 'PENDING',
    normalization: reachable ? (row?.normalization_ready ? 'READY' : 'PENDING') : 'PENDING',
    generation: reachable ? (row?.generation_ready ? 'READY' : 'PENDING') : 'PENDING',
    email: reachable ? (row?.email_production_ready ? 'READY' : 'PENDING') : 'PENDING',
    observability: reachable ? (row?.observability_ready ? 'READY' : 'PENDING') : 'PENDING',
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Production Readiness</h2>
        <button onClick={load} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">Refresh</button>
      </div>

      {status === 'unconfigured' && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-sm">Supabase is not configured.</div>
      )}
      {status === 'error' && (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200 text-sm break-words">Readiness read failed: {error}</div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ORDER.map(([label, key]) => (
          <div key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm text-slate-200">{label}</span>
            <Badge state={status === 'loading' ? 'PENDING' : states[key]} />
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Runtime-verified. Auth = current session; Gmail = <code>gmail_connections.status</code>; the pipeline items reflect
        <code> data_source='production'</code> only. Gmail shows PENDING until the pilot user completes OAuth consent.
      </p>
    </section>
  );
}
