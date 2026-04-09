import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, CalendarDays, TrendingUp, Eye, Clock, BarChart2,
  CheckCircle, XCircle, Shield, Search, Bell, LogOut,
  ChevronLeft, ChevronRight, RefreshCw, Loader2,
  UserCheck, AlertTriangle, Pencil, Trash2, SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { admin } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtNum = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
      : String(n ?? 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(',', '') : '—';

const Badge = ({ status }) => {
  const map = {
    PENDING_APPROVAL: 'bg-yellow-900/40 text-yellow-400 border-yellow-500/40',
    APPROVED: 'bg-green-900/40 text-green-400 border-green-500/40',
    REJECTED: 'bg-red-900/40 text-red-400 border-red-500/40',
    DRAFT: 'bg-gray-700/60 text-gray-300 border-gray-500/40',
    ACTIVE: 'bg-green-900/40 text-green-400 border-green-500/40',
    BLOCKED: 'bg-red-900/40 text-red-400 border-red-500/40',
    ORGANIZER_REQUEST: 'bg-purple-900/40 text-purple-400 border-purple-500/40',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${map[status] ?? 'bg-gray-700 text-gray-300 border-gray-500'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

// Role badge matching mockup — USER=amber outline, ADMIN=red/pink
const RoleBadge = ({ role, isOrganizer }) => {
  if (role === 'ADMIN') return (
    <span className="text-xs font-semibold px-3 py-0.5 rounded-full border border-red-500 text-red-400 bg-red-900/20">
      Admin
    </span>
  );
  if (isOrganizer) return (
    <span className="text-xs font-semibold px-3 py-0.5 rounded-full border border-purple-500 text-purple-400 bg-purple-900/20">
      Organizer
    </span>
  );
  return (
    <span className="text-xs font-semibold px-3 py-0.5 rounded-full border border-amber-500 text-amber-400 bg-amber-900/20">
      User
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, change, icon: Icon, iconBg }) => (
  <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5 flex items-center justify-between hover:border-[#00ff88]/50 transition-all duration-300 group">
    <div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-3xl font-bold tracking-tight">{fmtNum(value)}</p>
      {change != null && (
        <p className="text-[#00ff88] text-xs mt-1 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {change}% from last month
        </p>
      )}
    </div>
    <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({ title, count, onRefresh }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <h2 className="text-white text-lg font-semibold">{title}</h2>
      {count != null && (
        <span className="bg-[#00ff88]/20 text-[#00ff88] text-xs font-bold px-2.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
    {onRefresh && (
      <button onClick={onRefresh} className="text-gray-400 hover:text-[#00ff88] transition-colors p-1 rounded-lg hover:bg-[#1a4d4d]">
        <RefreshCw className="w-4 h-4" />
      </button>
    )}
  </div>
);

// ─── Admin Component ──────────────────────────────────────────────────────────

const Admin = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard data
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loadingDash, setLoadingDash] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Pending events
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [rejectModal, setRejectModal] = useState(null); // { id, title }
  const [rejectReason, setRejectReason] = useState('');

  // Users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userMeta, setUserMeta] = useState(null);

  // Organizer requests (from audit logs)
  const [orgRequests, setOrgRequests] = useState([]);
  const [loadingOrg, setLoadingOrg] = useState(false);

  // Recent users (full list with search)
  const [recentUsersData, setRecentUsersData] = useState([]);
  const [loadingRecentUsers, setLoadingRecentUsers] = useState(false);
  const [recentUserSearch, setRecentUserSearch] = useState('');
  const [recentUserPage, setRecentUserPage] = useState(1);
  const [recentUserMeta, setRecentUserMeta] = useState(null);
  const [viewUserModal, setViewUserModal] = useState(null); // user object

  // Notifications / feedback
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch Dashboard ──

  const fetchDashboard = useCallback(async () => {
    setLoadingDash(true);
    try {
      const data = await admin.getDashboard();
      // get() unwraps { success, message, data } → data is { stats, recentEvents, recentUsers }
      setStats(data?.stats ?? null);
      setRecentEvents(data?.recentEvents ?? []);
      setRecentUsers(data?.recentUsers ?? []);
      setLastUpdated(new Date());
    } catch (e) {
      showToast('Failed to load dashboard stats', 'error');
    } finally {
      setLoadingDash(false);
    }
  }, []);

  // ── Fetch Pending Events ──

  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const data = await admin.getPendingEvents();
      // buildPaginatedResult returns { data: [...], meta } → get() returns that directly
      setPendingEvents(data?.data ?? []);
    } catch {
      showToast('Failed to load pending events', 'error');
    } finally {
      setLoadingPending(false);
    }
  }, []);

  // ── Fetch Users ──

  const fetchUsers = useCallback(async (page = 1, search = '') => {
    setLoadingUsers(true);
    try {
      const data = await admin.getUsers(page, 10, search);
      // buildPaginatedResult returns { data: [...], meta } → get() returns that directly
      setUsers(data?.data ?? []);
      setUserMeta(data?.meta ?? null);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // ── Fetch Organizer Requests ──

  const fetchOrgRequests = useCallback(async () => {
    setLoadingOrg(true);
    try {
      // Dedicated endpoint returns a plain array (not paginated)
      const data = await admin.getOrganizerRequests();
      setOrgRequests(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load organizer requests', 'error');
    } finally {
      setLoadingOrg(false);
    }
  }, []);

  // ── Fetch Recent Users (full paginated list) ──

  const fetchRecentUsers = useCallback(async (page = 1, search = '') => {
    setLoadingRecentUsers(true);
    try {
      const data = await admin.getUsers(page, 15, search);
      setRecentUsersData(data?.data ?? []);
      setRecentUserMeta(data?.meta ?? null);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoadingRecentUsers(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => {
    if (activeTab === 'events') fetchPending();
    if (activeTab === 'users') fetchUsers(1);
    if (activeTab === 'organizer') fetchOrgRequests();
    if (activeTab === 'recentUsers') fetchRecentUsers(1);
  }, [activeTab]);

  // ── Actions ──

  const handleApproveEvent = async (id) => {
    try {
      await admin.approveEvent(id);
      showToast('Event approved!');
      fetchPending();
      fetchDashboard();
    } catch (e) {
      showToast(e.message || 'Failed to approve event', 'error');
    }
  };

  const handleRejectEvent = async () => {
    if (!rejectModal) return;
    try {
      await admin.rejectEvent(rejectModal.id, rejectReason || 'No reason provided');
      showToast('Event rejected.');
      setRejectModal(null);
      setRejectReason('');
      fetchPending();
    } catch (e) {
      showToast(e.message || 'Failed to reject event', 'error');
    }
  };

  const handleToggleBlock = async (u) => {
    try {
      if (u.status === 'BLOCKED') {
        await admin.unblockUser(u.id);
        showToast(`${u.name || u.email} unblocked.`);
      } else {
        await admin.blockUser(u.id);
        showToast(`${u.name || u.email} blocked.`);
      }
      fetchUsers(userPage, userSearch);
    } catch (e) {
      showToast(e.message || 'Action failed', 'error');
    }
  };

  const handleApproveOrganizer = async (userId) => {
    try {
      await admin.approveOrganizer(userId);
      showToast('Organizer approved!');
      fetchOrgRequests();
      fetchDashboard();
    } catch (e) {
      showToast(e.message || 'Failed to approve organizer', 'error');
    }
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    setUserPage(1);
    fetchUsers(1, userSearch);
  };

  // ── Nav Items ──
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { key: 'events', label: 'Pending Events', icon: CalendarDays },
    { key: 'organizer', label: 'Organizer Requests', icon: UserCheck },
    { key: 'recentUsers', label: 'Recent Users', icon: Users },
    { key: 'users', label: 'All Users', icon: SlidersHorizontal },
  ];

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, change: 12, icon: Users, iconBg: 'bg-purple-600' },
    { label: 'Total Events', value: stats.totalEvents, change: 8, icon: CalendarDays, iconBg: 'bg-purple-500' },
    { label: 'Upcoming Events', value: stats.pendingEvents, change: 15, icon: TrendingUp, iconBg: 'bg-red-500' },
    { label: 'Total Impressions', value: stats.totalRegistrations, change: 29, icon: Eye, iconBg: 'bg-red-600' },
    { label: 'Pending Approval', value: stats.pendingEvents, change: null, icon: Clock, iconBg: 'bg-orange-500' },
    { label: 'Active Users', value: stats.approvedRegistrations, change: null, icon: BarChart2, iconBg: 'bg-yellow-500' },
  ] : [];

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f1f] via-[#0d2626] to-[#0a1f1f] flex">

      {/* ── Sidebar ── */}
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#061818] border-r border-[#1a4d4d] z-40
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-[#1a4d4d]">
          <div className="w-10 h-10 bg-[#00ff88] rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#0a1f1f]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Lenient Tree</p>
            <p className="text-[#00ff88] text-xs">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                ${activeTab === key
                  ? 'bg-[#00ff88] text-[#0a1f1f]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a4d4d]'}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {key === 'events' && pendingEvents.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingEvents.length}
                </span>
              )}
              {key === 'organizer' && orgRequests.length > 0 && (
                <span className="ml-auto bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {orgRequests.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-[#1a4d4d]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#1a4d4d] flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#00ff88]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{authUser?.name || 'Admin'}</p>
              <p className="text-gray-500 text-xs truncate">{authUser?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm py-2 px-3 rounded-lg hover:bg-red-900/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#061818]/80 backdrop-blur-md border-b border-[#1a4d4d] px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#1a4d4d] transition-colors"
          >
            <div className="space-y-1">
              <span className="block w-5 h-0.5 bg-current" />
              <span className="block w-5 h-0.5 bg-current" />
              <span className="block w-5 h-0.5 bg-current" />
            </div>
          </button>

          <div className="hidden lg:flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00ff88]" />
            <span className="text-white font-semibold text-sm">
              {navItems.find(n => n.key === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={fetchDashboard}
              className="text-gray-400 hover:text-[#00ff88] p-2 rounded-lg hover:bg-[#1a4d4d] transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="relative text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#1a4d4d] transition-colors">
              <Bell className="w-4 h-4" />
              {(pendingEvents.length + orgRequests.length) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-[#1a4d4d] border border-[#00ff88]/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#00ff88]" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">

          {/* Toast */}
          {toast && (
            <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl border
              ${toast.type === 'error'
                ? 'bg-red-900/80 border-red-500/50 text-red-300'
                : 'bg-green-900/80 border-green-500/50 text-green-300'}`}>
              {toast.msg}
            </div>
          )}

          {/* ── DASHBOARD TAB ── */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Overview header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#00ff88]" />
                  <h1 className="text-white text-xl font-bold">Analytics Overview</h1>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  Last Updated:&nbsp;
                  <span className="text-white font-mono">
                    {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-pulse" />
                </div>
              </div>

              {loadingDash ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-10 h-10 text-[#00ff88] animate-spin" />
                </div>
              ) : (
                <>
                  {/* Stat cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
                    {statCards.map((card) => (
                      <StatCard key={card.label} {...card} />
                    ))}
                  </div>

                  {/* Recent section */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Recent Events */}
                    <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-6">
                      <SectionHeader title="Recent Events" count={recentEvents.length} />
                      {recentEvents.length === 0 ? (
                        <p className="text-gray-500 text-sm">No events found.</p>
                      ) : (
                        <div className="space-y-3">
                          {recentEvents.map((ev) => (
                            <Link key={ev.id} to={`/event/${ev.id}`}>
                              <div className="flex items-center justify-between py-2 border-b border-[#1a4d4d] last:border-0">
                                <div>
                                  <p className="text-white text-sm font-medium">{ev.title}</p>
                                  <p className="text-gray-500 text-xs mt-0.5">{ev.category} · {ev.organizer?.name || '—'}</p>
                                </div>
                                <Badge status={ev.status} />
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Users */}
                    <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-6">
                      <SectionHeader title="Recent Sign-ups" count={recentUsers.length} />
                      {recentUsers.length === 0 ? (
                        <p className="text-gray-500 text-sm">No users found.</p>
                      ) : (
                        <div className="space-y-3">
                          {recentUsers.map((u) => (
                            <div key={u.id} className="flex items-center justify-between py-2 border-b border-[#1a4d4d] last:border-0">
                              <div>
                                <p className="text-white text-sm font-medium">{u.name || u.email}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{fmtDate(u.createdAt)}</p>
                              </div>
                              <Badge status={u.role} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── PENDING EVENTS TAB ── */}
          {activeTab === 'events' && (
            <div>
              <SectionHeader title="Pending Events" count={pendingEvents.length} onRefresh={fetchPending} />
              {loadingPending ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>
              ) : pendingEvents.length === 0 ? (
                <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-[#00ff88] mx-auto mb-3 opacity-50" />
                  <p className="text-gray-400">All caught up! No pending events.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingEvents.map((ev) => (
                    <div key={ev.id} className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5 hover:border-[#00ff88]/40 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-white font-semibold">{ev.title}</h3>
                            <Badge status={ev.status} />
                          </div>
                          <p className="text-gray-400 text-sm">{ev.category} · {ev.mode}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            By {ev.organizer?.name || '—'} · {fmtDate(ev.startDate)}
                          </p>
                          {ev.description && (
                            <p className="text-gray-400 text-xs mt-2 line-clamp-2">{ev.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApproveEvent(ev.id)}
                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: ev.id, title: ev.title })}
                            className="flex items-center gap-1.5 bg-red-900/50 hover:bg-red-700 border border-red-500/50 text-red-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reject Modal */}
              {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                  <div className="w-full max-w-md bg-[#0d2f2f] border-2 border-red-500/40 rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <h3 className="text-white font-semibold">Reject Event</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Rejecting: <span className="text-white font-medium">"{rejectModal.title}"</span>
                    </p>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection (optional)"
                      rows={3}
                      className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-3 px-4 rounded-xl focus:outline-none focus:border-red-500 transition-all resize-none text-sm"
                    />
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                        className="flex-1 py-2.5 rounded-xl border border-[#1a4d4d] text-gray-400 hover:text-white hover:border-[#00ff88] transition-all text-sm">
                        Cancel
                      </button>
                      <button onClick={handleRejectEvent}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all text-sm">
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ORGANIZER REQUESTS TAB ── */}
          {activeTab === 'organizer' && (
            <div>
              <SectionHeader title="Organizer Requests" count={orgRequests.length} onRefresh={fetchOrgRequests} />
              {loadingOrg ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>
              ) : orgRequests.length === 0 ? (
                <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-12 text-center">
                  <UserCheck className="w-12 h-12 text-[#00ff88] mx-auto mb-3 opacity-50" />
                  <p className="text-gray-400">No pending organizer requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orgRequests.map((log) => {
                    const details = log.newValue || {};
                    return (
                      <div key={log.id} className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5 hover:border-purple-500/40 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-white font-semibold">{log.user?.name || log.user?.email || 'Unknown User'}</h3>
                              <Badge status="ORGANIZER_REQUEST" />
                            </div>
                            <p className="text-gray-400 text-sm">{log.user?.email}</p>
                            {details.orgName && <p className="text-gray-300 text-sm mt-1">🏢 {details.orgName}</p>}
                            {details.orgEmail && <p className="text-gray-400 text-xs mt-0.5">✉️ {details.orgEmail}</p>}
                            {details.eventName && <p className="text-gray-400 text-xs mt-0.5">🎯 First event: {details.eventName}</p>}
                            <p className="text-gray-600 text-xs mt-2">{fmtDate(log.createdAt)}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => handleApproveOrganizer(log.userId)}
                              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2 rounded-xl transition-all"
                            >
                              <UserCheck className="w-4 h-4" />
                              Approve as Organizer
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── RECENT USERS TAB ── */}
          {activeTab === 'recentUsers' && (
            <div>
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#00ff88]" />
                  <h1 className="text-white text-xl font-bold">Recent Users</h1>
                </div>
                {/* Search bar — matches mockup */}
                <form
                  onSubmit={e => { e.preventDefault(); setRecentUserPage(1); fetchRecentUsers(1, recentUserSearch); }}
                  className="sm:ml-auto flex items-center gap-2 w-full sm:w-auto"
                >
                  <div className="relative flex-1 sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={recentUserSearch}
                      onChange={e => setRecentUserSearch(e.target.value)}
                      placeholder="Search for users"
                      className="w-full bg-[#0d2f2f] border border-[#1a4d4d] text-white placeholder-gray-500 py-2.5 pl-9 pr-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="p-2.5 bg-[#0d2f2f] border border-[#1a4d4d] rounded-xl text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88] transition-all"
                    title="Filter"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {loadingRecentUsers ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
                </div>
              ) : recentUsersData.length === 0 ? (
                <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-12 text-center">
                  <Users className="w-12 h-12 text-[#00ff88] mx-auto mb-3 opacity-40" />
                  <p className="text-gray-400">No users found.</p>
                </div>
              ) : (
                <>
                  {/* ── Desktop table (matches mockup exactly) ── */}
                  <div className="hidden md:block bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#1a4d4d]">
                            <th className="text-left text-gray-300 font-medium px-6 py-4">User</th>
                            <th className="text-left text-gray-300 font-medium px-6 py-4">Email</th>
                            <th className="text-left text-gray-300 font-medium px-6 py-4">Role</th>
                            <th className="text-left text-gray-300 font-medium px-6 py-4">Join Date</th>
                            <th className="text-center text-gray-300 font-medium px-6 py-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentUsersData.map((u) => (
                            <tr
                              key={u.id}
                              className="border-b border-[#1a4d4d]/60 last:border-0 hover:bg-[#1a4d4d]/20 transition-colors group"
                            >
                              <td className="px-6 py-4">
                                <span className="text-white font-medium">{u.name || '—'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-300">{u.email}</span>
                              </td>
                              <td className="px-6 py-4">
                                <RoleBadge role={u.role} isOrganizer={u.isOrganizer} />
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-300 font-mono text-xs">{fmtDateTime(u.createdAt)}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-3">
                                  {/* View */}
                                  <button
                                    onClick={() => setViewUserModal(u)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded-lg hover:bg-blue-900/20"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {/* Edit — navigates to user edit or opens modal */}
                                  <button
                                    onClick={() => showToast('Edit coming soon', 'success')}
                                    className="text-purple-400 hover:text-purple-300 transition-colors p-1 rounded-lg hover:bg-purple-900/20"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  {/* Delete */}
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm(`Delete ${u.name || u.email}?`)) return;
                                      try {
                                        await admin.deleteUser(u.id);
                                        showToast('User deleted.');
                                        fetchRecentUsers(recentUserPage, recentUserSearch);
                                      } catch (e) {
                                        showToast(e.message || 'Failed to delete user', 'error');
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-lg hover:bg-red-900/20"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── Mobile cards ── */}
                  <div className="md:hidden space-y-3">
                    {recentUsersData.map((u) => (
                      <div key={u.id} className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold truncate">{u.name || '—'}</p>
                            <p className="text-gray-400 text-xs truncate">{u.email}</p>
                            <p className="text-gray-600 text-xs mt-1 font-mono">{fmtDateTime(u.createdAt)}</p>
                          </div>
                          <RoleBadge role={u.role} isOrganizer={u.isOrganizer} />
                        </div>
                        <div className="flex gap-3 pt-2 border-t border-[#1a4d4d]">
                          <button onClick={() => setViewUserModal(u)}
                            className="flex-1 flex items-center justify-center gap-1.5 text-blue-400 text-xs py-1.5 rounded-lg hover:bg-blue-900/20 transition-colors">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button onClick={() => showToast('Edit coming soon')}
                            className="flex-1 flex items-center justify-center gap-1.5 text-purple-400 text-xs py-1.5 rounded-lg hover:bg-purple-900/20 transition-colors">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Delete ${u.name || u.email}?`)) return;
                              try { await admin.deleteUser(u.id); showToast('User deleted.'); fetchRecentUsers(recentUserPage, recentUserSearch); }
                              catch (e) { showToast(e.message || 'Failed', 'error'); }
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 text-red-400 text-xs py-1.5 rounded-lg hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {recentUserMeta && recentUserMeta.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-5">
                      <p className="text-gray-500 text-sm">
                        {recentUserMeta.total} users · Page {recentUserPage} of {recentUserMeta.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          disabled={recentUserPage <= 1}
                          onClick={() => { const p = recentUserPage - 1; setRecentUserPage(p); fetchRecentUsers(p, recentUserSearch); }}
                          className="p-2 bg-[#0d2f2f] border border-[#1a4d4d] rounded-xl text-gray-400 hover:text-white disabled:opacity-40 transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          disabled={recentUserPage >= recentUserMeta.totalPages}
                          onClick={() => { const p = recentUserPage + 1; setRecentUserPage(p); fetchRecentUsers(p, recentUserSearch); }}
                          className="p-2 bg-[#0d2f2f] border border-[#1a4d4d] rounded-xl text-gray-400 hover:text-white disabled:opacity-40 transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── View User Modal ── */}
              {viewUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                  <div className="w-full max-w-md bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-white font-semibold text-lg">User Profile</h3>
                      <button onClick={() => setViewUserModal(null)} className="text-gray-400 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-full bg-[#1a4d4d] flex items-center justify-center flex-shrink-0">
                        {viewUserModal.profileImage
                          ? <img src={viewUserModal.profileImage} alt="" className="w-full h-full object-cover rounded-full" />
                          : <Users className="w-7 h-7 text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{viewUserModal.name || '—'}</p>
                        <p className="text-gray-400 text-sm">{viewUserModal.email}</p>
                        <div className="mt-1"><RoleBadge role={viewUserModal.role} isOrganizer={viewUserModal.isOrganizer} /></div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <Badge status={viewUserModal.status} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Joined</span>
                        <span className="text-white font-mono text-xs">{fmtDateTime(viewUserModal.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Organizer</span>
                        <span className={viewUserModal.isOrganizer ? 'text-[#00ff88]' : 'text-gray-500'}>
                          {viewUserModal.isOrganizer ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() => { handleToggleBlock(viewUserModal); setViewUserModal(null); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                          ${viewUserModal.status === 'BLOCKED'
                            ? 'bg-green-900/40 border border-green-500/40 text-green-400 hover:bg-green-700 hover:text-white'
                            : 'bg-red-900/40 border border-red-500/40 text-red-400 hover:bg-red-700 hover:text-white'}`}
                      >
                        {viewUserModal.status === 'BLOCKED' ? 'Unblock User' : 'Block User'}
                      </button>
                      <button onClick={() => setViewUserModal(null)}
                        className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 border border-[#1a4d4d] hover:border-[#00ff88] hover:text-white transition-all">
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === 'users' && (
            <div>
              <SectionHeader title="All Users" onRefresh={() => fetchUsers(userPage, userSearch)} />

              {/* Search */}
              <form onSubmit={handleUserSearch} className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-2.5 pl-9 pr-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all text-sm"
                  />
                </div>
                <button type="submit" className="bg-[#00ff88] text-[#0a1f1f] font-bold px-5 py-2.5 rounded-xl hover:bg-[#00cc70] transition-all text-sm flex-shrink-0">
                  Search
                </button>
              </form>

              {loadingUsers ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>
              ) : users.length === 0 ? (
                <p className="text-gray-500 text-center py-12">No users found.</p>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#1a4d4d] bg-[#061818]">
                          <th className="text-left text-gray-400 font-medium px-5 py-3">User</th>
                          <th className="text-left text-gray-400 font-medium px-5 py-3">Role</th>
                          <th className="text-left text-gray-400 font-medium px-5 py-3">Status</th>
                          <th className="text-left text-gray-400 font-medium px-5 py-3">Joined</th>
                          <th className="text-right text-gray-400 font-medium px-5 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, i) => (
                          <tr key={u.id} className={`border-b border-[#1a4d4d] last:border-0 hover:bg-[#1a4d4d]/30 transition-colors`}>
                            <td className="px-5 py-3">
                              <p className="text-white font-medium">{u.name || '—'}</p>
                              <p className="text-gray-500 text-xs">{u.email}</p>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex flex-col gap-1">
                                <Badge status={u.role} />
                                {u.isOrganizer && <Badge status="ORGANIZER" />}
                              </div>
                            </td>
                            <td className="px-5 py-3"><Badge status={u.status} /></td>
                            <td className="px-5 py-3 text-gray-400">{fmtDate(u.createdAt)}</td>
                            <td className="px-5 py-3 text-right">
                              <button
                                onClick={() => handleToggleBlock(u)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all
                                  ${u.status === 'BLOCKED'
                                    ? 'bg-green-900/40 hover:bg-green-700 text-green-400 hover:text-white border border-green-500/40'
                                    : 'bg-red-900/40 hover:bg-red-700 text-red-400 hover:text-white border border-red-500/40'}`}
                              >
                                {u.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {users.map((u) => (
                      <div key={u.id} className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{u.name || u.email}</p>
                            <p className="text-gray-500 text-xs truncate">{u.email}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Badge status={u.role} />
                              <Badge status={u.status} />
                              {u.isOrganizer && <Badge status="ORGANIZER" />}
                            </div>
                            <p className="text-gray-600 text-xs mt-1">{fmtDate(u.createdAt)}</p>
                          </div>
                          <button
                            onClick={() => handleToggleBlock(u)}
                            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all
                              ${u.status === 'BLOCKED'
                                ? 'bg-green-900/40 text-green-400 border border-green-500/40'
                                : 'bg-red-900/40 text-red-400 border border-red-500/40'}`}
                          >
                            {u.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {userMeta && userMeta.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-gray-500 text-sm">
                        Page {userMeta.page} of {userMeta.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { const p = userPage - 1; setUserPage(p); fetchUsers(p, userSearch); }}
                          disabled={userPage <= 1}
                          className="p-2 bg-[#0d2f2f] border border-[#1a4d4d] rounded-xl text-gray-400 hover:text-white disabled:opacity-40 transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { const p = userPage + 1; setUserPage(p); fetchUsers(p, userSearch); }}
                          disabled={userPage >= userMeta.totalPages}
                          className="p-2 bg-[#0d2f2f] border border-[#1a4d4d] rounded-xl text-gray-400 hover:text-white disabled:opacity-40 transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Admin;
