import { useEffect, useState } from 'react';
import { supabase, isConfigured } from './supabaseClient';
import Auth from './Auth';
import Readiness from './Readiness';

const JOB_COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'company_raw', label: 'Company' },
  { key: 'location_raw', label: 'Location' },
  { key: 'salary_raw', label: 'Salary' },
  { key: 'pipeline_status', label: 'Status' },
  { key: 'scraped_at', label: 'Scraped at' },
];

function fmt(v) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}
function fmtTime(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

function Card({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-2 text-3xl font-semibold ${accent || 'text-white'}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    raw: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    cleaned: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    scored: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    ignored: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    duplicate: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    invalid: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  };
  const cls = map[status] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {fmt(status)}
    </span>
  );
}

const PILOT_METRICS = [
  ['jobs_discovered', 'Jobs discovered'],
  ['jobs_cleaned', 'Jobs cleaned'],
  ['companies_enriched', 'Companies enriched'],
  ['applications_prepared', 'Applications prepared'],
  ['applications_approved', 'Applications approved'],
  ['applications_sent', 'Applications sent'],
  ['interviews', 'Interviews'],
  ['offers', 'Offers'],
  ['rejections', 'Rejections'],
  ['waiting_responses', 'Waiting responses'],
];
const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`);

function PilotDashboard({ pilot, prod }) {
  if (!pilot) return null;
  const p = pilot.production || {};
  const t = pilot.test || {};
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pilot Production Validation</h2>
        <span className="text-xs uppercase tracking-wider text-slate-400">Production Runtime vs Test Data</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Metric</th>
              <th className="px-4 py-3 font-medium text-emerald-300">● Production Runtime</th>
              <th className="px-4 py-3 font-medium text-slate-300">○ Test Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {PILOT_METRICS.map(([k, label]) => (
              <tr key={k} className="hover:bg-white/5">
                <td className="px-4 py-2.5 text-slate-300">{label}</td>
                <td className="px-4 py-2.5 text-lg font-semibold text-emerald-300">{fmt(p[k] ?? 0)}</td>
                <td className="px-4 py-2.5 text-slate-400">{fmt(t[k] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card label="Discovery success" value={pct(prod?.discovery_success_rate_pct)} accent="text-emerald-300" />
        <Card label="Duplicate rate" value={pct(prod?.duplicate_rate_pct)} accent="text-amber-300" />
        <Card label="ATS coverage" value={pct(prod?.ats_coverage_pct)} accent="text-sky-300" />
        <Card label="Avg processing" value={prod?.avg_processing_ms != null ? `${prod.avg_processing_ms} ms` : '—'} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Production metrics are computed <span className="text-slate-300">only</span> from{' '}
        <code>data_source='production'</code> — never fixtures. Interview / offer / response rates and real
        Gmail are <span className="text-amber-300">Pending Pilot User</span> (Gmail OAuth). Approval and sending
        are manual (ADR-006).
      </p>
    </section>
  );
}

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [successRate, setSuccessRate] = useState(null);
  const [pilot, setPilot] = useState(null);        // { production:{...}, test:{...} }
  const [prodMetrics, setProdMetrics] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | unconfigured
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [view, setView] = useState('dashboard'); // dashboard | readiness | account

  // Session: load once, then track auth changes (persisted in localStorage).
  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) ensureProfile();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Pilot profile flow: on sign-in, link this auth user to the existing seeded
  // pilot profile (which holds the imported CV/template/preferences). The client
  // cannot see an unlinked profile (RLS), so linking goes through the sanctioned
  // SECURITY DEFINER RPC link_pilot_profile() — it links the seeded row, is
  // idempotent, and only creates a new profile when none exists at all.
  async function ensureProfile() {
    try {
      await supabase.rpc('link_pilot_profile');
    } catch { /* non-fatal; surfaced on the Account view */ }
  }

  async function signOut() { await supabase.auth.signOut(); setView('dashboard'); }

  async function load() {
    if (!isConfigured) { setStatus('unconfigured'); return; }
    setStatus('loading');
    setError('');
    try {
      const [jobsRes, metricsRes, connRes, pilotRes, prodRes] = await Promise.all([
        supabase
          .from('jobs')
          .select('external_id,title,company_raw,location_raw,salary_raw,pipeline_status,scraped_at')
          .order('scraped_at', { ascending: false }),
        supabase
          .from('vs1_metrics')
          .select('jobs_discovered,jobs_inserted,duplicates_detected')
          .maybeSingle(),
        supabase
          .from('vs1_connector_metrics')
          .select('pipeline_success_rate')
          .eq('connector', 'jobbank')
          .maybeSingle(),
        supabase.from('pilot_dashboard').select('*'),
        supabase.from('pilot_production_metrics').select('*').maybeSingle(),
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (metricsRes.error) throw metricsRes.error;
      if (connRes.error) throw connRes.error;
      if (pilotRes.error) throw pilotRes.error;
      if (prodRes.error) throw prodRes.error;

      setJobs(jobsRes.data || []);
      setMetrics(metricsRes.data || { jobs_discovered: 0, jobs_inserted: 0, duplicates_detected: 0 });
      setSuccessRate(connRes.data ? connRes.data.pipeline_success_rate : null);
      const pilotRows = pilotRes.data || [];
      setPilot({
        production: pilotRows.find((r) => r.data_source === 'production') || {},
        test: pilotRows.find((r) => r.data_source === 'test') || {},
      });
      setProdMetrics(prodRes.data || null);
      setStatus('ready');
    } catch (e) {
      setError(e.message || String(e));
      setStatus('error');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">career-os · Pilot Console</h1>
              <p className="mt-1 text-sm text-slate-400">Real Job Bank Canada jobs, live from Supabase.</p>
            </div>
            <div className="text-right text-sm">
              {session ? (
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Signed in as <span className="text-slate-200">{session.user.email}</span></span>
                  <button onClick={signOut} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-medium hover:bg-white/10">Sign out</button>
                </div>
              ) : (
                <span className="text-slate-500">Not signed in</span>
              )}
            </div>
          </div>
          <nav className="mt-4 flex gap-2">
            {[['dashboard', 'Dashboard'], ['readiness', 'Production Readiness'], ['account', 'Account']].map(([v, label]) => (
              <button
                key={v} onClick={() => setView(v)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium ${
                  view === v ? 'bg-white/10 text-white border border-white/20' : 'border border-white/10 text-slate-300 hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
            {view === 'dashboard' && (
              <button onClick={load} className="ml-auto rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium hover:bg-white/10">Refresh</button>
            )}
          </nav>
        </header>

        {view === 'readiness' && <Readiness session={session} />}

        {view === 'account' && (
          <section>
            {session ? (
              <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-sm">
                <div className="text-slate-400">Signed in as</div>
                <div className="mt-1 text-lg font-semibold text-white">{session.user.email}</div>
                <div className="mt-1 text-xs text-slate-500">user id: {session.user.id}</div>
                <button onClick={signOut} className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-medium hover:bg-white/10">Sign out</button>
              </div>
            ) : (
              <Auth />
            )}
          </section>
        )}

        {view === 'dashboard' && (<>
        {status === 'unconfigured' && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-200">
            <div className="font-semibold">Supabase is not configured.</div>
            <p className="mt-2 text-sm">
              Copy <code>dashboard/.env.example</code> to <code>dashboard/.env</code> and set{' '}
              <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then restart{' '}
              <code>npm run dev</code>.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
            <div className="font-semibold">Could not load data.</div>
            <p className="mt-2 break-words text-sm">{error}</p>
          </div>
        )}

        {status !== 'unconfigured' && (
          <>
            <PilotDashboard pilot={pilot} prod={prodMetrics} />

            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">VS1 discovery (all sources)</h3>
            <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card label="Jobs discovered" value={fmt(metrics?.jobs_discovered ?? (status === 'loading' ? '…' : 0))} />
              <Card label="Jobs inserted" value={fmt(metrics?.jobs_inserted ?? (status === 'loading' ? '…' : 0))} accent="text-emerald-300" />
              <Card label="Duplicates detected" value={fmt(metrics?.duplicates_detected ?? (status === 'loading' ? '…' : 0))} accent="text-amber-300" />
              <Card
                label="Pipeline success rate"
                value={successRate === null || successRate === undefined ? (status === 'loading' ? '…' : '—') : `${successRate}%`}
                accent="text-sky-300"
              />
            </section>

            <section className="overflow-hidden rounded-2xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      {JOB_COLUMNS.map((c) => (
                        <th key={c.key} className="whitespace-nowrap px-4 py-3 font-medium">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {status === 'loading' && (
                      <tr><td colSpan={JOB_COLUMNS.length} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
                    )}
                    {status === 'ready' && jobs.length === 0 && (
                      <tr><td colSpan={JOB_COLUMNS.length} className="px-4 py-8 text-center text-slate-400">
                        No jobs yet. Enable the connector flag and run the VS1 discovery.
                      </td></tr>
                    )}
                    {jobs.map((j) => (
                      <tr key={j.external_id} className="hover:bg-white/5">
                        <td className="px-4 py-3 font-medium text-white">{fmt(j.title)}</td>
                        <td className="px-4 py-3">{fmt(j.company_raw)}</td>
                        <td className="px-4 py-3">{fmt(j.location_raw)}</td>
                        <td className="px-4 py-3">{fmt(j.salary_raw)}</td>
                        <td className="px-4 py-3"><StatusBadge status={j.pipeline_status} /></td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-400">{fmtTime(j.scraped_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <footer className="mt-6 text-xs text-slate-500">
              Reading <code>jobs</code>, <code>vs1_metrics</code>, <code>vs1_connector_metrics</code> via the Supabase anon key.
            </footer>
          </>
        )}
        </>)}
      </div>
    </div>
  );
}
