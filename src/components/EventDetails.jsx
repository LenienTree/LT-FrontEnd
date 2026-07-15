import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Loader2, Pencil, Share2, Twitter, Linkedin, Send, Copy } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Header from './layout/Header';
import Footer from './layout/Footer';
import CountdownTimer from './CountdownTimer';
import { events as eventsApi, bookmarks as bookmarksApi } from '../services/api';
import { captureReferral } from '../services/referralTracker';
import { useAuth } from '../context/AuthContext';

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-[#0d2f2f]/50 border-2 border-[#1a4d4d] rounded-2xl overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-[#1a4d4d]/30 transition-colors"
            >
                <span className="text-white font-medium text-lg">{question}</span>
                <div className={`flex-shrink-0 ml-4 w-8 h-8 rounded-full bg-[#00ff88] flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="px-6 pb-6 text-gray-400 text-sm leading-relaxed">{answer}</div>
            </div>
        </div>
    );
};

// ─── EventDetails Component ───────────────────────────────────────────────────

const EventDetails = () => {
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const [searchParams] = useSearchParams();
    const eventId = paramId || searchParams.get('id');
    // Support both the new short `?r=` param and the legacy `?ref=`.
    const refCode = searchParams.get('r') || searchParams.get('ref');

    const { isAuthenticated, openAuthModal, user } = useAuth();

    const [eventData, setEventData] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [registrationStatus, setRegistrationStatus] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [relatedEvents, setRelatedEvents] = useState([]);
    const [copied, setCopied] = useState(false);

    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [bookmarking, setBookmarking] = useState(false);
    const [error, setError] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState('');

    // ── Load event data ──
    useEffect(() => {
        if (!eventId) {
            setError('No event ID provided.');
            setLoading(false);
            return;
        }

        const fetchEvent = async () => {
            try {
                // Resolve the event first — `eventId` may be a UUID or a short slug.
                // Everything else is keyed off the resolved real id (data.id).
                const eventRes = await eventsApi.getById(eventId).catch(() => null);
                const data = eventRes?.event || eventRes;
                if (!data?.id) {
                    setError('Event not found.');
                    setLoading(false);
                    return;
                }
                setEventData(data);
                const realId = data.id;
                const loadedCategory = data.category;

                // Attribute the referral (from ?r= / ?ref=) against the real event id
                // so it matches what the registration page reads.
                if (refCode) captureReferral(realId, refCode);

                const [announcementsRes, faqsRes] = await Promise.allSettled([
                    eventsApi.getAnnouncements(realId),
                    eventsApi.getFAQs(realId),
                ]);
                if (announcementsRes.status === 'fulfilled') {
                    setAnnouncements(announcementsRes.value?.announcements || announcementsRes.value || []);
                }
                if (faqsRes.status === 'fulfilled') {
                    setFaqs(faqsRes.value?.faqs || faqsRes.value || []);
                }

                // Check registration status only if logged in
                if (isAuthenticated) {
                    try {
                        const statusRes = await eventsApi.checkRegistrationStatus(realId);
                        setRegistrationStatus(statusRes);
                        setIsBookmarked(statusRes?.isBookmarked || false);
                    } catch (_) { /* silent */ }
                }

                // Fetch related events if category exists
                if (loadedCategory) {
                    try {
                        const relatedRes = await eventsApi.getAll({ category: loadedCategory, limit: 5 });
                        const relatedList = relatedRes?.events || (Array.isArray(relatedRes) ? relatedRes : []);
                        setRelatedEvents(relatedList.filter(e => e.id !== realId).slice(0, 3));
                    } catch (_) { /* silent */ }
                }
            } catch (err) {
                setError(err.message || 'Failed to load event.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId, isAuthenticated]);

    const handleRegister = () => {
        if (!isAuthenticated) {
            openAuthModal('login');
            return;
        }
        // If this event has an external registration link, open it in a new tab
        if (eventData?.registrationLink) {
            window.open(eventData.registrationLink, '_blank', 'noopener,noreferrer');
            return;
        }
        navigate(`/event/${eventData?.id ?? eventId}/register`);
    };

    const handleBookmark = async () => {
        if (!isAuthenticated) {
            openAuthModal('login');
            return;
        }
        setBookmarking(true);
        try {
            const res = await bookmarksApi.toggle(eventData?.id ?? eventId);
            setIsBookmarked(res?.bookmarked ?? !isBookmarked);
        } catch (err) {
            setError(err.message || 'Bookmark failed.');
        } finally {
            setBookmarking(false);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a1f1f] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#00ff88] animate-spin" />
            </div>
        );
    }

    if (!eventData) {
        return (
            <div className="min-h-screen bg-[#0a1f1f] flex flex-col items-center justify-center gap-4">
                <p className="text-red-400 text-lg">{error || 'Event not found.'}</p>
                <button onClick={() => navigate(-1)} className="text-[#00ff88] underline">Go Back</button>
            </div>
        );
    }

    // ── Derived values ──
    const startDate = eventData.startDate ? new Date(eventData.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const endDate = eventData.endDate ? new Date(eventData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const dateRange = startDate && endDate ? `${startDate} – ${endDate}` : startDate;
    const isRegistered = registrationStatus?.isRegistered;
    
    const eventUrl = window.location.href;
    const totalRegistrations = eventData._count?.registrations ?? 0;
    const maxParticipants = eventData.maxParticipants ?? 0;
    const percentFilled = maxParticipants > 0 ? Math.min(100, Math.round((totalRegistrations / maxParticipants) * 100)) : 0;
    const isFull = maxParticipants > 0 && totalRegistrations >= maxParticipants;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(eventUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen  bg-[#0a1f1f]">
            <Helmet>
                <title>{`${eventData.title} | LenientTree`}</title>
                <meta name="description" content={eventData.subtitle || eventData.description} />
                <meta property="og:title" content={eventData.title} />
                <meta property="og:description" content={eventData.subtitle || eventData.description} />
                <meta property="og:image" content={eventData.bannerImage || eventData.eventPoster} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>
            <Header />

            <div className="container mx-auto px-4 sm:px-6 md:px-10 pt-24 py-8">
                {/* Top Navigation */}
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 bg-[#0d2f2f] hover:bg-[#1a4d4d] text-white px-4 py-2 rounded-lg transition-colors duration-300 border-2 border-[#00ff88]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Go Back</span>
                    </button>
                </div>

                {/* Error / Success */}
                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-400 text-sm">{error}</div>
                )}
                {registerSuccess && (
                    <div className="mb-4 px-4 py-3 bg-green-900/40 border border-green-500/50 rounded-xl text-green-400 text-sm">{registerSuccess}</div>
                )}

                {/* Event Banner */}
                <div className="hidden sm:block rounded-3xl mb-8 relative overflow-hidden min-h-[300px] lg:min-h-[500px]">
                    {eventData.bannerImage ? (
                        <div className="absolute inset-0">
                            <img src={eventData.bannerImage} alt="Event Banner" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                    ) : (
                        <div className={`absolute inset-0 ${
                            eventData.isPremium
                                ? "bg-gradient-to-r from-amber-950 via-amber-900 to-[#1e1405]"
                               : "bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700"
                        }`} />
                    )}
                </div>

                {/* Event Details Section */}
                <div className="grid lg:grid-cols-3 gap-8 mb-8 relative z-20 mt-0 sm:mt-[-60px] lg:mt-[-150px]">
                    {/* Poster */}
                    <div className="lg:col-span-1">
                        <div className={`rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${
                            eventData.isPremium
                                ? "bg-amber-950 border-4 border-amber-500/80 shadow-amber-500/20"
                                : "bg-blue-900 border-4 border-blue-700 shadow-blue-500/10"
                        }`}>
                            {eventData.eventPoster ? (
                                <img src={eventData.eventPoster} alt="Event Poster" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                                <div className="aspect-[3/4] flex items-center justify-center text-gray-400">
                                    No poster available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="lg:col-span-2 space-y-6 pt-6 lg:pt-48 px-2 sm:px-4 lg:px-20">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold">{eventData.title || 'Event Name'}</h2>
                                {eventData.isPremium && (
                                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-xs px-3 py-1 rounded-full shadow-lg shadow-amber-500/20 uppercase tracking-widest animate-pulse">
                                        👑 Premium
                                    </span>
                                )}
                            </div>
                            {eventData.subtitle && <p className="text-gray-400 text-lg">{eventData.subtitle}</p>}
                        </div>

                        <div className="flex flex-wrap gap-4 text-gray-400 items-center">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{dateRange || 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                </svg>
                                <span>{eventData.mode}</span>
                            </div>
                            {eventData.category && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                    eventData.isPremium
                                        ? "bg-amber-950/40 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-900/30"
                                        : "bg-[#1a4d4d] text-[#00ff88] border-transparent"
                                }`}>
                                    {eventData.category}
                                </span>
                            )}
                            {(eventData.venueName || eventData.mapLink) && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>
                                        {eventData.venueName}
                                        {eventData.mapLink && (
                                            <a href={eventData.mapLink.startsWith('http') ? eventData.mapLink : `https://${eventData.mapLink}`} target="_blank" rel="noopener noreferrer" className="ml-1.5 text-[#00ff88] hover:underline font-medium">
                                                (Map)
                                            </a>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>

                        {eventData.isPremium && (
                            <div className="bg-gradient-to-r from-amber-950/40 to-yellow-950/20 border border-amber-500/30 rounded-2xl p-6 flex items-start gap-4 shadow-lg shadow-amber-950/20 relative overflow-hidden backdrop-blur-md">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
                                <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">👑</span>
                                <div>
                                    <h4 className="text-amber-400 font-bold text-base tracking-wide uppercase">Premium Partnered Event</h4>
                                    <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                                        Verified Official Partner. This event features exclusive perks, including guaranteed certification, prioritized support, and special eligibility for Lenient Tree career tracks.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {isAuthenticated && (user?.role === 'ADMIN' || eventData?.organizerId === user?.id || eventData?.organizer?.id === user?.id) && (
                                <button
                                    onClick={() => navigate(`/organize/edit/${eventData.id}`)}
                                    className="w-full font-bold text-lg py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-600/20 flex items-center justify-center gap-2"
                                >
                                    <Pencil className="w-5 h-5" />
                                    Edit Event (Admin/Organizer)
                                </button>
                            )}

                            {isRegistered ? (
                                <div className={`w-full font-bold text-lg py-4 px-6 rounded-xl text-center border-2 ${
                                    eventData.isPremium
                                        ? "bg-[#181105] border-amber-400 text-amber-400"
                                        : "bg-[#0d2f2f] border-2 border-[#00ff88] text-[#00ff88]"
                                }`}>
                                    ✓ Registered — Status: {registrationStatus?.status || 'PENDING'}
                                </div>
                            ) : (
                                <button
                                    id="register-event-btn"
                                    onClick={handleRegister}
                                    disabled={registering}
                                    className={`w-full font-bold text-lg py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-60 ${
                                        eventData.isPremium
                                            ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-[#0c2222] shadow-amber-500/20 hover:shadow-amber-400/40"
                                            : "bg-[#00ff88] hover:bg-[#00cc70] text-black shadow-[#00ff88]/30"
                                    }`}
                                >
                                    {registering ? 'Registering…' : eventData.isPremium ? 'Claim Premium Pass & Register' : 'Register Now'}
                                </button>
                            )}

                            <button
                                id="bookmark-event-btn"
                                onClick={handleBookmark}
                                disabled={bookmarking}
                                className={`w-full border-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-medium text-lg py-4 px-6 ${
                                    eventData.isPremium
                                        ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-400 text-amber-400 hover:bg-amber-950/40"
                                        : "bg-[#0d2f2f] border-[#1a4d4d] hover:border-[#00ff88] text-white"
                                }`}
                            >
                                {isBookmarked ? <BookmarkCheck className={`w-5 h-5 ${eventData.isPremium ? 'text-amber-400' : 'text-[#00ff88]'}`} /> : <Bookmark className="w-5 h-5" />}
                                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                            </button>
                        </div>

                        {/* Capacity Bar */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-4">
                            <div className="flex justify-between items-center text-xs font-semibold text-gray-400 mb-2">
                                <span>Registration Capacity</span>
                                <span className="text-white">
                                    {totalRegistrations}{maxParticipants > 0 ? ` / ${maxParticipants}` : ""} slots filled
                                </span>
                            </div>
                            {maxParticipants > 0 ? (
                                <>
                                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-500 to-[#9AE600] rounded-full transition-all duration-500" 
                                            style={{ width: `${percentFilled}%` }} 
                                        />
                                    </div>
                                    {isFull && (
                                        <p className="text-[10px] text-rose-400 font-bold mt-2 text-center">
                                            ⚠️ Registration is full!
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="text-[10px] text-[#9AE600] font-bold mt-1">
                                    Unlimited capacity (open enrollment)
                                </div>
                            )}
                        </div>

                        {/* Share buttons */}
                        <div className="mt-6 border-t border-white/10 pt-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Share Event</p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:text-[#9AE600] transition-all flex items-center justify-center gap-1.5 text-xs font-semibold flex-grow"
                                >
                                    <Copy className="w-4 h-4" />
                                    {copied ? "Copied!" : "Copy Link"}
                                </button>
                                <a
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this event: ${eventData.title}`)}&url=${encodeURIComponent(eventUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:text-sky-400 transition-all flex items-center justify-center"
                                    title="Share on Twitter"
                                >
                                    <Twitter className="w-4 h-4" />
                                </a>
                                <a
                                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:text-blue-500 transition-all flex items-center justify-center"
                                    title="Share on LinkedIn"
                                >
                                    <Linkedin className="w-4 h-4" />
                                </a>
                                <a
                                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this event: ${eventData.title} - ${eventUrl}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:text-emerald-500 transition-all flex items-center justify-center"
                                    title="Share on WhatsApp"
                                >
                                    <Send className="w-4 h-4 -rotate-45" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Announcements */}
                <div className="mb-12">
                    <h3 className="text-white text-xl font-semibold mb-6">Announcements</h3>
                    <div className="bg-[#0d2f2f]/30 border-2 border-[#1a4d4d] rounded-3xl p-6 lg:p-8 space-y-6">
                        {eventData.endDate && <CountdownTimer endDate={eventData.endDate} />}

                        {announcements.length === 0 ? (
                            <div className="bg-gradient-to-r from-[#0a1f1f] to-[#0d2f2f] border-2 border-[#1a4d4d] rounded-2xl p-6 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h4 className="text-white text-xl font-bold mb-2">Check out the event details below</h4>
                                    <p className="text-gray-400 text-sm">Make sure to register before the slots fill up!</p>
                                </div>
                            </div>
                        ) : (
                            announcements.map((ann, i) => (
                                <div key={ann.id || i} className="bg-gradient-to-r from-[#0a1f1f] to-[#0d2f2f] border-2 border-[#1a4d4d] rounded-2xl p-6">
                                    <h4 className="text-white text-lg font-bold mb-2">{ann.title}</h4>
                                    <p className="text-gray-400 text-sm">{ann.content}</p>
                                    {ann.createdAt && (
                                        <p className="text-gray-500 text-xs mt-2">{new Date(ann.createdAt).toLocaleString()}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Prize Details */}
                {eventData.prizeType && eventData.prizeType !== 'NONE' && (
                    <div className="mb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <h3 className="text-white text-xl font-semibold shrink-0">Details</h3>
                            <div className="h-[2px] bg-[#1a4d4d] w-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className={`p-8 text-center group transition-all duration-300 transform hover:-translate-y-1 rounded-2xl ${
                                eventData.isPremium
                                    ? "bg-amber-950/20 border-2 border-amber-500/60 hover:bg-amber-500/5 shadow-md shadow-amber-900/10"
                                    : "bg-[#0d2f2f]/30 border-2 border-[#00ff88] hover:bg-[#00ff88]/5"
                            }`}>
                                <p className="text-gray-400 text-sm mb-2">{eventData.prizeType}</p>
                                <p className="text-white text-4xl font-bold">
                                    {eventData.prizeAmount ? `₹${eventData.prizeAmount.toLocaleString()}` : 'TBA'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* About Event */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-white text-xl font-semibold shrink-0">About Event</h3>
                        <div className="h-[2px] bg-[#1a4d4d] w-full" />
                    </div>
                    <div className="text-gray-300 leading-relaxed text-sm space-y-6">
                        <div className={`p-6 rounded-r-2xl border-l-4 ${
                            eventData.isPremium
                                ? "bg-amber-950/10 border-amber-500"
                                : "bg-[#0d2f2f]/20 border-[#00ff88]"
                        }`}>
                            <p className="whitespace-pre-wrap">{eventData.description || 'No description provided.'}</p>
                        </div>

                        {/* Registration deadline */}
                        {eventData.registrationDeadline && (
                            <div className="bg-[#0d2f2f]/20 border border-[#1a4d4d] rounded-2xl p-4 flex items-center gap-3">
                                <svg className="w-5 h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-gray-400 text-sm">
                                    Registration deadline: <span className="text-white">{new Date(eventData.registrationDeadline).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* FAQs */}
                <div className="mb-12">
                    <h3 className="text-white text-2xl font-bold mb-6">FAQs</h3>
                    {faqs.length === 0 ? (
                        <p className="text-gray-400 text-sm">No FAQs available for this event.</p>
                    ) : (
                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <FAQItem key={faq.id || i} question={faq.question} answer={faq.answer} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Related Events */}
                {relatedEvents.length > 0 && (
                    <div className="mb-12 border-t border-white/10 pt-12">
                        <h3 className="text-white text-2xl font-bold mb-6">Related Events</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedEvents.map((evt) => (
                                <Link
                                    key={evt.id}
                                    to={`/event/${evt.id}`}
                                    className="group bg-[#0d2f2f]/30 border border-[#1a4d4d] rounded-2xl overflow-hidden hover:border-[#00ff88]/50 hover:bg-[#0d2f2f]/50 transition-all duration-300 flex flex-col"
                                >
                                    <div className="aspect-[16/9] relative overflow-hidden bg-black/20">
                                        {evt.bannerImage ? (
                                            <img src={evt.bannerImage} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#0d2f2f] text-gray-500 text-xs">
                                                No Banner
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h4 className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#00ff88] transition-colors">{evt.title}</h4>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed flex-grow">{evt.subtitle || evt.description}</p>
                                        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-4 border-t border-white/5 pt-3 font-semibold uppercase tracking-wider">
                                            <span>{new Date(evt.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            <span className="text-[#00ff88]">{evt.mode}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default EventDetails;
