import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, CalendarDays, TrendingUp, Eye, Clock, BarChart2,
  CheckCircle, XCircle, Shield, Search, Bell, LogOut,
  ChevronLeft, ChevronRight, RefreshCw, Loader2,
  UserCheck, AlertTriangle, Pencil, Trash2, SlidersHorizontal,
  Upload, Plus, ArrowUp, ArrowDown, Image, Settings, Home, Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { admin, homepage as homepageApi } from '../../services/api';
import { events as eventsApi } from '../../services/api';

import { fmtNum, fmtDate, fmtDateTime } from './AdminHelpers';
import { Badge, RoleBadge } from './Badges';
import StatCard from './StatCard';
import SectionHeader from './SectionHeader';
import Header from '../layout/Header';

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

  // Approve Modal & options
  const [approveModal, setApproveModal] = useState(null); // { id, title }
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // All events
  const [allEvents, setAllEvents] = useState([]);
  const [loadingAllEvents, setLoadingAllEvents] = useState(false);


  // Users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userMeta, setUserMeta] = useState(null);

  // Organizer requests (from audit logs)
  const [orgRequests, setOrgRequests] = useState([]);
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [viewOrgModal, setViewOrgModal] = useState(null);

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

  // Homepage state
  const [homepageData, setHomepageData] = useState({ banners: [], community: [], testimonials: [], sections: [] });
  const [loadingHomepage, setLoadingHomepage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingCommunity, setUploadingCommunity] = useState(false);
  const [testimonialModal, setTestimonialModal] = useState(null); // { mode: 'add'|'edit', data?: testimonialObj }
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  const [updatingSections, setUpdatingSections] = useState(false);
  const [eventsList, setEventsList] = useState([]);
  const [selectedSectionKey, setSelectedSectionKey] = useState('');
  const [updatingEventsOrder, setUpdatingEventsOrder] = useState(false);

  // Internship Survey State
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [loadingSurvey, setLoadingSurvey] = useState(false);
  const [surveySearch, setSurveySearch] = useState('');
  const [surveyPage, setSurveyPage] = useState(1);
  const [surveyMeta, setSurveyMeta] = useState(null);
  const [surveyStats, setSurveyStats] = useState(null);
  const [surveyEnabled, setSurveyEnabled] = useState(true);
  const [togglingSurvey, setTogglingSurvey] = useState(false);

  const fetchHomepageData = useCallback(async () => {
    setLoadingHomepage(true);
    try {
      const [homepageRes, eventsRes] = await Promise.all([
        homepageApi.get(),
        eventsApi.getAll({ limit: 100 })
      ]);
      setHomepageData(homepageRes || { banners: [], community: [], testimonials: [], sections: [] });
      const eventsArr = (Array.isArray(eventsRes) ? eventsRes : eventsRes?.data) || [];
      setEventsList(eventsArr);
    } catch (e) {
      showToast('Failed to load homepage configuration', 'error');
    } finally {
      setLoadingHomepage(false);
    }
  }, []);

  const handleMoveSection = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === homepageData.sections.length - 1) return;
    
    const newSections = [...homepageData.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap orders
    const tempOrder = newSections[index].order;
    newSections[index].order = newSections[targetIndex].order;
    newSections[targetIndex].order = tempOrder;
    
    // Sort
    newSections.sort((a, b) => a.order - b.order);
    setHomepageData((prev) => ({ ...prev, sections: newSections }));
    
    setUpdatingSections(true);
    try {
      const res = await admin.homepage.updateSectionsOrder(newSections.map(s => ({ id: s.id, order: s.order })));
      setHomepageData((prev) => ({ ...prev, sections: res || newSections }));
      showToast('Homepage sections order updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update section order', 'error');
      fetchHomepageData();
    } finally {
      setUpdatingSections(false);
    }
  };

  const getFilteredEventsForSection = (sectionKey) => {
    return eventsList.filter((event) => {
      const cat = event.category;
      if (sectionKey === 'hackathons') return cat === 'Hackathon';
      if (sectionKey === 'ideathons') return cat === 'Ideathon';
      if (sectionKey === 'webinars') return cat === 'Webinar';
      if (sectionKey === 'events') {
        return cat !== 'Hackathon' && cat !== 'Ideathon' && cat !== 'Webinar';
      }
      return false;
    }).sort((a, b) => {
      if ((a.displayOrder || 0) !== (b.displayOrder || 0)) {
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      }
      return new Date(a.startDate) - new Date(b.startDate);
    });
  };

  const handleMoveEvent = async (index, direction, filteredEvents) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === filteredEvents.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reorderedEvents = [...filteredEvents];
    const temp = reorderedEvents[index];
    reorderedEvents[index] = reorderedEvents[targetIndex];
    reorderedEvents[targetIndex] = temp;

    const updatedEventsPayload = reorderedEvents.map((ev, idx) => ({
      id: ev.id,
      displayOrder: idx + 1
    }));

    setEventsList(prev => {
      return prev.map(ev => {
        const match = updatedEventsPayload.find(p => p.id === ev.id);
        return match ? { ...ev, displayOrder: match.displayOrder } : ev;
      });
    });

    setUpdatingEventsOrder(true);
    try {
      await admin.updateEventsOrder(updatedEventsPayload);
      showToast('Events order updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update events order', 'error');
      fetchHomepageData();
    } finally {
      setUpdatingEventsOrder(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      await admin.homepage.uploadBanner(file);
      showToast('Banner slide uploaded successfully!');
      fetchHomepageData();
    } catch (err) {
      showToast(err.message || 'Failed to upload banner', 'error');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleBannerDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner slide?')) return;
    try {
      await admin.homepage.deleteBanner(id);
      showToast('Banner slide deleted successfully!');
      fetchHomepageData();
    } catch (err) {
      showToast(err.message || 'Failed to delete banner', 'error');
    }
  };

  const handleBannerOrderChange = async (id, newOrder) => {
    try {
      await admin.homepage.updateBannerOrder(id, parseInt(newOrder));
      showToast('Banner order updated!');
      fetchHomepageData();
    } catch (err) {
      showToast(err.message || 'Failed to update banner order', 'error');
    }
  };

  const handleCommunityUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCommunity(true);
    try {
      await admin.homepage.uploadCommunityImage(file);
      showToast('Community image uploaded successfully!');
      fetchHomepageData();
    } catch (err) {
      showToast(err.message || 'Failed to upload community image', 'error');
    } finally {
      setUploadingCommunity(false);
      e.target.value = '';
    }
  };

  const handleCommunityDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this community image?')) return;
    try {
      await admin.homepage.deleteCommunityImage(id);
      showToast('Community image deleted successfully!');
      fetchHomepageData();
    } catch (err) {
      showToast(err.message || 'Failed to delete community image', 'error');
    }
  };

  const handleCommunityOrderChange = async (id, newOrder) => {
    try {
      await admin.homepage.updateCommunityImageOrder(id, parseInt(newOrder));
      showToast('Community image order updated!');
      fetchHomepageData();
    } catch (err) {
      showToast(err.message || 'Failed to update community image order', 'error');
    }
  };

  const handleTestimonialAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const res = await admin.homepage.uploadTestimonialAvatar(file);
      setTestimonialModal(prev => ({
        ...prev,
        data: { ...prev.data, avatarUrl: res.avatarUrl }
      }));
      showToast('Avatar uploaded successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to upload avatar', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    const { mode, data } = testimonialModal;
    setSubmittingTestimonial(true);
    try {
      if (!data.name || !data.role || !data.quote) {
        throw new Error('Name, Role, and Quote are required');
      }
      
      const payload = {
        name: data.name,
        role: data.role,
        quote: data.quote,
        avatarUrl: data.avatarUrl || null,
        badge: data.badge || null,
        link: data.link || null,
        order: data.order !== undefined ? parseInt(data.order) : undefined,
      };

      if (mode === 'add') {
        await admin.homepage.addTestimonial(payload);
        showToast('Testimonial added successfully!');
      } else {
        await admin.homepage.updateTestimonial(data.id, payload);
        showToast('Testimonial updated successfully!');
      }
      setTestimonialModal(null);
      fetchHomepageData();
    } catch (err) {
      showToast(err.message || 'Failed to save testimonial', 'error');
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  const handleTestimonialDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await admin.homepage.deleteTestimonial(id);
      showToast('Testimonial deleted successfully!');
      fetchHomepageData();
    } catch (err) {
      showToast(err.message || 'Failed to delete testimonial', 'error');
    }
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


  const fetchAllEvents = useCallback(async () => {
    setLoadingAllEvents(true);
    try {
      const data = await eventsApi.getAll({ limit: 1000 });
      setAllEvents(data?.data || data || []);
    } catch {
      showToast('Failed to load all events', 'error');
    } finally {
      setLoadingAllEvents(false);
    }
  }, []);
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

  const fetchSurveyResponses = useCallback(async (page = 1, search = '') => {
    setLoadingSurvey(true);
    try {
      const res = await admin.getInternshipSurvey(page, 15, search);
      setSurveyResponses(res?.data ?? []);
      setSurveyMeta(res?.meta ?? null);
      setSurveyStats(res?.stats ?? null);
      setSurveyEnabled(res?.enabled ?? true);
    } catch (err) {
      showToast(err.message || 'Failed to load survey responses', 'error');
    } finally {
      setLoadingSurvey(false);
    }
  }, []);

  const handleToggleSurvey = async () => {
    setTogglingSurvey(true);
    try {
      const res = await admin.toggleInternshipSurvey();
      // Since it toggles visual flag in HomepageSection
      setSurveyEnabled(res?.visible ?? !surveyEnabled);
      showToast(res?.visible ? 'Internship survey feature enabled!' : 'Internship survey feature disabled.');
    } catch (err) {
      showToast(err.message || 'Failed to toggle survey feature', 'error');
    } finally {
      setTogglingSurvey(false);
    }
  };

  const handleSurveySearch = (e) => {
    e.preventDefault();
    setSurveyPage(1);
    fetchSurveyResponses(1, surveySearch);
  };

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => {
    if (activeTab === 'events') fetchPending();
    if (activeTab === 'allEvents') fetchAllEvents();
    if (activeTab === 'users') fetchUsers(1);
    if (activeTab === 'organizer') fetchOrgRequests();
    if (activeTab === 'recentUsers') fetchRecentUsers(1);
    if (activeTab === 'homepage') fetchHomepageData();
    if (activeTab === 'internships') fetchSurveyResponses(1);
  }, [activeTab]);

  // ── Actions ──

  const handleApproveEvent = async (id, feat = false, prem = false) => {
    try {
      await admin.approveEvent(id, feat, prem);
      showToast('Event approved!');
      setApproveModal(null);
      setIsFeatured(false);
      setIsPremium(false);
      fetchPending();
      fetchDashboard();
    } catch (e) {
      showToast(e.message || 'Failed to approve event', 'error');
    }
  };

  const handleTogglePremium = async (id, currentStatus) => {
    try {
      const nextStatus = !currentStatus;
      await admin.togglePremium(id, nextStatus);
      showToast(nextStatus ? 'Event marked as Premium!' : 'Premium status removed.');
      
      // Update local state for allEvents
      setAllEvents(prev => prev.map(ev => ev.id === id ? { ...ev, isPremium: nextStatus } : ev));
      // Update local state for recentEvents
      setRecentEvents(prev => prev.map(ev => ev.id === id ? { ...ev, isPremium: nextStatus } : ev));
    } catch (e) {
      showToast(e.message || 'Failed to toggle premium status', 'error');
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
    { key: 'allEvents', label: 'All Events', icon: CalendarDays },
    { key: 'organizer', label: 'Organizer Requests', icon: UserCheck },
    { key: 'recentUsers', label: 'Recent Users', icon: Users },
    { key: 'users', label: 'All Users', icon: SlidersHorizontal },
    { key: 'homepage', label: 'Homepage Config', icon: Settings },
    { key: 'internships', label: 'Internship Survey', icon: Briefcase },
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
        fixed top-0 left-0 h-82 w-64 bg-[#061818] border-r border-[#1a4d4d] z-40
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 pt-20  border-b border-[#1a4d4d]">
          

        </div>

        {/* Nav */}
        <nav className="flex-1 p-5 space-y-1 overflow-y-auto">
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
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm py-2 px-3 rounded-lg hover:bg-red-900/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
<Header/>

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
              <div className='h-15'></div>
              {/* Overview header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#00ff88]" />
                  <h1 className="text-white text-xl font-bold">Analytics Overview</h1>
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
                    <div key={ev.id} onClick={() => navigate(`/event/${ev.id}`)} className="cursor-pointer bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5 hover:border-[#00ff88]/40 transition-all">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsFeatured(false);
                              setIsPremium(false);
                              setApproveModal({ id: ev.id, title: ev.title });
                            }}
                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setRejectModal({ id: ev.id, title: ev.title }); }}
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

              {/* Approve Event Modal */}
              {approveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                  <div className="w-full max-w-md bg-[#0d2f2f] border-2 border-green-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                    {/* Background glow decoration */}
                    <div className="absolute top-[-50px] right-[-50px] w-36 h-36 bg-green-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-50px] left-[-50px] w-36 h-36 bg-amber-500/10 rounded-full blur-3xl" />
                    
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <h3 className="text-white font-semibold text-lg">Approve Event</h3>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-6 relative z-10">
                      Approving: <span className="text-white font-medium">"{approveModal.title}"</span>
                    </p>
                    
                    <div className="space-y-4 mb-6 relative z-10">
                      {/* Featured Event Option */}
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-[#061818]/60 border border-[#1a4d4d] cursor-pointer hover:border-green-500/30 transition-all">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="mt-1 accent-green-500 rounded focus:ring-green-500"
                        />
                        <div>
                          <p className="text-white font-medium text-sm flex items-center gap-1.5">
                            ★ Mark as Featured
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            Featured events will show up in the carousel or highlights section.
                          </p>
                        </div>
                      </label>
                      
                      {/* Premium Event Option */}
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-[#061818]/60 border border-[#1a4d4d] cursor-pointer hover:border-amber-500/30 transition-all">
                        <input
                          type="checkbox"
                          checked={isPremium}
                          onChange={(e) => setIsPremium(e.target.checked)}
                          className="mt-1 accent-amber-500 rounded focus:ring-amber-500"
                        />
                        <div>
                          <p className="text-amber-400 font-semibold text-sm flex items-center gap-1.5">
                            👑 Mark as Premium Event
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            Premium events represent official company prompts and get a gold glowing border and verified badge.
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    <div className="flex gap-3 relative z-10">
                      <button
                        onClick={() => { setApproveModal(null); setIsFeatured(false); setIsPremium(false); }}
                        className="flex-1 py-2.5 rounded-xl border border-[#1a4d4d] text-gray-400 hover:text-white hover:border-[#00ff88] transition-all text-sm font-medium bg-[#061818]/30"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleApproveEvent(approveModal.id, isFeatured, isPremium)}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-green-900/30 hover:shadow-green-500/20 hover:scale-[1.02] transition-all text-sm"
                      >
                        Confirm & Approve
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ── ALL EVENTS TAB ── */}
          {activeTab === 'allEvents' && (
            <div>
              <SectionHeader title="All Events" count={allEvents.length} onRefresh={fetchAllEvents} />
              {loadingAllEvents ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>
              ) : allEvents.length === 0 ? (
                <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-12 text-center">
                  <CalendarDays className="w-12 h-12 text-[#00ff88] mx-auto mb-3 opacity-50" />
                  <p className="text-gray-400">No events found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allEvents.map((ev) => (
                    <div key={ev.id} onClick={() => navigate(`/event/${ev.id}`)} className="cursor-pointer bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5 hover:border-[#00ff88]/40 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-white font-semibold">{ev.title}</h3>
                            <Badge status={ev.status} />
                            {ev.isPremium && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-400 bg-amber-900/20 flex items-center gap-1">
                                👑 Premium
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{ev.category} · {ev.mode}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            By {ev.organizer?.name || '—'} · {fmtDate(ev.startDate)}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 items-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTogglePremium(ev.id, ev.isPremium); }}
                            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all ${
                              ev.isPremium
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30 hover:scale-[1.02]'
                                : 'bg-[#061818]/60 border border-[#1a4d4d] hover:border-amber-500/50 text-gray-400 hover:text-amber-400 hover:scale-[1.02]'
                            }`}
                          >
                            👑 {ev.isPremium ? 'Premium' : 'Make Premium'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/organize/edit/${ev.id}`); }}
                            className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all hover:scale-[1.02]"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                      <div key={log.id} onClick={() => setViewOrgModal(log)} className="cursor-pointer bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5 hover:border-purple-500/40 transition-all">
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
                              onClick={(e) => { e.stopPropagation(); handleApproveOrganizer(log.userId); }}
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

          {activeTab === 'homepage' && (
            <div>
              <SectionHeader title="Homepage Configurator" onRefresh={fetchHomepageData} />
              
              {loadingHomepage ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>
              ) : (
                <div className="space-y-10">

                  {/* HOMEPAGE SECTIONS ORDER */}
                  <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-6">
                    <div className="mb-6">
                      <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-[#00ff88]" />
                        Homepage Event Sections Order
                      </h2>
                      <p className="text-gray-400 text-xs mt-1">Reorder the upcoming event categories sections displayed on the homepage.</p>
                    </div>

                    {!homepageData.sections || homepageData.sections.length === 0 ? (
                      <p className="text-gray-500 text-sm py-4">No sections configured. Database will seed defaults on homepage refresh.</p>
                    ) : (
                      <div className="space-y-3 max-w-xl">
                        {homepageData.sections.map((section, idx) => (
                          <div key={section.id} className="bg-[#061818]/60 border border-[#1a4d4d] rounded-xl p-4 flex items-center justify-between gap-4 hover:border-[#00ff88]/30 transition-all">
                            <div>
                              <p className="text-white font-medium text-sm">{section.title}</p>
                              <p className="text-gray-500 text-xs mt-0.5">Key: {section.key} · Order: {section.order}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                disabled={idx === 0 || updatingSections}
                                onClick={() => handleMoveSection(idx, 'up')}
                                className="p-1.5 bg-[#1a4d4d] hover:bg-[#256e6e] text-white disabled:opacity-30 disabled:hover:bg-[#1a4d4d] rounded-lg transition-all"
                                title="Move Up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                disabled={idx === homepageData.sections.length - 1 || updatingSections}
                                onClick={() => handleMoveSection(idx, 'down')}
                                className="p-1.5 bg-[#1a4d4d] hover:bg-[#256e6e] text-white disabled:opacity-30 disabled:hover:bg-[#1a4d4d] rounded-lg transition-all"
                                title="Move Down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* EVENTS ORDER IN SECTIONS */}
                  <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-6">
                    <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                          <SlidersHorizontal className="w-5 h-5 text-[#00ff88]" />
                          Order Events in Homepage Sections
                        </h2>
                        <p className="text-gray-400 text-xs mt-1">Reorder individual events displayed under each section on the homepage.</p>
                      </div>

                      {/* Section Selector */}
                      <div>
                        <select
                          value={selectedSectionKey || (homepageData.sections && homepageData.sections[0]?.key) || ''}
                          onChange={(e) => setSelectedSectionKey(e.target.value)}
                          className="bg-[#0c2424] border border-[#1a4d4d] text-white text-sm px-4 py-2 rounded-xl focus:outline-none focus:border-[#00ff88] cursor-pointer"
                        >
                          {(homepageData.sections || []).map((sec) => (
                            <option key={sec.key} value={sec.key}>
                              {sec.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(() => {
                      const activeSecKey = selectedSectionKey || (homepageData.sections && homepageData.sections[0]?.key) || 'hackathons';
                      const sectionEvents = getFilteredEventsForSection(activeSecKey);

                      if (sectionEvents.length === 0) {
                        return <p className="text-gray-500 text-sm py-4">No events found in this category.</p>;
                      }

                      return (
                        <div className="space-y-3 max-w-2xl">
                          {sectionEvents.map((event, idx) => (
                            <div key={event.id} className="bg-[#061818]/60 border border-[#1a4d4d] rounded-xl p-4 flex items-center justify-between gap-4 hover:border-[#00ff88]/30 transition-all">
                              <div className="flex items-center gap-3">
                                {event.eventPoster || event.bannerImage ? (
                                  <img
                                    src={event.eventPoster || event.bannerImage}
                                    alt="Event Thumbnail"
                                    className="w-12 h-12 object-cover rounded-lg border border-[#1a4d4d]"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-[#0c2424] flex items-center justify-center rounded-lg border border-[#1a4d4d]">
                                    <CalendarDays className="w-6 h-6 text-gray-500" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-white font-medium text-sm line-clamp-1">{event.title}</p>
                                  <p className="text-gray-500 text-xs mt-0.5">
                                    Date: {fmtDate(event.startDate)} · Display Order: {event.displayOrder || 0}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  disabled={idx === 0 || updatingEventsOrder}
                                  onClick={() => handleMoveEvent(idx, 'up', sectionEvents)}
                                  className="p-1.5 bg-[#1a4d4d] hover:bg-[#256e6e] text-white disabled:opacity-30 disabled:hover:bg-[#1a4d4d] rounded-lg transition-all"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  disabled={idx === sectionEvents.length - 1 || updatingEventsOrder}
                                  onClick={() => handleMoveEvent(idx, 'down', sectionEvents)}
                                  className="p-1.5 bg-[#1a4d4d] hover:bg-[#256e6e] text-white disabled:opacity-30 disabled:hover:bg-[#1a4d4d] rounded-lg transition-all"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* HERO BANNERS */}
                  <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                      <div>
                        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                          <Image className="w-5 h-5 text-[#00ff88]" />
                          Hero Carousel Banners
                        </h2>
                        <p className="text-gray-400 text-xs mt-1">Manage the large images scrolling in the main home banner.</p>
                      </div>
                      
                      <label className={`cursor-pointer flex items-center gap-2 bg-[#00ff88] text-[#0a1f1f] font-bold px-4 py-2 rounded-xl hover:bg-[#00cc70] transition-all text-sm ${uploadingBanner ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Upload className="w-4 h-4" />
                        {uploadingBanner ? 'Uploading...' : 'Add Banner'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          disabled={uploadingBanner}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {homepageData.banners.length === 0 ? (
                      <p className="text-gray-500 text-sm py-4">No banners configured. Add a new banner image above.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {homepageData.banners.map((banner) => (
                          <div key={banner.id} className="bg-[#061818]/60 border border-[#1a4d4d] rounded-xl overflow-hidden hover:border-[#00ff88]/30 transition-all flex flex-col">
                            <div className="relative aspect-[21/9] bg-[#0c2424] flex items-center justify-center">
                              <img src={banner.secureUrl || banner.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                            </div>
                            <div className="p-3 flex items-center justify-between gap-3 border-t border-[#1a4d4d]">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">Order:</span>
                                <input
                                  type="number"
                                  value={banner.order}
                                  onChange={(e) => handleBannerOrderChange(banner.id, e.target.value)}
                                  className="w-16 bg-[#0d2f2f] border border-[#1a4d4d] text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-[#00ff88]"
                                />
                              </div>
                              <button
                                onClick={() => handleBannerDelete(banner.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-950/40 p-1.5 rounded-lg transition-all"
                                title="Delete Banner"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* COMMUNITY SHOWCASE */}
                  <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                      <div>
                        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                          <Image className="w-5 h-5 text-[#00ff88]" />
                          Community Showcase Images
                        </h2>
                        <p className="text-gray-400 text-xs mt-1">Configure images for the interactive community section on the homepage.</p>
                      </div>
                      
                      <label className={`cursor-pointer flex items-center gap-2 bg-[#00ff88] text-[#0a1f1f] font-bold px-4 py-2 rounded-xl hover:bg-[#00cc70] transition-all text-sm ${uploadingCommunity ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Upload className="w-4 h-4" />
                        {uploadingCommunity ? 'Uploading...' : 'Add Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCommunityUpload}
                          disabled={uploadingCommunity}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {homepageData.community.length === 0 ? (
                      <p className="text-gray-500 text-sm py-4">No community images configured. Add a new image above.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {homepageData.community.map((img) => (
                          <div key={img.id} className="bg-[#061818]/60 border border-[#1a4d4d] rounded-xl overflow-hidden hover:border-[#00ff88]/30 transition-all flex flex-col">
                            <div className="relative aspect-square bg-[#0c2424] flex items-center justify-center">
                              <img src={img.secureUrl || img.imageUrl} alt="Community" className="w-full h-full object-cover" />
                            </div>
                            <div className="p-2.5 flex items-center justify-between gap-2 border-t border-[#1a4d4d]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-500 text-[10px]">Ord:</span>
                                <input
                                  type="number"
                                  value={img.order}
                                  onChange={(e) => handleCommunityOrderChange(img.id, e.target.value)}
                                  className="w-10 bg-[#0d2f2f] border border-[#1a4d4d] text-white text-[10px] px-1 py-0.5 rounded text-center focus:outline-none focus:border-[#00ff88]"
                                />
                              </div>
                              <button
                                onClick={() => handleCommunityDelete(img.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-950/40 p-1 rounded transition-all"
                                title="Delete Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TESTIMONIALS */}
                  <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                      <div>
                        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#00ff88]" />
                          Testimonials Carousel
                        </h2>
                        <p className="text-gray-400 text-xs mt-1">Configure client/member reviews and quotes shown on the homepage.</p>
                      </div>
                      
                      <button
                        onClick={() => setTestimonialModal({ mode: 'add', data: { name: '', role: '', quote: '', avatarUrl: '', badge: '', link: '', order: 0 } })}
                        className="flex items-center gap-2 bg-[#00ff88] text-[#0a1f1f] font-bold px-4 py-2 rounded-xl hover:bg-[#00cc70] transition-all text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Testimonial
                      </button>
                    </div>

                    {homepageData.testimonials.length === 0 ? (
                      <p className="text-gray-500 text-sm py-4">No testimonials configured. Add a new testimonial review above.</p>
                    ) : (
                      <div className="space-y-4">
                        {homepageData.testimonials.map((t) => (
                          <div key={t.id} className="bg-[#061818]/60 border border-[#1a4d4d] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#00ff88]/30 transition-all">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-full bg-[#1a4d4d] flex items-center justify-center flex-shrink-0">
                                {t.avatarUrl ? (
                                  <img src={t.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <Users className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-white font-medium text-sm">{t.name}</span>
                                  {t.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#00ff88]/40 text-[#00ff88] bg-[#00ff88]/10 uppercase">
                                      {t.badge}
                                    </span>
                                  )}
                                  <span className="text-gray-500 text-xs">Order: {t.order}</span>
                                </div>
                                <p className="text-[#00ff88] text-xs mt-0.5">{t.role}</p>
                                <p className="text-gray-300 text-xs mt-2 italic font-serif">"{t.quote}"</p>
                                {t.link && (
                                  <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-[10px] mt-1 inline-block">
                                    {t.link}
                                  </a>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 self-end md:self-auto">
                              <button
                                onClick={() => setTestimonialModal({ mode: 'edit', data: { ...t } })}
                                className="flex items-center gap-1 bg-[#1a4d4d] hover:bg-[#256e6e] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleTestimonialDelete(t.id)}
                                className="flex items-center gap-1 bg-red-950/40 hover:bg-red-800 text-red-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-900/50 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ── INTERNSHIP SURVEY TAB ── */}
          {activeTab === 'internships' && (
            <div className="space-y-6 pt-20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-white text-xl font-bold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#00ff88]" />
                    Internship Survey Manager
                  </h1>
                  <p className="text-gray-400 text-xs mt-1">Manage survey popups and view student interest responses.</p>
                </div>
                
                {/* Enable/Disable Feature Switch Card */}
                <div className="flex items-center gap-4 bg-[#0d2f2f] border border-[#1a4d4d] px-5 py-3 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-semibold">Survey Popup Feature</span>
                    <span className="text-gray-400 text-xs mt-0.5">
                      {surveyEnabled ? 'Active (Displaying to users)' : 'Inactive (Hidden)'}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleSurvey}
                    disabled={togglingSurvey}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:ring-offset-2 focus:ring-offset-[#0d2f2f]
                      ${surveyEnabled ? 'bg-[#00ff88]' : 'bg-[#1a4d4d]'} ${togglingSurvey ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
                        ${surveyEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>

              {loadingSurvey && !surveyStats ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0d2f2f] border border-[#1a4d4d] p-5 rounded-2xl">
                      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Responses</p>
                      <h3 className="text-white text-2xl font-bold mt-2">{surveyStats?.total || 0}</h3>
                      <p className="text-gray-500 text-[10px] mt-1">Total submitted user feedback</p>
                    </div>
                    <div className="bg-[#0d2f2f] border border-[#1a4d4d] p-5 rounded-2xl border-l-4 border-l-green-500">
                      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Interested</p>
                      <h3 className="text-green-400 text-2xl font-bold mt-2">{surveyStats?.interested || 0}</h3>
                      <p className="text-gray-500 text-[10px] mt-1">Students seeking internships</p>
                    </div>
                    <div className="bg-[#0d2f2f] border border-[#1a4d4d] p-5 rounded-2xl border-l-4 border-l-red-500">
                      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Not Interested</p>
                      <h3 className="text-red-400 text-2xl font-bold mt-2">{surveyStats?.notInterested || 0}</h3>
                      <p className="text-gray-500 text-[10px] mt-1">Declined internship popups</p>
                    </div>
                    <div className="bg-[#0d2f2f] border border-[#1a4d4d] p-5 rounded-2xl border-l-4 border-l-[#00ff88]">
                      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Conversion Rate</p>
                      <h3 className="text-[#00ff88] text-2xl font-bold mt-2">
                        {surveyStats?.total ? ((surveyStats.interested / surveyStats.total) * 100).toFixed(1) : '0.0'}%
                      </h3>
                      <p className="text-gray-500 text-[10px] mt-1">Percentage of positive responses</p>
                    </div>
                  </div>

                  {/* Domain Breakdown */}
                  {surveyStats?.domainCounts && Object.keys(surveyStats.domainCounts).length > 0 && (
                    <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-6">
                      <h2 className="text-white text-lg font-semibold mb-4">Preferred Domains Breakdown</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(surveyStats.domainCounts).map(([domain, count]) => (
                          <div key={domain} className="bg-[#061818]/60 border border-[#1a4d4d] p-4 rounded-xl flex justify-between items-center hover:border-[#00ff88]/30 transition-all">
                            <span className="text-gray-300 text-sm font-medium">{domain}</span>
                            <span className="bg-[#00ff88]/10 text-[#00ff88] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#00ff88]/20">
                              {count} students
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Table with search and pagination */}
                  <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                      <h2 className="text-white text-lg font-semibold">User Responses</h2>
                      
                      <form onSubmit={handleSurveySearch} className="sm:ml-auto flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={surveySearch}
                            onChange={e => setSurveySearch(e.target.value)}
                            placeholder="Search by name or email…"
                            className="w-full bg-[#061818]/60 border border-[#1a4d4d] text-white placeholder-gray-500 py-2 pl-9 pr-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all text-xs"
                          />
                        </div>
                        <button type="submit" className="bg-[#00ff88] text-[#0a1f1f] font-bold px-4 py-2 rounded-xl hover:bg-[#00cc70] transition-all text-xs">
                          Search
                        </button>
                      </form>
                    </div>

                    {loadingSurvey ? (
                      <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>
                    ) : surveyResponses.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No responses found.</p>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[#1a4d4d] bg-[#061818]/60">
                                <th className="text-left text-gray-400 font-medium px-4 py-3">Student Name</th>
                                <th className="text-left text-gray-400 font-medium px-4 py-3">Email</th>
                                <th className="text-left text-gray-400 font-medium px-4 py-3">Interested?</th>
                                <th className="text-left text-gray-400 font-medium px-4 py-3">Preferred Domains</th>
                                <th className="text-left text-gray-400 font-medium px-4 py-3">Date Submitted</th>
                              </tr>
                            </thead>
                            <tbody>
                              {surveyResponses.map((res) => (
                                <tr key={res.id} className="border-b border-[#1a4d4d]/60 last:border-0 hover:bg-[#1a4d4d]/10 transition-colors">
                                  <td className="px-4 py-3 text-white font-medium">{res.name || '—'}</td>
                                  <td className="px-4 py-3 text-gray-400">{res.email}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border 
                                      ${res.internshipInterest 
                                        ? 'bg-green-950/20 text-green-400 border-green-500/40' 
                                        : 'bg-red-950/20 text-red-400 border-red-500/40'}`}
                                    >
                                      {res.internshipInterest ? 'Yes' : 'No'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 max-w-[250px]">
                                    {res.internshipInterest && res.internshipDomains?.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {res.internshipDomains.map((dom, i) => (
                                          <span key={i} className="bg-[#1a4d4d]/30 text-lime-400 text-[10px] px-1.5 py-0.5 rounded border border-[#1a4d4d]">
                                            {dom}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-500 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(res.createdAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {surveyMeta && surveyMeta.totalPages > 1 && (
                          <div className="flex items-center justify-between mt-6">
                            <p className="text-gray-500 text-xs">
                              Page {surveyMeta.page} of {surveyMeta.totalPages}
                            </p>
                            <div className="flex gap-2">
                              <button
                                disabled={surveyPage <= 1}
                                onClick={() => { const p = surveyPage - 1; setSurveyPage(p); fetchSurveyResponses(p, surveySearch); }}
                                className="p-2 bg-[#0d2f2f] border border-[#1a4d4d] rounded-xl text-gray-400 hover:text-white disabled:opacity-40 transition-all"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                disabled={surveyPage >= surveyMeta.totalPages}
                                onClick={() => { const p = surveyPage + 1; setSurveyPage(p); fetchSurveyResponses(p, surveySearch); }}
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
                </>
              )}
            </div>
          )}

          {/* Testimonial Form Modal */}
          {testimonialModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
              <div className="w-full max-w-lg bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-semibold text-lg">
                    {testimonialModal.mode === 'add' ? 'Add Testimonial' : 'Edit Testimonial'}
                  </h3>
                  <button onClick={() => setTestimonialModal(null)} className="text-gray-400 hover:text-white transition-colors">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                  {/* Avatar upload */}
                  <div>
                    <span className="text-gray-400 text-xs block mb-2">Avatar Image</span>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-[#1a4d4d] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {testimonialModal.data.avatarUrl ? (
                          <img src={testimonialModal.data.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-7 h-7 text-gray-400" />
                        )}
                      </div>
                      <label className={`cursor-pointer bg-[#1a4d4d] text-white hover:bg-[#256e6e] text-xs font-semibold px-3 py-2 rounded-xl transition-all ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleTestimonialAvatarUpload}
                          disabled={uploadingAvatar}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Author Name *</label>
                    <input
                      type="text"
                      required
                      value={testimonialModal.data.name || ''}
                      onChange={(e) => setTestimonialModal(prev => ({
                        ...prev,
                        data: { ...prev.data, name: e.target.value }
                      }))}
                      className="w-full bg-[#061818]/60 border border-[#1a4d4d] text-white placeholder-gray-500 py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all text-sm"
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Role / Affiliation *</label>
                    <input
                      type="text"
                      required
                      value={testimonialModal.data.role || ''}
                      onChange={(e) => setTestimonialModal(prev => ({
                        ...prev,
                        data: { ...prev.data, role: e.target.value }
                      }))}
                      className="w-full bg-[#061818]/60 border border-[#1a4d4d] text-white placeholder-gray-500 py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all text-sm"
                      placeholder="e.g. Founder at TechCorp"
                    />
                  </div>

                  {/* Quote */}
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Testimonial Quote *</label>
                    <textarea
                      required
                      rows={3}
                      value={testimonialModal.data.quote || ''}
                      onChange={(e) => setTestimonialModal(prev => ({
                        ...prev,
                        data: { ...prev.data, quote: e.target.value }
                      }))}
                      className="w-full bg-[#061818]/60 border border-[#1a4d4d] text-white placeholder-gray-500 py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all text-sm resize-none"
                      placeholder="Write the quote text here..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Badge */}
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Badge (optional)</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={testimonialModal.data.badge || ''}
                        onChange={(e) => setTestimonialModal(prev => ({
                          ...prev,
                          data: { ...prev.data, badge: e.target.value }
                        }))}
                        className="w-full bg-[#061818]/60 border border-[#1a4d4d] text-white placeholder-gray-500 py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all text-sm"
                        placeholder="e.g. Winner"
                      />
                    </div>

                    {/* Order */}
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Display Order</label>
                      <input
                        type="number"
                        value={testimonialModal.data.order || 0}
                        onChange={(e) => setTestimonialModal(prev => ({
                          ...prev,
                          data: { ...prev.data, order: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full bg-[#061818]/60 border border-[#1a4d4d] text-white placeholder-gray-500 py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Link */}
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Social/External Link (optional)</label>
                    <input
                      type="url"
                      value={testimonialModal.data.link || ''}
                      onChange={(e) => setTestimonialModal(prev => ({
                        ...prev,
                        data: { ...prev.data, link: e.target.value }
                      }))}
                      className="w-full bg-[#061818]/60 border border-[#1a4d4d] text-white placeholder-gray-500 py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all text-sm"
                      placeholder="e.g. https://linkedin.com/in/username"
                    />
                  </div>

                  <div className="flex gap-3 mt-6 pt-2">
                    <button
                      type="button"
                      onClick={() => setTestimonialModal(null)}
                      className="flex-1 py-2.5 rounded-xl border border-[#1a4d4d] text-gray-400 hover:text-white transition-all text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingTestimonial}
                      className="flex-1 py-2.5 rounded-xl bg-[#00ff88] text-[#0a1f1f] font-bold hover:bg-[#00cc70] disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      {submittingTestimonial && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

              {/* ── View Org Modal ── */}
              {viewOrgModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                  <div className="w-full max-w-md bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-white font-semibold text-lg">Organizer Details</h3>
                      <button onClick={() => setViewOrgModal(null)} className="text-gray-400 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4 text-sm text-gray-300">
                      <div><span className="text-gray-500 block text-xs">User Name</span>{viewOrgModal.user?.name || viewOrgModal.user?.email || 'Unknown'}</div>
                      <div><span className="text-gray-500 block text-xs">User Email</span>{viewOrgModal.user?.email}</div>
                      <div><span className="text-gray-500 block text-xs">Organization Name</span>{viewOrgModal.newValue?.orgName || '—'}</div>
                      <div><span className="text-gray-500 block text-xs">Organization Email</span>{viewOrgModal.newValue?.orgEmail || '—'}</div>
                      <div><span className="text-gray-500 block text-xs">First Event</span>{viewOrgModal.newValue?.eventName || '—'}</div>
                      <div><span className="text-gray-500 block text-xs">Requested At</span>{fmtDateTime(viewOrgModal.createdAt)}</div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setViewOrgModal(null)} className="flex-1 py-2.5 rounded-xl border border-[#1a4d4d] text-gray-400 hover:text-white transition-all">
                        Close
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleApproveOrganizer(viewOrgModal.userId); setViewOrgModal(null); }} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all">
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              )}


        </main>
      </div>
    </div>

  );
};

export default Admin;
