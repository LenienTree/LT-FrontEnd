import React, { useState, useEffect, useCallback } from 'react';
import {
  Link2, Users, MousePointerClick, Trophy, Copy, Check,
  Loader2, RefreshCw, Sparkles, BarChart3
} from 'lucide-react';
import { referral as referralApi, admin as adminApi } from '../../services/api';

/**
 * Reusable referral / UTM management panel.
 *
 * @param {'admin'|'organizer'} mode
 *   - 'admin'     → can generate & view stats for ANY event
 *   - 'organizer' → restricted to the organizer's own events (backend-enforced)
 * @param {string} [accent]  hex accent color (defaults to brand green)
 */
export default function ReferralManager({ mode = 'organizer', accent = '#9AE600' }) {
  const isAdmin = mode === 'admin';
  const r = isAdmin ? referralApi.admin : referralApi.organizer;

  const [subTab, setSubTab] = useState('generate'); // 'generate' | 'stats'

  // Shared
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [error, setError] = useState('');

  // Generate
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // ── Load events + colleges on mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingEvents(true);
      setError('');
      try {
        const [evRes, colRes] = await Promise.all([
          isAdmin ? adminApi.getAllEvents({ limit: 1000 }) : r.listEvents(),
          r.listColleges(),
        ]);
        if (cancelled) return;
        const evArr = Array.isArray(evRes) ? evRes : (evRes?.data || []);
        setEvents(evArr);
        setColleges(Array.isArray(colRes) ? colRes : []);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load referral data');
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Load students when a college is picked ──
  const loadStudents = useCallback(async (college) => {
    setSelectedStudentId('');
    setStudents([]);
    if (!college) return;
    setLoadingStudents(true);
    try {
      const res = await r.listStudents(college);
      setStudents(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e.message || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleGenerate = async () => {
    if (!selectedEventId || !selectedStudentId) return;
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await r.generate(selectedEventId, selectedStudentId);
      setResult(res);
    } catch (e) {
      setError(e.message || 'Failed to generate referral link');
    } finally {
      setGenerating(false);
    }
  };

  const loadStats = useCallback(async (eventId) => {
    if (!eventId) { setStats(null); return; }
    setLoadingStats(true);
    setError('');
    try {
      const res = await r.getStats(eventId);
      setStats(res);
    } catch (e) {
      setError(e.message || 'Failed to load referral stats');
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Auto-load stats when switching to stats tab with an event selected
  useEffect(() => {
    if (subTab === 'stats' && selectedEventId) loadStats(selectedEventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab, selectedEventId]);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  const conversionRate = stats && stats.totalClicks > 0
    ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(1)
    : '0.0';

  const inputCls =
    'w-full bg-[#0c2424] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#9AE600] disabled:opacity-50';

  return (
    <div className="space-y-6">
      {/* Header + sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white text-lg font-semibold flex items-center gap-2">
            <Link2 className="w-5 h-5" style={{ color: accent }} />
            Referral &amp; UTM Tracking
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            {isAdmin
              ? 'Generate attributed referral links for any event and track clicks → registrations.'
              : 'Generate referral links for your events and track clicks → registrations.'}
          </p>
        </div>
        <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1 self-start">
          {[
            { key: 'generate', label: 'Generate Link', icon: Sparkles },
            { key: 'stats', label: 'View Stats', icon: BarChart3 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === key ? 'text-black' : 'text-gray-300 hover:text-white'
              }`}
              style={subTab === key ? { backgroundColor: accent } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-rose-900/40 border border-rose-500/50 rounded-xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Event selector (shared) */}
      <div>
        <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
          Event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => { setSelectedEventId(e.target.value); setResult(null); }}
          disabled={loadingEvents}
          className={inputCls}
        >
          <option value="">
            {loadingEvents ? 'Loading events…' : '— Select an event —'}
          </option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}{ev.status ? ` (${ev.status})` : ''}
            </option>
          ))}
        </select>
        {!loadingEvents && events.length === 0 && (
          <p className="text-gray-500 text-xs mt-1">No events available.</p>
        )}
      </div>

      {/* ── GENERATE TAB ── */}
      {subTab === 'generate' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                College
              </label>
              <select
                value={selectedCollege}
                onChange={(e) => { setSelectedCollege(e.target.value); loadStudents(e.target.value); }}
                className={inputCls}
              >
                <option value="">— Select a college —</option>
                {colleges.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                Student (referrer)
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={!selectedCollege || loadingStudents}
                className={inputCls}
              >
                <option value="">
                  {loadingStudents ? 'Loading students…' : '— Select a student —'}
                </option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.email ? ` · ${s.email}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedEventId || !selectedStudentId || generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-black text-sm font-bold disabled:opacity-40 transition-all"
            style={{ backgroundColor: accent }}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Referral Link
          </button>

          {result && (
            <div className="bg-[#0c2424] border border-[#9AE600]/30 rounded-xl p-4 space-y-3">
              {/* Publisher (referrer) + college + code */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                <span className="font-semibold text-white">Publisher:</span>
                <span className="text-gray-200">{result.referee?.name || '—'}</span>
                {result.referee?.college && <span>· {result.referee.college}</span>}
                {result.referee?.email && <span className="text-gray-500">· {result.referee.email}</span>}
                <span className="ml-auto px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono">
                  {result.code}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={result.link}
                  className="flex-1 bg-[#061818] border border-white/10 text-gray-200 text-xs px-3 py-2 rounded-lg font-mono"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={() => copy(result.link)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-black text-xs font-bold"
                  style={{ backgroundColor: accent }}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              {/* Live counters for this link */}
              <div className="flex items-center gap-5 pt-1 text-xs text-gray-300">
                <span className="flex items-center gap-1.5">
                  <MousePointerClick className="w-3.5 h-3.5" style={{ color: accent }} />
                  <span className="font-bold text-white">{result.clicks ?? 0}</span> Impressions
                </span>
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" style={{ color: accent }} />
                  <span className="font-bold text-white">{result.conversions ?? 0}</span> Registrations
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STATS TAB ── */}
      {subTab === 'stats' && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button
              onClick={() => loadStats(selectedEventId)}
              disabled={!selectedEventId || loadingStats}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {!selectedEventId ? (
            <p className="text-gray-500 text-sm py-6 text-center">Select an event to view referral stats.</p>
          ) : loadingStats ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-7 h-7 animate-spin" style={{ color: accent }} /></div>
          ) : stats ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatBox icon={MousePointerClick} label="Impressions" value={stats.totalClicks} accent={accent} />
                <StatBox icon={Trophy} label="Registrations" value={stats.totalConversions} accent={accent} />
                <StatBox icon={BarChart3} label="Registration Rate" value={`${conversionRate}%`} accent={accent} />
              </div>

              {/* Per-referral table */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: accent }} />
                  <h3 className="text-sm font-bold text-white">
                    Referrers ({stats.referrals?.length || 0})
                  </h3>
                </div>
                {(!stats.referrals || stats.referrals.length === 0) ? (
                  <p className="text-gray-500 text-sm p-6 text-center">No referral links generated for this event yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white/5 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          <th className="px-5 py-2.5">Referrer</th>
                          <th className="px-5 py-2.5">College</th>
                          <th className="px-5 py-2.5 text-center">Impressions</th>
                          <th className="px-5 py-2.5 text-center">Registrations</th>
                          <th className="px-5 py-2.5 text-center">Rate</th>
                          <th className="px-5 py-2.5 text-right">Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {stats.referrals.map((rf) => {
                          const rate = rf.clicks > 0 ? ((rf.conversions / rf.clicks) * 100).toFixed(0) : '0';
                          return (
                            <tr key={rf.id} className="hover:bg-white/[0.02]">
                              <td className="px-5 py-3">
                                <div className="font-semibold text-white">{rf.referrer?.name || '—'}</div>
                                <div className="text-gray-500">{rf.referrer?.email || ''}</div>
                              </td>
                              <td className="px-5 py-3 text-gray-400">{rf.referrer?.college || '—'}</td>
                              <td className="px-5 py-3 text-center text-gray-200 font-semibold">{rf.clicks}</td>
                              <td className="px-5 py-3 text-center font-semibold" style={{ color: accent }}>{rf.conversions}</td>
                              <td className="px-5 py-3 text-center text-gray-400">{rate}%</td>
                              <td className="px-5 py-3 text-right">
                                <button
                                  onClick={() => copy(rf.link)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300 hover:text-white"
                                  title="Copy link"
                                >
                                  <Copy className="w-3 h-3" /> Copy
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}22`, color: accent }}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}
