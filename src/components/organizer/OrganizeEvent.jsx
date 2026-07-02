import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import api from '../../services/api';

const OrganizeEvent = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [showPreview, setShowPreview] = useState(false);

    // Form state for event details
    const [eventData, setEventData] = useState({
        eventName: '',
        eventSubtitle: '',
        eventType: 'Hackathon',
        eventTheme: '',
        modeOfConduct: 'Offline',
        eventLocation: '',
        mapLink: '',
        eventAccess: 'Free',
        eventStartDate: '',
        eventEndDate: '',
        eventTime: '',
        registrationDeadline: '',
        registrationType: 'Individual',
        minTeamSize: '1',
        maxTeamSize: '4',
        // Event description
        eventDescription: '',
        prizeType: 'No prize',
        prizeDetails: '',
        ticketPrice: '',
        eventPoster: null,
        // FAQs
        faqs: [{ question: '', answer: '' }],
        // Announcements
        announcements: [{ title: '', content: '', publishDate: '' }],
        // Event design (Step 2)
        eventBanner: null,
        selectedTemplate: 'Default',
        // Event configuration
        acceptanceMode: 'Auto approval',
        participantLimit: '',
        registerAction: 'Register',
        externalWebsiteLink: '',
        paymentType: 'FREE',
        upiId: '',
        upiQrCode: null,
        requiredFields: {
            name: true,
            phone: true,
            email: true,
            college: false
        },
        includeMealInfo: false,
        includeTshirtInfo: false,
        termsAccepted: false
    });

    const [registrationId, setRegistrationId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    const getFieldError = (fieldName) => {
        const mappings = {
            eventName: ['eventName', 'title'],
            eventSubtitle: ['eventSubtitle', 'subtitle'],
            eventType: ['eventType', 'category'],
            eventTheme: ['eventTheme', 'theme'],
            modeOfConduct: ['modeOfConduct', 'mode'],
            eventLocation: ['eventLocation', 'venueName', 'location.venueName'],
            mapLink: ['mapLink', 'location.mapLink'],
            eventStartDate: ['eventStartDate', 'startDate'],
            eventEndDate: ['eventEndDate', 'endDate'],
            registrationDeadline: ['registrationDeadline', 'registrationDeadline'],
            eventDescription: ['eventDescription', 'description'],
            prizeType: ['prizeType', 'prizeType'],
            prizeDetails: ['prizeDetails', 'prizeAmount'],
            ticketPrice: ['ticketPrice'],
            minTeamSize: ['minTeamSize'],
            maxTeamSize: ['maxTeamSize'],
            eventPoster: ['eventPoster', 'poster'],
            participantLimit: ['participantLimit', 'maxParticipants'],
            upiId: ['upiId'],
            upiQrCode: ['upiQrCode'],
            externalWebsiteLink: ['externalWebsiteLink'],
            termsAccepted: ['termsAccepted', 'agreedToTerms']
        };

        const keys = mappings[fieldName] || [fieldName];
        for (const key of keys) {
            if (fieldErrors[key]) return fieldErrors[key];
        }
        return null;
    };

    const getInputClass = (fieldName) => {
        const hasErr = !!getFieldError(fieldName);
        return `w-full bg-transparent border-2 ${
            hasErr ? 'border-red-500/80 focus:border-red-500' : 'border-[#1a4d4d] focus:border-[#00ff88]'
        } text-white placeholder-gray-500 py-3 px-4 rounded-xl focus:outline-none transition-all duration-300`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEventData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear field error on change
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
        }
        // Also check mappings to clear associated backend error
        const mappings = {
            eventName: 'title',
            eventSubtitle: 'subtitle',
            eventType: 'category',
            eventTheme: 'theme',
            modeOfConduct: 'mode',
            eventLocation: 'location.venueName',
            mapLink: 'location.mapLink',
            eventStartDate: 'startDate',
            eventEndDate: 'endDate',
            registrationDeadline: 'registrationDeadline',
            eventDescription: 'description',
            prizeType: 'prizeType',
            prizeDetails: 'prizeAmount',
            participantLimit: 'maxParticipants',
            upiId: 'upiId',
            externalWebsiteLink: 'externalWebsiteLink'
        };
        const mapped = mappings[name];
        if (mapped && fieldErrors[mapped]) {
            setFieldErrors(prev => ({ ...prev, [mapped]: undefined }));
        }
    };

    // FAQ handlers
    const handleFaqChange = (index, field, value) => {
        setEventData(prev => {
            const updated = [...prev.faqs];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, faqs: updated };
        });
        const path = `faqs.${index}.${field}`;
        if (fieldErrors[path]) {
            setFieldErrors(prev => ({ ...prev, [path]: undefined }));
        }
    };
    const addFaq = () => {
        setEventData(prev => ({
            ...prev,
            faqs: [...prev.faqs, { question: '', answer: '' }]
        }));
    };
    const removeFaq = (index) => {
        setEventData(prev => ({
            ...prev,
            faqs: prev.faqs.filter((_, i) => i !== index)
        }));
        // Clean up errors for removed FAQ
        setFieldErrors(prev => {
            const copy = { ...prev };
            delete copy[`faqs.${index}.question`];
            delete copy[`faqs.${index}.answer`];
            return copy;
        });
    };

    // Announcement handlers
    const handleAnnouncementChange = (index, field, value) => {
        setEventData(prev => {
            const updated = [...prev.announcements];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, announcements: updated };
        });
        const path = `announcements.${index}.${field}`;
        if (fieldErrors[path]) {
            setFieldErrors(prev => ({ ...prev, [path]: undefined }));
        }
    };
    const addAnnouncement = () => {
        setEventData(prev => ({
            ...prev,
            announcements: [...prev.announcements, { title: '', content: '', publishDate: '' }]
        }));
    };
    const removeAnnouncement = (index) => {
        setEventData(prev => ({
            ...prev,
            announcements: prev.announcements.filter((_, i) => i !== index)
        }));
        // Clean up errors for removed announcement
        setFieldErrors(prev => {
            const copy = { ...prev };
            delete copy[`announcements.${index}.title`];
            delete copy[`announcements.${index}.content`];
            delete copy[`announcements.${index}.publishDate`];
            return copy;
        });
    };

    const validateStep1 = () => {
        const errors = {};

        // Title
        if (!eventData.eventName || eventData.eventName.trim().length < 3) {
            errors.eventName = 'Event name must be at least 3 characters.';
        } else if (eventData.eventName.length > 200) {
            errors.eventName = 'Event name cannot exceed 200 characters.';
        }

        // Subtitle
        if (!eventData.eventSubtitle || eventData.eventSubtitle.trim().length === 0) {
            errors.eventSubtitle = 'Event subtitle is required.';
        } else if (eventData.eventSubtitle.length > 300) {
            errors.eventSubtitle = 'Event subtitle cannot exceed 300 characters.';
        }

        // Theme
        if (eventData.eventTheme && eventData.eventTheme.length > 200) {
            errors.eventTheme = 'Theme cannot exceed 200 characters.';
        }

        // Location & mapLink
        if (eventData.modeOfConduct === 'Offline') {
            if (!eventData.eventLocation || eventData.eventLocation.trim().length === 0) {
                errors.eventLocation = 'Venue name or address is required for offline events.';
            }
            if (eventData.mapLink && eventData.mapLink.trim().length > 0) {
                let mapsLink = eventData.mapLink.trim();
                if (!mapsLink.startsWith('http://') && !mapsLink.startsWith('https://')) {
                    mapsLink = 'https://' + mapsLink;
                }
                try {
                    new URL(mapsLink);
                } catch (_) {
                    errors.mapLink = 'Please enter a valid URL (e.g., https://maps.google.com/...)';
                }
            }
        } else {
            // Online mode: mapLink is optional but if provided must be valid URL
            if (eventData.mapLink && eventData.mapLink.trim().length > 0) {
                let mapsLink = eventData.mapLink.trim();
                if (!mapsLink.startsWith('http://') && !mapsLink.startsWith('https://')) {
                    mapsLink = 'https://' + mapsLink;
                }
                try {
                    new URL(mapsLink);
                } catch (_) {
                    errors.mapLink = 'Please enter a valid URL (e.g., https://zoom.us/...)';
                }
            }
        }

        // Dates
        if (!eventData.eventStartDate) {
            errors.eventStartDate = 'Start date is required.';
        }
        if (!eventData.eventEndDate) {
            errors.eventEndDate = 'End date is required.';
        }
        if (!eventData.eventTime) {
            errors.eventTime = 'Event start time is required.';
        }
        if (!eventData.registrationDeadline) {
            errors.registrationDeadline = 'Registration deadline is required.';
        }

        if (eventData.eventStartDate && eventData.eventEndDate) {
            const start = new Date(eventData.eventStartDate);
            const end = new Date(eventData.eventEndDate);
            if (end < start) {
                errors.eventEndDate = 'End date cannot be earlier than start date.';
            }
        }




        // Team Size
        if (eventData.registrationType === 'Group') {
            const minSize = parseInt(eventData.minTeamSize) || 1;
            const maxSize = parseInt(eventData.maxTeamSize) || 1;
            if (minSize < 1) {
                errors.minTeamSize = 'Minimum team size must be at least 1.';
            }
            if (maxSize < minSize) {
                errors.maxTeamSize = 'Maximum team size must be greater than or equal to minimum team size.';
            }
        }

        // Description
        if (!eventData.eventDescription || eventData.eventDescription.trim().length < 10) {
            errors.eventDescription = 'Description is required and must be at least 10 characters.';
        }

        // Poster
        if (!eventData.eventPoster) {
            errors.eventPoster = 'Event poster image is required.';
        }

        // FAQs
        eventData.faqs.forEach((faq, index) => {
            const hasQuestion = faq.question.trim().length > 0;
            const hasAnswer = faq.answer.trim().length > 0;
            if (hasQuestion || hasAnswer) {
                if (faq.question.trim().length < 5) {
                    errors[`faqs.${index}.question`] = 'Question must be at least 5 characters.';
                }
                if (faq.answer.trim().length < 5) {
                    errors[`faqs.${index}.answer`] = 'Answer must be at least 5 characters.';
                }
            }
        });

        // Announcements
        eventData.announcements.forEach((ann, index) => {
            const hasTitle = ann.title.trim().length > 0;
            const hasContent = ann.content.trim().length > 0;
            if (hasTitle || hasContent) {
                if (ann.title.trim().length < 2) {
                    errors[`announcements.${index}.title`] = 'Title must be at least 2 characters.';
                }
                if (ann.content.trim().length < 5) {
                    errors[`announcements.${index}.content`] = 'Content must be at least 5 characters.';
                }
            }
        });

        return errors;
    };

    const validateStep2 = () => {
        const errors = {};

        if (eventData.participantLimit) {
            const limit = parseInt(eventData.participantLimit);
            if (isNaN(limit) || limit < 1) {
                errors.participantLimit = 'Participant limit must be a positive integer.';
            }
        }

        if (eventData.paymentType === 'MANUAL_UPI') {
            if (!eventData.upiId || eventData.upiId.trim().length === 0) {
                errors.upiId = 'UPI ID is required for MANUAL UPI payment.';
            } else {
                const upiPattern = /^[\w.-]+@[\w.-]+$/;
                if (!upiPattern.test(eventData.upiId.trim())) {
                    errors.upiId = 'Please enter a valid UPI ID (e.g. name@upi)';
                }
            }
            if (!eventData.upiQrCode) {
                errors.upiQrCode = 'UPI QR Code image is required for MANUAL UPI payment.';
            }
        }

        if (!eventData.termsAccepted) {
            errors.termsAccepted = 'You must accept the terms and conditions.';
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setError(null);
        setFieldErrors({});

        if (currentStep === 1) {
            const clientErrors = validateStep1();
            if (Object.keys(clientErrors).length > 0) {
                setFieldErrors(clientErrors);
                setError('Validation failed. Please correct the highlighted errors.');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            try {
                setIsSubmitting(true);
                // Parse dates
                let sDate = new Date();
                let eDate = new Date();
                let rDate = new Date();
                try {
                    const timeStr = eventData.eventTime || "00:00";
                    if (eventData.eventStartDate) {
                        sDate = new Date(`${eventData.eventStartDate}T${timeStr}`);
                    }
                    if (eventData.eventEndDate) {
                        eDate = new Date(`${eventData.eventEndDate}T${timeStr}`);
                    } else {
                        eDate = sDate;
                    }
                    if (eventData.registrationDeadline) {
                        rDate = new Date(`${eventData.registrationDeadline}T${timeStr}`);
                    } else {
                        rDate = sDate;
                    }
                } catch (err) { console.error('Date parse error', err); }

                let mapsLink = eventData.mapLink ? eventData.mapLink.trim() : undefined;
                if (mapsLink && !mapsLink.startsWith('http://') && !mapsLink.startsWith('https://')) {
                    mapsLink = 'https://' + mapsLink;
                }

                const step1Payload = {
                    title: eventData.eventName,
                    subtitle: eventData.eventSubtitle || undefined,
                    category: eventData.eventType === 'Other' ? 'Other' : eventData.eventType,
                    theme: eventData.eventTheme || undefined,
                    mode: eventData.modeOfConduct.toUpperCase(),
                    location: {
                        venueName: eventData.eventLocation || undefined,
                        mapLink: mapsLink || undefined
                    },
                    registrationType: eventData.registrationType.toUpperCase(),
                    minTeamSize: eventData.registrationType === 'Group' ? parseInt(eventData.minTeamSize) || 1 : undefined,
                    maxTeamSize: eventData.registrationType === 'Group' ? parseInt(eventData.maxTeamSize) || undefined : undefined,
                    startDate: isNaN(sDate.getTime()) ? new Date().toISOString() : sDate.toISOString(),
                    endDate: isNaN(eDate.getTime()) ? new Date().toISOString() : eDate.toISOString(),
                    registrationDeadline: isNaN(rDate.getTime()) ? new Date().toISOString() : rDate.toISOString(),
                    description: eventData.eventDescription || 'No description provided.',
                    prizeType: eventData.prizeType === 'No prize' ? 'NONE' : eventData.prizeType === 'Cash prize' ? 'CASH' : eventData.prizeType === 'Merchandise' ? 'MERCH' : 'POINTS',
                    prizeAmount: eventData.prizeDetails ? parseFloat(eventData.prizeDetails.split('/')[0].replace(/[^0-9.]/g, '')) || 0 : 0,
                    isPaid: eventData.eventAccess === 'Paid',
                    ticketPrice: eventData.eventAccess === 'Paid' ? parseFloat(eventData.ticketPrice) || 0 : undefined,
                    faqs: eventData.faqs
                        .filter(f => f.question.trim() && f.answer.trim())
                        .map((f, i) => ({ question: f.question, answer: f.answer, order: i + 1 })),
                    announcements: eventData.announcements
                        .filter(a => a.title.trim() && a.content.trim())
                        .map(a => ({
                            title: a.title,
                            content: a.content,
                            publishDate: (a.publishDate && !isNaN(new Date(a.publishDate).getTime())) ? new Date(a.publishDate).toISOString() : new Date().toISOString()
                        }))
                };

                const res = await api.events.createDraft(step1Payload);
                const newEventId = res.id;
                setRegistrationId(newEventId);

                if (eventData.eventPoster) {
                    await api.events.uploadPoster(newEventId, eventData.eventPoster);
                }

                setCurrentStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                if (err.errors && Array.isArray(err.errors)) {
                    const validationErrors = {};
                    err.errors.forEach(issue => {
                        validationErrors[issue.field] = issue.message;
                    });
                    setFieldErrors(validationErrors);
                    setError('Validation failed. Please correct the highlighted errors.');
                } else {
                    setError(err.message || 'Failed to create event. Please ensure all required fields are filled.');
                }
                console.error(err);
            } finally {
                setIsSubmitting(false);
            }
        } else if (currentStep === 2) {
            const clientErrors = validateStep2();
            if (Object.keys(clientErrors).length > 0) {
                setFieldErrors(clientErrors);
                setError('Please fix the validation errors below before submitting.');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            try {
                setIsSubmitting(true);
                if (!eventData.termsAccepted) return;

                const templateColors = {
                    'Default': { primaryColor: '#0a1f1f', secondaryColor: '#0d2f2f', accentColor: '#00ff88' },
                    'Blue Sky': { primaryColor: '#1e3a8a', secondaryColor: '#60a5fa', accentColor: '#ffffff' },
                    'Crimson Rush': { primaryColor: '#7f1d1d', secondaryColor: '#f87171', accentColor: '#ffffff' },
                    'Plain White': { primaryColor: '#f3f4f6', secondaryColor: '#d1d5db', accentColor: '#000000' },
                    'Black & Yellow': { primaryColor: '#000000', secondaryColor: '#4b5563', accentColor: '#facc15' },
                    'Aqua Push': { primaryColor: '#164e63', secondaryColor: '#22d3ee', accentColor: '#ffffff' },
                    'Pink Bubbles': { primaryColor: '#831843', secondaryColor: '#f472b6', accentColor: '#ffffff' }
                };

                const colors = templateColors[eventData.selectedTemplate] || templateColors['Default'];

                const customFields = [];
                Object.entries(eventData.requiredFields).forEach(([key, isRequired]) => {
                    if (isRequired) customFields.push({ label: key, type: 'text', required: true });
                });
                if (eventData.includeMealInfo) customFields.push({ label: 'Meal Preference', type: 'select', required: false, options: ['Veg', 'Non-veg'] });
                if (eventData.includeTshirtInfo) customFields.push({ label: 'T-Shirt Size', type: 'select', required: false, options: ['S', 'M', 'L', 'XL'] });

                const step2Payload = {
                    maxParticipants: parseInt(eventData.participantLimit) || undefined,
                    approvalMode: eventData.acceptanceMode === 'Auto approval' ? 'AUTO' : 'MANUAL',
                    designConfig: colors,
                    customFormFields: customFields,
                    paymentType: eventData.paymentType,
                    upiId: eventData.paymentType === 'MANUAL_UPI' ? eventData.upiId : undefined,
                };

                await api.events.updateDesign(registrationId, step2Payload);

                if (eventData.eventBanner) {
                    await api.events.uploadBanner(registrationId, eventData.eventBanner);
                }

                if (eventData.paymentType === 'MANUAL_UPI' && eventData.upiQrCode) {
                    await api.events.uploadUpiQrCode(registrationId, eventData.upiQrCode);
                }

                await api.events.submitForApproval(registrationId);

                setCurrentStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                if (err.errors && Array.isArray(err.errors)) {
                    const validationErrors = {};
                    err.errors.forEach(issue => {
                        validationErrors[issue.field] = issue.message;
                    });
                    setFieldErrors(validationErrors);
                    setError('Validation failed. Please correct the highlighted errors.');
                } else {
                    setError(err.message || 'Failed to submit event design and configuration.');
                }
                console.error(err);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a1f1f] via-[#0d2626] to-[#0a1f1f]">
            <Header />

            {/* Main Content */}
            <div className="max-w-7xl pt-20 mx-auto px-2 py-12">
                {/* Go Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-white mb-8 hover:text-[#00ff88] transition-colors duration-300"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Go Back</span>
                </button>

                {/* Page Title and Description */}
                <div className="mb-8">
                    <h1 className="text-white text-4xl font-bold mb-4">
                        {currentStep === 1 && 'Add Your Event Information'}
                        {currentStep === 2 && 'Begin Designing Your Event'}
                        {currentStep === 3 && 'Event created successfully !'}
                    </h1>
                    {currentStep !== 3 && (
                        <p className="text-gray-400 text-sm leading-relaxed max-w-4xl">
                            {currentStep === 1 && 'Provide the essential details to get your event started. Add the event name, a clear description, the category it belongs to, and any key information participants should know before joining. This section helps define the purpose and identity of your event, ensuring users understand what it\'s about at a glance. You can always revisit and refine these details later as your event evolves.'}
                            {currentStep === 2 && 'Customize how your event appears to participants by selecting its design elements. Pick from preset colour theme that reflect your brand or concept. Tailor the layout, background, and overall aesthetic to create an experience that feels uniquely yours. All design choices are flexible and can be updated later as needed.'}
                        </p>
                    )}
                </div>

                {/* Progress Indicator */}
                <div className="mb-12">
                    <div className="flex items-center justify-between max-w-full">
                        {[1, 2, 3].map((step) => (
                            <React.Fragment key={step}>
                                <div
                                    className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${currentStep >= step
                                        ? 'border-[#00ff88] bg-[#00ff88]'
                                        : 'border-[#1a4d4d] bg-transparent'
                                        }`}
                                >
                                    {currentStep >= step && (
                                        <div className="w-3 h-3 rounded-full bg-[#0a1f1f]"></div>
                                    )}
                                </div>
                                {step < 3 && (
                                    <div
                                        className={`flex-1 h-1 mx-2 transition-all duration-300 ${currentStep > step ? 'bg-[#00ff88]' : 'bg-[#1a4d4d]'
                                            }`}
                                    ></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Step 1: Event Details Section */}
                {currentStep === 1 && (
                    <div className="rounded-3xl p-8 lg:p-6">
                        {/* Section Header */}
                        <div className="mb-8 pb-4 border-b-2 border-[#00ff88]">
                            <h2 className="text-white text-2xl font-semibold">Event details</h2>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-500/10 border-2 border-red-500/50 rounded-xl text-red-400 flex flex-col gap-2">
                                <span className="font-semibold text-lg">{error}</span>
                                {Object.keys(fieldErrors).length > 0 && (
                                    <ul className="list-disc pl-5 text-sm space-y-1">
                                        {Object.entries(fieldErrors).map(([field, msg]) => {
                                            let readableField = field
                                                .replace('title', 'Event Name')
                                                .replace('eventName', 'Event Name')
                                                .replace('subtitle', 'Subtitle')
                                                .replace('eventSubtitle', 'Subtitle')
                                                .replace('description', 'Description')
                                                .replace('eventDescription', 'Description')
                                                .replace('location.mapLink', 'Google Map Link')
                                                .replace('mapLink', 'Google Map Link')
                                                .replace('venueName', 'Venue Name')
                                                .replace('eventLocation', 'Venue Name')
                                                .replace('startDate', 'Start Date')
                                                .replace('eventStartDate', 'Start Date')
                                                .replace('endDate', 'End Date')
                                                .replace('eventEndDate', 'End Date')
                                                .replace('registrationDeadline', 'Registration Deadline')
                                                .replace(/faqs\.(\d+)\.question/, (_, i) => `FAQ #${parseInt(i)+1} Question`)
                                                .replace(/faqs\.(\d+)\.answer/, (_, i) => `FAQ #${parseInt(i)+1} Answer`)
                                                .replace(/announcements\.(\d+)\.title/, (_, i) => `Announcement #${parseInt(i)+1} Title`)
                                                .replace(/announcements\.(\d+)\.content/, (_, i) => `Announcement #${parseInt(i)+1} Content`);
                                            
                                            readableField = readableField.charAt(0).toUpperCase() + readableField.slice(1);
                                            return (
                                                <li key={field}>
                                                    <strong>{readableField}:</strong> {msg}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Event Form */}
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Row 1: Event Name and Subtitle */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-white text-sm mb-3 block">
                                        Name of the event <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="eventName"
                                        value={eventData.eventName}
                                        onChange={handleInputChange}
                                        placeholder="ThinkerRoot"
                                        className={getInputClass('eventName')}
                                        required
                                    />
                                    {getFieldError('eventName') && (
                                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('eventName')}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-white text-sm mb-3 block">
                                        Subtitle of the event <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="eventSubtitle"
                                        value={eventData.eventSubtitle}
                                        onChange={handleInputChange}
                                        placeholder="This will be the subtext shown under the event name"
                                        className={getInputClass('eventSubtitle')}
                                        required
                                    />
                                    {getFieldError('eventSubtitle') && (
                                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('eventSubtitle')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Type of Event */}
                            <div>
                                <label className="text-white text-sm mb-4 block">
                                    Type of event <span className="text-red-400">*</span>
                                </label>
                                <div className={`flex flex-wrap justify-between gap-4 border-2 ${getFieldError('eventType') ? 'border-red-500' : 'border-[#1a4d4d]'} rounded-xl p-2`}>
                                    {['Hackathon', 'Ideathon', 'Techfest', 'Webinar', 'Other'].map((type) => (
                                        <label
                                            key={type}
                                            className={`flex items-center gap-3 px-6 py-3  rounded-xl cursor-pointer transition-all duration-300 ${eventData.eventType === type
                                                ? 'border-[#00ff88] bg-[#00ff88]/10'
                                                : 'border-[#1a4d4d] hover:border-[#00ff88]/50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="eventType"
                                                value={type}
                                                checked={eventData.eventType === type}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 accent-[#00ff88]"
                                            />
                                            <span className="text-white">{type}</span>
                                        </label>
                                    ))}
                                </div>
                                {getFieldError('eventType') && (
                                    <p className="text-red-400 text-xs mt-1.5">{getFieldError('eventType')}</p>
                                )}
                            </div>

                            {/* Row 2: Theme and Mode of Conduct */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-white text-sm mb-3 block">
                                        Theme of the event <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="eventTheme"
                                        value={eventData.eventTheme}
                                        onChange={handleInputChange}
                                        placeholder="Sustainability, Web 3, AR/VR, etc..."
                                        className={getInputClass('eventTheme')}
                                        required
                                    />
                                    {getFieldError('eventTheme') && (
                                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('eventTheme')}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-white text-sm mb-4 block">
                                        Mode of Conduct <span className="text-red-400">*</span>
                                    </label>
                                    <div className={`flex gap-4 border-2 ${getFieldError('modeOfConduct') ? 'border-red-500' : 'border-[#1a4d4d]'} rounded-xl p-2`}>
                                        {['Online', 'Offline'].map((mode) => (
                                            <label
                                                key={mode}
                                                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition-all duration-300 ${eventData.modeOfConduct === mode
                                                    ? 'border-[#00ff88] bg-[#00ff88]/10'
                                                    : 'border-[#1a4d4d] hover:border-[#00ff88]/50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="modeOfConduct"
                                                    value={mode}
                                                    checked={eventData.modeOfConduct === mode}
                                                    onChange={handleInputChange}
                                                    className="w-5 h-5 accent-[#00ff88]"
                                                />
                                                <span className="text-white">{mode}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {getFieldError('modeOfConduct') && (
                                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('modeOfConduct')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Registration Type Section */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-white text-sm mb-4 block">
                                        Registration Type <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex gap-4 border-2 border-[#1a4d4d]">
                                        {['Individual', 'Group'].map((type) => (
                                            <label
                                                key={type}
                                                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition-all duration-300 ${eventData.registrationType === type
                                                    ? 'border-[#00ff88] bg-[#00ff88]/10'
                                                    : 'border-[#1a4d4d] hover:border-[#00ff88]/50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="registrationType"
                                                    value={type}
                                                    checked={eventData.registrationType === type}
                                                    onChange={handleInputChange}
                                                    className="w-5 h-5 accent-[#00ff88]"
                                                />
                                                <span className="text-white">{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {eventData.registrationType === 'Group' && (
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-white text-sm mb-3 block">
                                                Min Team Size <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="minTeamSize"
                                                value={eventData.minTeamSize}
                                                onChange={handleInputChange}
                                                min="1"
                                                className={getInputClass('minTeamSize')}
                                                required
                                            />
                                            {getFieldError('minTeamSize') && (
                                                <p className="text-red-400 text-xs mt-1.5">{getFieldError('minTeamSize')}</p>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-white text-sm mb-3 block">
                                                Max Team Size <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="maxTeamSize"
                                                value={eventData.maxTeamSize}
                                                onChange={handleInputChange}
                                                min="1"
                                                className={getInputClass('maxTeamSize')}
                                                required
                                            />
                                            {getFieldError('maxTeamSize') && (
                                                <p className="text-red-400 text-xs mt-1.5">{getFieldError('maxTeamSize')}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Row 3: Location and Event Access */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-white text-sm mb-3 block">
                                            Venue Name / Address <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="eventLocation"
                                            value={eventData.eventLocation}
                                            onChange={handleInputChange}
                                            placeholder={eventData.modeOfConduct === 'Online' ? 'e.g. Zoom, Google Meet' : 'e.g. College Hall, Auditorium'}
                                            className={getInputClass('eventLocation')}
                                            required
                                        />
                                        {getFieldError('eventLocation') && (
                                            <p className="text-red-400 text-xs mt-1.5">{getFieldError('eventLocation')}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-white text-sm mb-3 block">
                                            Link / Map Link <span className="text-gray-400">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="mapLink"
                                            value={eventData.mapLink}
                                            onChange={handleInputChange}
                                            placeholder={eventData.modeOfConduct === 'Online' ? 'https://zoom.us/j/...' : 'https://maps.google.com/...'}
                                            className={getInputClass('mapLink')}
                                        />
                                        {getFieldError('mapLink') && (
                                            <p className="text-red-400 text-xs mt-1.5">{getFieldError('mapLink')}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-white text-sm mb-4 block">
                                        Event Access <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex gap-4 border-2 border-[#1a4d4d] ">
                                        {['Free', 'Paid'].map((access) => (
                                            <label
                                                key={access}
                                                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition-all duration-300 ${eventData.eventAccess === access
                                                    ? 'border-[#00ff88] bg-[#00ff88]/10'
                                                    : 'border-[#1a4d4d] hover:border-[#00ff88]/50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="eventAccess"
                                                    value={access}
                                                    checked={eventData.eventAccess === access}
                                                    onChange={handleInputChange}
                                                    className="w-5 h-5 accent-[#00ff88]"
                                                />
                                                <span className="text-white">{access}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Price (conditional) */}
                            {eventData.eventAccess === 'Paid' && (
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-white text-sm mb-3 block">
                                            Ticket Price (₹) <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="ticketPrice"
                                            value={eventData.ticketPrice}
                                            onChange={handleInputChange}
                                            placeholder="499"
                                            min="0"
                                            className={getInputClass('ticketPrice')}
                                            required
                                        />
                                        <p className="text-gray-500 text-xs mt-2">Enter the price per participant in INR</p>
                                        {getFieldError('ticketPrice') && (
                                            <p className="text-red-400 text-xs mt-1.5">{getFieldError('ticketPrice')}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Date & Time Section */}
                            <div className={`border-2 ${getFieldError('eventStartDate') || getFieldError('eventEndDate') || getFieldError('eventTime') || getFieldError('registrationDeadline') ? 'border-red-500 bg-red-500/5' : 'border-[#1a4d4d]'} rounded-xl p-6`}>
                                <label className="text-white text-sm mb-4 block">
                                    Date & Time of the event <span className="text-red-400">*</span>
                                </label>

                                <div className="grid lg:grid-cols-2 grid-cols-1 gap-8">
                                    {/* Left: Calendar Image */}
                                    <div className="flex flex-col items-center">
                                        <div className="relative w-full max-w-sm">
                                            <img
                                                src="/cal.png"
                                                alt="Calendar"
                                                className="w-64 mx-auto lg:w-full h-auto rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Date & Time Inputs */}
                                    <div className="space-y-6">
                                        {/* Description Text */}
                                        <p className="text-gray-400 text-justify text-sm leading-relaxed">
                                            Configure the event date and time, choose all active event dates within the start-end range, and add external submission or additional dates later through announcements.
                                        </p>

                                        {/* Date Input */}
                                        <div>
                                            <label className="text-white text-sm mb-3 block">Date</label>
                                            <div className="flex flex-col lg:flex-row items-center gap-3 mx-auto">
                                                <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
                                                    <div className="bg-[#1a4d4d] text-gray-400 px-4 py-3 rounded-lg text-sm">
                                                        Start
                                                    </div>
                                                    <input
                                                        type="date"
                                                        name="eventStartDate"
                                                        value={eventData.eventStartDate}
                                                        onChange={handleInputChange}
                                                        className={`flex-1 bg-transparent border-2 ${getFieldError('eventStartDate') ? 'border-red-500' : 'border-[#1a4d4d]'} text-white placeholder-gray-500 lg:py-3 py-2 lg:px-4 px-2 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 min-w-0`}
                                                        required
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
                                                    <div className="bg-[#1a4d4d] text-gray-400 px-4 py-3 rounded-lg text-sm">
                                                        End
                                                    </div>
                                                    <input
                                                        type="date"
                                                        name="eventEndDate"
                                                        value={eventData.eventEndDate}
                                                        onChange={handleInputChange}
                                                        className={`flex-1 bg-transparent border-2 ${getFieldError('eventEndDate') ? 'border-red-500' : 'border-[#1a4d4d]'} text-white placeholder-gray-500 lg:py-3 py-2 lg:px-4 px-2 rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300 min-w-0`}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            {getFieldError('eventStartDate') && (
                                                <p className="text-red-400 text-xs mt-1.5">{getFieldError('eventStartDate')}</p>
                                            )}
                                            {getFieldError('eventEndDate') && (
                                                <p className="text-red-400 text-xs mt-1.5">{getFieldError('eventEndDate')}</p>
                                            )}
                                        </div>

                                        {/* Time Input */}
                                        <div>
                                            <label className="text-white text-sm mb-3 block">Time</label>
                                            <div className="flex items-center gap-3">
                                                <div className="bg-[#1a4d4d] text-gray-400 px-4 py-3 rounded-lg text-sm">
                                                    Time
                                                </div>
                                                <input
                                                    type="time"
                                                    name="eventTime"
                                                    value={eventData.eventTime}
                                                    onChange={handleInputChange}
                                                    className={`flex-1 bg-transparent border-2 ${getFieldError('eventTime') ? 'border-red-500' : 'border-[#1a4d4d]'} text-white placeholder-gray-500 lg:py-3 py-2 lg:px-4 px-2  rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300`}
                                                    required
                                                />
                                            </div>
                                            {getFieldError('eventTime') && (
                                                <p className="text-red-400 text-xs mt-1.5">{getFieldError('eventTime')}</p>
                                            )}
                                        </div>

                                        {/* Registration Deadline */}
                                        <div>
                                            <label className="text-white text-sm mb-3 block">Registration Deadline</label>
                                            <div className="flex items-center gap-3">
                                                <div className="bg-[#1a4d4d] text-gray-400 px-4 py-3 rounded-lg text-sm">
                                                    Date
                                                </div>
                                                <input
                                                    type="date"
                                                    name="registrationDeadline"
                                                    value={eventData.registrationDeadline}
                                                    onChange={handleInputChange}
                                                    className={`flex-1 bg-transparent border-2 ${getFieldError('registrationDeadline') ? 'border-red-500' : 'border-[#1a4d4d]'} text-white placeholder-gray-500 lg:py-3 py-2 lg:px-4 px-2  rounded-lg focus:outline-none focus:border-[#00ff88] transition-all duration-300`}
                                                    required
                                                />
                                            </div>
                                            {getFieldError('registrationDeadline') && (
                                                <p className="text-red-400 text-xs mt-1.5">{getFieldError('registrationDeadline')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Organizer Details Section */}
                            <div className="mt-8">
                                <div className="mb-8 pb-4 border-b-2 border-[#00ff88]">
                                    <h2 className="text-white text-2xl font-semibold">Organizer details</h2>
                                </div>
                                <div className="bg-[#1a4d4d]/30 border-2 border-[#1a4d4d] rounded-xl p-6">
                                    <p className="text-gray-400 text-sm">
                                        This event will be automatically attributed to your logged-in organizer profile. Make sure your profile information (Name, College, Contact details) is up to date in the Profile section.
                                    </p>
                                </div>
                            </div>

                            {/* Event Description Section */}
                            <div className="mt-12">
                                <div className="mb-8 pb-4 border-b-2 border-[#00ff88]">
                                    <h2 className="text-white text-2xl font-semibold">Event description</h2>
                                </div>

                                {/* Description Textarea */}
                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-white text-sm">Description <span className="text-red-400">*</span></label>
                                        <span className="text-gray-500 text-xs">
                                            {eventData.eventDescription.length} characters (Min 10)
                                        </span>
                                    </div>
                                    <textarea
                                        name="eventDescription"
                                        value={eventData.eventDescription}
                                        onChange={handleInputChange}
                                        rows="8"
                                        placeholder="Enter event details, guidelines, rules, etc. (min 10 characters)"
                                        className={getInputClass('eventDescription') + ' resize-none'}
                                        required
                                    ></textarea>
                                    {getFieldError('eventDescription') && (
                                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('eventDescription')}</p>
                                    )}
                                </div>

                                {/* Prize Type */}
                                <div className="mb-8">
                                    <label className="text-white text-sm mb-4 block">
                                        Prize of the event <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-4">
                                        {['No prize', 'Cash prize', 'Merchandise', 'Activity points'].map((prize) => (
                                            <label
                                                key={prize}
                                                className={`flex items-center gap-3 px-6 py-3 border-2 rounded-xl cursor-pointer transition-all duration-300 ${eventData.prizeType === prize
                                                    ? 'border-[#00ff88] bg-[#00ff88]/10'
                                                    : 'border-[#1a4d4d] hover:border-[#00ff88]/50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="prizeType"
                                                    value={prize}
                                                    checked={eventData.prizeType === prize}
                                                    onChange={handleInputChange}
                                                    className="w-5 h-5 accent-[#00ff88]"
                                                />
                                                <span className="text-white">{prize}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {getFieldError('prizeType') && (
                                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('prizeType')}</p>
                                    )}
                                </div>

                                {/* Prize Details (Conditional) */}
                                {eventData.prizeType !== 'No prize' && (
                                    <div className="mb-8">
                                        <label className="text-white text-sm mb-3 block">
                                            {eventData.prizeType === 'Cash prize' && 'Cash prize amount/ Activity point count/ Merchandise count'}
                                            {eventData.prizeType === 'Activity points' && 'Cash prize amount/ Activity point count/ Merchandise count'}
                                            {eventData.prizeType === 'Merchandise' && 'Cash prize amount/ Activity point count/ Merchandise count'}
                                        </label>
                                        <p className="text-gray-500 text-xs mb-3">(If more than 1 type of prize, separate prizes using slash /)</p>
                                        <input
                                            type="text"
                                            name="prizeDetails"
                                            value={eventData.prizeDetails}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 5000 / 20 XP / 50 merch to selected participants"
                                            className={getInputClass('prizeDetails')}
                                        />
                                        {getFieldError('prizeDetails') && (
                                            <p className="text-red-400 text-xs mt-1.5">{getFieldError('prizeDetails')}</p>
                                        )}
                                    </div>
                                )}

                                {/* Event Poster Upload */}
                                <div className="mb-8">
                                    <label className="text-white text-sm mb-3 block">
                                        Event poster <span className="text-red-400">*</span>
                                    </label>
                                    <div className={`border-2 border-dashed ${getFieldError('eventPoster') ? 'border-red-500 bg-red-500/5' : 'border-[#1a4d4d] hover:border-[#00ff88]'} rounded-xl p-8 text-center transition-all duration-300`}>
                                        <input
                                            type="file"
                                            id="posterUpload"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setEventData(prev => ({ ...prev, eventPoster: file }));
                                                    setFieldErrors(prev => ({ ...prev, eventPoster: undefined, poster: undefined }));
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="posterUpload"
                                            className="inline-flex items-center gap-2 bg-[#00ff88] hover:bg-[#00cc70] text-[#0a1f1f] font-medium py-2 px-6 rounded-lg cursor-pointer transition-all duration-300"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Upload image
                                        </label>
                                        {eventData.eventPoster && (
                                            <p className="text-[#00ff88] text-sm mt-3">{eventData.eventPoster.name}</p>
                                        )}
                                        {getFieldError('eventPoster') && (
                                            <p className="text-red-400 text-sm mt-3">{getFieldError('eventPoster')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* FAQs Section */}
                            <div className="mt-12">
                                <div className="mb-8 pb-4 border-b-2 border-[#00ff88]">
                                    <h2 className="text-white text-2xl font-semibold">Frequently Asked Questions</h2>
                                </div>
                                <p className="text-gray-400 text-sm mb-6">
                                    Add common questions and answers that participants might have about your event. These will be displayed on your event page.
                                </p>

                                <div className="space-y-6">
                                    {eventData.faqs.map((faq, index) => (
                                        <div
                                            key={index}
                                            className="relative border-2 border-[#1a4d4d] rounded-xl p-6 hover:border-[#1a6d6d] transition-all duration-300 group"
                                        >
                                            {/* FAQ number badge */}
                                            <div className="absolute -top-3 left-4 bg-[#00ff88] text-[#0a1f1f] text-xs font-bold px-3 py-1 rounded-full">
                                                Q{index + 1}
                                            </div>

                                            {/* Remove button */}
                                            {eventData.faqs.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeFaq(index)}
                                                    className="absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors duration-300 opacity-0 group-hover:opacity-100"
                                                    title="Remove this FAQ"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}

                                            <div className="space-y-4 mt-2">
                                                <div>
                                                    <label className="text-white text-sm mb-2 block">Question</label>
                                                    <input
                                                        type="text"
                                                        value={faq.question}
                                                        onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                                                        placeholder="e.g. Who can participate?"
                                                        className={getInputClass(`faqs.${index}.question`)}
                                                    />
                                                    {getFieldError(`faqs.${index}.question`) && (
                                                        <p className="text-red-400 text-xs mt-1.5">{getFieldError(`faqs.${index}.question`)}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-white text-sm mb-2 block">Answer</label>
                                                    <textarea
                                                        value={faq.answer}
                                                        onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                                                        rows="3"
                                                        placeholder="Provide a clear, helpful answer..."
                                                        className={getInputClass(`faqs.${index}.answer`) + ' resize-none'}
                                                    ></textarea>
                                                    {getFieldError(`faqs.${index}.answer`) && (
                                                        <p className="text-red-400 text-xs mt-1.5">{getFieldError(`faqs.${index}.answer`)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add FAQ button */}
                                <button
                                    type="button"
                                    onClick={addFaq}
                                    className="mt-4 flex items-center gap-2 text-[#00ff88] hover:text-[#00cc70] font-medium transition-colors duration-300 group"
                                >
                                    <span className="w-8 h-8 rounded-full border-2 border-[#00ff88] group-hover:bg-[#00ff88]/10 flex items-center justify-center transition-all duration-300">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </span>
                                    Add another question
                                </button>
                            </div>

                            {/* Announcements Section */}
                            <div className="mt-12">
                                <div className="mb-8 pb-4 border-b-2 border-[#00ff88]">
                                    <h2 className="text-white text-2xl font-semibold">Announcements</h2>
                                </div>
                                <p className="text-gray-400 text-sm mb-6">
                                    Schedule announcements that will be published on your event page. Use these to share updates, deadlines, or important information with participants.
                                </p>

                                <div className="space-y-6">
                                    {eventData.announcements.map((announcement, index) => (
                                        <div
                                            key={index}
                                            className="relative border-2 border-[#1a4d4d] rounded-xl p-6 hover:border-[#1a6d6d] transition-all duration-300 group"
                                        >
                                            {/* Announcement number badge */}
                                            <div className="absolute -top-3 left-4 bg-[#00ff88] text-[#0a1f1f] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                                </svg>
                                                #{index + 1}
                                            </div>

                                            {/* Remove button */}
                                            {eventData.announcements.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeAnnouncement(index)}
                                                    className="absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors duration-300 opacity-0 group-hover:opacity-100"
                                                    title="Remove this announcement"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}

                                            <div className="space-y-4 mt-2">
                                                <div className="grid lg:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-white text-sm mb-2 block">Title</label>
                                                        <input
                                                            type="text"
                                                            value={announcement.title}
                                                            onChange={(e) => handleAnnouncementChange(index, 'title', e.target.value)}
                                                            placeholder="e.g. Registration Now Open! 🎉"
                                                            className={getInputClass(`announcements.${index}.title`)}
                                                        />
                                                        {getFieldError(`announcements.${index}.title`) && (
                                                            <p className="text-red-400 text-xs mt-1.5">{getFieldError(`announcements.${index}.title`)}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="text-white text-sm mb-2 block">Publish Date</label>
                                                        <input
                                                            type="datetime-local"
                                                            value={announcement.publishDate}
                                                            onChange={(e) => handleAnnouncementChange(index, 'publishDate', e.target.value)}
                                                            className={`w-full bg-transparent border-2 ${getFieldError(`announcements.${index}.publishDate`) ? 'border-red-500' : 'border-[#1a4d4d]'} text-white placeholder-gray-500 py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300`}
                                                        />
                                                        {getFieldError(`announcements.${index}.publishDate`) && (
                                                            <p className="text-red-400 text-xs mt-1.5">{getFieldError(`announcements.${index}.publishDate`)}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-white text-sm mb-2 block">Content</label>
                                                    <textarea
                                                        value={announcement.content}
                                                        onChange={(e) => handleAnnouncementChange(index, 'content', e.target.value)}
                                                        rows="3"
                                                        placeholder="Write the announcement details here..."
                                                        className={getInputClass(`announcements.${index}.content`) + ' resize-none'}
                                                    ></textarea>
                                                    {getFieldError(`announcements.${index}.content`) && (
                                                        <p className="text-red-400 text-xs mt-1.5">{getFieldError(`announcements.${index}.content`)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Announcement button */}
                                <button
                                    type="button"
                                    onClick={addAnnouncement}
                                    className="mt-4 flex items-center gap-2 text-[#00ff88] hover:text-[#00cc70] font-medium transition-colors duration-300 group"
                                >
                                    <span className="w-8 h-8 rounded-full border-2 border-[#00ff88] group-hover:bg-[#00ff88]/10 flex items-center justify-center transition-all duration-300">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </span>
                                    Add another announcement
                                </button>
                            </div>

                            {/* Next Button */}
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-3 px-12 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#00ff88]/50 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Creating...' : 'Next'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Step 2: Event Design and Details */}
                {currentStep === 2 && (
                    <div className="rounded-3xl bg-[#022F2E] p-8 lg:p-6">
                        {error && (
                            <div className="mb-8 p-4 bg-red-500/10 border-2 border-red-500/50 rounded-xl text-red-400 flex flex-col gap-2">
                                <span className="font-semibold text-lg">{error}</span>
                                {Object.keys(fieldErrors).length > 0 && (
                                    <ul className="list-disc pl-5 text-sm space-y-1">
                                        {Object.entries(fieldErrors).map(([field, msg]) => {
                                            let readableField = field
                                                .replace('maxParticipants', 'Participant Limit')
                                                .replace('participantLimit', 'Participant Limit')
                                                .replace('upiId', 'UPI ID')
                                                .replace('upiQrCode', 'UPI QR Code')
                                                .replace('externalWebsiteLink', 'External Website Link')
                                                .replace('agreedToTerms', 'Terms and Conditions')
                                                .replace('termsAccepted', 'Terms and Conditions');
                                            
                                            readableField = readableField.charAt(0).toUpperCase() + readableField.slice(1);
                                            return (
                                                <li key={field}>
                                                    <strong>{readableField}:</strong> {msg}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}
                        {/* Banner Upload Section */}
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative group">
                                {/* Banner Image Container */}
                                <div className="relative border-2 border-dashed border-[#00ff88] rounded-lg overflow-hidden">
                                    <img
                                        src={eventData.eventBanner ? URL.createObjectURL(eventData.eventBanner) : "/banner-placeholder.png"}
                                        alt="Event Banner"
                                        className="w-full h-auto"
                                        style={{ maxWidth: '350.5px', maxHeight: '147.5px' }}
                                    />

                                    {/* Size Label */}
                                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium">
                                        350.5 × 147.5
                                    </div>
                                </div>

                                {/* Edit Icon */}
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('bannerUpload').click()}
                                    className="absolute -bottom-4 -right-4 bg-[#00ff88] hover:bg-[#00cc70] p-3 rounded-full transition-all duration-300 shadow-lg"
                                >
                                    <svg className="w-5 h-5 text-[#0a1f1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>

                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    id="bannerUpload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setEventData(prev => ({ ...prev, eventBanner: file }));
                                        }
                                    }}
                                />
                            </div>

                            {/* Upload Banner Text */}
                            <button
                                type="button"
                                onClick={() => document.getElementById('bannerUpload').click()}
                                className="text-white text-xl font-medium mt-8 hover:text-[#00ff88] transition-colors duration-300"
                            >
                                Upload banner image
                            </button>
                        </div>

                        {/* Color Selection Section */}
                        <div className="mt-12 border-2 border-dashed border-blue-500 rounded-xl p-8">
                            <h3 className="text-white text-lg font-medium mb-2">
                                Colour Selection (Choose if only chosen Custom Colour Scheme) <span className="text-red-400">*</span>
                            </h3>

                            {/* Templates */}
                            <div className="mt-6">
                                <h4 className="text-white text-sm mb-4">Templates</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                    {[
                                        { name: 'Default', icon: '🌿', bg: 'from-[#0a1f1f] to-[#00ff88]' },
                                        { name: 'Blue Sky', icon: '🌊', bg: 'from-blue-900 to-blue-400' },
                                        { name: 'Crimson Rush', icon: '🔥', bg: 'from-red-900 to-red-400' },
                                        { name: 'Plain White', icon: '⚪', bg: 'from-gray-100 to-gray-300' },
                                        { name: 'Black & Yellow', icon: '⚡', bg: 'from-black to-yellow-400' },
                                        { name: 'Aqua Push', icon: '💧', bg: 'from-cyan-900 to-cyan-400' },
                                        { name: 'Pink Bubbles', icon: '🎀', bg: 'from-pink-900 to-pink-400' }
                                    ].map((template) => (
                                        <button
                                            key={template.name}
                                            type="button"
                                            onClick={() => setEventData(prev => ({ ...prev, selectedTemplate: template.name }))}
                                            className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all duration-300 ${eventData.selectedTemplate === template.name
                                                ? 'border-[#00ff88] bg-[#00ff88]/10'
                                                : 'border-[#1a4d4d] hover:border-[#00ff88]/50'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${template.bg} flex items-center justify-center text-2xl`}>
                                                {template.icon}
                                            </div>
                                            <span className="text-white text-xs text-center">{template.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Template Info */}
                            <p className="text-gray-400 text-sm mt-6 mb-8">
                                View the template colors for each designated area. Your choices will shape the final look of the design. Review the preview to ensure everything looks balanced before finalizing your design.
                            </p>

                            {/* Color Swatches Grid */}
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Primary Background */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg border-2 border-[#1a4d4d] bg-[#0a1f1f]"></div>
                                    <span className="text-white text-sm">Primary-background-colour</span>
                                </div>

                                {/* Secondary Background */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg border-2 border-[#1a4d4d] bg-[#0d2f2f]"></div>
                                    <span className="text-white text-sm">Secondary-background-colour</span>
                                </div>

                                {/* Filler Background */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg border-2 border-[#1a4d4d] bg-[#1a4d4d]"></div>
                                    <span className="text-white text-sm">Filler-background-colour</span>
                                </div>

                                {/* Border Color */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg border-2 border-[#1a4d4d] bg-[#2d5a5a]"></div>
                                    <span className="text-white text-sm">Border-colour</span>
                                </div>

                                {/* Accent Color */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg border-2 border-[#1a4d4d] bg-[#00ff88]"></div>
                                    <span className="text-white text-sm">Accent-colour</span>
                                </div>

                                {/* Gradient Fill */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg border-2 border-[#1a4d4d] bg-gradient-to-r from-[#0a1f1f] to-[#00ff88]"></div>
                                    <span className="text-white text-sm">Gradient fill</span>
                                </div>

                                {/* Primary Text Color */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg border-2 border-[#1a4d4d] bg-white"></div>
                                    <span className="text-white text-sm">Primary-text-colour</span>
                                </div>

                                {/* Secondary Text Color */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg border-2 border-[#1a4d4d] bg-gray-400"></div>
                                    <span className="text-white text-sm">Secondary-text-colour</span>
                                </div>

                                {/* Accent Text Color */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg border-2 border-[#1a4d4d] bg-black"></div>
                                    <span className="text-white text-sm">Accent-text-colour</span>
                                </div>
                            </div>
                        </div>

                        {/* Event Configuration Section */}
                        <div className="mt-12 space-y-8">
                            {/* Mode of Acceptance */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-white text-sm mb-4 block">
                                        Mode of acception <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex gap-4">
                                        {['Auto approval', 'Request acception'].map((mode) => (
                                            <label
                                                key={mode}
                                                className={`flex items-center gap-3 px-6 py-3 border-2 rounded-xl cursor-pointer transition-all duration-300 ${eventData.acceptanceMode === mode
                                                    ? 'border-[#00ff88] bg-[#00ff88]/10'
                                                    : 'border-[#1a4d4d] hover:border-[#00ff88]/50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="acceptanceMode"
                                                    value={mode}
                                                    checked={eventData.acceptanceMode === mode}
                                                    onChange={handleInputChange}
                                                    className="w-5 h-5 accent-[#00ff88]"
                                                />
                                                <span className="text-white text-sm">{mode}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Number of Participants */}
                                {eventData.acceptanceMode === 'Request acception' && (
                                    <div>
                                        <label className="text-white text-sm mb-3 block">
                                            Number of participants allowed{' '}
                                            <span className="text-gray-500 text-xs">(This bar is shown only if they select 2 option)</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="participantLimit"
                                            value={eventData.participantLimit}
                                            onChange={handleInputChange}
                                            placeholder="500"
                                            className={getInputClass('participantLimit')}
                                        />
                                        {getFieldError('participantLimit') && (
                                            <p className="text-red-400 text-xs mt-1.5">{getFieldError('participantLimit')}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Register Button Action */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-white text-sm mb-4 block">What does register button do?</label>
                                    <div className="flex gap-4">
                                        {['Register', 'Go to external site'].map((action) => (
                                            <label
                                                key={action}
                                                className={`flex items-center gap-3 px-6 py-3 border-2 rounded-xl cursor-pointer transition-all duration-300 ${eventData.registerAction === action
                                                    ? 'border-[#00ff88] bg-[#00ff88]/10'
                                                    : 'border-[#1a4d4d] hover:border-[#00ff88]/50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="registerAction"
                                                    value={action}
                                                    checked={eventData.registerAction === action}
                                                    onChange={handleInputChange}
                                                    className="w-5 h-5 accent-[#00ff88]"
                                                />
                                                <span className="text-white text-sm">{action}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* External Website Link */}
                                {eventData.registerAction === 'Go to external site' && (
                                    <div>
                                        <label className="text-white text-sm mb-3 block">The external website link</label>
                                        <input
                                            type="url"
                                            name="externalWebsiteLink"
                                            value={eventData.externalWebsiteLink}
                                            onChange={handleInputChange}
                                            placeholder="URL of external website"
                                            className={getInputClass('externalWebsiteLink')}
                                        />
                                        {getFieldError('externalWebsiteLink') && (
                                            <p className="text-red-400 text-xs mt-1.5">{getFieldError('externalWebsiteLink')}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Payment Options Section */}
                            <div>
                                <label className="text-white text-sm mb-4 block">
                                    Payment Options <span className="text-red-400">*</span>
                                </label>
                                <div className="grid lg:grid-cols-3 gap-4 mb-6">
                                    {[
                                        { id: 'FREE', label: 'Free (No Payment)' },
                                        { id: 'MANUAL_UPI', label: 'Manual UPI Payment' },
                                        { id: 'RAZORPAY', label: 'Razorpay System' }
                                    ].map((opt) => (
                                        <label
                                            key={opt.id}
                                            className={`flex items-center gap-3 px-6 py-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${eventData.paymentType === opt.id
                                                ? 'border-[#00ff88] bg-[#00ff88]/10'
                                                : 'border-[#1a4d4d] hover:border-[#00ff88]/50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentType"
                                                value={opt.id}
                                                checked={eventData.paymentType === opt.id}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 accent-[#00ff88]"
                                            />
                                            <span className="text-white text-sm font-medium">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {eventData.paymentType === 'MANUAL_UPI' && (
                                    <div className="grid lg:grid-cols-2 gap-6 border-2 border-[#1a4d4d] p-6 rounded-xl">
                                        <div>
                                            <label className="text-white text-sm mb-3 block">
                                                UPI ID <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="upiId"
                                                value={eventData.upiId}
                                                onChange={handleInputChange}
                                                placeholder="e.g. yourname@upi"
                                                className={getInputClass('upiId')}
                                                required={eventData.paymentType === 'MANUAL_UPI'}
                                            />
                                            {getFieldError('upiId') && (
                                                <p className="text-red-400 text-xs mt-1.5">{getFieldError('upiId')}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-white text-sm mb-3 block">
                                                Upload Payment QR Code <span className="text-red-400">*</span>
                                            </label>
                                            <div className={`border-2 border-dashed ${getFieldError('upiQrCode') ? 'border-red-500 bg-red-500/5' : 'border-[#1a4d4d] hover:border-[#00ff88]'} rounded-xl p-4 text-center transition-all duration-300 relative`}>
                                                <input
                                                    type="file"
                                                    id="upiQrCodeUpload"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setEventData(prev => ({ ...prev, upiQrCode: file }));
                                                            setFieldErrors(prev => ({ ...prev, upiQrCode: undefined }));
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor="upiQrCodeUpload"
                                                    className="inline-flex items-center gap-2 bg-[#1a4d4d] hover:bg-[#2a5d5d] text-white font-medium py-2 px-6 rounded-lg cursor-pointer transition-all duration-300"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Upload QR Code
                                                </label>
                                                {eventData.upiQrCode && (
                                                    <p className="text-[#00ff88] text-sm mt-3">{eventData.upiQrCode.name}</p>
                                                )}
                                                {getFieldError('upiQrCode') && (
                                                    <p className="text-red-400 text-sm mt-3">{getFieldError('upiQrCode')}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Required Information Checkboxes */}
                            <div>
                                <label className="text-white text-sm mb-4 block">Check all the information you need from our side -</label>
                                <div className="border-2 border-[#1a4d4d] rounded-xl p-6 space-y-3">
                                    {Object.entries({
                                        name: 'Name',
                                        phone: 'Phone number',
                                        email: 'E-mail',
                                        college: 'College'
                                    }).map(([key, label]) => (
                                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={eventData.requiredFields[key]}
                                                onChange={(e) => {
                                                    setEventData(prev => ({
                                                        ...prev,
                                                        requiredFields: {
                                                            ...prev.requiredFields,
                                                            [key]: e.target.checked
                                                        }
                                                    }));
                                                }}
                                                className="w-5 h-5 accent-[#00ff88] rounded"
                                            />
                                            <span className="text-white text-sm group-hover:text-[#00ff88] transition-colors">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Include Meal Info */}
                                <div className="flex items-center justify-between border-2 border-[#1a4d4d] rounded-xl p-4">
                                    <span className="text-white text-sm">Include meal info?</span>
                                    <button
                                        type="button"
                                        onClick={() => setEventData(prev => ({ ...prev, includeMealInfo: !prev.includeMealInfo }))}
                                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${eventData.includeMealInfo ? 'bg-[#00ff88]' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${eventData.includeMealInfo ? 'transform translate-x-7' : ''
                                                }`}
                                        ></div>
                                    </button>
                                </div>

                                {/* Include T-shirt Size Info */}
                                <div className="flex items-center justify-between border-2 border-[#1a4d4d] rounded-xl p-4">
                                    <span className="text-white text-sm">Include T-shirt size info?</span>
                                    <button
                                        type="button"
                                        onClick={() => setEventData(prev => ({ ...prev, includeTshirtInfo: !prev.includeTshirtInfo }))}
                                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${eventData.includeTshirtInfo ? 'bg-[#00ff88]' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${eventData.includeTshirtInfo ? 'transform translate-x-7' : ''
                                                }`}
                                        ></div>
                                    </button>
                                </div>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="bg-[#0a1f1f] border-2 border-[#1a4d4d] rounded-xl p-6">
                                <p className="text-gray-400 text-sm mb-4">
                                    By proceeding, you acknowledge that you have read, understood, and agree to comply with Lenient Tree's Terms and Conditions for hosting an event on our platform.
                                </p>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={eventData.termsAccepted}
                                        onChange={(e) => {
                                            setEventData(prev => ({ ...prev, termsAccepted: e.target.checked }));
                                            if (fieldErrors.termsAccepted || fieldErrors.agreedToTerms) {
                                                setFieldErrors(prev => ({ ...prev, termsAccepted: undefined, agreedToTerms: undefined }));
                                            }
                                        }}
                                        className="w-5 h-5 accent-[#00ff88] rounded mt-0.5"
                                    />
                                    <span className="text-white text-sm group-hover:text-[#00ff88] transition-colors">
                                        I have read and agree to the{' '}
                                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                                            terms and conditions
                                        </a>
                                    </span>
                                </label>
                                {getFieldError('termsAccepted') && (
                                    <p className="text-red-400 text-xs mt-1.5">{getFieldError('termsAccepted')}</p>
                                )}
                            </div>

                            {/* Preview and Submit Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(true)}
                                    className="flex-1 bg-transparent border-2 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10 font-bold py-4 px-12 rounded-xl transition-all duration-300"
                                >
                                    Preview
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!eventData.termsAccepted || isSubmitting}
                                    className={`flex-1 font-bold py-4 px-12 rounded-xl transition-all duration-300 ${eventData.termsAccepted && !isSubmitting
                                        ? 'bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] transform hover:scale-105 hover:shadow-lg hover:shadow-[#00ff88]/50'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </div>

                        {/* Original Navigation Buttons - Hidden for now */}
                        <div className="hidden flex justify-between pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentStep(prev => prev - 1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="bg-transparent border-2 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-[#0a1f1f] font-bold py-3 px-12 rounded-xl transition-all duration-300"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                className="bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-3 px-12 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#00ff88]/50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Success Page */}
                {currentStep === 3 && (
                    <div className="flex items-center justify-center py-12">
                        <div className="max-w-xl w-full bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-12">
                            {/* Success Icon */}
                            <div className="flex justify-center mb-8">
                                <div className="text-8xl">🎉</div>
                            </div>

                            {/* Success Message */}
                            <h2 className="text-white text-2xl font-bold text-center mb-2">
                                Event Created Successful !
                            </h2>
                            <p className="text-gray-400 text-sm text-center mb-6">
                                Your unique registration ID is:
                            </p>

                            {/* Registration ID Display */}
                            <div className="bg-[#1a4d4d] border-2 border-[#2d5a5a] rounded-xl p-4 mb-3 flex items-center justify-between">
                                <span className="text-[#00ff88] text-xl font-bold tracking-wide">
                                    {registrationId}
                                </span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(registrationId);
                                        alert('Registration ID copied to clipboard!');
                                    }}
                                    className="p-2 hover:bg-[#2d5a5a] rounded-lg transition-colors"
                                    title="Copy to clipboard"
                                >
                                    <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>

                            <p className="text-gray-500 text-xs text-center mb-8">
                                Please save this ID or screenshot it for later use. Check email to know the date and time of your scheduled meet
                            </p>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    Done
                                </button>
                                <button
                                    onClick={() => {
                                        // TODO: Implement bookmark functionality
                                        alert('Event bookmarked!');
                                    }}
                                    className="w-full bg-transparent border-2 border-[#1a4d4d] hover:border-[#00ff88] text-white font-medium py-4 px-6 rounded-xl transition-all duration-300"
                                >
                                    Bookmark your event
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
                    <div className="min-h-screen py-8 px-4">
                        <div className="max-w-2xl mx-auto">
                            {/* Modal Header with Close Button */}
                            <div className="flex justify-between items-center mb-6">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="flex items-center gap-2 text-[#00ff88] hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span>Go Back</span>
                                </button>
                                <div className="flex gap-3">
                                    <button className="p-2 bg-[#0d2f2f] rounded-lg hover:bg-[#1a4d4d] transition-colors">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                    <button className="p-2 bg-[#0d2f2f] rounded-lg hover:bg-[#1a4d4d] transition-colors">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Event Preview Card */}
                            <div className="bg-gradient-to-br from-[#0a1f1f] via-[#0d2626] to-[#0a1f1f] rounded-3xl overflow-hidden">
                                {/* Event Header */}
                                <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 p-8 text-white">
                                    <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
                                        <div className="text-6xl font-bold">››››</div>
                                    </div>
                                    <div className="ml-32">
                                        <h2 className="text-2xl font-bold mb-2">{eventData.eventDateRange || 'Tuesday, 24 June 2025'}</h2>
                                        <p className="text-lg">Time: {eventData.eventTime || '7 PM to 8 PM'}</p>
                                        <p className="text-lg">Mode: {eventData.modeOfConduct.toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Event Content */}
                                <div className="p-8">
                                    <div className="grid lg:grid-cols-3 gap-8">
                                        {/* Left: Event Poster */}
                                        <div className="lg:col-span-1">
                                            {eventData.eventPoster ? (
                                                <img
                                                    src={URL.createObjectURL(eventData.eventPoster)}
                                                    alt="Event Poster"
                                                    className="w-full rounded-xl"
                                                />
                                            ) : (
                                                <div className="w-full aspect-[3/4] bg-blue-900 rounded-xl flex items-center justify-center">
                                                    <span className="text-white text-sm">No poster uploaded</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Event Details */}
                                        <div className="lg:col-span-2 space-y-6">
                                            <div>
                                                <h1 className="text-white text-3xl font-bold mb-2">
                                                    {eventData.eventName || 'ABC Hackathon 2025'}
                                                </h1>
                                                <p className="text-gray-400 text-sm">{eventData.eventSubtitle || 'Cybersecurity Workshop'}</p>
                                            </div>

                                            <div className="flex gap-3 text-gray-400 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>{eventData.eventDateRange || '29 Jul - 30 Jul 2025'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                                    </svg>
                                                    <span>{eventData.modeOfConduct}</span>
                                                </div>
                                            </div>

                                            {/* Register and Bookmark Buttons */}
                                            <div className="space-y-3">
                                                <button className="w-full bg-[#00ff88] hover:bg-[#00cc70] text-[#0a1f1f] font-bold py-3 px-6 rounded-xl transition-all duration-300">
                                                    Register
                                                </button>
                                                <button className="w-full bg-transparent border-2 border-[#1a4d4d] hover:border-[#00ff88] text-white font-medium py-3 px-6 rounded-xl transition-all duration-300">
                                                    Bookmark
                                                </button>
                                            </div>

                                            <p className="text-gray-500 text-sm text-center">
                                                🎯 {eventData.participantLimit || '1939'} participants registered
                                            </p>
                                        </div>
                                    </div>

                                    {/* Announcements Section */}
                                    <div className="mt-8 bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-xl p-6">
                                        <h3 className="text-white text-lg font-semibold mb-4">Announcements</h3>
                                        <div className="bg-[#1a4d4d] rounded-xl p-4 mb-4">
                                            <div className="text-center">
                                                <p className="text-gray-400 text-sm mb-2">Event closes in:</p>
                                                <p className="text-[#00ff88] text-xl font-bold">2d-23h-14m</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#0a1f1f] rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <div className="flex-1">
                                                    <p className="text-gray-500 text-xs mb-1">12 Jul 2025</p>
                                                    <h4 className="text-white font-medium mb-2">Early Bird Registration Ends Soon</h4>
                                                    <p className="text-gray-400 text-sm">Register before July 20th to get 30% off on prize ticket price!</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Section */}
                                    <div className="mt-8">
                                        <h3 className="text-white text-lg font-semibold mb-4">Details</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {eventData.prizeType !== 'No prize' && (
                                                <>
                                                    <div className="bg-[#0d2f2f] border-2 border-[#00ff88] rounded-xl p-4 text-center">
                                                        <p className="text-gray-400 text-xs mb-1">Available Prizes</p>
                                                        <p className="text-white text-xl font-bold">$ 2000</p>
                                                    </div>
                                                    <div className="bg-[#0d2f2f] border-2 border-[#00ff88] rounded-xl p-4 text-center">
                                                        <p className="text-gray-400 text-xs mb-1">Available Prizes</p>
                                                        <p className="text-white text-xl font-bold">$ 2000</p>
                                                    </div>
                                                    <div className="bg-[#0d2f2f] border-2 border-[#00ff88] rounded-xl p-4 text-center">
                                                        <p className="text-gray-400 text-xs mb-1">Available Prizes</p>
                                                        <p className="text-white text-xl font-bold">$ 2000</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {eventData.eventDescription && (
                                            <div className="mt-4 bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-xl p-6">
                                                <p className="text-gray-300 text-sm leading-relaxed">{eventData.eventDescription}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default OrganizeEvent;
