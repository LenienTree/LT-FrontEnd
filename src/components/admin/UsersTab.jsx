import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, SlidersHorizontal, X, Download, ChevronDown, ChevronLeft, ChevronRight,
  Check, Loader2, Eye, RefreshCw, Users,
} from 'lucide-react';
import { admin } from '../../services/api';
import { fmtNum, fmtDate, downloadCsv } from './AdminHelpers';
import { Badge } from './Badges';

// "All Users" tab: every filter option — and its count — comes live from the
// DB via GET /api/admin/users/filters, so nothing here is hardcoded to today's
// data. Colleges are the grouped names from the backend normalisation layer;
// the raw spellings users typed are untouched and shown in the tooltips.

const NONE = '__none';

const EMPTY_FILTERS = {
  search: '', college: [], currentRole: [], graduationYear: [], interest: [], domain: [],
  internship: '', auth: [], phone: '', registrations: '', eventId: '', eventStatus: '',
  organizer: '', role: '', status: '', joinedFrom: '', joinedTo: '',
};

const AUTH_LABELS = { google: 'Google only', password: 'Password only', both: 'Google + password', none: 'No sign-in method' };
const INTERNSHIP_LABELS = { yes: 'Interested', no: 'Not interested', unset: 'Not answered' };
const REG_LABELS = { '0': 'Never registered', '1+': '1 or more', '2+': '2 or more', '3+': '3 or more', '5+': '5 or more' };
const EVENT_STATUS_LABELS = { APPROVED: 'Approved', ATTENDED: 'Attended', PENDING: 'Pending', PAYMENT_PENDING: 'Payment pending', REJECTED: 'Rejected' };
const SORT_LABELS = { newest: 'Newest first', oldest: 'Oldest first', name: 'Name A–Z', registrations: 'Most registrations' };
const PAGE_SIZES = [10, 25, 50, 100];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const labelOrNotSet = (v, fmt = (x) => x) => (v === NONE ? 'Not set' : fmt(v));
const authOf = (u) => (u.googleId && u.hasPassword ? 'both' : u.googleId ? 'google' : u.hasPassword ? 'password' : 'none');

const fieldLabel = 'block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1';
const fieldBox = (active) =>
  `w-full bg-[#061818] border ${active ? 'border-[#00ff88]/60 text-white' : 'border-[#1a4d4d] text-gray-400'} rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88] hover:border-[#00ff88]/50 transition-colors`;

// ── Multi-select dropdown with search and live counts ─────────────────────────
const MultiSelect = ({ label, options, selected, onChange, searchable = false }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const needle = q.trim().toLowerCase();
  const visible = needle
    ? options.filter((o) => o.label.toLowerCase().includes(needle) || (o.search || '').includes(needle))
    : options;
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  const first = options.find((o) => o.value === selected[0]);
  const summary = selected.length === 0 ? 'Any' : selected.length === 1 ? (first?.short || first?.label || selected[0]) : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <span className={fieldLabel}>{label}</span>
      <button type="button" onClick={() => setOpen((o) => !o)} className={`${fieldBox(selected.length > 0)} flex items-center justify-between gap-2`}>
        <span className="truncate">{summary}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[17rem] bg-[#0a2323] border border-[#1a4d4d] rounded-xl shadow-2xl">
          {searchable && (
            <div className="p-2 border-b border-[#1a4d4d]">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full bg-[#061818] border border-[#1a4d4d] rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]"
              />
            </div>
          )}
          <div className="max-h-72 overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-500">No matches</p>
            ) : visible.map((o) => {
              const on = selected.includes(o.value);
              return (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => toggle(o.value)}
                  title={o.title}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-[#1a4d4d]/50 transition-colors"
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${on ? 'bg-[#00ff88] border-[#00ff88]' : 'border-gray-500'}`}>
                    {on && <Check className="w-3 h-3 text-[#04110f]" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-gray-200">{o.label}</span>
                    {o.hint && <span className="block text-[11px] text-gray-500 truncate">{o.hint}</span>}
                  </span>
                  <span className="text-xs text-gray-500 tabular-nums">{fmtNum(o.count)}</span>
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-[#1a4d4d] flex justify-end">
              <button type="button" onClick={() => onChange([])} className="text-xs text-gray-400 hover:text-white">Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SingleSelect = ({ label, value, onChange, options, anyLabel = 'Any' }) => (
  <label className="block">
    <span className={fieldLabel}>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldBox(Boolean(value))}>
      <option value="" className="bg-[#061818]">{anyLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#061818]">
          {o.label}{o.count != null ? ` (${fmtNum(o.count)})` : ''}
        </option>
      ))}
    </select>
  </label>
);

// ── Tab ───────────────────────────────────────────────────────────────────────
const UsersTab = ({ showToast, onViewUser, onToggleBlock, refreshKey = 0 }) => {
  const [options, setOptions] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [result, setResult] = useState({ data: [], meta: null, totalAll: null });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [exporting, setExporting] = useState(false);

  const toastRef = useRef(showToast);
  useEffect(() => { toastRef.current = showToast; }, [showToast]);
  const requestId = useRef(0);

  const loadOptions = useCallback(async (fresh = false) => {
    setLoadingOptions(true);
    try {
      setOptions(await admin.getUserFilters(fresh));
    } catch (e) {
      toastRef.current?.(e.message || 'Failed to load filter options', 'error');
    } finally {
      setLoadingOptions(false);
    }
  }, []);
  useEffect(() => { loadOptions(); }, [loadOptions]);

  // Any filter change sends you back to page 1 (batched with the change itself).
  const updateFilters = useCallback((patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  // Search as you type, debounced.
  const filtersRef = useRef(filters);
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchInput.trim();
      if (filtersRef.current.search !== q) updateFilters({ search: q });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, updateFilters]);

  const params = useMemo(() => ({ ...filters, sort }), [filters, sort]);

  const loadUsers = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await admin.listUsers({ ...params, page, limit: pageSize });
      if (id !== requestId.current) return; // superseded by a newer request
      setResult({ data: res?.data ?? [], meta: res?.meta ?? null, totalAll: res?.totalAll ?? null });
    } catch (e) {
      if (id === requestId.current) toastRef.current?.(e.message || 'Failed to load users', 'error');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [params, page, pageSize]);
  useEffect(() => { loadUsers(); }, [loadUsers, refreshKey]);

  // ── option lists (all from the DB) ──
  const opt = useMemo(() => {
    if (!options) return null;
    return {
      college: [
        ...options.colleges.map((c) => ({
          value: c.id,
          label: c.name,
          short: c.acronym || c.name,
          count: c.count,
          hint: c.variantCount > 1 ? `${c.variantCount} spellings grouped` : null,
          title: c.variants.map((v) => `${v.raw} (${v.count})`).join('\n') + (c.variantCount > c.variants.length ? `\n…and ${c.variantCount - c.variants.length} more` : ''),
          search: c.variants.map((v) => v.raw.toLowerCase()).join(' | '),
        })),
        { value: NONE, label: 'No college on record', count: options.collegeCoverage.withoutCollege },
      ],
      currentRole: options.currentRoles.map((r) => ({ value: r.value, label: labelOrNotSet(r.value, cap), count: r.count })),
      graduationYear: options.graduationYears.map((y) => ({ value: y.value, label: labelOrNotSet(y.value), count: y.count })),
      interest: options.interests.map((i) => ({ value: i.value, label: i.value, count: i.count })),
      domain: options.domains.map((d) => ({ value: d.value, label: d.value, count: d.count })),
      auth: Object.entries(AUTH_LABELS).map(([value, label]) => ({ value, label, count: options.auth[value] })),
      internship: Object.entries(INTERNSHIP_LABELS).map(([value, label]) => ({ value, label, count: options.internship[value] })),
      registrations: Object.entries(REG_LABELS).map(([value, label]) => ({ value, label, count: options.registrations[value] })),
      events: options.events.map((e) => ({ value: e.id, label: e.title, count: e.registrations })),
      phone: [{ value: 'yes', label: 'Has phone', count: options.phone.yes }, { value: 'no', label: 'No phone', count: options.phone.no }],
      organizer: [{ value: 'yes', label: 'Organizers', count: options.organizer.yes }, { value: 'no', label: 'Not organizers', count: options.organizer.no }],
      role: [{ value: 'USER', label: 'Regular users', count: options.roles.USER }, { value: 'ADMIN', label: 'Admins', count: options.roles.ADMIN }],
      status: [{ value: 'ACTIVE', label: 'Active', count: options.status.ACTIVE }, { value: 'BLOCKED', label: 'Blocked', count: options.status.BLOCKED }],
    };
  }, [options]);

  // ── active filter chips ──
  const chips = useMemo(() => {
    const out = [];
    const nameOf = (list, v) => list?.find((o) => o.value === v)?.label ?? v;
    const add = (key, value, text) => out.push({ key, value, text });
    if (filters.search) add('search', null, `Search: “${filters.search}”`);
    filters.college.forEach((v) => add('college', v, nameOf(opt?.college, v)));
    filters.currentRole.forEach((v) => add('currentRole', v, `Role: ${nameOf(opt?.currentRole, v)}`));
    filters.graduationYear.forEach((v) => add('graduationYear', v, `Grad year: ${nameOf(opt?.graduationYear, v)}`));
    filters.interest.forEach((v) => add('interest', v, `Interest: ${v}`));
    filters.domain.forEach((v) => add('domain', v, `Domain: ${v}`));
    filters.auth.forEach((v) => add('auth', v, AUTH_LABELS[v]));
    if (filters.internship) add('internship', null, `Internship: ${INTERNSHIP_LABELS[filters.internship]}`);
    if (filters.phone) add('phone', null, filters.phone === 'yes' ? 'Has phone' : 'No phone');
    if (filters.registrations) add('registrations', null, `Registrations: ${REG_LABELS[filters.registrations]}`);
    if (filters.eventId) {
      add('eventId', null, `Registered for: ${nameOf(opt?.events, filters.eventId)}${filters.eventStatus ? ` (${EVENT_STATUS_LABELS[filters.eventStatus]})` : ''}`);
    }
    if (filters.organizer) add('organizer', null, filters.organizer === 'yes' ? 'Organizers' : 'Not organizers');
    if (filters.role) add('role', null, filters.role === 'ADMIN' ? 'Admins' : 'Regular users');
    if (filters.status) add('status', null, filters.status === 'BLOCKED' ? 'Blocked' : 'Active');
    if (filters.joinedFrom || filters.joinedTo) add('joined', null, `Joined ${filters.joinedFrom || '…'} → ${filters.joinedTo || 'today'}`);
    return out;
  }, [filters, opt]);

  const removeChip = (c) => {
    if (c.key === 'search') { setSearchInput(''); updateFilters({ search: '' }); }
    else if (c.key === 'joined') updateFilters({ joinedFrom: '', joinedTo: '' });
    else if (c.key === 'eventId') updateFilters({ eventId: '', eventStatus: '' });
    else if (Array.isArray(filters[c.key])) updateFilters({ [c.key]: filters[c.key].filter((v) => v !== c.value) });
    else updateFilters({ [c.key]: '' });
  };

  const clearAll = () => {
    setSearchInput('');
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const refresh = () => { loadOptions(true); loadUsers(); };

  const handleToggleBlock = async (u) => {
    await onToggleBlock(u); // parent toasts and bumps refreshKey, which reloads this list
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await admin.listUsers({ ...params, all: 'true' });
      const users = res?.data ?? [];
      const headers = [
        'Name', 'Email', 'Phone', 'College (grouped)', 'College (as entered)', 'College source',
        'Current role', 'Graduation year', 'Interests', 'Internship interest', 'Internship domains',
        'Sign-in method', 'Registrations', 'Organizer', 'Role', 'Status', 'Joined',
      ];
      const rows = users.map((u) => [
        u.name || '', u.email || '', u.phone || '',
        u.effectiveCollege?.name || '', u.effectiveCollege?.raw || '',
        u.effectiveCollege ? (u.effectiveCollege.source === 'profile' ? 'Profile' : 'Registration form') : '',
        u.currentRole || '', u.graduationYear ?? '', (u.interests || []).join('; '),
        u.internshipInterest == null ? '' : u.internshipInterest ? 'Yes' : 'No',
        (u.internshipDomains || []).join('; '),
        AUTH_LABELS[authOf(u)], u._count?.registrations ?? 0,
        u.isOrganizer ? 'Yes' : 'No', u.role, u.status, fmtDate(u.createdAt),
      ]);
      downloadCsv(`users-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      toastRef.current?.(`Exported ${fmtNum(rows.length)} user${rows.length === 1 ? '' : 's'}.`);
    } catch (e) {
      toastRef.current?.(e.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const { data: users, meta, totalAll } = result;
  const total = meta?.total ?? 0;
  const from = total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = total === 0 ? 0 : Math.min(meta.page * meta.limit, total);
  const filtered = chips.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-[#00ff88]" /> All Users
          {totalAll != null && (
            <span className="bg-[#00ff88]/20 text-[#00ff88] text-xs font-bold px-2.5 py-0.5 rounded-full">{fmtNum(totalAll)}</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || loading || total === 0}
            className="flex items-center gap-1.5 bg-[#061818]/60 border border-[#1a4d4d] hover:border-[#00ff88]/50 text-gray-300 hover:text-[#00ff88] text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export {filtered ? 'filtered' : 'all'} ({fmtNum(total)})
          </button>
          <button
            onClick={refresh}
            className="text-gray-400 hover:text-[#00ff88] transition-colors p-2 rounded-lg hover:bg-[#1a4d4d]"
            title="Refresh users and filter counts"
          >
            <RefreshCw className={`w-4 h-4 ${loading || loadingOptions ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-2.5 pl-9 pr-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all flex-shrink-0 ${showFilters ? 'bg-[#00ff88]/10 border-[#00ff88]/60 text-[#00ff88]' : 'border-[#1a4d4d] text-gray-300 hover:text-white'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters{chips.length ? ` (${chips.length})` : ''}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-4 mb-3">
          {!opt ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading filter options…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <MultiSelect label="College" options={opt.college} selected={filters.college} onChange={(v) => updateFilters({ college: v })} searchable />
                </div>
                <MultiSelect label="Current role" options={opt.currentRole} selected={filters.currentRole} onChange={(v) => updateFilters({ currentRole: v })} />
                <MultiSelect label="Graduation year" options={opt.graduationYear} selected={filters.graduationYear} onChange={(v) => updateFilters({ graduationYear: v })} />
                <MultiSelect label="Interests" options={opt.interest} selected={filters.interest} onChange={(v) => updateFilters({ interest: v })} />
                <MultiSelect label="Internship domain" options={opt.domain} selected={filters.domain} onChange={(v) => updateFilters({ domain: v })} searchable />
                <SingleSelect label="Internship interest" value={filters.internship} onChange={(v) => updateFilters({ internship: v })} options={opt.internship} />
                <MultiSelect label="Sign-in method" options={opt.auth} selected={filters.auth} onChange={(v) => updateFilters({ auth: v })} />
                <SingleSelect label="Event registrations" value={filters.registrations} onChange={(v) => updateFilters({ registrations: v })} options={opt.registrations} />
                <div className="sm:col-span-2 grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <SingleSelect
                      label="Registered for event"
                      value={filters.eventId}
                      onChange={(v) => updateFilters({ eventId: v, ...(v ? {} : { eventStatus: '' }) })}
                      options={opt.events}
                      anyLabel="Any event"
                    />
                  </div>
                  <SingleSelect
                    label="…with status"
                    value={filters.eventStatus}
                    onChange={(v) => updateFilters({ eventStatus: v })}
                    options={Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                    anyLabel={filters.eventId ? 'Any status' : 'Pick an event'}
                  />
                </div>
                <SingleSelect label="Phone number" value={filters.phone} onChange={(v) => updateFilters({ phone: v })} options={opt.phone} />
                <SingleSelect label="Organizer" value={filters.organizer} onChange={(v) => updateFilters({ organizer: v })} options={opt.organizer} />
                <SingleSelect label="Account role" value={filters.role} onChange={(v) => updateFilters({ role: v })} options={opt.role} />
                <SingleSelect label="Account status" value={filters.status} onChange={(v) => updateFilters({ status: v })} options={opt.status} />
                <label className="block">
                  <span className={fieldLabel}>Joined from</span>
                  <input type="date" value={filters.joinedFrom} max={filters.joinedTo || undefined} onChange={(e) => updateFilters({ joinedFrom: e.target.value })} className={`${fieldBox(Boolean(filters.joinedFrom))} [color-scheme:dark]`} />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Joined to</span>
                  <input type="date" value={filters.joinedTo} min={filters.joinedFrom || undefined} onChange={(e) => updateFilters({ joinedTo: e.target.value })} className={`${fieldBox(Boolean(filters.joinedTo))} [color-scheme:dark]`} />
                </label>
                <SingleSelect
                  label="Sort by"
                  value={sort}
                  onChange={(v) => { setSort(v || 'newest'); setPage(1); }}
                  options={Object.entries(SORT_LABELS).filter(([v]) => v !== 'newest').map(([value, label]) => ({ value, label }))}
                  anyLabel={SORT_LABELS.newest}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
                College known for {fmtNum(options.collegeCoverage.withCollege)} of {fmtNum(options.totalUsers)} users
                ({fmtNum(options.collegeCoverage.fromProfile)} from profiles, {fmtNum(options.collegeCoverage.fromRegistration)} from their latest registration form).
                Different spellings of the same college are grouped automatically — the entries users typed are kept unchanged; hover a college to see them.
              </p>
            </>
          )}
        </div>
      )}

      {/* Active filters */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {chips.map((c) => (
            <span key={`${c.key}:${c.value ?? ''}`} className="inline-flex items-center gap-1.5 bg-[#00ff88]/10 border border-[#00ff88]/40 text-[#00ff88] text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full max-w-full">
              <span className="truncate">{c.text}</span>
              <button onClick={() => removeChip(c)} className="hover:text-white p-0.5 rounded-full" aria-label={`Remove ${c.text}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-white underline underline-offset-2">Clear all</button>
        </div>
      )}

      {/* Result summary */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <p className="text-gray-400">
          {loading && !meta ? 'Loading…' : (
            <>
              <span className="text-white font-semibold">{fmtNum(total)}</span> user{total === 1 ? '' : 's'}
              {filtered && totalAll != null && <> match · filtered from {fmtNum(totalAll)}</>}
            </>
          )}
        </p>
        {loading && meta && <Loader2 className="w-4 h-4 text-[#00ff88] animate-spin" />}
      </div>

      {!loading && users.length === 0 ? (
        <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl py-12 text-center">
          <p className="text-gray-400">No users match these filters.</p>
          {filtered && <button onClick={clearAll} className="mt-2 text-sm text-[#00ff88] hover:underline">Clear all filters</button>}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className={`hidden md:block bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a4d4d] bg-[#061818]">
                  <th className="text-left text-gray-400 font-medium px-4 py-3">User</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3">College</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3">Role</th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3" title="Event registrations">Regs</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3">Sign-in</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3">Joined</th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#1a4d4d] last:border-0 hover:bg-[#1a4d4d]/30 transition-colors">
                    <td className="px-4 py-3 max-w-[16rem]">
                      <p className="text-white font-medium truncate">{u.name || '—'}</p>
                      <p className="text-gray-500 text-xs truncate">{u.email}</p>
                      {u.phone && <p className="text-gray-600 text-xs">{u.phone}</p>}
                    </td>
                    <td className="px-4 py-3 max-w-[18rem]">
                      {u.effectiveCollege ? (
                        <div title={`Entered as: ${u.effectiveCollege.raw}\nFrom: ${u.effectiveCollege.source === 'profile' ? 'profile' : 'latest registration form'}`}>
                          <p className="text-gray-200 truncate">{u.effectiveCollege.name}</p>
                          {u.effectiveCollege.raw !== u.effectiveCollege.name && (
                            <p className="text-gray-500 text-xs truncate">“{u.effectiveCollege.raw}”</p>
                          )}
                        </div>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-gray-300 text-xs">{u.currentRole ? cap(u.currentRole) : '—'}</span>
                        <div className="flex gap-1">
                          {u.role === 'ADMIN' && <Badge status="ADMIN" />}
                          {u.isOrganizer && <Badge status="ORGANIZER" />}
                          {u.status === 'BLOCKED' && <Badge status="BLOCKED" />}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-200 tabular-nums">{fmtNum(u._count?.registrations ?? 0)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{AUTH_LABELS[authOf(u)]}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button onClick={() => onViewUser(u)} className="text-blue-400 hover:text-blue-300 transition-colors p-1.5 rounded-lg hover:bg-blue-900/20" title="View profile">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleBlock(u)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${u.status === 'BLOCKED'
                            ? 'bg-green-900/40 hover:bg-green-700 text-green-400 hover:text-white border border-green-500/40'
                            : 'bg-red-900/40 hover:bg-red-700 text-red-400 hover:text-white border border-red-500/40'}`}
                        >
                          {u.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className={`md:hidden space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {users.map((u) => (
              <div key={u.id} className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-4">
                <p className="text-white font-medium truncate">{u.name || u.email}</p>
                <p className="text-gray-500 text-xs truncate">{u.email}</p>
                {u.effectiveCollege && <p className="text-gray-300 text-xs mt-1.5 truncate">{u.effectiveCollege.name}</p>}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-gray-400">
                  {u.currentRole && <span>{cap(u.currentRole)}</span>}
                  <span>· {fmtNum(u._count?.registrations ?? 0)} reg{(u._count?.registrations ?? 0) === 1 ? '' : 's'}</span>
                  <span>· {fmtDate(u.createdAt)}</span>
                  {u.isOrganizer && <Badge status="ORGANIZER" />}
                  {u.status === 'BLOCKED' && <Badge status="BLOCKED" />}
                </div>
                <div className="flex gap-3 pt-2 mt-3 border-t border-[#1a4d4d]">
                  <button onClick={() => onViewUser(u)} className="flex-1 flex items-center justify-center gap-1.5 text-blue-400 text-xs py-1.5 rounded-lg hover:bg-blue-900/20 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View profile
                  </button>
                  <button
                    onClick={() => handleToggleBlock(u)}
                    className={`flex-1 flex items-center justify-center text-xs font-semibold py-1.5 rounded-lg transition-all ${u.status === 'BLOCKED'
                      ? 'bg-green-900/40 text-green-400 border border-green-500/40 hover:bg-green-700 hover:text-white'
                      : 'bg-red-900/40 text-red-400 border border-red-500/40 hover:bg-red-700 hover:text-white'}`}
                  >
                    {u.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>Showing {fmtNum(from)}–{fmtNum(to)} of {fmtNum(total)}</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="bg-[#061818] border border-[#1a4d4d] rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#00ff88]"
                >
                  {PAGE_SIZES.map((n) => <option key={n} value={n} className="bg-[#061818]">{n} / page</option>)}
                </select>
              </div>
              {meta.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Page {fmtNum(meta.page)} of {fmtNum(meta.totalPages)}</span>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.page <= 1 || loading}
                    className="p-2 bg-[#0d2f2f] border border-[#1a4d4d] rounded-xl text-gray-400 hover:text-white disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={meta.page >= meta.totalPages || loading}
                    className="p-2 bg-[#0d2f2f] border border-[#1a4d4d] rounded-xl text-gray-400 hover:text-white disabled:opacity-40 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsersTab;
