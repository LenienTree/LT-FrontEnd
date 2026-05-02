import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Edit2, LogOut, Loader2, X, Pencil, Upload, Trash2, Plus } from 'lucide-react';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { users, bookmarks, events as eventsApi } from '../../services/api';

// ─── Small helpers ────────────────────────────────────────────────────────────

const Field = ({ label, name, value, onChange, type = 'text', readOnly = false }) => (
  <div>
    <label className="text-gray-400 text-sm mb-2 block">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 disabled:opacity-60"
    />
  </div>
);

// ─── Profile Component ────────────────────────────────────────────────────────

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const posterInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('account');

  // Profile data state
  const [profileData, setProfileData] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [myCreatedEvents, setMyCreatedEvents] = useState([]);
  const [loadingCreatedEvents, setLoadingCreatedEvents] = useState(false);
  const [myCertificates, setMyCertificates] = useState([]);
  const [myBookmarks, setMyBookmarks] = useState([]);

  // Edit event modal state
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [loadingEditData, setLoadingEditData] = useState(false);

  // UI state
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password change state
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Organizer request modal state
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgSubmitted, setOrgSubmitted] = useState(false);
  const [submittingOrg, setSubmittingOrg] = useState(false);
  const [orgForm, setOrgForm] = useState({ orgName: '', orgEmail: '', eventName: '' });
  const [orgError, setOrgError] = useState('');

  // ── Bootstrap ──
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, eventsRes, certsRes, bookmarksRes] = await Promise.allSettled([
          users.getMyProfile(),
          users.getMyRegisteredEvents(),
          users.getMyCertificates(),
          bookmarks.getAll(),
        ]);

        if (profileRes.status === 'fulfilled') {
          const profile = profileRes.value;
          setProfileData(profile);

          // If the user is an organizer, fetch the events they created
          if (profile?.isOrganizer && profile?.id) {
            setLoadingCreatedEvents(true);
            eventsApi.getAll({ organizerId: profile.id, limit: 100 })
              .then(res => {
                const list = (Array.isArray(res) ? res : res.data) || [];
                // Strictly filter by organizer ID
                const filtered = list.filter(evt => 
                  evt.organizerId === profile.id || 
                  evt.organizer?.id === profile.id
                );
                setMyCreatedEvents(filtered);
              })
              .catch(() => {})
              .finally(() => setLoadingCreatedEvents(false));
          }
        }

        if (eventsRes.status === 'fulfilled') {
          setMyEvents(eventsRes.value.registered || []);
          setMyBookmarks(eventsRes.value.bookmarked || []);
        }
        if (certsRes.status === 'fulfilled') setMyCertificates(certsRes.value || []);
        if (bookmarksRes.status === 'fulfilled' && !eventsRes.value?.bookmarked) {
          setMyBookmarks(bookmarksRes.value || []);
        }
      } catch (err) {
        setProfileError('Failed to load profile.');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchAll();
  }, []);

  // ── Handlers ──

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSavingProfile(true);
    try {
      const updated = await users.updateMyProfile({
        name: profileData.name,
        phone: profileData.phone,
        college: profileData.college,
        graduationYear: profileData.graduationYear,
        bio: profileData.bio,
        skills: profileData.skills,
        socialLinks: profileData.socialLinks,
      });
      setProfileData(updated?.user || updated || profileData);
      setProfileSuccess('Profile saved successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err.message || 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await users.uploadAvatar(file);
      // Backend returns updated user or { id, profileImage }
      setProfileData(prev => ({
        ...prev,
        profileImage: res?.profileImage || res?.user?.profileImage || prev.profileImage
      }));
      setProfileSuccess('Avatar updated!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err.message || 'Avatar upload failed.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordError('');
    setPasswordSuccess('');
    setSavingPassword(true);
    try {
      await users.changePassword(passwordData);
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleBecomeOrganizer = () => {
    setOrgError('');
    setShowOrgModal(true);
  };

  const handleOrganizerSubmit = async (e) => {
    e.preventDefault();
    setOrgError('');
    setSubmittingOrg(true);
    try {
      await users.becomeOrganizer({
        orgName: orgForm.orgName,
        orgEmail: orgForm.orgEmail,
        eventName: orgForm.eventName,
      });
      setShowOrgModal(false);
      setOrgSubmitted(true);
      setProfileSuccess('Your request has been submitted! We will review and get back to you.');
      setTimeout(() => setProfileSuccess(''), 5000);
    } catch (err) {
      // 409 = already has a pending request
      if (err.message?.includes('pending')) {
        setShowOrgModal(false);
        setOrgSubmitted(true);
      } else {
        setOrgError(err.message || 'Failed to submit request. Please try again.');
      }
    } finally {
      setSubmittingOrg(false);
    }
  };

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(profileData?.id || '');
    setProfileSuccess('User ID copied!');
    setTimeout(() => setProfileSuccess(''), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Edit Event Handlers ──

  const openEditModal = async (evt) => {
    setEditError('');
    setEditSuccess('');
    setLoadingEditData(true);
    setEditingEvent(evt);
    try {
      const full = await eventsApi.getById(evt.id);
      const e = full?.event || full;
      setEditForm({
        title: e.title || '',
        subtitle: e.subtitle || '',
        description: e.description || '',
        category: e.category || 'Hackathon',
        mode: e.mode || 'ONLINE',
        startDate: e.startDate ? e.startDate.slice(0, 16) : '',
        endDate: e.endDate ? e.endDate.slice(0, 16) : '',
        registrationDeadline: e.registrationDeadline ? e.registrationDeadline.slice(0, 16) : '',
        prizeType: e.prizeType || 'NONE',
        prizeAmount: e.prizeAmount ?? 0,
        isPaid: e.isPaid ?? false,
        ticketPrice: e.ticketPrice ?? 0,
        theme: e.theme || '',
        venueName: e.venueName || '',
        address: e.address || '',
        mapLink: e.mapLink || '',
        bannerImage: e.bannerImage || '',
        eventPoster: e.eventPoster || '',
        faqs: (e.faqs || []).map(f => ({ id: f.id, question: f.question, answer: f.answer, order: f.order || 0 })),
        announcements: (e.announcements || []).map(a => ({ id: a.id, title: a.title, content: a.content })),
      });
    } catch (err) {
      setEditForm({
        title: evt.title || '',
        subtitle: evt.subtitle || '',
        description: '',
        category: evt.category || 'Hackathon',
        mode: evt.mode || 'ONLINE',
        startDate: evt.startDate ? evt.startDate.slice(0, 16) : '',
        endDate: evt.endDate ? evt.endDate.slice(0, 16) : '',
        registrationDeadline: '',
        prizeType: evt.prizeType || 'NONE',
        prizeAmount: evt.prizeAmount ?? 0,
        isPaid: evt.isPaid ?? false,
        ticketPrice: evt.ticketPrice ?? 0,
        theme: '',
        venueName: evt.venueName || '',
        address: '',
        mapLink: '',
        bannerImage: evt.bannerImage || '',
        eventPoster: evt.eventPoster || '',
        faqs: [],
        announcements: [],
      });
    } finally {
      setLoadingEditData(false);
    }
  };

  const closeEditModal = () => {
    setEditingEvent(null);
    setEditForm({});
    setEditError('');
    setEditSuccess('');
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── Image Upload Handlers ──

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingEvent) return;
    try {
      setSavingEdit(true);
      const res = await eventsApi.uploadBanner(editingEvent.id, file);
      setEditForm(prev => ({ ...prev, bannerImage: res?.bannerImage || URL.createObjectURL(file) }));
      setEditSuccess('Banner updated!');
      setTimeout(() => setEditSuccess(''), 2000);
    } catch (err) {
      setEditError(err.message || 'Banner upload failed.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingEvent) return;
    try {
      setSavingEdit(true);
      const res = await eventsApi.uploadPoster(editingEvent.id, file);
      setEditForm(prev => ({ ...prev, eventPoster: res?.eventPoster || URL.createObjectURL(file) }));
      setEditSuccess('Poster updated!');
      setTimeout(() => setEditSuccess(''), 2000);
    } catch (err) {
      setEditError(err.message || 'Poster upload failed.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── FAQ Handlers ──

  const handleEditFaqChange = (index, field, value) => {
    setEditForm(prev => {
      const faqs = [...(prev.faqs || [])];
      faqs[index] = { ...faqs[index], [field]: value };
      return { ...prev, faqs };
    });
  };

  const addEditFaq = () => {
    setEditForm(prev => ({ ...prev, faqs: [...(prev.faqs || []), { question: '', answer: '' }] }));
  };

  const removeEditFaq = async (index) => {
    const faq = editForm.faqs[index];
    if (faq.id && editingEvent) {
      try {
        await eventsApi.deleteFAQ(editingEvent.id, faq.id);
      } catch (_) { /* silent */ }
    }
    setEditForm(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  };

  // ── Announcement Handlers ──

  const handleEditAnnouncementChange = (index, field, value) => {
    setEditForm(prev => {
      const announcements = [...(prev.announcements || [])];
      announcements[index] = { ...announcements[index], [field]: value };
      return { ...prev, announcements };
    });
  };

  const addEditAnnouncement = () => {
    setEditForm(prev => ({ ...prev, announcements: [...(prev.announcements || []), { title: '', content: '' }] }));
  };

  const removeEditAnnouncement = async (index) => {
    const ann = editForm.announcements[index];
    if (ann.id && editingEvent) {
      try {
        await eventsApi.deleteAnnouncement(editingEvent.id, ann.id);
      } catch (_) { /* silent */ }
    }
    setEditForm(prev => ({ ...prev, announcements: prev.announcements.filter((_, i) => i !== index) }));
  };

  // ── Save All Event Edits ──

  const handleEditSave = async () => {
    if (!editingEvent) return;
    setSavingEdit(true);
    setEditError('');
    setEditSuccess('');
    try {
      // 1. Update main event fields
      const payload = {
        title: editForm.title,
        subtitle: editForm.subtitle || undefined,
        description: editForm.description,
        category: editForm.category,
        theme: editForm.theme || undefined,
        mode: editForm.mode,
        startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
        endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined,
        registrationDeadline: editForm.registrationDeadline ? new Date(editForm.registrationDeadline).toISOString() : undefined,
        prizeType: editForm.prizeType,
        prizeAmount: parseFloat(editForm.prizeAmount) || 0,
        isPaid: editForm.isPaid,
        ticketPrice: editForm.isPaid ? (parseFloat(editForm.ticketPrice) || 0) : undefined,
        venueName: editForm.venueName || undefined,
        address: editForm.address || undefined,
        mapLink: editForm.mapLink || undefined,
      };
      await eventsApi.update(editingEvent.id, payload);

      // 2. Save FAQs (create new / update existing)
      for (const faq of (editForm.faqs || [])) {
        if (!faq.question?.trim() || !faq.answer?.trim()) continue;
        if (faq.id) {
          await eventsApi.updateFAQ(editingEvent.id, faq.id, { question: faq.question, answer: faq.answer });
        } else {
          await eventsApi.createFAQ(editingEvent.id, { question: faq.question, answer: faq.answer, order: faq.order || 0 });
        }
      }

      // 3. Save Announcements (create new / update existing)
      for (const ann of (editForm.announcements || [])) {
        if (!ann.title?.trim() || !ann.content?.trim()) continue;
        if (ann.id) {
          await eventsApi.updateAnnouncement(editingEvent.id, ann.id, { title: ann.title, content: ann.content });
        } else {
          await eventsApi.createAnnouncement(editingEvent.id, { title: ann.title, content: ann.content });
        }
      }

      // Update the local list
      setMyCreatedEvents(prev =>
        prev.map(e => e.id === editingEvent.id ? { ...e, ...payload, bannerImage: editForm.bannerImage, eventPoster: editForm.eventPoster } : e)
      );
      setEditSuccess('Event updated successfully!');
      setTimeout(() => closeEditModal(), 1500);
    } catch (err) {
      setEditError(err.message || 'Failed to update event.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Loading State ──
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1f1f] via-[#0d2626] to-[#0a1f1f] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#00ff88] animate-spin" />
      </div>
    );
  }

  const displayName = profileData?.name || profileData?.email || 'User';

  const userId = `#${(profileData?.id || '').slice(0, 10)}`;



  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0a1f1f] via-[#0d2626] to-[#0a1f1f] flex">
        <Header />

        {/* Left Sidebar */}
        <div className="w-60 lg:mt-24 p-6 hidden lg:block">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white mb-8 hover:text-[#00ff88] transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Go Back</span>
          </button>

          <div className="bg-[#0a1f1f] border-2 border-[#1a4d4d] rounded-2xl p-4">
            <nav className="space-y-2">
              {[
                { key: 'account', label: 'Account' },
                { key: 'myEvents', label: 'My Events' },
                { key: 'certificates', label: 'Certificates' },
                { key: 'bookmarks', label: 'Bookmarks' },
                { key: 'password', label: 'Password' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === key
                    ? 'bg-[#00ff88] text-[#0a1f1f]'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a4d4d]'
                    }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 mt-24 lg:mt-14 lg:p-12 lg:mx-auto">
          <div className="mb-8">
            <h1 className="text-white text-4xl font-bold mb-2">Profile</h1>
            <p className="text-gray-400 text-sm">All your details are shown here</p>
          </div>

          {/* Global feedback */}
          {profileError && (
            <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="mb-4 px-4 py-3 bg-green-900/40 border border-green-500/50 rounded-xl text-green-400 text-sm">
              {profileSuccess}
            </div>
          )}

          {/* ── ACCOUNT TAB ── */}
          {activeTab === 'account' && (
            <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-8 lg:p-12 w-full">
              <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-[#00ff88]">
                <h2 className="text-white text-xl font-semibold">View Profile</h2>
                <button
                  onClick={handleCopyUserId}
                  className="flex items-center gap-2 bg-[#0a1f1f] border-2 border-[#00ff88] text-[#00ff88] px-4 py-2 rounded-lg hover:bg-[#1a4d4d] transition-all duration-300"
                >
                  <span className="font-mono font-medium">{userId}</span>
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-40 h-40 rounded-full border-4 border-[#00ff88] overflow-hidden bg-gray-800">
                      <img
                        src={profileData?.profileImage || '/profile.jpg'}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Change picture
                  </button>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <Field label="Full Name" name="name" value={profileData?.name || ''} onChange={handleInputChange} />
                  <Field label="Phone number" name="phone" type="tel" value={profileData?.phone || ''} onChange={handleInputChange} />
                  <Field label="College" name="college" value={profileData?.college || ''} onChange={handleInputChange} />
                  <Field label="Graduation Year" name="graduationYear" type="number" value={profileData?.graduationYear || ''} onChange={handleInputChange} />
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Bio</label>
                    <textarea
                      name="bio"
                      value={profileData?.bio || ''}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[#00ff88]/50 disabled:opacity-60"
                  >
                    {savingProfile ? 'Saving…' : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Account Actions */}
              <div className="mt-10 space-y-6 border-t border-[#1a4d4d] pt-8">
                {/* Email */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Email</label>
                    <p className="text-white font-medium">{profileData?.email || '—'}</p>
                  </div>
                </div>

                {/* Organizer CTA / Become Organizer */}
                {profileData?.isOrganizer ? (
                  <div className="flex items-center justify-between pb-6 border-b border-[#1a4d4d]">
                    <div>
                      <h3 className="text-white text-lg font-medium mb-1">You're an Organizer 🎉</h3>
                      <p className="text-gray-400 text-sm">Ready to host your next event? Create one now.</p>
                    </div>
                    <button
                      onClick={() => navigate('/organize')}
                      className="bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Create an Event
                    </button>
                  </div>
                ) : profileData?.role !== 'ADMIN' && (
                  <div className="flex items-center justify-between pb-6 border-b border-[#1a4d4d]">
                    <div>
                      <h3 className="text-white text-lg font-medium mb-1">Become an Organizer</h3>
                      <p className="text-gray-400 text-sm">
                        {orgSubmitted
                          ? 'Your request is under review by our team.'
                          : 'Start creating and managing events'}
                      </p>
                    </div>
                    {orgSubmitted ? (
                      <span className="flex items-center gap-2 bg-yellow-900/40 border border-yellow-500/50 text-yellow-400 text-sm font-semibold px-4 py-2 rounded-lg">
                        ⏳ Pending Approval
                      </span>
                    ) : (
                      <button
                        onClick={handleBecomeOrganizer}
                        className="bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                )}

                {/* Sign Out */}
                <div className="flex items-center justify-between pb-6 border-b border-[#1a4d4d]">
                  <div>
                    <h3 className="text-white text-lg font-medium mb-1">You are signed in as {displayName}</h3>
                    <p className="text-gray-400 text-sm">Click to sign out of your account</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── MY EVENTS TAB ── */}
          {activeTab === 'myEvents' && (
            <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-8 lg:p-12 w-full space-y-10">

              {/* ── Events I'm Organising (organizer only) ── */}
              {profileData?.isOrganizer && (
                <div>
                  <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-[#00ff88]">
                    <h2 className="text-white text-2xl font-semibold">Events I'm Organising</h2>
                    <button
                      onClick={() => navigate('/organize')}
                      className="bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold px-5 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap text-sm"
                    >
                      + New Event
                    </button>
                  </div>

                  {loadingCreatedEvents ? (
                    <div className="flex items-center gap-3 text-gray-400 py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-[#00ff88]" />
                      <span className="text-sm">Loading your events…</span>
                    </div>
                  ) : myCreatedEvents.length === 0 ? (
                    <div className="bg-[#0a1f1f] border border-dashed border-[#1a4d4d] rounded-2xl p-8 text-center">
                      <p className="text-gray-400 mb-3">You haven't created any events yet.</p>
                      <button
                        onClick={() => navigate('/organize')}
                        className="text-[#00ff88] text-sm border border-[#00ff88] px-4 py-2 rounded-lg hover:bg-[#00ff88]/10 transition-colors"
                      >
                        Create your first event
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myCreatedEvents.map((evt) => {
                        const statusColors = {
                          DRAFT:            'bg-gray-700/50 text-gray-300 border-gray-600',
                          PENDING_APPROVAL: 'bg-yellow-900/40 text-yellow-400 border-yellow-600/50',
                          APPROVED:         'bg-green-900/40 text-[#00ff88] border-green-600/50',
                          REJECTED:         'bg-red-900/40 text-red-400 border-red-600/50',
                          COMPLETED:        'bg-blue-900/40 text-blue-400 border-blue-600/50',
                        };
                        const statusClass = statusColors[evt.status] || statusColors.DRAFT;
                        const poster = evt.eventPoster || evt.bannerImage;

                        return (
                          <div
                            key={evt.id}
                            className="bg-[#0a1f1f] border border-[#1a4d4d] hover:border-[#00ff88]/60 rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 group"
                          >
                            {/* Poster thumbnail */}
                            <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-[#0d2626] border border-[#1a4d4d]">
                              {poster ? (
                                <img src={poster} alt={evt.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xl">📅</div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-semibold truncate group-hover:text-[#00ff88] transition-colors">{evt.title}</h3>
                              <p className="text-gray-400 text-xs mt-0.5">
                                {evt.category} · {evt.mode}
                                {evt.startDate && (
                                  <span className="ml-2 text-gray-500">
                                    · {new Date(evt.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                )}
                              </p>
                              {evt._count?.registrations !== undefined && (
                                <p className="text-gray-500 text-xs mt-0.5">
                                  {evt._count.registrations} registration{evt._count.registrations !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>

                            {/* Status + Edit + View */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusClass}`}>
                                {evt.status?.replace('_', ' ')}
                              </span>
                              <button
                                onClick={() => openEditModal(evt)}
                                className="flex items-center gap-1.5 text-yellow-400 text-sm border border-yellow-500/50 px-4 py-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => navigate(`/event/${evt.id}`)}
                                className="text-[#00ff88] text-sm border border-[#00ff88] px-4 py-1.5 rounded-lg hover:bg-[#00ff88]/10 transition-colors"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Registered Events ── */}
              <div>
                <h2 className="text-white text-2xl font-semibold mb-5 pb-4 border-b-2 border-[#00ff88]">My Registered Events</h2>
                {myEvents.length === 0 ? (
                  <p className="text-gray-400">You haven't registered for any events yet.</p>
                ) : (
                  <div className="space-y-4">
                    {myEvents.map((reg, i) => {
                      const evt = reg.event || reg;
                      return (
                        <div key={reg.id || i} className="bg-[#0a1f1f] border border-[#1a4d4d] rounded-2xl p-5 flex items-center justify-between hover:border-[#00ff88] transition-colors">
                          <div>
                            <h3 className="text-white font-semibold">{evt.title || 'Event'}</h3>
                            <p className="text-gray-400 text-sm mt-1">{evt.category} · {evt.mode}</p>
                            <p className="text-gray-500 text-xs mt-1">Status: <span className="text-[#00ff88]">{reg.status || 'REGISTERED'}</span></p>
                          </div>
                          <button
                            onClick={() => navigate(`/event/${evt.id}`)}
                            className="text-[#00ff88] text-sm border border-[#00ff88] px-4 py-2 rounded-lg hover:bg-[#00ff88]/10 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── CERTIFICATES TAB ── */}
          {activeTab === 'certificates' && (
            <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-8 lg:p-12 w-full">
              <h2 className="text-white text-2xl font-semibold mb-6 pb-4 border-b-2 border-[#00ff88]">My Certificates</h2>
              {myCertificates.length === 0 ? (
                <p className="text-gray-400">No certificates yet. Participate in events to earn them!</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myCertificates.map((cert, i) => (
                    <div key={cert.id || i} className="bg-[#0a1f1f] border border-[#1a4d4d] rounded-2xl p-5 hover:border-[#00ff88] transition-colors">
                      <p className="text-white font-semibold mb-2">{cert.event?.title || 'Event Certificate'}</p>
                      <p className="text-gray-400 text-sm mb-4">Issued: {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : '—'}</p>
                      {cert.certificateUrl && (
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00ff88] text-sm border border-[#00ff88] px-4 py-2 rounded-lg hover:bg-[#00ff88]/10 transition-colors inline-block"
                        >
                          View Certificate
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── BOOKMARKS TAB ── */}
          {activeTab === 'bookmarks' && (
            <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-8 lg:p-12 w-full">
              <h2 className="text-white text-2xl font-semibold mb-6 pb-4 border-b-2 border-[#00ff88]">Saved Events</h2>
              {myBookmarks.length === 0 ? (
                <p className="text-gray-400">You haven't bookmarked any events yet.</p>
              ) : (
                <div className="space-y-4">
                  {myBookmarks.map((bm, i) => {
                    const evt = bm.event || bm;
                    return (
                      <div key={bm.id || i} className="bg-[#0a1f1f] border border-[#1a4d4d] rounded-2xl p-5 flex items-center justify-between hover:border-[#00ff88] transition-colors">
                        <div>
                          <h3 className="text-white font-semibold">{evt.title || 'Event'}</h3>
                          <p className="text-gray-400 text-sm mt-1">{evt.category} · {evt.mode}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/event/${evt.id}`)}
                          className="text-[#00ff88] text-sm border border-[#00ff88] px-4 py-2 rounded-lg hover:bg-[#00ff88]/10 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PASSWORD TAB ── */}
          {activeTab === 'password' && (
            <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-8 lg:p-12 w-full max-w-lg">
              <h2 className="text-white text-2xl font-semibold mb-6 pb-4 border-b-2 border-[#00ff88]">Change Password</h2>
              {passwordError && (
                <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-400 text-sm">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="mb-4 px-4 py-3 bg-green-900/40 border border-green-500/50 rounded-xl text-green-400 text-sm">{passwordSuccess}</div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-5">
                <Field label="Current Password" name="currentPassword" type="password" value={passwordData.currentPassword}
                  onChange={e => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))} />
                <Field label="New Password" name="newPassword" type="password" value={passwordData.newPassword}
                  onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))} />
                <Field label="Confirm New Password" name="confirmPassword" type="password" value={passwordData.confirmPassword}
                  onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))} />
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-60"
                >
                  {savingPassword ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d2626] border-t border-[#1a4d4d] p-4">
          <div className="flex justify-around">
            {[
              { key: 'account', label: 'Account' },
              { key: 'myEvents', label: 'Events' },
              { key: 'certificates', label: 'Certs' },
              { key: 'bookmarks', label: 'Saved' },
              { key: 'password', label: 'Password' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === key ? 'bg-[#00ff88] text-[#0a1f1f]' : 'text-gray-400'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Footer />

      {/* ── Organizer Request Modal ── */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-8 shadow-2xl shadow-[#00ff88]/10">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-white text-2xl font-bold mb-1">Become an Organizer</h2>
              <p className="text-gray-400 text-sm">Tell us about your organization. Our team will review your request.</p>
            </div>

            {orgError && (
              <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-400 text-sm">
                {orgError}
              </div>
            )}

            <form onSubmit={handleOrganizerSubmit} className="space-y-5">
              {/* Org Name */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Organization / Club Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={orgForm.orgName}
                  onChange={e => setOrgForm(f => ({ ...f, orgName: e.target.value }))}
                  placeholder="e.g. IEEE Student Chapter"
                  required
                  className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Contact Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={orgForm.orgEmail}
                  onChange={e => setOrgForm(f => ({ ...f, orgEmail: e.target.value }))}
                  placeholder="org@example.com"
                  required
                  className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                />
              </div>

              {/* Event Name */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Name of Your First Event <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={orgForm.eventName}
                  onChange={e => setOrgForm(f => ({ ...f, eventName: e.target.value }))}
                  placeholder="e.g. HackFest 2025"
                  required
                  className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowOrgModal(false); setOrgError(''); }}
                  className="flex-1 bg-transparent border-2 border-[#1a4d4d] hover:border-[#00ff88] text-gray-400 hover:text-white font-semibold py-3 rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrg}
                  className="flex-1 bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submittingOrg ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Event Modal ── */}
      {editingEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0d2f2f] border-b border-[#1a4d4d] px-8 py-5 flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="text-white text-xl font-bold">Edit Event</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#1a4d4d] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingEditData ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
              </div>
            ) : (
              <div className="px-8 py-6 space-y-5">
                {/* Error / Success */}
                {editError && (
                  <div className="px-4 py-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-400 text-sm">{editError}</div>
                )}
                {editSuccess && (
                  <div className="px-4 py-3 bg-green-900/40 border border-green-500/50 rounded-xl text-green-400 text-sm">{editSuccess}</div>
                )}

                {/* Title */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Title *</label>
                  <input
                    type="text" name="title" value={editForm.title || ''} onChange={handleEditFormChange}
                    className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Subtitle</label>
                  <input
                    type="text" name="subtitle" value={editForm.subtitle || ''} onChange={handleEditFormChange}
                    className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Description *</label>
                  <textarea
                    name="description" value={editForm.description || ''} onChange={handleEditFormChange} rows={5}
                    className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 resize-none"
                  />
                </div>

                {/* Category + Mode */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Category</label>
                    <select
                      name="category" value={editForm.category || 'Hackathon'} onChange={handleEditFormChange}
                      className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                    >
                      <option value="Hackathon">Hackathon</option>
                      <option value="Ideathon">Ideathon</option>
                      <option value="Webinar">Webinar</option>
                      <option value="Conclave">Conclave</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Mode</label>
                    <select
                      name="mode" value={editForm.mode || 'ONLINE'} onChange={handleEditFormChange}
                      className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                    >
                      <option value="ONLINE">Online</option>
                      <option value="OFFLINE">Offline</option>
                    </select>
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Theme</label>
                  <input
                    type="text" name="theme" value={editForm.theme || ''} onChange={handleEditFormChange}
                    className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                    placeholder="e.g. Workshop, AI, Design"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Start Date</label>
                    <input
                      type="datetime-local" name="startDate" value={editForm.startDate || ''} onChange={handleEditFormChange}
                      className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">End Date</label>
                    <input
                      type="datetime-local" name="endDate" value={editForm.endDate || ''} onChange={handleEditFormChange}
                      className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Reg. Deadline</label>
                    <input
                      type="datetime-local" name="registrationDeadline" value={editForm.registrationDeadline || ''} onChange={handleEditFormChange}
                      className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Location (for offline events) */}
                {editForm.mode === 'OFFLINE' && (
                  <div className="space-y-4 p-4 bg-[#0a1f1f]/50 rounded-xl border border-[#1a4d4d]">
                    <p className="text-gray-400 text-sm font-medium">Venue Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Venue Name</label>
                        <input
                          type="text" name="venueName" value={editForm.venueName || ''} onChange={handleEditFormChange}
                          className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Map Link</label>
                        <input
                          type="text" name="mapLink" value={editForm.mapLink || ''} onChange={handleEditFormChange}
                          className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                          placeholder="https://maps.app.goo.gl/..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Address</label>
                      <input
                        type="text" name="address" value={editForm.address || ''} onChange={handleEditFormChange}
                        className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Prize */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Prize Type</label>
                    <select
                      name="prizeType" value={editForm.prizeType || 'NONE'} onChange={handleEditFormChange}
                      className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                    >
                      <option value="NONE">No Prize</option>
                      <option value="CASH">Cash Prize</option>
                      <option value="MERCH">Merchandise</option>
                      <option value="POINTS">Points</option>
                    </select>
                  </div>
                  {editForm.prizeType && editForm.prizeType !== 'NONE' && (
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Prize Amount (₹)</label>
                      <input
                        type="number" name="prizeAmount" value={editForm.prizeAmount || 0} onChange={handleEditFormChange}
                        className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                {/* Paid + Ticket Price */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox" name="isPaid" checked={editForm.isPaid || false} onChange={handleEditFormChange}
                      className="w-5 h-5 rounded border-2 border-[#1a4d4d] bg-transparent checked:bg-[#00ff88] checked:border-[#00ff88] focus:ring-0 cursor-pointer accent-[#00ff88]"
                    />
                    <span className="text-white text-sm">Paid Event</span>
                  </label>
                  {editForm.isPaid && (
                    <div className="flex-1">
                      <input
                        type="number" name="ticketPrice" value={editForm.ticketPrice || 0} onChange={handleEditFormChange}
                        className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-2 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                        placeholder="Ticket price (₹)" min="0"
                      />
                    </div>
                  )}
                </div>

                {/* ── Images ── */}
                <div className="space-y-4 p-4 bg-[#0a1f1f]/50 rounded-xl border border-[#1a4d4d]">
                  <p className="text-gray-400 text-sm font-medium">Event Images</p>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Banner */}
                    <div>
                      <label className="text-gray-400 text-xs mb-2 block">Banner Image</label>
                      {editForm.bannerImage && (
                        <img src={editForm.bannerImage} alt="Banner" className="w-full h-24 object-cover rounded-lg mb-2 border border-[#1a4d4d]" />
                      )}
                      <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} accept="image/*" className="hidden" />
                      <button
                        type="button" onClick={() => bannerInputRef.current?.click()} disabled={savingEdit}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 border border-dashed border-[#1a4d4d] hover:border-[#00ff88] hover:text-[#00ff88] py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {editForm.bannerImage ? 'Replace Banner' : 'Upload Banner'}
                      </button>
                    </div>
                    {/* Poster */}
                    <div>
                      <label className="text-gray-400 text-xs mb-2 block">Event Poster</label>
                      {editForm.eventPoster && (
                        <img src={editForm.eventPoster} alt="Poster" className="w-full h-24 object-cover rounded-lg mb-2 border border-[#1a4d4d]" />
                      )}
                      <input type="file" ref={posterInputRef} onChange={handlePosterUpload} accept="image/*" className="hidden" />
                      <button
                        type="button" onClick={() => posterInputRef.current?.click()} disabled={savingEdit}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 border border-dashed border-[#1a4d4d] hover:border-[#00ff88] hover:text-[#00ff88] py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {editForm.eventPoster ? 'Replace Poster' : 'Upload Poster'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── FAQs ── */}
                <div className="space-y-3 p-4 bg-[#0a1f1f]/50 rounded-xl border border-[#1a4d4d]">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm font-medium">FAQs</p>
                    <button type="button" onClick={addEditFaq} className="flex items-center gap-1 text-[#00ff88] text-xs hover:text-[#00cc70] transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add FAQ
                    </button>
                  </div>
                  {(editForm.faqs || []).length === 0 && (
                    <p className="text-gray-500 text-xs">No FAQs yet. Click "Add FAQ" to create one.</p>
                  )}
                  {(editForm.faqs || []).map((faq, i) => (
                    <div key={faq.id || `new-faq-${i}`} className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-xl p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <input
                          type="text" placeholder="Question" value={faq.question || ''}
                          onChange={e => handleEditFaqChange(i, 'question', e.target.value)}
                          className="flex-1 bg-transparent border border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                        />
                        <button type="button" onClick={() => removeEditFaq(i)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        placeholder="Answer" value={faq.answer || ''}
                        onChange={e => handleEditFaqChange(i, 'answer', e.target.value)} rows={2}
                        className="w-full bg-transparent border border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm resize-none"
                      />
                    </div>
                  ))}
                </div>

                {/* ── Announcements ── */}
                <div className="space-y-3 p-4 bg-[#0a1f1f]/50 rounded-xl border border-[#1a4d4d]">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm font-medium">Announcements</p>
                    <button type="button" onClick={addEditAnnouncement} className="flex items-center gap-1 text-[#00ff88] text-xs hover:text-[#00cc70] transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Announcement
                    </button>
                  </div>
                  {(editForm.announcements || []).length === 0 && (
                    <p className="text-gray-500 text-xs">No announcements yet. Click "Add Announcement" to create one.</p>
                  )}
                  {(editForm.announcements || []).map((ann, i) => (
                    <div key={ann.id || `new-ann-${i}`} className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-xl p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <input
                          type="text" placeholder="Title" value={ann.title || ''}
                          onChange={e => handleEditAnnouncementChange(i, 'title', e.target.value)}
                          className="flex-1 bg-transparent border border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                        />
                        <button type="button" onClick={() => removeEditAnnouncement(i)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        placeholder="Content" value={ann.content || ''}
                        onChange={e => handleEditAnnouncementChange(i, 'content', e.target.value)} rows={2}
                        className="w-full bg-transparent border border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm resize-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-[#1a4d4d]">
                  <button
                    type="button" onClick={closeEditModal}
                    className="flex-1 bg-transparent border-2 border-[#1a4d4d] hover:border-[#00ff88] text-gray-400 hover:text-white font-semibold py-3 rounded-xl transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button" onClick={handleEditSave} disabled={savingEdit}
                    className="flex-1 bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {savingEdit ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;