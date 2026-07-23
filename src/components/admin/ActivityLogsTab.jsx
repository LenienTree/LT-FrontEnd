import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, Search, Download, ChevronLeft, ChevronRight,
  RefreshCw, ScrollText, X,
} from 'lucide-react';
import { admin } from '../../services/api';
import { fmtDateTime, downloadCsv } from './AdminHelpers';

// Colour an action pill by intent (destructive → red, approvals → green, etc.).
const actionColor = (action = '') => {
  const a = action.toUpperCase();
  if (/(DELETE|BLOCK|REJECT)/.test(a)) return 'bg-red-900/40 text-red-400 border-red-500/40';
  if (/(APPROVE|UNBLOCK|CREATE|CONFIRM|ATTEND)/.test(a)) return 'bg-green-900/40 text-green-400 border-green-500/40';
  if (/(UPDATE|TOGGLE|REORDER|SUBMIT|PAYMENT)/.test(a)) return 'bg-blue-900/40 text-blue-400 border-blue-500/40';
  if (/(REQUEST|REGISTER)/.test(a)) return 'bg-purple-900/40 text-purple-400 border-purple-500/40';
  return 'bg-gray-700/60 text-gray-300 border-gray-500/40';
};

const EMPTY_FILTERS = { action: '', entity: '', search: '', startDate: '', endDate: '' };

const ActivityLogsTab = ({ showToast }) => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [available, setAvailable] = useState({ actions: [], entities: [] });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const debounceRef = useRef(null);
  // Stable ref to showToast so fetchLogs doesn't change identity every parent render.
  const toastRef = useRef(showToast);
  useEffect(() => { toastRef.current = showToast; });

  const fetchLogs = useCallback(async (pageArg, filtersArg) => {
    setLoading(true);
    try {
      const res = await admin.getAuditLogs({ page: pageArg, limit: 20, ...filtersArg });
      setLogs(res?.data || []);
      setMeta(res?.meta || null);
      if (res?.filters) setAvailable(res.filters);
    } catch (e) {
      toastRef.current?.(e.message || 'Failed to load activity logs', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce all filter/page changes into a single fetch.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchLogs(page, filters), 300);
    return () => clearTimeout(debounceRef.current);
  }, [page, filters, fetchLogs]);

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Pull every matching row (ignore pagination) for the export.
      const res = await admin.getAuditLogs({ page: 1, limit: 100000, ...filters });
      const rows = (res?.data || []).map((l) => [
        fmtDateTime(l.createdAt),
        l.user?.name || '',
        l.user?.email || '(system)',
        l.action,
        l.entity,
        l.entityId || '',
        l.ipAddress || '',
        l.userAgent || '',
      ]);
      downloadCsv(
        `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Time', 'Actor', 'Actor Email', 'Action', 'Entity', 'Target ID', 'IP', 'User Agent'],
        rows,
      );
      toastRef.current?.(`Exported ${rows.length} log${rows.length === 1 ? '' : 's'}.`);
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
        <div className="flex items-center gap-3">
          <h2 className="text-white text-lg font-semibold flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-[#00ff88]" /> Activity Logs
          </h2>
          {meta?.total != null && (
            <span className="bg-[#00ff88]/20 text-[#00ff88] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {meta.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="flex items-center gap-1.5 bg-[#061818]/60 border border-[#1a4d4d] hover:border-[#00ff88]/50 text-gray-300 hover:text-[#00ff88] text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
          <button
            onClick={() => fetchLogs(page, filters)}
            className="text-gray-400 hover:text-[#00ff88] transition-colors p-2 rounded-lg hover:bg-[#1a4d4d]"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search actor name/email or target ID"
            className="w-full bg-[#061818] border border-[#1a4d4d] rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50"
          />
        </div>
        <select
          value={filters.action}
          onChange={(e) => setFilter('action', e.target.value)}
          className="bg-[#061818] border border-[#1a4d4d] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
        >
          <option value="">All actions</option>
          {available.actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={filters.entity}
          onChange={(e) => setFilter('entity', e.target.value)}
          className="bg-[#061818] border border-[#1a4d4d] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
        >
          <option value="">All entities</option>
          {available.entities.map((en) => <option key={en} value={en}>{en}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilter('startDate', e.target.value)}
            className="w-full bg-[#061818] border border-[#1a4d4d] rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
            title="From date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilter('endDate', e.target.value)}
            className="w-full bg-[#061818] border border-[#1a4d4d] rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
            title="To date"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => { setPage(1); setFilters(EMPTY_FILTERS); }}
            className="lg:col-span-5 justify-self-start flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-xs transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>
      ) : logs.length === 0 ? (
        <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-12 text-center">
          <ScrollText className="w-12 h-12 text-[#00ff88] mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">No activity found for these filters.</p>
        </div>
      ) : (
        <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-[#1a4d4d]">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Time</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-[#1a4d4d]/50 hover:bg-[#061818]/40">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
                    <td className="px-4 py-3">
                      {l.user ? (
                        <div>
                          <div className="text-white">{l.user.name || '—'}</div>
                          <div className="text-gray-500 text-xs">{l.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${actionColor(l.action)}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-300">{l.entity}</div>
                      {l.entityId && <div className="text-gray-600 text-xs font-mono truncate max-w-[220px]" title={l.entityId}>{l.entityId}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">{l.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1a4d4d]">
            <span className="text-gray-500 text-xs">Page {meta?.page || page} of {totalPages}</span>
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
    </div>
  );
};

export default ActivityLogsTab;
