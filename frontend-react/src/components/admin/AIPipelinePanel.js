import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_CONFIG from '../../config/apiConfig';

// Talks to the Python AI service admin/pipeline endpoints.
const aiApi = axios.create({
  baseURL: API_CONFIG.AI_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
const pct = (r) => (r == null ? '—' : `${(r * 100).toFixed(1)}%`);
const ago = (ts) => {
  if (!ts) return 'never';
  const d = new Date(ts);
  if (isNaN(d)) return String(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const Stat = ({ label, value, sub, color = 'gray' }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <p className="text-xs text-gray-500 font-semibold uppercase">{label}</p>
    <p className={`text-2xl font-extrabold text-${color}-600 mt-1`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export const AIPipelinePanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await aiApi.get('/api/v1/admin/dashboard');
      if (res.data?.success) setData(res.data.data);
      else setError(res.data?.error || 'Failed to load');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'AI service unreachable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // auto-refresh every 30s
    return () => clearInterval(t);
  }, [load]);

  const sync = async (query) => {
    setBusy(query || 'all');
    try {
      await aiApi.post(`/api/v1/pipeline/sync${query ? `?${query}` : ''}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setBusy('');
    }
  };

  if (loading && !data) {
    return <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Loading AI pipeline status…</div>;
  }
  if (error && !data) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-red-400 mb-2 block">error</span>
        <p className="text-red-600 font-semibold">{error}</p>
        <button onClick={load} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold">Retry</button>
      </div>
    );
  }

  const m = data?.metrics || {};
  const c = data?.counts || {};
  const v = data?.vectors || {};
  const sched = data?.scheduler || {};

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">AI Knowledge Pipeline</h2>
          <p className="text-xs text-gray-500">
            DB {data?.database?.reachable ? '🟢' : '🔴'} · Vectors {v.status === 'green' ? '🟢' : '🟡'} ·
            Scheduler {sched.running ? `🟢 ${sched.jobs?.length || 0} jobs` : (sched.mode === 'render-cron' ? '🕓 cron' : '⚪ off')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            <span className="material-symbols-outlined text-base align-middle">refresh</span> Refresh
          </button>
          <button onClick={() => sync('')} disabled={busy === 'all'}
            className="px-3 py-2 text-sm rounded-lg bg-orange-500 text-white font-semibold disabled:opacity-50">
            {busy === 'all' ? 'Syncing…' : 'Sync all now'}
          </button>
        </div>
      </div>

      {/* token-optimization KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Cache Hit Ratio" value={pct(m.cache_hit_ratio)} color="green"
              sub={`${fmt(m.cache_hits)} hits / ${fmt(m.cache_misses)} misses`} />
        <Stat label="Tokens Saved" value={fmt(m.tokens_saved)} color="orange"
              sub="vs. always calling the LLM" />
        <Stat label="LLM Calls" value={fmt(m.total_llm_calls)} color="blue"
              sub={`${fmt(m.total_api_calls)} total API calls`} />
        <Stat label="Vectors" value={fmt(v.points_count)} color="purple"
              sub={`${fmt(c.documents_active)} docs · ${fmt(c.chunks)} chunks`} />
      </div>

      {/* answer-source breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs text-gray-500 font-semibold uppercase mb-3">Answer sources (token layers)</p>
        <div className="flex flex-wrap gap-2">
          {(data?.answer_sources || []).map((a) => (
            <span key={a.answer_source} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              {a.answer_source}: <b>{fmt(a.n)}</b>{a.tokens_saved > 0 ? ` · saved ${fmt(a.tokens_saved)}` : ''}
            </span>
          ))}
          {(!data?.answer_sources || data.answer_sources.length === 0) && (
            <span className="text-xs text-gray-400">No chat queries logged yet.</span>
          )}
        </div>
      </div>

      {/* sources table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-700">Website Sources</p>
          <span className="text-xs text-gray-400">{c.faqs} FAQs · {c.semantic_cache_entries} cached answers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Source', 'Category', 'Last Sync', 'Status', 'Changed', 'Failed', ''].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.sources || []).map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{s.name}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[220px]">{s.url}{s.render_js ? ' · JS' : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.category}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{ago(s.last_synced_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      s.last_status === 'success' ? 'bg-green-100 text-green-700'
                      : s.last_status === 'partial' ? 'bg-yellow-100 text-yellow-700'
                      : s.last_status === 'failed' ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-500'}`}>{s.last_status || 'idle'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{s.last_run?.pages_changed ?? '—'}</td>
                  <td className="px-4 py-3 text-red-600">{s.last_run?.pages_failed || 0}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => sync(`source=${s.id}`)} disabled={busy === `source=${s.id}`}
                      className="px-2.5 py-1 text-xs rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 disabled:opacity-50">
                      {busy === `source=${s.id}` ? '…' : 'Sync'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* most asked */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs text-gray-500 font-semibold uppercase mb-3">Most-asked questions</p>
        {(data?.most_asked || []).length === 0 ? (
          <p className="text-xs text-gray-400">No questions logged yet.</p>
        ) : (
          <ol className="space-y-1.5 list-decimal list-inside">
            {data.most_asked.map((q, i) => (
              <li key={i} className="text-sm text-gray-700">
                {q.sample} <span className="text-xs text-gray-400">· asked {q.asked}×</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default AIPipelinePanel;
