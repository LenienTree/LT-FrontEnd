import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Edit2, LogOut, Loader2 } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState('account');

  // Profile data state
  const [profileData, setProfileData] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [myCreatedEvents, setMyCreatedEvents] = useState([]);
  const [loadingCreatedEvents, setLoadingCreatedEvents] = useState(false);
  const [myCertificates, setMyCertificates] = useState([]);
  const [myBookmarks, setMyBookmarks] = useState([]);

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
                setMyCreatedEvents(list);
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

                            {/* Status + View */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusClass}`}>
                                {evt.status?.replace('_', ' ')}
                              </span>
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
    </>
  );
};

export default Profile;