import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import Header from './layout/Header';
import Footer from './layout/Footer';
import { events as eventsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EventRegistration = () => {
    const navigate = useNavigate();
    const { id: eventId } = useParams();
    const { isAuthenticated, openAuthModal, user } = useAuth();

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        college: user?.college || '',
        tshirtSize: '',
        gender: ''
    });

    const [teamMembers, setTeamMembers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

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
            } catch (err) {
                setError(err.message || 'Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleTeamMemberChange = (index, field, value) => {
        setTeamMembers(prev => {
            const newMembers = [...prev];
            newMembers[index] = { ...newMembers[index], [field]: value };
            return newMembers;
        });
    };

    const addTeamMember = () => {
        setTeamMembers(prev => [...prev, { name: '', email: '', phone: '', tshirtSize: '' }]);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            // Validate
            if (!form.name || !form.email || !form.phone || !form.college) {
                throw new Error("Please fill in all primary member required fields.");
            }

            for (let i = 0; i < teamMembers.length; i++) {
                const m = teamMembers[i];
                if (!m.name || !m.email) {
                    throw new Error(`Please fill name and email for Team Member ${i + 1}`);
                }
            }

            const formDataBase = {
                name: form.name,
                email: form.email,
                phone: form.phone,
                college: form.college,
                tshirtSize: form.tshirtSize,
                gender: form.gender,
                teamMembers: teamMembers.length > 0 ? teamMembers : undefined,
            };

            if (eventData?.isPaid) {
                const res = await loadRazorpayScript();
                if (!res) throw new Error("Razorpay SDK failed to load. Are you online?");

                const orderData = await eventsApi.createRazorpayOrder(eventId, { teamSize: 1 + teamMembers.length });
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
                                razorpaySignature: response.razorpay_signature
                            });
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
                        name: form.name,
                        email: form.email,
                        contact: form.phone
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

            // Free Event Flow
            await eventsApi.registerForEvent(eventId, { formData: formDataBase });
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

    const isPaid = eventData.isPaid;
    const ticketPrice = eventData.ticketPrice || 0;
    const totalPrice = ticketPrice * (1 + teamMembers.length);

    const isFormValid = Boolean(
        form.name.trim() &&
        form.email.trim() &&
        form.phone.trim() &&
        form.college.trim() &&
        teamMembers.every(m => m.name.trim() && m.email.trim())
    );

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

                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
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

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

                        {/* Primary Member Details */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-[#1a4d4d] pb-2">
                                <h2 className="text-xl text-white font-semibold">Primary Attendee Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-gray-400 text-sm mb-2 block">Full Name *</label>
                                    <input
                                        type="text" name="name" value={form.name} onChange={handleChange} required
                                        className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm mb-2 block">Email Address *</label>
                                    <input
                                        type="email" name="email" value={form.email} onChange={handleChange} required
                                        className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm mb-2 block">Phone Number *</label>
                                    <input
                                        type="tel" name="phone" value={form.phone} onChange={handleChange} required
                                        className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm mb-2 block">College / Organization *</label>
                                    <input
                                        type="text" name="college" value={form.college} onChange={handleChange} required
                                        className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                                        placeholder="University Name"
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm mb-2 block">Gender</label>
                                    <select
                                        name="gender" value={form.gender} onChange={handleChange}
                                        className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm mb-2 block">T-Shirt Size</label>
                                    <select
                                        name="tshirtSize" value={form.tshirtSize} onChange={handleChange}
                                        className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                                    >
                                        <option value="">Select Size</option>
                                        <option value="S">Small (S)</option>
                                        <option value="M">Medium (M)</option>
                                        <option value="L">Large (L)</option>
                                        <option value="XL">Extra Large (XL)</option>
                                        <option value="XXL">XXL</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Team Registration */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center justify-between border-b border-[#1a4d4d] pb-2">
                                <div>
                                    <h2 className="text-xl text-white font-semibold">Team Registration</h2>
                                    <p className="text-gray-400 text-sm mt-1">Registering a group? Add their details here.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addTeamMember}
                                    className="flex items-center gap-2 bg-[#0a1f1f] border border-[#00ff88] text-[#00ff88] px-4 py-2 rounded-lg hover:bg-[#00ff88]/10 transition-colors text-sm font-medium"
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
                                                <div>
                                                    <label className="text-gray-400 text-xs mb-1 block">Full Name *</label>
                                                    <input
                                                        type="text" value={member.name} onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)} required
                                                        className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-gray-400 text-xs mb-1 block">Email Address *</label>
                                                    <input
                                                        type="email" value={member.email} onChange={(e) => handleTeamMemberChange(index, 'email', e.target.value)} required
                                                        className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-gray-400 text-xs mb-1 block">Phone Number</label>
                                                    <input
                                                        type="tel" value={member.phone} onChange={(e) => handleTeamMemberChange(index, 'phone', e.target.value)}
                                                        className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-gray-400 text-xs mb-1 block">T-Shirt Size</label>
                                                    <select
                                                        value={member.tshirtSize} onChange={(e) => handleTeamMemberChange(index, 'tshirtSize', e.target.value)}
                                                        className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
                                                    >
                                                        <option value="">Select Size</option>
                                                        <option value="S">S</option>
                                                        <option value="M">M</option>
                                                        <option value="L">L</option>
                                                        <option value="XL">XL</option>
                                                        <option value="XXL">XXL</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Payment Details (If Paid) */}
                        {isPaid && (
                            <div className="space-y-6 pt-4">
                                <div className="border-b border-[#1a4d4d] pb-2">
                                    <h2 className="text-xl text-white font-semibold">Payment Details</h2>
                                </div>

                                <div className="bg-gradient-to-r from-[#0a1f1f] to-[#1a4d4d]/30 border border-[#1a4d4d] p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Registration Fee</p>
                                        <p className="text-2xl font-bold text-white">₹{ticketPrice} <span className="text-sm font-normal text-gray-500">per person</span></p>
                                        <p className="text-sm text-[#00ff88] mt-2">Total Participants: {1 + teamMembers.length}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400 text-sm mb-1">Total Amount Payable</p>
                                        <p className="text-4xl font-bold text-[#00ff88]">₹{totalPrice}</p>
                                    </div>
                                </div>
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
                                    isPaid ? `Pay ₹${totalPrice} & Register` : 'Complete Registration'
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
