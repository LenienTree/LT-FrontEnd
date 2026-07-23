import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, Search, Download, ChevronLeft, ChevronRight, ChevronDown,
  RefreshCw, Users, Check, X, UserCheck, Trash2, CreditCard,
  Phone, GraduationCap, Mail, ExternalLink, BadgeCheck,
} from 'lucide-react';
import { admin, events as eventsApi } from '../../services/api';
import { fmtDateTime, downloadCsv } from './AdminHelpers';

// ── formData display helpers (mirrors OrganizerDashboard) ──
const displayValue = (v) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v));
const hasValue = (v) => v !== null && v !== undefined && v !== '' && typeof v !== 'object';
const RESERVED = new Set(['name', 'email', 'phone', 'college']);

const getExtraAnswers = (formData) => {
  if (!formData || typeof formData !== 'object') return [];
  return Object.entries(formData)
    .filter(([k, v]) => !RESERVED.has(String(k).toLowerCase()) && hasValue(v))
    .map(([k, v]) => [k, displayValue(v)]);
};
const getMemberFields = (member) => {
  if (!member || typeof member !== 'object') return [];
  return Object.entries(member)
    .filter(([k, v]) => String(k).toLowerCase() !== 'name' && hasValue(v))
    .map(([k, v]) => [k, displayValue(v)]);
};

const STATUS_TABS = ['ALL', 'PENDING', 'PAYMENT_PENDING', 'APPROVED', 'ATTENDED', 'REJECTED'];

const statusPill = (s) => {
  const map = {
    PENDING: 'bg-yellow-900/40 text-yellow-400 border-yellow-500/40',
    PAYMENT_PENDING: 'bg-orange-900/40 text-orange-400 border-orange-500/40',
    APPROVED: 'bg-green-900/40 text-green-400 border-green-500/40',
    ATTENDED: 'bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/40',
    REJECTED: 'bg-red-900/40 text-red-400 border-red-500/40',
  };
  return map[s] || 'bg-gray-700/60 text-gray-300 border-gray-500/40';
};
const paymentPill = (s) => {
  const map = {
    PAID: 'bg-green-900/40 text-green-400 border-green-500/40',
    UNPAID: 'bg-gray-700/60 text-gray-300 border-gray-500/40',
    REFUNDED: 'bg-amber-900/40 text-amber-400 border-amber-500/40',
  };
  return map[s] || 'bg-gray-700/60 text-gray-300 border-gray-500/40';
};

const isUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v);

const AttendeesTab = ({ showToast }) => {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');

  const [participants, setParticipants] = useState([]);
  const [meta, setMeta] = useState(null);
  const [counts, setCounts] = useState({});
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const debounceRef = useRef(null);
  // Keep a stable reference to showToast so fetch callbacks don't re-run (and
  // reload the whole event list) every time the parent Admin re-renders.
  const toastRef = useRef(showToast);
  useEffect(() => { toastRef.current = showToast; });

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  // Load event list for the picker.
  useEffect(() => {
    (async () => {
      setLoadingEvents(true);
      try {
        const res = await admin.getAllEvents({ limit: 1000 });
        setEvents(res?.data || res || []);
      } catch (e) {
        toastRef.current?.(e.message || 'Failed to load events', 'error');
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, []);

  const fetchParticipants = useCallback(async (eventId, pageArg, statusArg, searchArg) => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await eventsApi.getParticipants(eventId, {
        page: pageArg,
        limit: 20,
        status: statusArg === 'ALL' ? undefined : statusArg,
        search: searchArg || undefined,
      });
      setParticipants(res?.data || []);
      setMeta(res?.meta || null);
      setCounts(res?.counts || {});
    } catch (e) {
      toastRef.current?.(e.message || 'Failed to load attendees', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced fetch on any change.
  useEffect(() => {
    if (!selectedEventId) { setParticipants([]); setMeta(null); setCounts({}); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchParticipants(selectedEventId, page, statusFilter, search),
      300,
    );
    return () => clearTimeout(debounceRef.current);
  }, [selectedEventId, page, statusFilter, search, fetchParticipants]);

  const refresh = () => fetchParticipants(selectedEventId, page, statusFilter, search);

  // Run a mutating action, then refresh the roster.
  const runAction = async (id, fn, successMsg) => {
    setActioningId(id);
    try {
      await fn();
      toastRef.current?.(successMsg);
      await refresh();
    } catch (e) {
      toastRef.current?.(e.message || 'Action failed', 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleExport = async () => {
    if (!selectedEventId) return;
    setExporting(true);
    try {
      const res = await eventsApi.getParticipants(selectedEventId, {
        page: 1,
        limit: 100000,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: search || undefined,
      });
      const regs = res?.data || [];
      const customKeys = new Set();
      regs.forEach((r) => getExtraAnswers(r.formData).forEach(([k]) => customKeys.add(k)));
      const customCols = [...customKeys];
      const headers = [
        'Name', 'Email', 'Phone', 'College', 'Status', 'Payment', 'Registered At',
        'IEEE Member', 'IEEE Member ID', ...customCols, 'Team Members',
      ];
      const rows = regs.map((r) => {
        const answers = Object.fromEntries(getExtraAnswers(r.formData));
        const team = Array.isArray(r.formData?.teamMembers)
          ? r.formData.teamMembers.map((m, i) => {
              const fields = getMemberFields(m).map(([k, v]) => `${k}: ${v}`).join('; ');
              return `${m?.name || `Member ${i + 1}`}${fields ? ` (${fields})` : ''}`;
            }).join(' | ')
          : '';
        return [
          r.user?.name || r.formData?.name || '',
          r.user?.email || r.formData?.email || '',
          r.user?.phone || r.formData?.phone || '',
          r.user?.college || r.formData?.college || '',
          r.status,
          r.paymentStatus,
          fmtDateTime(r.registeredAt),
          r.isMember == null ? '' : (r.isMember ? 'Yes' : 'No'),
          r.ieeeMemberId || '',
          ...customCols.map((k) => answers[k] ?? ''),
          team,
        ];
      });
      const slug = (selectedEvent?.title || 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      downloadCsv(`attendees-${slug}-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      toastRef.current?.(`Exported ${rows.length} attendee${rows.length === 1 ? '' : 's'}.`);
    } catch (e) {
      toastRef.current?.(e.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = meta?.totalPages || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-[#00ff88]" /> Attendees
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={!selectedEventId || exporting || loading}
            className="flex items-center gap-1.5 bg-[#061818]/60 border border-[#1a4d4d] hover:border-[#00ff88]/50 text-gray-300 hover:text-[#00ff88] text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
          <button
            onClick={refresh}
            disabled={!selectedEventId}
            className="text-gray-400 hover:text-[#00ff88] transition-colors p-2 rounded-lg hover:bg-[#1a4d4d] disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Event picker */}
      <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-4 mb-4">
        <label className="text-gray-400 text-xs mb-2 block">Select an event</label>
        <select
          value={selectedEventId}
          onChange={(e) => { setSelectedEventId(e.target.value); setPage(1); setStatusFilter('ALL'); setSearch(''); setExpandedId(null); }}
          disabled={loadingEvents}
          className="w-full bg-[#061818] border border-[#1a4d4d] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
        >
          <option value="">{loadingEvents ? 'Loading events…' : '— Choose an event —'}</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} · {ev.status}{ev._count?.registrations != null ? ` (${ev._count.registrations})` : ''}
            </option>
          ))}
        </select>
      </div>

      {!selectedEventId ? (
        <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-[#00ff88] mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">Pick an event above to view and manage its attendees.</p>
        </div>
      ) : (
        <>
          {/* Status chips + search */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                    statusFilter === s
                      ? 'bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/50'
                      : 'bg-[#061818]/60 border-[#1a4d4d] text-gray-400 hover:text-white'
                  }`}
                >
                  {s.replace('_', ' ')}
                  <span className="ml-1.5 opacity-70">{counts[s] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="relative lg:ml-auto lg:w-72">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search name / email / phone / college"
                className="w-full bg-[#061818] border border-[#1a4d4d] rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>
          ) : participants.length === 0 ? (
            <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-12 text-center">
              <Users className="w-12 h-12 text-[#00ff88] mx-auto mb-3 opacity-50" />
              <p className="text-gray-400">No attendees match this filter.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {participants.map((r) => {
                const expanded = expandedId === r.id;
                const extra = getExtraAnswers(r.formData);
                const team = Array.isArray(r.formData?.teamMembers) ? r.formData.teamMembers : [];
                const busy = actioningId === r.id;
                const name = r.user?.name || r.formData?.name || 'Anonymous';
                return (
                  <div key={r.id} className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl overflow-hidden">
                    {/* Summary row */}
                    <button
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#061818]/40 transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{name}</div>
                        <div className="text-gray-500 text-xs truncate">{r.user?.email || r.formData?.email || '—'}</div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusPill(r.status)}`}>
                        {r.status?.replace('_', ' ')}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${paymentPill(r.paymentStatus)} hidden sm:inline`}>
                        {r.paymentStatus}
                      </span>
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 border-t border-[#1a4d4d]/60 pt-3 space-y-4">
                        {/* Detail grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                          <Detail icon={Mail} label="Email" value={r.user?.email || r.formData?.email} />
                          <Detail icon={Phone} label="Phone" value={r.user?.phone || r.formData?.phone} />
                          <Detail icon={GraduationCap} label="College" value={r.user?.college || r.formData?.college} />
                          <Detail label="Registered" value={fmtDateTime(r.registeredAt)} />
                          {r.isMember != null && <Detail icon={BadgeCheck} label="IEEE member" value={r.isMember ? 'Yes' : 'No'} />}
                          {r.ieeeMemberId && <Detail label="IEEE ID" value={r.ieeeMemberId} />}
                        </div>

                        {/* Custom form answers */}
                        {extra.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Form answers</p>
                            <div className="flex flex-wrap gap-1.5">
                              {extra.map(([k, v]) => (
                                <span key={k} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-[#061818] border border-[#1a4d4d]">
                                  <span className="text-gray-500 capitalize">{k}:</span>
                                  <span className="text-gray-200">{v}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Team members */}
                        {team.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Team members</p>
                            <div className="space-y-1.5 border-l-2 border-[#1a4d4d] pl-3">
                              {team.map((m, i) => (
                                <div key={i}>
                                  <span className="text-gray-300 text-xs font-medium">Member {i + 1}: {m?.name || 'Unnamed'}</span>
                                  {getMemberFields(m).length > 0 && (
                                    <div className="mt-0.5 flex flex-wrap gap-1">
                                      {getMemberFields(m).map(([k, v]) => (
                                        <span key={k} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#061818] border border-[#1a4d4d]">
                                          <span className="text-gray-500 capitalize">{k}:</span>
                                          <span className="text-gray-300">{v}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Payment proof */}
                        {r.paymentProof && (
                          <div className="text-sm">
                            {isUrl(r.paymentProof) ? (
                              <a href={r.paymentProof} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[#00ff88] hover:underline">
                                <ExternalLink className="w-3.5 h-3.5" /> View payment proof
                              </a>
                            ) : (
                              <span className="text-gray-400">Payment ref: <span className="font-mono text-gray-300">{r.paymentProof}</span></span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(r.status === 'PENDING' || r.status === 'PAYMENT_PENDING') && (
                            <ActionBtn busy={busy} onClick={() => runAction(r.id, () => eventsApi.approveRegistration(selectedEventId, r.id), 'Registration approved')}
                              icon={Check} label="Approve" className="text-green-400 hover:bg-green-900/20 border-green-500/40" />
                          )}
                          {r.status !== 'REJECTED' && (
                            <ActionBtn busy={busy} onClick={() => runAction(r.id, () => eventsApi.rejectRegistration(selectedEventId, r.id), 'Registration rejected')}
                              icon={X} label="Reject" className="text-red-400 hover:bg-red-900/20 border-red-500/40" />
                          )}
                          {r.status !== 'ATTENDED' && (
                            <ActionBtn busy={busy} onClick={() => runAction(r.id, () => eventsApi.markAttendance(selectedEventId, r.id), 'Marked as attended')}
                              icon={UserCheck} label="Mark attended" className="text-[#00ff88] hover:bg-[#00ff88]/10 border-[#00ff88]/40" />
                          )}
                          {r.paymentStatus === 'PAID' ? (
                            <ActionBtn busy={busy} onClick={() => runAction(r.id, () => eventsApi.setPaymentStatus(selectedEventId, r.id, 'UNPAID'), 'Marked as unpaid')}
                              icon={CreditCard} label="Mark unpaid" className="text-gray-300 hover:bg-[#1a4d4d] border-[#1a4d4d]" />
                          ) : (
                            <ActionBtn busy={busy} onClick={() => runAction(r.id, () => eventsApi.setPaymentStatus(selectedEventId, r.id, 'PAID'), 'Marked as paid')}
                              icon={CreditCard} label="Mark paid" className="text-green-400 hover:bg-green-900/20 border-green-500/40" />
                          )}
                          <ActionBtn busy={busy}
                            onClick={() => {
                              if (!window.confirm(`Permanently delete ${name}'s registration? This cannot be undone.`)) return;
                              runAction(r.id, () => eventsApi.deleteRegistration(selectedEventId, r.id), 'Registration deleted');
                            }}
                            icon={Trash2} label="Delete" className="text-red-400 hover:bg-red-900/30 border-red-500/40 ml-auto" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              <div className="flex items-center justify-between px-1 pt-2">
                <span className="text-gray-500 text-xs">Page {meta?.page || page} of {totalPages} · {meta?.total ?? 0} total</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={(meta?.page || page) <= 1}
                    className="p-1.5 rounded-lg border border-[#1a4d4d] text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={(meta?.page || page) >= totalPages}
                    className="p-1.5 rounded-lg border border-[#1a4d4d] text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Detail = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    {Icon && <Icon className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />}
    <div className="min-w-0">
      <span className="text-gray-500 text-xs">{label}: </span>
      <span className="text-gray-200 break-words">{value || '—'}</span>
    </div>
  </div>
);

const ActionBtn = ({ busy, onClick, icon: Icon, label, className = '' }) => (
  <button
    onClick={onClick}
    disabled={busy}
    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-[#061818]/60 transition-all disabled:opacity-50 ${className}`}
  >
    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
    {label}
  </button>
);

export default AttendeesTab;
