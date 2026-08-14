import { useState } from 'react';
import { supabase } from './supabaseClient';

/**
 * Sign-in / sign-up panel (Supabase Auth, email + password). Session
 * persistence, refresh and logout are handled by the client + App.jsx.
 * No login is fabricated: sign-up honours the project's email-confirmation
 * setting and reports exactly what the user must do next.
 */
export default function Auth() {
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {kind:'error'|'info', text}

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) setMsg({ kind: 'info', text: 'Account created and signed in.' });
        else setMsg({ kind: 'info', text: 'Account created. Check your email to confirm, then sign in.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMsg({ kind: 'info', text: 'Signed in.' });
      }
    } catch (err) {
      setMsg({ kind: 'error', text: err.message || String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex gap-2">
        {['signin', 'signup'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setMsg(null); }}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${
              mode === m ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40' : 'border border-white/10 text-slate-300 hover:bg-white/5'
            }`}
          >
            {m === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs uppercase tracking-wider text-slate-400">Email
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          />
        </label>
        <label className="block text-xs uppercase tracking-wider text-slate-400">Password
          <input
            type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          />
        </label>
        <button
          type="submit" disabled={busy}
          className="w-full rounded-xl bg-emerald-500/90 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {msg && (
        <div className={`mt-4 rounded-xl border p-3 text-sm ${
          msg.kind === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-sky-500/30 bg-sky-500/10 text-sky-200'
        }`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
