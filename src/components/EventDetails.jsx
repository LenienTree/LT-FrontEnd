import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import Header from './layout/Header';
import Footer from './layout/Footer';
import CountdownTimer from './CountdownTimer';
import { events as eventsApi, bookmarks as bookmarksApi } from '../services/api';
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

    const { isAuthenticated } = useAuth();

    const [eventData, setEventData] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [registrationStatus, setRegistrationStatus] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(false);

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
                const [eventRes, announcementsRes, faqsRes] = await Promise.allSettled([
                    eventsApi.getById(eventId),
                    eventsApi.getAnnouncements(eventId),
                    eventsApi.getFAQs(eventId),
                ]);

                if (eventRes.status === 'fulfilled') {
                    setEventData(eventRes.value?.event || eventRes.value);
                } else {
                    setError('Event not found.');
                }

                if (announcementsRes.status === 'fulfilled') {
                    setAnnouncements(announcementsRes.value?.announcements || announcementsRes.value || []);
                }
                if (faqsRes.status === 'fulfilled') {
                    setFaqs(faqsRes.value?.faqs || faqsRes.value || []);
                }

                // Check registration status only if logged in
                if (isAuthenticated) {
                    try {
                        const statusRes = await eventsApi.checkRegistrationStatus(eventId);
                        setRegistrationStatus(statusRes);
                        setIsBookmarked(statusRes?.isBookmarked || false);
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

    const handleRegister = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setRegistering(true);
        setError('');
        try {
            await eventsApi.registerForEvent(eventId, {});
            setRegisterSuccess('You are registered! Check your email for confirmation.');
            setRegistrationStatus(prev => ({ ...prev, isRegistered: true, status: 'PENDING' }));
        } catch (err) {
            setError(err.message || 'Registration failed.');
        } finally {
            setRegistering(false);
        }
    };

    const handleBookmark = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setBookmarking(true);
        try {
            const res = await bookmarksApi.toggle(eventId);
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
    console.log("Event data", eventData)
    return (
        <div className="min-h-screen  bg-[#0a1f1f]">
            <Header />

            <div className="container pl-10 pr-10 pt-24 mx-auto px-4 py-8">
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
                <div className="rounded-3xl p-8 lg:p-12 mb-8 relative overflow-hidden min-h-[300px] lg:min-h-[500px]">
                    {eventData.bannerImage ? (
                        <div className="absolute inset-0">
                            <img src={eventData.bannerImage} alt="Event Banner" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700" />
                    )}

                    <div className="absolute left-8 lg:left-12 top-1/2 transform -translate-y-1/2 z-10">
                        <div className="text-white text-6xl lg:text-7xl font-bold opacity-80">••••</div>
                    </div>

                    <div className="relative z-10 text-center text-white ml-0 lg:ml-32">
                        <h1 className="text-3xl lg:text-5xl font-bold mb-4">{dateRange || 'TBD'}</h1>
                        <p className="text-xl lg:text-2xl mb-2">Mode: {eventData.mode}</p>
                        {(eventData.venueName || eventData.mapLink) && (
                            <p className="text-lg text-gray-200">
                                {eventData.venueName} {eventData.mapLink && `(${eventData.mapLink})`}
                            </p>
                        )}
                    </div>
                </div>

                {/* Event Details Section */}
                <div className="grid lg:grid-cols-3 gap-8 mb-8 relative z-20 mt-[-60px] lg:mt-[-150px]">
                    {/* Poster */}
                    <div className="lg:col-span-1">
                        <div className="bg-blue-900 rounded-2xl overflow-hidden border-4 border-blue-700 shadow-2xl">
                            {eventData.eventPoster ? (
                                <img src={eventData.eventPoster} alt="Event Poster" className="h-full" />
                            ) : (
                                <div className="aspect-[3/4] flex items-center justify-center text-gray-400">
                                    No poster available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="lg:col-span-2 space-y-6 pt-10 lg:pt-48 px-1 lg:px-20">
                        <div>
                            <h2 className="text-white text-4xl font-bold mb-2">{eventData.title || 'Event Name'}</h2>
                            {eventData.subtitle && <p className="text-gray-400 text-lg">{eventData.subtitle}</p>}
                        </div>

                        <div className="flex flex-wrap gap-4 text-gray-400">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{dateRange || 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                </svg>
                                <span>{eventData.mode}</span>
                            </div>
                            {eventData.category && (
                                <span className="bg-[#1a4d4d] text-[#00ff88] px-3 py-1 rounded-full text-sm">{eventData.category}</span>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {isRegistered ? (
                                <div className="w-full bg-[#0d2f2f] border-2 border-[#00ff88] text-[#00ff88] font-bold text-lg py-4 px-6 rounded-xl text-center">
                                    ✓ Registered — Status: {registrationStatus?.status || 'PENDING'}
                                </div>
                            ) : (
                                <button
                                    id="register-event-btn"
                                    onClick={handleRegister}
                                    disabled={registering}
                                    className="w-full bg-[#00ff88] hover:bg-[#00cc70] text-black font-bold text-lg py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#00ff88]/30 disabled:opacity-60"
                                >
                                    {registering ? 'Registering…' : 'Register Now'}
                                </button>
                            )}

                            <button
                                id="bookmark-event-btn"
                                onClick={handleBookmark}
                                disabled={bookmarking}
                                className="w-full bg-[#0d2f2f] border-2 border-[#1a4d4d] hover:border-[#00ff88] text-white font-medium text-lg py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {isBookmarked ? <BookmarkCheck className="w-5 h-5 text-[#00ff88]" /> : <Bookmark className="w-5 h-5" />}
                                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                            </button>
                        </div>

                        {/* Participant count */}
                        {eventData.maxParticipants && (
                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-sm">{eventData.maxParticipants} slots available</span>
                            </div>
                        )}
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
                            <div className="bg-[#0d2f2f]/30 border-2 border-[#00ff88] rounded-2xl p-8 text-center group hover:bg-[#00ff88]/5 transition-all duration-300 transform hover:-translate-y-1">
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
                        <div className="bg-[#0d2f2f]/20 border-l-4 border-[#00ff88] p-6 rounded-r-2xl">
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
            </div>

            <Footer />
        </div>
    );
};

export default EventDetails;
