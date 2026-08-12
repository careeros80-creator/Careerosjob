import { useEffect, useState } from 'react';
import { supabase, isConfigured } from './supabaseClient';

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

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [successRate, setSuccessRate] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | unconfigured
  const [error, setError] = useState('');

  async function load() {
    if (!isConfigured) { setStatus('unconfigured'); return; }
    setStatus('loading');
    setError('');
    try {
      const [jobsRes, metricsRes, connRes] = await Promise.all([
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
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (metricsRes.error) throw metricsRes.error;
      if (connRes.error) throw connRes.error;

      setJobs(jobsRes.data || []);
      setMetrics(metricsRes.data || { jobs_discovered: 0, jobs_inserted: 0, duplicates_detected: 0 });
      setSuccessRate(connRes.data ? connRes.data.pipeline_success_rate : null);
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
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">career-os · VS1 Discovery</h1>
            <p className="mt-1 text-sm text-slate-400">
              Real Job Bank Canada jobs, live from Supabase.
            </p>
          </div>
          <button
            onClick={load}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
          >
            Refresh
          </button>
        </header>

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
      </div>
    </div>
  );
}
