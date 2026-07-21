import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2, CheckCircle2, AlertCircle, Download, Copy, Check, Link, Linkedin, Upload } from 'lucide-react';
import Header from './layout/Header';
import Footer from './layout/Footer';
import { events as eventsApi } from '../services/api';
import { getReferral, clearReferral } from '../services/referralTracker';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../utils/analytics';

const EventRegistration = () => {
    const navigate = useNavigate();
    const { id: eventId } = useParams();
    const { isAuthenticated, openAuthModal, user } = useAuth();

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [form, setForm] = useState({});
    const [formFields, setFormFields] = useState([]);

    const [teamMembers, setTeamMembers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    // Manual UPI payment proof
    const [paymentProofFile, setPaymentProofFile] = useState(null);

    // IEEE Member registration state
    const [isMember, setIsMember] = useState(false);
    const [ieeeMemberId, setIeeeMemberId] = useState('');

    // LinkedIn post flow (only for the special events / premium settings)
    const isShareEvent = eventData?.requiresLinkedinShare ?? false;
    const [linkedinPostLink, setLinkedinPostLink] = useState('');
    const [copiedDescription, setCopiedDescription] = useState(false);
    const [linkedinLinkError, setLinkedinLinkError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            openAuthModal('login');
        }
    }, [isAuthenticated, openAuthModal]);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await eventsApi.getById(eventId);
                const e = res?.event || res;
                if (!e) throw new Error('Event not found');
                setEventData(e);
                
                if (isAuthenticated) {
                    try {
                        const statusRes = await eventsApi.checkRegistrationStatus(eventId);
                        if (statusRes?.isRegistered) {
                            setError('You are already registered for this event. Redirecting...');
                            setTimeout(() => {
                                navigate(`/event/${eventId}`);
                            }, 3000);
                            return;
                        }
                    } catch (_) { /* silent */ }
                }

                const defaultFields = [
                    { label: 'name', type: 'text', required: true },
                    { label: 'email', type: 'email', required: true },
                    { label: 'phone', type: 'tel', required: true },
                    { label: 'college', type: 'text', required: true }
                ];
                
                let parsedFields = e.customFormFields;
                if (typeof parsedFields === 'string') {
                    try {
                        parsedFields = JSON.parse(parsedFields);
                    } catch (_) {
                        parsedFields = null;
                    }
                }
                
                let fields = parsedFields && Array.isArray(parsedFields) && parsedFields.length > 0 
                    ? parsedFields 
                    : defaultFields;

                setFormFields(fields);

                const initialForm = {};
                fields.forEach(field => {
                    const key = field.label;
                    const keyLower = key.toLowerCase();
                    if (keyLower.includes('name')) initialForm[key] = user?.name || '';
                    else if (keyLower.includes('email')) initialForm[key] = user?.email || '';
                    else if (keyLower.includes('phone')) initialForm[key] = user?.phone || '';
                    else if (keyLower.includes('college')) initialForm[key] = user?.college || '';
                    else initialForm[key] = '';
                });
                setForm(initialForm);

            } catch (err) {
                setError(err.message || 'Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId, isAuthenticated, user, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleTeamMemberChange = (index, field, value) => {
        setTeamMembers(prev => {
            const newMembers = [...prev];
            newMembers[index] = { ...newMembers[index], [field]: value };
            return newMembers;
        });
    };

    const addTeamMember = () => {
        const initialMember = {};
        formFields.forEach(f => { initialMember[f.label] = ''; });
        setTeamMembers(prev => [...prev, initialMember]);
    };

    const removeTeamMember = (index) => {
        setTeamMembers(prev => prev.filter((_, i) => i !== index));
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Returns true when a required field has no acceptable answer.
    // Handles every field type produced by the form builder: `checkbox` stores a
    // boolean (a required checkbox must be ticked), everything else stores a string.
    // Guards against calling string methods like .trim() on non-string values.
    const isFieldMissing = (field, value) => {
        if (field?.type === 'checkbox') return value !== true;
        if (value === undefined || value === null) return true;
        return String(value).trim() === '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            // Validate
            for (const f of formFields) {
                if (f.required && isFieldMissing(f, form[f.label])) {
                    throw new Error(`Please fill in ${f.label} for the primary member.`);
                }
            }

            for (let i = 0; i < teamMembers.length; i++) {
                const m = teamMembers[i];
                for (const f of formFields) {
                    if (f.required && isFieldMissing(f, m[f.label])) {
                        throw new Error(`Please fill in ${f.label} for Team Member ${i + 1}`);
                    }
                }
            }

            // Validate LinkedIn post link for the special event
            if (isShareEvent) {
                if (!linkedinPostLink.trim()) {
                    throw new Error('Please paste your LinkedIn post link before registering.');
                }
                const urlPattern = /^https?:\/\/.+/;
                if (!urlPattern.test(linkedinPostLink.trim())) {
                    throw new Error('Please enter a valid URL for your LinkedIn post link.');
                }
            }

            // IEEE membership validation
            if (eventData?.isIeeeEvent) {
                if (isMember && eventData?.requiresIeeeId && !ieeeMemberId.trim()) {
                    throw new Error('Please enter your IEEE Member ID.');
                }
            }

            const formDataBase = {
                ...form,
                teamMembers: teamMembers.length > 0 ? teamMembers : undefined,
                ...(isShareEvent ? { linkedinPostLink: linkedinPostLink.trim() } : {}),
            };

            // Referral attribution captured from ?ref= on the event page (if any)
            const referralCode = getReferral(eventId);

            const getName = (data) => data.name || data.Name || data['Full Name'] || Object.values(data)[0] || '';
            const getEmail = (data) => data.email || data.Email || '';
            const getPhone = (data) => data.phone || data.Phone || data['Phone Number'] || '';

            // Calculate dynamic price if IEEE event
            const effectivePrice = eventData?.isIeeeEvent
                ? (isMember ? (eventData?.ieeeMemberPrice ?? 0) : (eventData?.nonIeeeMemberPrice ?? 0))
                : (eventData?.ticketPrice ?? 0);
            // Derive paid status from the payment method + price, not the isPaid flag,
            // which can be stale (see note near the render-time isPaid computation).
            const isPaidForUser = (eventData?.paymentType && eventData.paymentType !== 'FREE') && effectivePrice > 0;

            if (isPaidForUser && eventData?.paymentType === 'RAZORPAY') {
                // ── Razorpay Payment Flow ──
                const res = await loadRazorpayScript();
                if (!res) throw new Error("Razorpay SDK failed to load. Are you online?");

                const orderData = await eventsApi.createRazorpayOrder(eventId, { teamSize: 1 + teamMembers.length, isMember });
                if (!orderData || !orderData.order_id) throw new Error("Failed to create Razorpay order.");

                const options = {
                    key: orderData.key_id,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "LenientTree",
                    description: `Registration for ${eventData.title}`,
                    order_id: orderData.order_id,
                    handler: async function (response) {
                        try {
                            setSubmitting(true);
                            await eventsApi.registerForEvent(eventId, {
                                formData: formDataBase,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpaySignature: response.razorpay_signature,
                                isMember,
                                ieeeMemberId,
                                ...(referralCode ? { referralCode } : {})
                            });
                            clearReferral(eventId);
                            trackEvent('event_register', { event_id: eventId, payment_type: 'RAZORPAY', is_paid: true });
                            setSuccess('Registration successful! Check your email for confirmation.');
                            setTimeout(() => {
                                navigate(`/event/${eventId}`);
                            }, 3000);
                        } catch (err) {
                            setError(err.message || 'Payment verified but registration failed.');
                            setSubmitting(false);
                        }
                    },
                    prefill: {
                        name: getName(form),
                        email: getEmail(form),
                        contact: getPhone(form)
                    },
                    theme: {
                        color: "#00ff88"
                    }
                };

                const paymentObject = new window.Razorpay(options);
                paymentObject.on('payment.failed', function (response) {
                    setError(`Payment failed: ${response.error.description}`);
                    setSubmitting(false);
                });
                paymentObject.open();
                return; // Early return, the success handler will finish registration
            }

            if (isPaidForUser && eventData?.paymentType === 'MANUAL_UPI') {
                // ── Manual UPI Payment Flow ──
                if (!paymentProofFile) {
                    throw new Error('Please upload your payment screenshot before registering.');
                }
                const fd = new FormData();
                fd.append('paymentProof', paymentProofFile);
                fd.append('formData', JSON.stringify(formDataBase));
                if (referralCode) fd.append('referralCode', referralCode);
                fd.append('isMember', isMember ? 'true' : 'false');
                if (ieeeMemberId) fd.append('ieeeMemberId', ieeeMemberId);
                
                await eventsApi.registerForEvent(eventId, fd);
                clearReferral(eventId);
                trackEvent('event_register', { event_id: eventId, payment_type: 'MANUAL_UPI', is_paid: true });
                setSuccess('Registration submitted! Your payment will be verified by the organizer.');
                setTimeout(() => {
                    navigate(`/event/${eventId}`);
                }, 3000);
                return;
            }

            // Free Event Flow (either it's a free event or effective price is 0 for this tier)
            await eventsApi.registerForEvent(eventId, {
                formData: formDataBase,
                isMember,
                ieeeMemberId,
                ...(referralCode ? { referralCode } : {})
            });
            clearReferral(eventId);
            trackEvent('event_register', { event_id: eventId, payment_type: 'FREE', is_paid: false });
            setSuccess('Registration successful! Check your email for confirmation.');
            setTimeout(() => {
                navigate(`/event/${eventId}`);
            }, 3000);
            
        } catch (err) {
            setError(err.message || 'Failed to submit registration. Please try again.');
            setSubmitting(false);
        }
    };

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

    const ticketPrice = eventData.isIeeeEvent
        ? (isMember ? (eventData.ieeeMemberPrice ?? 0) : (eventData.nonIeeeMemberPrice ?? 0))
        : (eventData.ticketPrice ?? 0);
    const paymentType = eventData.paymentType || 'FREE';
    // Source of truth for "is this a paid event" is the payment method + price, not the
    // isPaid flag alone: some events have isPaid out of sync with paymentType/ticketPrice
    // (e.g. a MANUAL_UPI event with a price but isPaid=false), which used to hide the QR
    // and let people register for free.
    const isPaid = paymentType !== 'FREE' && ticketPrice > 0;
    const totalPrice = ticketPrice * (1 + teamMembers.length);

    const isFormValid = (() => {
        if (!eventData) return false;
        if (eventData.isIeeeEvent && isMember && eventData.requiresIeeeId && !ieeeMemberId.trim()) return false;
        for (const f of formFields) {
            if (f.required && isFieldMissing(f, form[f.label])) return false;
        }
        for (const m of teamMembers) {
            for (const f of formFields) {
                if (f.required && isFieldMissing(f, m[f.label])) return false;
            }
        }
        // LinkedIn post link required for special event
        if (isShareEvent && !linkedinPostLink.trim()) return false;
        // Payment screenshot required for manual UPI events
        if (isPaid && paymentType === 'MANUAL_UPI' && !paymentProofFile) return false;
        return true;
    })();

    const handleCopyDescription = async () => {
        const text = eventData?.linkedinShareDescription || eventData?.description || '';
        try {
            await navigator.clipboard.writeText(text);
            setCopiedDescription(true);
            setTimeout(() => setCopiedDescription(false), 2500);
        } catch {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopiedDescription(true);
            setTimeout(() => setCopiedDescription(false), 2500);
        }
    };

    const handleDownloadPoster = () => {
        const posterUrl = eventData?.linkedinSharePoster || eventData?.eventPoster;
        if (!posterUrl) return;
        const link = document.createElement('a');
        link.href = posterUrl;
        link.download = `${eventData.title.replace(/\s+/g, '_')}_poster.jpg`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0a1f1f] flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="w-20 h-20 text-[#00ff88] mb-6" />
                <h1 className="text-3xl text-white font-bold mb-4">Registration Complete!</h1>
                <p className="text-gray-400 mb-8">{success}</p>
                <p className="text-gray-500 text-sm">Redirecting you back to the event page...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a1f1f] flex flex-col">
            <Header />

            <div className="flex-grow container mx-auto px-4 py-24 max-w-4xl">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-[#00ff88] transition-colors mb-8"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Back to Event</span>
                </button>

                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-4 sm:p-8 lg:p-12 shadow-2xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#00ff88]/10 rounded-full blur-3xl" />

                    <h1 className="text-3xl lg:text-4xl text-white font-bold mb-2 relative z-10">
                        Register for {eventData.title}
                    </h1>
                    <p className="text-gray-400 mb-8 relative z-10">
                        Complete the form below to secure your spot.
                    </p>

                    {error && (
                        <div className="mb-6 px-4 py-4 bg-red-900/40 border-l-4 border-red-500 rounded-lg flex items-center gap-3">
                            <AlertCircle className="text-red-400 w-5 h-5 shrink-0" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* ── LinkedIn Post Flow (Special Event Only) ── */}
                    {isShareEvent && (
                        <div className="mb-10 space-y-6 relative z-10">
                            {/* Step badge */}
                            <div className="flex items-center gap-3 border-b border-[#1a4d4d] pb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00cc70] flex items-center justify-center shrink-0">
                                    <span className="text-black font-bold text-sm">1</span>
                                </div>
                                <div>
                                    <h2 className="text-xl text-white font-semibold">Share This Event First</h2>
                                    <p className="text-gray-400 text-sm">Download the poster & copy the description → post it on LinkedIn → paste your post link below</p>
                                </div>
                            </div>

                            {/* Poster + Description side-by-side or stacked */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Poster card */}
                                {(eventData?.linkedinSharePoster || eventData?.eventPoster) && (
                                    <div className="bg-[#0a1f1f] border border-[#1a4d4d] rounded-2xl overflow-hidden flex flex-col">
                                        <div className="relative group">
                                            <img
                                                src={eventData.linkedinSharePoster || eventData.eventPoster}
                                                alt={`${eventData.title} poster`}
                                                className="w-full object-cover max-h-72"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">Click below to download</span>
                                            </div>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                            <div>
                                                <p className="text-gray-300 text-sm font-medium mb-1">Event Poster</p>
                                                <p className="text-gray-500 text-xs">Download and upload this to your LinkedIn post</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleDownloadPoster}
                                                className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-black font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-[#00ff88]/30 transform hover:-translate-y-0.5"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download Poster
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Description card */}
                                <div className="bg-[#0a1f1f] border border-[#1a4d4d] rounded-2xl flex flex-col">
                                     <div className="p-4 border-b border-[#1a4d4d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <p className="text-gray-300 text-sm font-medium">Post Description</p>
                                            <p className="text-gray-500 text-xs">Copy this text for your LinkedIn post</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCopyDescription}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                                copiedDescription
                                                    ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]'
                                                    : 'bg-[#1a4d4d] text-gray-300 hover:bg-[#00ff88]/10 hover:text-[#00ff88] border border-[#1a4d4d] hover:border-[#00ff88]'
                                            }`}
                                        >
                                            {copiedDescription ? (
                                                <><Check className="w-4 h-4" /> Copied!</>
                                            ) : (
                                                <><Copy className="w-4 h-4" /> Copy Text</>
                                            )}
                                        </button>
                                    </div>
                                    <div className="p-4 flex-1 overflow-y-auto max-h-72 custom-scrollbar">
                                        <pre className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-sans select-text">
                                            {eventData?.linkedinShareDescription || eventData?.description || 'No description available.'}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* LinkedIn post link input */}
                            <div className="bg-[#0a1f1f] border-2 border-[#1a4d4d] rounded-2xl p-6 space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Linkedin className="w-5 h-5 text-[#00ff88]" />
                                    <label className="text-white font-semibold text-base">Your LinkedIn Post Link <span className="text-[#00ff88]">*</span></label>
                                </div>
                                <p className="text-gray-400 text-sm">Post the above content (with poster image) on LinkedIn, then paste the link to your post here.</p>
                                <div className="relative">
                                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="url"
                                        value={linkedinPostLink}
                                        onChange={(e) => {
                                            setLinkedinPostLink(e.target.value);
                                            if (linkedinLinkError) setLinkedinLinkError('');
                                        }}
                                        placeholder="https://www.linkedin.com/posts/your-post-id"
                                        className={`w-full bg-[#060f0f] border-2 text-white py-3 pl-11 pr-4 rounded-xl focus:outline-none transition-all duration-300 ${
                                            linkedinLinkError
                                                ? 'border-red-500 focus:border-red-400'
                                                : linkedinPostLink.trim()
                                                ? 'border-[#00ff88] focus:border-[#00ff88]'
                                                : 'border-[#1a4d4d] focus:border-[#00ff88]'
                                        }`}
                                    />
                                </div>
                                {linkedinLinkError && (
                                    <p className="text-red-400 text-xs flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />{linkedinLinkError}
                                    </p>
                                )}
                                {linkedinPostLink.trim() && !linkedinLinkError && (
                                    <p className="text-[#00ff88] text-xs flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Link saved — you can now complete your registration below
                                    </p>
                                )}
                            </div>

                            {/* Divider to Step 2 */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 border-t border-[#1a4d4d]" />
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <div className="w-7 h-7 rounded-full bg-[#1a4d4d] flex items-center justify-center">
                                        <span className="text-gray-300 font-bold text-xs">2</span>
                                    </div>
                                    Complete Your Registration
                                </div>
                                <div className="flex-1 border-t border-[#1a4d4d]" />
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

                        {/* Primary Member Details */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-[#1a4d4d] pb-2">
                                <h2 className="text-xl text-white font-semibold">Primary Attendee Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {formFields.map((field, idx) => (
                                    <div key={idx} className={field.type === 'checkbox' ? 'col-span-1 md:col-span-2' : ''}>
                                        {field.type !== 'checkbox' && (
                                            <label className="text-gray-400 text-sm mb-2 block capitalize">
                                                {field.label} {field.required && '*'}
                                            </label>
                                        )}
                                        {field.type === 'select' ? (
                                            <select
                                                name={field.label}
                                                value={form[field.label] || ''}
                                                onChange={handleChange}
                                                required={field.required}
                                                className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                                            >
                                                <option value="">Select {field.label}</option>
                                                {field.options?.map((opt, i) => (
                                                    <option key={i} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : field.type === 'checkbox' ? (
                                            <label className="flex items-center gap-3 py-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    name={field.label}
                                                    checked={!!form[field.label]}
                                                    onChange={handleChange}
                                                    required={field.required}
                                                    className="w-5 h-5 rounded border-2 border-[#1a4d4d] bg-transparent checked:bg-[#00ff88] checked:border-[#00ff88] focus:ring-0 cursor-pointer accent-[#00ff88]"
                                                />
                                                <span className="text-white text-sm font-semibold">{field.label} {field.required && '*'}</span>
                                            </label>
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                name={field.label}
                                                value={form[field.label] || ''}
                                                onChange={handleChange}
                                                required={field.required}
                                                rows="3"
                                                className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 resize-none"
                                                placeholder={`Enter ${field.label}`}
                                            ></textarea>
                                        ) : (
                                            <input
                                                type={field.type || 'text'}
                                                name={field.label}
                                                value={form[field.label] || ''}
                                                onChange={handleChange}
                                                required={field.required}
                                                className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                                                placeholder={`Enter ${field.label}`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* IEEE Member Declaration Card */}
                        {eventData.isIeeeEvent && (
                            <div className="bg-[#0a1f1f] border-2 border-[#1a4d4d] rounded-3xl p-6 space-y-4 mb-8">
                                <h3 className="text-white font-bold text-lg border-b border-[#1a4d4d] pb-2">IEEE Membership Verification</h3>
                                <p className="text-gray-400 text-sm">This event has discount pricing for IEEE members. Please select your membership status below.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label
                                        onClick={() => setIsMember(true)}
                                        className={`flex items-center gap-3 px-5 py-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                                            isMember
                                                ? 'border-[#00ff88] bg-[#00ff88]/10'
                                                : 'border-[#1a4d4d] hover:border-[#00ff88]/50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="ieeeStatus"
                                            checked={isMember}
                                            onChange={() => setIsMember(true)}
                                            className="w-5 h-5 accent-[#00ff88]"
                                        />
                                        <div className="text-left">
                                            <p className="text-white text-sm font-semibold">I am an IEEE Member</p>
                                            <p className="text-gray-500 text-xs mt-0.5">Ticket Price: ₹{eventData.ieeeMemberPrice ?? 0}</p>
                                        </div>
                                    </label>

                                    <label
                                        onClick={() => setIsMember(false)}
                                        className={`flex items-center gap-3 px-5 py-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                                            !isMember
                                                ? 'border-[#00ff88] bg-[#00ff88]/10'
                                                : 'border-[#1a4d4d] hover:border-[#00ff88]/50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="ieeeStatus"
                                            checked={!isMember}
                                            onChange={() => setIsMember(false)}
                                            className="w-5 h-5 accent-[#00ff88]"
                                        />
                                        <div className="text-left">
                                            <p className="text-white text-sm font-semibold">I am NOT an IEEE Member</p>
                                            <p className="text-gray-500 text-xs mt-0.5">Ticket Price: ₹{eventData.nonIeeeMemberPrice ?? 0}</p>
                                        </div>
                                    </label>
                                </div>

                                {isMember && eventData.requiresIeeeId && (
                                    <div className="mt-4 animate-fadeIn">
                                        <label className="text-gray-400 text-sm mb-2 block font-semibold">IEEE Member ID *</label>
                                        <input
                                            type="text"
                                            value={ieeeMemberId}
                                            onChange={e => setIeeeMemberId(e.target.value)}
                                            placeholder="Enter your 8-digit or 9-digit IEEE Member ID"
                                            className="w-full bg-[#061414] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Team Registration — only shown for Group events */}
                        {(eventData?.registrationType === 'Group' || (eventData?.maxTeamSize && parseInt(eventData.maxTeamSize) > 1)) && (
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center justify-between border-b border-[#1a4d4d] pb-2">
                                <div>
                                    <h2 className="text-xl text-white font-semibold">Team Registration</h2>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {eventData?.maxTeamSize
                                            ? `${1 + teamMembers.length} / ${parseInt(eventData.maxTeamSize)} members`
                                            : 'Registering a group? Add their details here.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addTeamMember}
                                    disabled={eventData?.maxTeamSize && teamMembers.length >= parseInt(eventData.maxTeamSize) - 1}
                                    className={`flex items-center gap-2 bg-[#0a1f1f] border px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                        (eventData?.maxTeamSize && teamMembers.length >= parseInt(eventData.maxTeamSize) - 1)
                                            ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                                            : 'border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10'
                                    }`}
                                >
                                    <Plus className="w-4 h-4" /> Add Member
                                </button>
                            </div>

                            {teamMembers.length > 0 && (
                                <div className="space-y-6">
                                    {teamMembers.map((member, index) => (
                                        <div key={index} className="bg-[#0a1f1f] p-6 rounded-2xl border border-[#1a4d4d] relative">
                                            <button
                                                type="button"
                                                onClick={() => removeTeamMember(index)}
                                                className="absolute top-4 right-4 text-red-400 hover:text-red-300 bg-red-900/20 p-2 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <h3 className="text-[#00ff88] font-medium mb-4">Team Member {index + 1}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {formFields.map((field, fIdx) => (
                                                    <div key={fIdx} className={field.type === 'checkbox' ? 'col-span-1 md:col-span-2' : ''}>
                                                        {field.type !== 'checkbox' && (
                                                            <label className="text-gray-400 text-xs mb-1 block capitalize">
                                                                {field.label} {field.required && '*'}
                                                            </label>
                                                        )}
                                                        {field.type === 'select' ? (
                                                            <select
                                                                value={member[field.label] || ''}
                                                                onChange={(e) => handleTeamMemberChange(index, field.label, e.target.value)}
                                                                required={field.required}
                                                                className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                                                            >
                                                                <option value="">Select {field.label}</option>
                                                                {field.options?.map((opt, i) => (
                                                                    <option key={i} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : field.type === 'checkbox' ? (
                                                            <label className="flex items-center gap-3 py-1 cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!member[field.label]}
                                                                    onChange={(e) => handleTeamMemberChange(index, field.label, e.target.checked)}
                                                                    required={field.required}
                                                                    className="w-4 h-4 rounded border-2 border-[#1a4d4d] bg-transparent checked:bg-[#00ff88] checked:border-[#00ff88] focus:ring-0 cursor-pointer accent-[#00ff88]"
                                                                />
                                                                <span className="text-white text-xs font-semibold">{field.label} {field.required && '*'}</span>
                                                            </label>
                                                        ) : field.type === 'textarea' ? (
                                                            <textarea
                                                                value={member[field.label] || ''}
                                                                onChange={(e) => handleTeamMemberChange(index, field.label, e.target.value)}
                                                                required={field.required}
                                                                rows="2"
                                                                className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm resize-none"
                                                                placeholder={`Enter ${field.label}`}
                                                            ></textarea>
                                                        ) : (
                                                            <input
                                                                type={field.type || 'text'}
                                                                value={member[field.label] || ''}
                                                                onChange={(e) => handleTeamMemberChange(index, field.label, e.target.value)}
                                                                required={field.required}
                                                                className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                                                                placeholder={`Enter ${field.label}`}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        )}

                        {/* Payment Details (If Paid) */}
                        {isPaid && (
                            <div className="space-y-6 pt-4">
                                <div className="border-b border-[#1a4d4d] pb-2">
                                    <h2 className="text-xl text-white font-semibold">Payment Details</h2>
                                </div>

                                <div className="bg-gradient-to-r from-[#0a1f1f] to-[#1a4d4d]/30 border border-[#1a4d4d] p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="w-full md:w-auto">
                                        <p className="text-gray-400 text-sm mb-1">Registration Fee</p>
                                        <p className="text-2xl font-bold text-white">₹{ticketPrice} <span className="text-sm font-normal text-gray-500">per person</span></p>
                                        <p className="text-sm text-[#00ff88] mt-2">Total Participants: {1 + teamMembers.length}</p>
                                    </div>
                                    <div className="text-left md:text-right w-full md:w-auto">
                                        <p className="text-gray-400 text-sm mb-1">Total Amount Payable</p>
                                        <p className="text-4xl font-bold text-[#00ff88]">₹{totalPrice}</p>
                                    </div>
                                </div>

                                {/* Manual UPI Payment Section */}
                                {paymentType === 'MANUAL_UPI' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* UPI QR Code */}
                                            {eventData.upiQrCode && (
                                                <div className="bg-[#0a1f1f] border border-[#1a4d4d] rounded-2xl p-6 flex flex-col items-center gap-4">
                                                    <p className="text-gray-300 text-sm font-medium">Scan QR Code to Pay</p>
                                                    <div className="bg-white rounded-xl p-3">
                                                        <img
                                                            src={eventData.upiQrCode}
                                                            alt="UPI QR Code"
                                                            className="w-48 h-48 object-contain"
                                                        />
                                                    </div>
                                                    {eventData.upiId && (
                                                        <p className="text-gray-400 text-xs">UPI ID: <span className="text-[#00ff88] font-mono">{eventData.upiId}</span></p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Payment Proof Upload */}
                                            <div className="bg-[#0a1f1f] border border-[#1a4d4d] rounded-2xl p-6 flex flex-col justify-center">
                                                <p className="text-gray-300 text-sm font-medium mb-1">Upload Payment Screenshot <span className="text-[#00ff88]">*</span></p>
                                                <p className="text-gray-500 text-xs mb-4">After paying, take a screenshot and upload it here for verification.</p>
                                                
                                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#1a4d4d] rounded-xl p-6 cursor-pointer hover:border-[#00ff88] transition-all duration-300 group">
                                                    {paymentProofFile ? (
                                                        <div className="text-center">
                                                            <CheckCircle2 className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
                                                            <p className="text-[#00ff88] text-sm font-medium">{paymentProofFile.name}</p>
                                                            <p className="text-gray-500 text-xs mt-1">{(paymentProofFile.size / 1024).toFixed(1)} KB</p>
                                                            <p className="text-gray-500 text-xs mt-2">Click to change</p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center">
                                                            <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2 group-hover:text-[#00ff88] transition-colors" />
                                                            <p className="text-gray-400 text-sm">Click to upload screenshot</p>
                                                            <p className="text-gray-600 text-xs mt-1">PNG, JPG up to 5MB</p>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                if (file.size > 5 * 1024 * 1024) {
                                                                    setError('File size must be less than 5MB');
                                                                    return;
                                                                }
                                                                setPaymentProofFile(file);
                                                                setError('');
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        {/* UPI ID fallback (if no QR but UPI ID exists) */}
                                        {!eventData.upiQrCode && eventData.upiId && (
                                            <div className="bg-[#0a1f1f] border border-[#1a4d4d] rounded-2xl p-6 text-center">
                                                <p className="text-gray-300 text-sm mb-2">Pay via UPI</p>
                                                <p className="text-[#00ff88] font-mono text-lg font-bold">{eventData.upiId}</p>
                                                <p className="text-gray-500 text-xs mt-2">Send ₹{totalPrice} to the above UPI ID and upload the screenshot</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Razorpay info */}
                                {paymentType === 'RAZORPAY' && (
                                    <div className="bg-[#0a1f1f] border border-[#1a4d4d] rounded-2xl p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#00ff88]/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                                        </div>
                                        <p className="text-gray-400 text-sm">You'll be redirected to <span className="text-white font-medium">Razorpay</span> secure checkout to complete payment after clicking the button below.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-8">
                            <button
                                type="submit"
                                disabled={submitting || !isFormValid}
                                className={`w-full font-bold text-lg py-4 px-6 rounded-xl transition-all duration-300 shadow-xl ${
                                    submitting || !isFormValid
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed shadow-none'
                                        : 'bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-black transform hover:-translate-y-1 shadow-[#00ff88]/20'
                                }`}
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                                    </span>
                                ) : (
                                    isPaid
                                        ? paymentType === 'RAZORPAY'
                                            ? `Pay ₹${totalPrice} & Register`
                                            : `Submit Registration (₹${totalPrice})`
                                        : 'Complete Registration'
                                )}
                            </button>
                            <p className="text-center text-gray-500 text-xs mt-4">
                                By registering, you agree to our terms and conditions.
                            </p>
                        </div>

                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default EventRegistration;
