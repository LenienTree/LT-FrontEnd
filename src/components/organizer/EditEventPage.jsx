import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, Upload, Trash2, Plus, X, Check, Save, 
  Users, CreditCard, Clipboard, Info, AlertTriangle, CheckCircle, 
  XCircle, QrCode, Search, ExternalLink, Calendar, MapPin, Award,
  GripVertical, Type, AlignLeft, Hash, AtSign, Phone, ChevronDown, ToggleLeft, Link2
} from 'lucide-react';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import { events as eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Tab states: 'info', 'fields', 'payment', 'attendees'
  const [activeTab, setActiveTab] = useState('info');
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const getFieldError = (fieldName) => {
    const mappings = {
      title: ['title'],
      subtitle: ['subtitle'],
      description: ['description'],
      category: ['category'],
      mode: ['mode'],
      theme: ['theme'],
      startDate: ['startDate'],
      endDate: ['endDate'],
      registrationDeadline: ['registrationDeadline'],
      venueName: ['venueName', 'location.venueName'],
      address: ['address'],
      mapLink: ['mapLink', 'location.mapLink'],
      prizeType: ['prizeType'],
      prizeAmount: ['prizeAmount'],
      ticketPrice: ['ticketPrice'],
      upiId: ['upiId'],
      upiQrCode: ['upiQrCode']
    };
    const keys = mappings[fieldName] || [fieldName];
    for (const key of keys) {
      if (fieldErrors[key]) return fieldErrors[key];
    }
    return null;
  };

  const getInputClass = (fieldName, baseClass = "") => {
    const hasErr = !!getFieldError(fieldName);
    return `w-full bg-transparent border-2 ${
      hasErr ? 'border-red-500/80 focus:border-red-500' : 'border-[#1a4d4d] focus:border-[#00ff88]'
    } text-white py-3 px-4 rounded-xl focus:outline-none transition-all duration-300 ${baseClass}`;
  };

  const updateInfoField = (field, value) => {
    setInfoForm(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const updatePaymentField = (field, value) => {
    setPaymentConfig(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };
  
  // Event Data State
  const [eventData, setEventData] = useState(null);
  
  // Tab 1: Event Details form
  const [infoForm, setInfoForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Hackathon',
    mode: 'ONLINE',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    prizeType: 'NONE',
    prizeAmount: 0,
    theme: '',
    venueName: '',
    address: '',
    mapLink: '',
    bannerImage: '',
    eventPoster: '',
    faqs: [],
    announcements: []
  });
  
  // Image Upload refs
  const bannerInputRef = useRef(null);
  const posterInputRef = useRef(null);
  const upiQrInputRef = useRef(null);
  
  // Tab 2: Custom Registration Fields Builder
  const [formFields, setFormFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [fieldBuilderError, setFieldBuilderError] = useState(''); // inline error for builder card only
  const [optionDuplicateError, setOptionDuplicateError] = useState(false);

  // Tab 3: Payment Configuration
  const [paymentConfig, setPaymentConfig] = useState({
    isPaid: false,
    paymentType: 'FREE',
    ticketPrice: 0,
    upiId: '',
    upiQrCode: '',
    isIeeeEvent: false,
    ieeeMemberPrice: 0,
    nonIeeeMemberPrice: 0,
    requiresIeeeId: true
  });

  // Premium Event Configuration
  const [premiumConfig, setPremiumConfig] = useState({
    requiresLinkedinShare: false,
    linkedinShareDescription: '',
    linkedinSharePoster: ''
  });
  const linkedinPosterInputRef = useRef(null);
  
  // Tab 4: Attendees list & manual validation
  const [attendees, setAttendees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAttendee, setSelectedAttendee] = useState(null); // for screenshot verification modal
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [processingAttendeeId, setProcessingAttendeeId] = useState(null);

  // Delete Event confirmations
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingEvent, setDeletingEvent] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const full = await eventsApi.getById(id);
      const e = full?.event || full;
      if (!e) throw new Error('Event data not found.');
      
      setEventData(e);
      
      // Populate Tab 1: Info Form
      setInfoForm({
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
        theme: e.theme || '',
        venueName: e.venueName || '',
        address: e.address || '',
        mapLink: e.mapLink || '',
        bannerImage: e.bannerImage || '',
        eventPoster: e.eventPoster || '',
        faqs: (e.faqs || []).map(f => ({ id: f.id, question: f.question, answer: f.answer, order: f.order || 0 })),
        announcements: (e.announcements || []).map(a => ({ id: a.id, title: a.title, content: a.content }))
      });
      
      // Populate Tab 2: Custom Registration Fields Builder
      const defaultFields = [
        { label: 'name', type: 'text', required: true },
        { label: 'email', type: 'email', required: true },
        { label: 'phone', type: 'tel', required: true },
        { label: 'college', type: 'text', required: true }
      ];
      
      const fields = e.customFormFields && Array.isArray(e.customFormFields) && e.customFormFields.length > 0 
        ? e.customFormFields 
        : defaultFields;
        
      setFormFields(fields);
      
      // Populate Tab 3: Payment Configuration
      setPaymentConfig({
        isPaid: e.isPaid ?? false,
        paymentType: e.paymentType || 'FREE',
        ticketPrice: e.ticketPrice ?? 0,
        upiId: e.upiId || '',
        upiQrCode: e.upiQrCode || '',
        isIeeeEvent: e.isIeeeEvent ?? false,
        ieeeMemberPrice: e.ieeeMemberPrice ?? 0,
        nonIeeeMemberPrice: e.nonIeeeMemberPrice ?? 0,
        requiresIeeeId: e.requiresIeeeId ?? true
      });

      // Populate Premium Event Configuration
      setPremiumConfig({
        requiresLinkedinShare: e.requiresLinkedinShare ?? false,
        linkedinShareDescription: e.linkedinShareDescription || '',
        linkedinSharePoster: e.linkedinSharePoster || ''
      });
      
      // Fetch attendees immediately in background or if tab is active
      fetchAttendees();
      
    } catch (err) {
      setError(err.message || 'Failed to fetch event details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    try {
      setLoadingAttendees(true);
      const res = await eventsApi.getParticipants(id);
      // Map participants list: FastAPI/Express/Prisma outputs paginated or raw data
      const list = Array.isArray(res) 
        ? res 
        : (Array.isArray(res?.data) 
            ? res.data 
            : (Array.isArray(res?.registrations) 
                ? res.registrations 
                : []));
      setAttendees(list);
    } catch (err) {
      console.error('Failed to load attendees:', err);
    } finally {
      setLoadingAttendees(false);
    }
  };

  // ─── Save Handlers ─────────────────────────────────────────────────────────
  
  const handleSaveInfo = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    setFieldErrors({});
    try {
      const payload = {
        title: infoForm.title,
        subtitle: infoForm.subtitle || undefined,
        description: infoForm.description,
        category: infoForm.category,
        theme: infoForm.theme || undefined,
        mode: infoForm.mode,
        startDate: infoForm.startDate ? new Date(infoForm.startDate).toISOString() : undefined,
        endDate: infoForm.endDate ? new Date(infoForm.endDate).toISOString() : undefined,
        registrationDeadline: infoForm.registrationDeadline ? new Date(infoForm.registrationDeadline).toISOString() : undefined,
        prizeType: infoForm.prizeType,
        prizeAmount: parseFloat(infoForm.prizeAmount) || 0,
        venueName: infoForm.mode === 'OFFLINE' ? (infoForm.venueName || undefined) : null,
        address: infoForm.mode === 'OFFLINE' ? (infoForm.address || undefined) : null,
        mapLink: infoForm.mode === 'OFFLINE' ? (infoForm.mapLink || undefined) : null
      };
      
      await eventsApi.update(id, payload);
      
      // FAQs Synchronization
      for (const faq of infoForm.faqs) {
        if (!faq.question?.trim() || !faq.answer?.trim()) continue;
        if (faq.id) {
          await eventsApi.updateFAQ(id, faq.id, { question: faq.question, answer: faq.answer });
        } else {
          await eventsApi.createFAQ(id, { question: faq.question, answer: faq.answer, order: faq.order || 0 });
        }
      }
      
      // Announcements Synchronization
      for (const ann of infoForm.announcements) {
        if (!ann.title?.trim() || !ann.content?.trim()) continue;
        if (ann.id) {
          await eventsApi.updateAnnouncement(id, ann.id, { title: ann.title, content: ann.content });
        } else {
          await eventsApi.createAnnouncement(id, { title: ann.title, content: ann.content });
        }
      }
      
      setSuccess('Event details saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
      fetchEventDetails();
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const validationErrors = {};
        err.errors.forEach(issue => {
          validationErrors[issue.field] = issue.message;
        });
        setFieldErrors(validationErrors);
        setError('Validation failed. Please correct the highlighted errors.');
      } else {
        setError(err.message || 'Failed to save event details.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFieldsBuilder = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    setFieldErrors({});
    try {
      // Update form fields on the backend
      await eventsApi.updateDesign(id, { customFormFields: formFields });
      setSuccess('Registration form fields updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
      fetchEventDetails();
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const validationErrors = {};
        err.errors.forEach(issue => {
          validationErrors[issue.field] = issue.message;
        });
        setFieldErrors(validationErrors);
        setError('Validation failed. Please correct the highlighted errors.');
      } else {
        setError(err.message || 'Failed to save registration form fields.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentConfig = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    setFieldErrors({});
    try {
      const payload = {
        isPaid: paymentConfig.isPaid,
        paymentType: paymentConfig.isPaid ? paymentConfig.paymentType : 'FREE',
        ticketPrice: (paymentConfig.isPaid && !paymentConfig.isIeeeEvent) ? parseFloat(paymentConfig.ticketPrice) || 0 : 0,
        upiId: (paymentConfig.isPaid && paymentConfig.paymentType === 'MANUAL_UPI') ? paymentConfig.upiId : null,
        isIeeeEvent: paymentConfig.isPaid && paymentConfig.isIeeeEvent,
        ieeeMemberPrice: (paymentConfig.isPaid && paymentConfig.isIeeeEvent) ? parseFloat(paymentConfig.ieeeMemberPrice) || 0 : 0,
        nonIeeeMemberPrice: (paymentConfig.isPaid && paymentConfig.isIeeeEvent) ? parseFloat(paymentConfig.nonIeeeMemberPrice) || 0 : 0,
        requiresIeeeId: (paymentConfig.isPaid && paymentConfig.isIeeeEvent) ? paymentConfig.requiresIeeeId : true
      };
      
      await eventsApi.update(id, payload);
      setSuccess('Payment configuration updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
      fetchEventDetails();
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const validationErrors = {};
        err.errors.forEach(issue => {
          validationErrors[issue.field] = issue.message;
        });
        setFieldErrors(validationErrors);
        setError('Validation failed. Please correct the highlighted errors.');
      } else {
        setError(err.message || 'Failed to update payment settings.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePremiumConfig = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    setFieldErrors({});
    try {
      const payload = {
        requiresLinkedinShare: premiumConfig.requiresLinkedinShare,
        linkedinShareDescription: premiumConfig.linkedinShareDescription || null
      };
      
      await eventsApi.update(id, payload);
      setSuccess('Premium features configuration updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
      fetchEventDetails();
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const validationErrors = {};
        err.errors.forEach(issue => {
          validationErrors[issue.field] = issue.message;
        });
        setFieldErrors(validationErrors);
        setError('Validation failed. Please correct the highlighted errors.');
      } else {
        setError(err.message || 'Failed to update premium settings.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleLinkedinPosterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSaving(true);
      setError('');
      const res = await eventsApi.uploadLinkedinPoster(id, file);
      setPremiumConfig(prev => ({ 
        ...prev, 
        linkedinSharePoster: res?.linkedinSharePoster || URL.createObjectURL(file) 
      }));
      setSuccess('LinkedIn share poster uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchEventDetails();
    } catch (err) {
      setError(err.message || 'LinkedIn poster upload failed.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Image Uploader Helpers ────────────────────────────────────────────────
  
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSaving(true);
      setError('');
      const res = await eventsApi.uploadBanner(id, file);
      setInfoForm(prev => ({ ...prev, bannerImage: res?.bannerImage || URL.createObjectURL(file) }));
      setSuccess('Banner image uploaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Banner upload failed.');
    } finally {
      setSaving(false);
    }
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSaving(true);
      setError('');
      const res = await eventsApi.uploadPoster(id, file);
      setInfoForm(prev => ({ ...prev, eventPoster: res?.eventPoster || URL.createObjectURL(file) }));
      setSuccess('Poster image uploaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Poster upload failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleQrCodeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSaving(true);
      setError('');
      const res = await eventsApi.uploadUpiQrCode(id, file);
      setPaymentConfig(prev => ({ ...prev, upiQrCode: res?.upiQrCode || URL.createObjectURL(file) }));
      setFieldErrors(prev => {
        if (!prev.upiQrCode) return prev;
        const copy = { ...prev };
        delete copy.upiQrCode;
        return copy;
      });
      setSuccess('UPI QR Code uploaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'QR Code upload failed.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Form Builder Helpers ──────────────────────────────────────────────────

  const FIELD_TYPES = [
    { value: 'text',     label: 'Short Text',     desc: 'Single-line text answer',       Icon: Type,         color: '#60a5fa' },
    { value: 'textarea', label: 'Long Text',       desc: 'Multi-line paragraph answer',   Icon: AlignLeft,    color: '#a78bfa' },
    { value: 'number',   label: 'Number',          desc: 'Numeric value only',            Icon: Hash,         color: '#fb923c' },
    { value: 'email',    label: 'Email',           desc: 'Validated email address',       Icon: AtSign,       color: '#f472b6' },
    { value: 'tel',      label: 'Phone / Contact', desc: 'Phone number input',            Icon: Phone,        color: '#34d399' },
    { value: 'select',   label: 'Dropdown',        desc: 'Pick one from a list',          Icon: ChevronDown,  color: '#fbbf24' },
    { value: 'checkbox', label: 'Checkbox',        desc: 'Yes / No toggle',               Icon: ToggleLeft,   color: '#00ff88' },
    { value: 'url',      label: 'URL / Link',      desc: 'Website or portfolio link',     Icon: Link2,        color: '#38bdf8' },
  ];

  const addField = () => {
    const trimmed = newFieldName.trim();
    if (!trimmed) {
      setFieldBuilderError('Field label is required.');
      return;
    }
    if (trimmed.length > 60) {
      setFieldBuilderError('Field label must be 60 characters or less.');
      return;
    }

    // Check for duplicate labels (case insensitive)
    if (formFields.some(f => f.label.toLowerCase() === trimmed.toLowerCase())) {
      setFieldBuilderError('A field with this name already exists.');
      return;
    }

    if (newFieldType === 'select' && newFieldOptions.length === 0) {
      setFieldBuilderError('Please add at least one option for the Dropdown field.');
      return;
    }

    if (newFieldType === 'select' && newFieldOptions.length < 2) {
      setFieldBuilderError('Dropdown fields should have at least 2 options.');
      return;
    }

    const newField = {
      label: trimmed,
      type: newFieldType,
      required: newFieldRequired,
      ...(newFieldType === 'select' ? { options: [...newFieldOptions] } : {}),
    };

    setFormFields(prev => [...prev, newField]);

    // Reset inputs
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldOptions([]);
    setNewOptionInput('');
    setFieldBuilderError('');
  };
  
  const deleteField = (idx) => {
    const field = formFields[idx];
    // Block deleting Name and Email
    if (field.label.toLowerCase() === 'name' || field.label.toLowerCase() === 'email') {
      setFieldBuilderError('Default "Name" and "Email" fields are required and cannot be deleted.');
      setTimeout(() => setFieldBuilderError(''), 3000);
      return;
    }
    setFormFields(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleRequired = (idx) => {
    const field = formFields[idx];
    // Block toggling Name and Email
    if (field.label.toLowerCase() === 'name' || field.label.toLowerCase() === 'email') {
      setFieldBuilderError('Default "Name" and "Email" fields are permanently required.');
      setTimeout(() => setFieldBuilderError(''), 3000);
      return;
    }
    setFormFields(prev => prev.map((f, i) => i === idx ? { ...f, required: !f.required } : f));
  };

  const addOptionToNewField = () => {
    const val = newOptionInput.trim();
    if (!val) return;
    if (newFieldOptions.map(o => o.toLowerCase()).includes(val.toLowerCase())) {
      setOptionDuplicateError(true);
      setTimeout(() => setOptionDuplicateError(false), 2000);
      return;
    }
    setNewFieldOptions(prev => [...prev, val]);
    setNewOptionInput('');
    setOptionDuplicateError(false);
  };

  const removeOptionFromNewField = (val) => {
    setNewFieldOptions(prev => prev.filter(o => o !== val));
  };

  // ─── FAQ & Announcement lists Helpers ─────────────────────────────────────
  
  const handleFaqChange = (index, field, value) => {
    setInfoForm(prev => {
      const faqs = [...prev.faqs];
      faqs[index] = { ...faqs[index], [field]: value };
      return { ...prev, faqs };
    });
  };

  const addFaq = () => {
    setInfoForm(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '', order: prev.faqs.length }]
    }));
  };

  const removeFaq = async (index) => {
    const faq = infoForm.faqs[index];
    if (faq.id) {
      try {
        await eventsApi.deleteFAQ(id, faq.id);
      } catch (err) {
        console.error('FAQ Delete error:', err);
      }
    }
    setInfoForm(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  const handleAnnouncementChange = (index, field, value) => {
    setInfoForm(prev => {
      const announcements = [...prev.announcements];
      announcements[index] = { ...announcements[index], [field]: value };
      return { ...prev, announcements };
    });
  };

  const addAnnouncement = () => {
    setInfoForm(prev => ({
      ...prev,
      announcements: [...prev.announcements, { title: '', content: '' }]
    }));
  };

  const removeAnnouncement = async (index) => {
    const ann = infoForm.announcements[index];
    if (ann.id) {
      try {
        await eventsApi.deleteAnnouncement(id, ann.id);
      } catch (err) {
        console.error('Announcement Delete error:', err);
      }
    }
    setInfoForm(prev => ({
      ...prev,
      announcements: prev.announcements.filter((_, i) => i !== index)
    }));
  };

  // ─── Attendee Operations ─────────────────────────────────────────────────
  
  const handleVerifyPayment = async (regId, action) => {
    setProcessingAttendeeId(regId);
    setError('');
    try {
      if (action === 'APPROVE') {
        await eventsApi.approveRegistration(id, regId);
        setSuccess('Registration successfully approved!');
      } else if (action === 'REJECT') {
        await eventsApi.rejectRegistration(id, regId);
        setSuccess('Registration successfully rejected!');
      }
      setTimeout(() => setSuccess(''), 3000);
      setSelectedAttendee(null); // close verification modal
      fetchAttendees(); // refresh list
    } catch (err) {
      setError(err.message || `Failed to ${action.toLowerCase()} registration.`);
      setTimeout(() => setError(''), 4000);
    } finally {
      setProcessingAttendeeId(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (deleteConfirmText !== eventData?.title) return;
    try {
      setDeletingEvent(true);
      setError('');
      await eventsApi.deleteEvent(id);
      setSuccess('Event successfully deleted!');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to delete the event.');
      setDeletingEvent(false);
      setShowDeleteModal(false);
    }
  };

  // ─── Filtering & Stats computation ───────────────────────────────────────
  
  const filteredAttendees = attendees.filter(reg => {
    const matchesSearch = 
      reg.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.paymentRef?.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && reg.status === statusFilter;
  });

  const totalRegistrations = attendees.length;
  const pendingApprovals = attendees.filter(r => r.status === 'PAYMENT_PENDING' || r.status === 'PENDING').length;
  const approvedCount = attendees.filter(r => r.status === 'APPROVED' || r.status === 'ATTENDED').length;
  
  const estimatedRevenue = paymentConfig.isPaid 
    ? approvedCount * (paymentConfig.ticketPrice || 0) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1f1f] via-[#0d2626] to-[#0a1f1f] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00ff88] animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-medium">Fetching event configuration details...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0a1f1f] via-[#0d2626] to-[#0a1f1f] flex flex-col font-urbanist text-white">
        <Header />

        {/* Outer Grid for Sidebar + Main Content */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar Menu */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00ff88] transition-colors duration-300 mb-6 group font-medium"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </button>

            <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-5 shadow-2xl sticky top-24">
              <div className="mb-6 pb-4 border-b border-[#1a4d4d]">
                <h2 className="text-lg font-bold text-white truncate">{eventData?.title}</h2>
                <span className="text-[#00ff88] text-xs font-semibold uppercase tracking-wider">{eventData?.category}</span>
              </div>

              <nav className="space-y-2">
                {[
                  { key: 'info', label: 'Event Details', icon: Info },
                  { key: 'fields', label: 'Form Builder', icon: Clipboard },
                  { key: 'payment', label: 'Payment Settings', icon: CreditCard },
                  ...(eventData?.isPremium
                    ? [{ key: 'premium', label: 'Premium Features', icon: Award }]
                    : []),
                  { key: 'attendees', label: 'Attendees & Proofs', icon: Users, count: pendingApprovals }
                ].map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTab(key);
                      setError('');
                      setSuccess('');
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 ${
                      activeTab === key
                        ? 'bg-[#00ff88] text-[#0a1f1f] shadow-lg shadow-[#00ff88]/10'
                        : 'text-gray-400 hover:text-white hover:bg-[#1a4d4d]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{label}</span>
                    </div>
                    {count > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        activeTab === key ? 'bg-[#0a1f1f] text-[#00ff88]' : 'bg-[#1a4d4d] text-white'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 min-w-0">
            {/* Tab Headers */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {activeTab === 'info' && 'Event Details'}
                  {activeTab === 'fields' && 'Registration Form Builder'}
                  {activeTab === 'payment' && 'Payment Configuration'}
                  {activeTab === 'premium' && 'Premium Features'}
                  {activeTab === 'attendees' && 'Attendee Database & Verification'}
                </h1>
                <p className="text-gray-400 text-sm mt-1 sm:mt-2">
                  {activeTab === 'info' && 'Manage core parameters, poster uploads, FAQs and notices'}
                  {activeTab === 'fields' && 'Visual designer for collected attendee registration fields'}
                  {activeTab === 'payment' && 'Setup pricing models, QR uploads, and UPI coordinates'}
                  {activeTab === 'premium' && 'Configure custom LinkedIn sharing settings for premium event verification'}
                  {activeTab === 'attendees' && 'Verify screenshot proofs, approve pending tickets, and view responses'}
                </p>
              </div>
            </div>

            {/* Toasts */}
            {error && (
              <div className="mb-6 px-5 py-4 bg-red-950/50 border border-red-500/50 rounded-2xl text-red-400 text-sm flex flex-col gap-2 shadow-xl backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-base">{error}</span>
                </div>
                {Object.keys(fieldErrors).length > 0 && (
                  <ul className="list-disc pl-8 text-sm space-y-1 mt-1">
                    {Object.entries(fieldErrors).map(([field, msg]) => {
                      let readableField = field
                        .replace('title', 'Event Title')
                        .replace('subtitle', 'Subtitle')
                        .replace('description', 'Event Description')
                        .replace('category', 'Category')
                        .replace('mode', 'Conduct Mode')
                        .replace('theme', 'Theme')
                        .replace('startDate', 'Start Date')
                        .replace('endDate', 'End Date')
                        .replace('registrationDeadline', 'Registration Deadline')
                        .replace('location.venueName', 'Venue Name')
                        .replace('venueName', 'Venue Name')
                        .replace('location.mapLink', 'Google Map Link')
                        .replace('mapLink', 'Google Map Link')
                        .replace('address', 'Address')
                        .replace('prizeType', 'Prize Pool Type')
                        .replace('prizeAmount', 'Prize Pool Value')
                        .replace('ticketPrice', 'Ticket Price')
                        .replace('upiId', 'UPI ID')
                        .replace('upiQrCode', 'UPI QR Code');
                      
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
            {success && (
              <div className="mb-6 px-5 py-4 bg-green-950/50 border border-green-500/50 rounded-2xl text-green-400 text-sm flex items-start gap-3 shadow-xl backdrop-blur-sm">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Tab 1: Event Details Form */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white border-b border-[#1a4d4d] pb-3">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Event Title *</label>
                      <input
                        type="text"
                        value={infoForm.title}
                        onChange={e => updateInfoField('title', e.target.value)}
                        className={getInputClass('title')}
                        placeholder="e.g. InnoHack 2026"
                      />
                      {getFieldError('title') && (
                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('title')}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Subtitle</label>
                      <input
                        type="text"
                        value={infoForm.subtitle}
                        onChange={e => updateInfoField('subtitle', e.target.value)}
                        className={getInputClass('subtitle')}
                        placeholder="e.g. Hack to the Future"
                      />
                      {getFieldError('subtitle') && (
                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('subtitle')}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Event Description *</label>
                    <textarea
                      value={infoForm.description}
                      onChange={e => updateInfoField('description', e.target.value)}
                      rows={5}
                      className={getInputClass('description', 'resize-none text-sm leading-relaxed')}
                      placeholder="Explain what the event is about, prizes, rules, guidelines..."
                    />
                    {getFieldError('description') && (
                      <p className="text-red-400 text-xs mt-1.5">{getFieldError('description')}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Category</label>
                      <select
                        value={infoForm.category}
                        onChange={e => updateInfoField('category', e.target.value)}
                        className={getInputClass('category', 'bg-[#0a1f1f]')}
                      >
                        <option value="Hackathon">Hackathon</option>
                        <option value="Ideathon">Ideathon</option>
                        <option value="Webinar">Webinar</option>
                        <option value="Techfest">Techfest</option>
                        <option value="Other">Other</option>
                      </select>
                      {getFieldError('category') && (
                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('category')}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Mode</label>
                      <select
                        value={infoForm.mode}
                        onChange={e => updateInfoField('mode', e.target.value)}
                        className={getInputClass('mode', 'bg-[#0a1f1f]')}
                      >
                        <option value="ONLINE">Online</option>
                        <option value="OFFLINE">Offline</option>
                      </select>
                      {getFieldError('mode') && (
                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('mode')}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Theme</label>
                      <input
                        type="text"
                        value={infoForm.theme}
                        onChange={e => updateInfoField('theme', e.target.value)}
                        className={getInputClass('theme')}
                        placeholder="e.g. AI, Cyber Security"
                      />
                      {getFieldError('theme') && (
                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('theme')}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white border-b border-[#1a4d4d] pb-3">Timeline Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Start Date *</label>
                      <input
                        type="datetime-local"
                        value={infoForm.startDate}
                        onChange={e => updateInfoField('startDate', e.target.value)}
                        className={getInputClass('startDate', 'bg-[#0a1f1f] text-sm')}
                      />
                      {getFieldError('startDate') && (
                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('startDate')}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">End Date *</label>
                      <input
                        type="datetime-local"
                        value={infoForm.endDate}
                        onChange={e => updateInfoField('endDate', e.target.value)}
                        className={getInputClass('endDate', 'bg-[#0a1f1f] text-sm')}
                      />
                      {getFieldError('endDate') && (
                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('endDate')}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Reg. Deadline *</label>
                      <input
                        type="datetime-local"
                        value={infoForm.registrationDeadline}
                        onChange={e => updateInfoField('registrationDeadline', e.target.value)}
                        className={getInputClass('registrationDeadline', 'bg-[#0a1f1f] text-sm')}
                      />
                      {getFieldError('registrationDeadline') && (
                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('registrationDeadline')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {infoForm.mode === 'OFFLINE' && (
                  <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white border-b border-[#1a4d4d] pb-3">Venue Coordinates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-gray-400 text-sm mb-2 block">Venue Name *</label>
                        <input
                          type="text"
                          value={infoForm.venueName}
                          onChange={e => updateInfoField('venueName', e.target.value)}
                          className={getInputClass('venueName', 'text-sm')}
                          placeholder="e.g. Central Auditorium, Block B"
                        />
                        {getFieldError('venueName') && (
                          <p className="text-red-400 text-xs mt-1.5">{getFieldError('venueName')}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm mb-2 block">Google Maps Embed/Share Link</label>
                        <input
                          type="text"
                          value={infoForm.mapLink}
                          onChange={e => updateInfoField('mapLink', e.target.value)}
                          className={getInputClass('mapLink', 'text-sm')}
                          placeholder="https://maps.app.goo.gl/..."
                        />
                        {getFieldError('mapLink') && (
                          <p className="text-red-400 text-xs mt-1.5">{getFieldError('mapLink')}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Full Address *</label>
                      <input
                        type="text"
                        value={infoForm.address}
                        onChange={e => updateInfoField('address', e.target.value)}
                        className={getInputClass('address', 'text-sm')}
                        placeholder="Street, City, State, ZIP..."
                      />
                      {getFieldError('address') && (
                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('address')}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white border-b border-[#1a4d4d] pb-3">Prizes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Prize Pool Type</label>
                      <select
                        value={infoForm.prizeType}
                        onChange={e => updateInfoField('prizeType', e.target.value)}
                        className={getInputClass('prizeType', 'bg-[#0a1f1f] text-sm')}
                      >
                        <option value="NONE">No Prize</option>
                        <option value="CASH">Cash Prize Pool</option>
                        <option value="MERCH">Swag / Merch</option>
                        <option value="POINTS">Credits / Rank Points</option>
                      </select>
                      {getFieldError('prizeType') && (
                        <p className="text-red-400 text-xs mt-1.5">{getFieldError('prizeType')}</p>
                      )}
                    </div>
                    {infoForm.prizeType !== 'NONE' && (
                      <div>
                        <label className="text-gray-400 text-sm mb-2 block">Prize Pool Value (INR ₹) *</label>
                        <input
                          type="number"
                          value={infoForm.prizeAmount}
                          onChange={e => updateInfoField('prizeAmount', e.target.value)}
                          className={getInputClass('prizeAmount', 'text-sm')}
                          min="0"
                        />
                        {getFieldError('prizeAmount') && (
                          <p className="text-red-400 text-xs mt-1.5">{getFieldError('prizeAmount')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Media Assets */}
                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white border-b border-[#1a4d4d] pb-3">Graphic Assets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-gray-400 text-sm font-semibold block">Banner Image (Desktop View)</label>
                      {infoForm.bannerImage && (
                        <div className="relative group overflow-hidden rounded-2xl border-2 border-[#1a4d4d]">
                          <img src={infoForm.bannerImage} alt="Banner" className="w-full h-32 object-cover" />
                        </div>
                      )}
                      <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} accept="image/*" className="hidden" />
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-300 border border-dashed border-[#1a4d4d] hover:border-[#00ff88] hover:text-[#00ff88] py-3.5 rounded-xl transition-all duration-300 bg-[#0a1f1f]/50 disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {infoForm.bannerImage ? 'Replace Banner Image' : 'Upload Banner Image'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="text-gray-400 text-sm font-semibold block">Event Poster (Mobile / Sharing)</label>
                      {infoForm.eventPoster && (
                        <div className="relative group overflow-hidden rounded-2xl border-2 border-[#1a4d4d]">
                          <img src={infoForm.eventPoster} alt="Poster" className="w-full h-32 object-cover" />
                        </div>
                      )}
                      <input type="file" ref={posterInputRef} onChange={handlePosterUpload} accept="image/*" className="hidden" />
                      <button
                        type="button"
                        onClick={() => posterInputRef.current?.click()}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-300 border border-dashed border-[#1a4d4d] hover:border-[#00ff88] hover:text-[#00ff88] py-3.5 rounded-xl transition-all duration-300 bg-[#0a1f1f]/50 disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {infoForm.eventPoster ? 'Replace Poster Image' : 'Upload Poster Image'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* FAQs Sub-section */}
                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#1a4d4d] pb-3">
                    <h3 className="text-lg font-bold text-white">Frequently Asked Questions</h3>
                    <button
                      type="button"
                      onClick={addFaq}
                      className="flex items-center gap-1.5 text-[#00ff88] text-sm hover:text-[#00cc70] transition-colors font-semibold"
                    >
                      <Plus className="w-4 h-4" /> Add FAQ
                    </button>
                  </div>
                  {infoForm.faqs.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No FAQs configured yet. Click "Add FAQ" to start.</p>
                  )}
                  <div className="space-y-4">
                    {infoForm.faqs.map((faq, i) => (
                      <div key={faq.id || `faq-${i}`} className="bg-[#0a1f1f]/50 border border-[#1a4d4d] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <input
                            type="text"
                            placeholder="Question"
                            value={faq.question}
                            onChange={e => handleFaqChange(i, 'question', e.target.value)}
                            className="flex-1 bg-transparent border-b-2 border-[#1a4d4d] text-white py-2 focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => removeFaq(i)}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-950/20 rounded-xl transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                        <textarea
                          placeholder="Detailed Answer"
                          value={faq.answer}
                          onChange={e => handleFaqChange(i, 'answer', e.target.value)}
                          rows={2}
                          className="w-full bg-transparent border border-[#1a4d4d] text-gray-300 py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Announcements Sub-section */}
                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#1a4d4d] pb-3">
                    <h3 className="text-lg font-bold text-white">Event Announcements</h3>
                    <button
                      type="button"
                      onClick={addAnnouncement}
                      className="flex items-center gap-1.5 text-[#00ff88] text-sm hover:text-[#00cc70] transition-colors font-semibold"
                    >
                      <Plus className="w-4 h-4" /> Broadcast Notice
                    </button>
                  </div>
                  {infoForm.announcements.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No notices broadcasted yet. Click "Broadcast Notice" to post.</p>
                  )}
                  <div className="space-y-4">
                    {infoForm.announcements.map((ann, i) => (
                      <div key={ann.id || `ann-${i}`} className="bg-[#0a1f1f]/50 border border-[#1a4d4d] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <input
                            type="text"
                            placeholder="Announcement Title"
                            value={ann.title}
                            onChange={e => handleAnnouncementChange(i, 'title', e.target.value)}
                            className="flex-1 bg-transparent border-b-2 border-[#1a4d4d] text-white py-2 focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => removeAnnouncement(i)}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-950/20 rounded-xl transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                        <textarea
                          placeholder="Content details (will be displayed to participants)"
                          value={ann.content}
                          onChange={e => handleAnnouncementChange(i, 'content', e.target.value)}
                          rows={3}
                          className="w-full bg-transparent border border-[#1a4d4d] text-gray-300 py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveInfo}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-extrabold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 shadow-xl shadow-[#00ff88]/10"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>Save Event Parameters</span>
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-950/20 border-2 border-red-900/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl mt-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-950/80 border border-red-500/30 p-3 rounded-2xl text-red-400">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-red-200 font-extrabold">Danger Zone</h3>
                      <p className="text-red-400/80 text-sm font-semibold">
                        Careful! Actions in this area are irreversible and can lead to permanent data loss.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-red-900/40 my-2"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-white font-bold text-sm">Delete Event</h4>
                      <p className="text-gray-400 text-xs max-w-lg">
                        Once deleted, the event website, registration lists, attendee data, and all other related content will be permanently removed.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmText('');
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-extrabold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl shadow-red-950/20 whitespace-nowrap self-start sm:self-center"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                      <span>Delete Event</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Custom Registration Fields Builder */}
            {activeTab === 'fields' && (
              <div className="space-y-6">

                {/* Existing Fields list */}
                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#1a4d4d] pb-3 mb-5">
                    <h3 className="text-lg font-bold text-white">Active Registration Fields</h3>
                    <span className="text-xs text-gray-500 bg-[#0a1f1f] px-3 py-1 rounded-full border border-[#1a4d4d]">
                      {formFields.length} field{formFields.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Builder-level inline error */}
                  {fieldBuilderError && (
                    <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{fieldBuilderError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {formFields.map((field, idx) => {
                      const isDefaultLocked = field.label.toLowerCase() === 'name' || field.label.toLowerCase() === 'email';
                      const typeInfo = FIELD_TYPES.find(t => t.value === field.type);
                      const TypeIcon = typeInfo?.Icon ?? Type;
                      const typeColor = typeInfo?.color ?? '#00ff88';

                      return (
                        <div
                          key={idx}
                          className="flex items-start sm:items-center justify-between gap-3 bg-[#0a1f1f]/60 border border-[#1a4d4d] hover:border-[#2d7d7d] rounded-2xl p-4 transition-all duration-200"
                        >
                          {/* Drag hint */}
                          <GripVertical className="w-4 h-4 text-gray-700 flex-shrink-0 mt-0.5 sm:mt-0" />

                          {/* Type icon */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
                          >
                            <TypeIcon className="w-4 h-4" />
                          </div>

                          {/* Field info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-sm capitalize">{field.label}</span>
                              {isDefaultLocked && (
                                <span className="bg-[#1a4d4d] text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                  Locked
                                </span>
                              )}
                              {field.required && (
                                <span className="text-[10px] font-bold text-red-400 bg-red-950/30 px-2 py-0.5 rounded-full border border-red-900/40">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span
                                className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md"
                                style={{ color: typeColor, backgroundColor: `${typeColor}18` }}
                              >
                                {typeInfo?.label ?? field.type}
                              </span>
                              {field.type === 'select' && field.options?.map((opt, oi) => (
                                <span key={oi} className="text-[10px] text-gray-500 bg-[#1a4d4d]/50 px-2 py-0.5 rounded-full border border-[#1a4d4d]">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Required toggle */}
                            <button
                              type="button"
                              onClick={() => toggleRequired(idx)}
                              disabled={isDefaultLocked}
                              title={field.required ? 'Mark optional' : 'Mark required'}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                                isDefaultLocked
                                  ? 'opacity-40 cursor-not-allowed border-[#1a4d4d] text-gray-600'
                                  : field.required
                                    ? 'bg-red-950/30 border-red-800/50 text-red-400 hover:bg-red-950/50'
                                    : 'bg-[#0a1f1f] border-[#1a4d4d] text-gray-500 hover:text-white hover:border-[#2d7d7d]'
                              }`}
                            >
                              {field.required ? '✓ Req.' : 'Optional'}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => deleteField(idx)}
                              disabled={isDefaultLocked}
                              title="Remove field"
                              className={`p-2 rounded-xl transition-colors ${
                                isDefaultLocked
                                  ? 'text-gray-700 cursor-not-allowed'
                                  : 'text-gray-600 hover:text-red-400 hover:bg-red-950/20'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Field Creator Card */}
                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  <h3 className="text-lg font-bold text-white border-b border-[#1a4d4d] pb-3">Add Custom Registration Field</h3>

                  {/* Step 1 — Field Label */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-400 text-sm font-semibold">
                        Field Label <span className="text-red-400">*</span>
                      </label>
                      <span className={`text-xs font-mono ${newFieldName.length > 50 ? 'text-red-400' : 'text-gray-600'}`}>
                        {newFieldName.length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={e => {
                        setNewFieldName(e.target.value);
                        if (fieldBuilderError) setFieldBuilderError('');
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addField(); } }}
                      maxLength={60}
                      className={`w-full bg-transparent border-2 ${fieldBuilderError && !newFieldName.trim() ? 'border-red-500/70 focus:border-red-400' : 'border-[#1a4d4d] focus:border-[#00ff88]'} text-white py-3 px-4 rounded-xl focus:outline-none transition-all duration-300 text-sm`}
                      placeholder="e.g. GitHub Handle, T-Shirt Size, LinkedIn URL"
                    />
                  </div>

                  {/* Step 2 — Field Type visual cards */}
                  <div>
                    <label className="text-gray-400 text-sm font-semibold mb-3 block">Field Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FIELD_TYPES.map(({ value, label, desc, Icon, color }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setNewFieldType(value);
                            setNewFieldOptions([]);
                            setNewOptionInput('');
                            setFieldBuilderError('');
                            setOptionDuplicateError(false);
                          }}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                            newFieldType === value
                              ? 'border-transparent shadow-lg scale-[1.02]'
                              : 'border-[#1a4d4d] hover:border-[#2d7d7d] bg-[#0a1f1f]/40 hover:bg-[#0a1f1f]/80'
                          }`}
                          style={newFieldType === value ? { backgroundColor: `${color}14`, borderColor: color } : {}}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: `${color}22`, color }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-xs font-bold leading-tight">{label}</p>
                            <p className="text-gray-500 text-[10px] leading-tight mt-0.5 line-clamp-2">{desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3 — Dropdown options (only for select type) */}
                  {newFieldType === 'select' && (
                    <div className="bg-[#0a1f1f]/60 border border-[#fbbf24]/30 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <ChevronDown className="w-4 h-4 text-[#fbbf24]" />
                        <label className="text-[#fbbf24] text-sm font-bold">Dropdown Options</label>
                        <span className="text-gray-600 text-xs">— add at least 2</span>
                      </div>

                      {/* Option input row */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newOptionInput}
                          onChange={e => {
                            setNewOptionInput(e.target.value);
                            setOptionDuplicateError(false);
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOptionToNewField(); } }}
                          className={`flex-1 bg-transparent border-2 ${optionDuplicateError ? 'border-red-500/70 focus:border-red-400' : 'border-[#1a4d4d] focus:border-[#fbbf24]'} text-white py-2.5 px-3 rounded-xl focus:outline-none transition-all duration-300 text-sm`}
                          placeholder="Type an option and press Enter or click Add"
                        />
                        <button
                          type="button"
                          onClick={addOptionToNewField}
                          className="flex items-center gap-1.5 bg-[#fbbf24]/10 hover:bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] font-bold px-4 py-2.5 rounded-xl transition-all text-sm whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>

                      {optionDuplicateError && (
                        <p className="text-red-400 text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          This option already exists (case-insensitive match).
                        </p>
                      )}

                      {/* Options pills */}
                      {newFieldOptions.length === 0 ? (
                        <p className="text-gray-600 text-xs italic">No options added yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {newFieldOptions.map((opt, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1.5 bg-[#fbbf24]/10 text-[#fbbf24] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#fbbf24]/30"
                            >
                              <span>{i + 1}.</span>
                              <span>{opt}</span>
                              <button
                                type="button"
                                onClick={() => removeOptionFromNewField(opt)}
                                className="text-[#fbbf24]/60 hover:text-red-400 ml-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4 — Required toggle + live preview row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Required toggle */}
                    <button
                      type="button"
                      onClick={() => setNewFieldRequired(p => !p)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 text-sm font-bold ${
                        newFieldRequired
                          ? 'bg-red-950/30 border-red-700/60 text-red-400'
                          : 'bg-[#0a1f1f]/60 border-[#1a4d4d] text-gray-400 hover:border-[#2d7d7d] hover:text-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${newFieldRequired ? 'bg-red-500 border-red-500' : 'border-gray-600'}`}>
                        {newFieldRequired && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {newFieldRequired ? 'Mandatory field' : 'Optional field'}
                    </button>

                    {/* Live preview chip */}
                    {newFieldName.trim() && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#0a1f1f] border border-[#1a4d4d] rounded-xl text-xs text-gray-400">
                        <span className="text-gray-600">Preview:</span>
                        <span className="text-white font-semibold">{newFieldName.trim()}</span>
                        <span
                          className="font-mono px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{ color: FIELD_TYPES.find(t => t.value === newFieldType)?.color ?? '#00ff88', backgroundColor: `${FIELD_TYPES.find(t => t.value === newFieldType)?.color ?? '#00ff88'}18` }}
                        >
                          {FIELD_TYPES.find(t => t.value === newFieldType)?.label ?? newFieldType}
                        </span>
                        {newFieldRequired && <span className="text-red-400 text-[10px] font-bold">*</span>}
                      </div>
                    )}
                  </div>

                  {/* Inline error */}
                  {fieldBuilderError && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{fieldBuilderError}</span>
                    </div>
                  )}

                  {/* Add Field button */}
                  <button
                    type="button"
                    onClick={addField}
                    className="w-full flex items-center justify-center gap-2 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 active:scale-[0.98] border-2 border-[#00ff88]/30 hover:border-[#00ff88]/60 text-[#00ff88] font-extrabold py-4 rounded-2xl transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Append Field to Form</span>
                  </button>
                </div>

                {/* Save row */}
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 text-xs">
                    {formFields.length} field{formFields.length !== 1 ? 's' : ''} · click <span className="text-[#00ff88]">Save</span> to persist changes
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveFieldsBuilder}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-extrabold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 shadow-xl shadow-[#00ff88]/10"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>Save Registration Schema</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Payment Configuration */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white border-b border-[#1a4d4d] pb-3">Pricing Settings</h3>
                  
                  <div className="flex items-center pb-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.isPaid}
                        onChange={e => {
                          const checked = e.target.checked;
                          setPaymentConfig(prev => ({ 
                            ...prev, 
                            isPaid: checked,
                            paymentType: checked ? 'MANUAL_UPI' : 'FREE'
                          }));
                          setFieldErrors(prev => ({
                            ...prev,
                            ticketPrice: undefined,
                            upiId: undefined,
                            upiQrCode: undefined
                          }));
                        }}
                        className="w-6 h-6 rounded border-2 border-[#1a4d4d] bg-transparent checked:bg-[#00ff88] checked:border-[#00ff88] focus:ring-0 cursor-pointer accent-[#00ff88]"
                      />
                      <span className="text-white text-base font-bold">This is a Paid / Ticketed Event</span>
                    </label>
                  </div>

                  {paymentConfig.isPaid && (
                    <div className="space-y-6 pt-2 animate-fadeIn">
                      {/* IEEE Event Toggle */}
                      <div className="flex items-center pb-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentConfig.isIeeeEvent}
                            onChange={e => {
                              const checked = e.target.checked;
                              setPaymentConfig(prev => ({
                                ...prev,
                                isIeeeEvent: checked
                              }));
                            }}
                            className="w-6 h-6 rounded border-2 border-[#1a4d4d] bg-transparent checked:bg-[#00ff88] checked:border-[#00ff88] focus:ring-0 cursor-pointer accent-[#00ff88]"
                          />
                          <span className="text-white text-base font-bold">This is an IEEE-affiliated event with tier pricing</span>
                        </label>
                      </div>

                      {paymentConfig.isIeeeEvent ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="text-gray-400 text-sm mb-2 block">IEEE Member Ticket Price (₹) *</label>
                              <input
                                type="number"
                                value={paymentConfig.ieeeMemberPrice}
                                onChange={e => updatePaymentField('ieeeMemberPrice', e.target.value)}
                                className={getInputClass('ieeeMemberPrice', 'text-sm font-semibold')}
                                min="0"
                                placeholder="e.g. 199 (enter 0 for free)"
                              />
                              {getFieldError('ieeeMemberPrice') && (
                                <p className="text-red-400 text-xs mt-1.5">{getFieldError('ieeeMemberPrice')}</p>
                              )}
                            </div>
                            <div>
                              <label className="text-gray-400 text-sm mb-2 block">Non-IEEE Member Ticket Price (₹) *</label>
                              <input
                                type="number"
                                value={paymentConfig.nonIeeeMemberPrice}
                                onChange={e => updatePaymentField('nonIeeeMemberPrice', e.target.value)}
                                className={getInputClass('nonIeeeMemberPrice', 'text-sm font-semibold')}
                                min="0"
                                placeholder="e.g. 499 (enter 0 for free)"
                              />
                              {getFieldError('nonIeeeMemberPrice') && (
                                <p className="text-red-400 text-xs mt-1.5">{getFieldError('nonIeeeMemberPrice')}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={paymentConfig.requiresIeeeId}
                                onChange={e => {
                                  const checked = e.target.checked;
                                  setPaymentConfig(prev => ({
                                    ...prev,
                                    requiresIeeeId: checked
                                  }));
                                }}
                                className="w-5 h-5 rounded border-2 border-[#1a4d4d] bg-transparent checked:bg-[#00ff88] checked:border-[#00ff88] focus:ring-0 cursor-pointer accent-[#00ff88]"
                              />
                              <span className="text-white text-sm font-semibold">Require IEEE Member ID on Registration</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-gray-400 text-sm mb-2 block">Ticket Cost / Admission Fee (INR ₹) *</label>
                            <input
                              type="number"
                              value={paymentConfig.ticketPrice}
                              onChange={e => updatePaymentField('ticketPrice', e.target.value)}
                              className={getInputClass('ticketPrice', 'text-sm font-semibold')}
                              min="0"
                              placeholder="e.g. 299"
                            />
                            {getFieldError('ticketPrice') && (
                              <p className="text-red-400 text-xs mt-1.5">{getFieldError('ticketPrice')}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-gray-400 text-sm mb-2 block">Payment Aggregator / Type *</label>
                          <select
                            value={paymentConfig.paymentType}
                            onChange={e => updatePaymentField('paymentType', e.target.value)}
                            className={getInputClass('paymentType', 'bg-[#0a1f1f] text-sm')}
                          >
                            <option value="MANUAL_UPI">Manual UPI QR & Receipt Verification</option>
                            <option value="RAZORPAY">Razorpay Automated Gateway integration</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {paymentConfig.isPaid && paymentConfig.paymentType === 'MANUAL_UPI' && (
                  <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fadeIn">
                    <h3 className="text-lg font-bold text-white border-b border-[#1a4d4d] pb-3">UPI Coordinates & QR Code</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-gray-400 text-sm mb-2 block">Your UPI ID *</label>
                          <input
                            type="text"
                            value={paymentConfig.upiId}
                            onChange={e => updatePaymentField('upiId', e.target.value)}
                            className={getInputClass('upiId', 'text-sm font-semibold')}
                            placeholder="e.g. lenienttree@okaxis"
                          />
                          {getFieldError('upiId') && (
                            <p className="text-red-400 text-xs mt-1.5">{getFieldError('upiId')}</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Enter the exact UPI ID where registrants will send payments. Ensure this coordinates correctly with your bank account before saving.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-gray-400 text-sm font-semibold block">UPI QR Code Image</label>
                        {paymentConfig.upiQrCode ? (
                          <div className={`relative group overflow-hidden rounded-2xl border-2 ${getFieldError('upiQrCode') ? 'border-red-500' : 'border-[#1a4d4d]'} max-w-[180px] bg-white p-2`}>
                            <img src={paymentConfig.upiQrCode} alt="UPI QR" className="w-full h-auto object-contain" />
                          </div>
                        ) : (
                          <div className={`flex flex-col items-center justify-center p-4 bg-[#0a1f1f]/50 border-2 border-dashed ${getFieldError('upiQrCode') ? 'border-red-500 bg-red-500/5' : 'border-[#1a4d4d]'} rounded-2xl text-gray-500 max-w-[180px] h-[180px]`}>
                            <QrCode className="w-10 h-10 mb-2" />
                            <span className="text-[10px] text-center">No QR uploaded yet</span>
                          </div>
                        )}
                        {getFieldError('upiQrCode') && (
                          <p className="text-red-400 text-xs mt-1">{getFieldError('upiQrCode')}</p>
                        )}
                        <input type="file" ref={upiQrInputRef} onChange={handleQrCodeUpload} accept="image/*" className="hidden" />
                        <button
                          type="button"
                          onClick={() => upiQrInputRef.current?.click()}
                          disabled={saving}
                          className="w-full flex items-center justify-center gap-2 text-xs text-gray-300 border border-dashed border-[#1a4d4d] hover:border-[#00ff88] hover:text-[#00ff88] py-2 rounded-xl transition-all duration-300 bg-[#0a1f1f]/50 disabled:opacity-50 max-w-[180px]"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {paymentConfig.upiQrCode ? 'Replace QR Code' : 'Upload QR Code'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSavePaymentConfig}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-extrabold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 shadow-xl shadow-[#00ff88]/10"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>Save Payments Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab Premium: Premium Features Configuration */}
            {activeTab === 'premium' && eventData?.isPremium && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3 border-b border-[#1a4d4d] pb-3">
                    <Award className="w-6 h-6 text-amber-400" />
                    <h3 className="text-lg font-bold text-white">LinkedIn Verification Flow Settings</h3>
                  </div>

                  <div className="flex items-center pb-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={premiumConfig.requiresLinkedinShare}
                        onChange={e => {
                          const checked = e.target.checked;
                          setPremiumConfig(prev => ({ 
                            ...prev, 
                            requiresLinkedinShare: checked
                          }));
                        }}
                        className="w-6 h-6 rounded border-2 border-[#1a4d4d] bg-transparent checked:bg-amber-400 checked:border-amber-400 focus:ring-0 cursor-pointer accent-amber-400"
                      />
                      <div>
                        <span className="text-white text-base font-bold block">Require LinkedIn Share to Register</span>
                        <span className="text-xs text-gray-400 block mt-0.5 font-medium">If checked, users must copy your provided description, download the poster, post it on LinkedIn, and provide the post link before they can submit their registration.</span>
                      </div>
                    </label>
                  </div>

                  {premiumConfig.requiresLinkedinShare && (
                    <div className="space-y-6 pt-2 animate-fadeIn">
                      <div>
                        <label className="text-gray-400 text-sm mb-2 block font-semibold">LinkedIn Post Description / Copy-paste text *</label>
                        <textarea
                          value={premiumConfig.linkedinShareDescription}
                          onChange={e => setPremiumConfig(prev => ({ ...prev, linkedinShareDescription: e.target.value }))}
                          rows={6}
                          className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-amber-400 transition-all duration-300 text-sm leading-relaxed"
                          placeholder="Provide the exact promotional text you want the users to copy and post on their LinkedIn profile."
                        />
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                          Keep it professional and clear. Users will copy this text with a single click.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="text-gray-400 text-sm font-semibold block">Custom LinkedIn Poster Image (Optional)</label>
                          {premiumConfig.linkedinSharePoster ? (
                            <div className="relative group overflow-hidden rounded-2xl border-2 border-[#1a4d4d] max-w-[280px]">
                              <img src={premiumConfig.linkedinSharePoster} alt="LinkedIn Share Poster" className="w-full h-auto object-cover max-h-[160px]" />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 bg-[#0a1f1f]/50 border-2 border-dashed border-[#1a4d4d] rounded-2xl text-gray-500 max-w-[280px] h-[160px] text-center">
                              <span className="text-xs">No custom poster uploaded.</span>
                              <span className="text-[10px] text-gray-600 mt-1">Falls back to the main Event Poster.</span>
                            </div>
                          )}
                          <input type="file" ref={linkedinPosterInputRef} onChange={handleLinkedinPosterUpload} accept="image/*" className="hidden" />
                          <button
                            type="button"
                            onClick={() => linkedinPosterInputRef.current?.click()}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 text-xs text-gray-300 border border-dashed border-[#1a4d4d] hover:border-amber-400 hover:text-amber-400 py-2.5 rounded-xl transition-all duration-300 bg-[#0a1f1f]/50 disabled:opacity-50 max-w-[280px]"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {premiumConfig.linkedinSharePoster ? 'Replace Poster' : 'Upload Custom Poster'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSavePremiumConfig}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-500 text-[#0a1f1f] font-extrabold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 shadow-xl shadow-amber-500/10"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>Save Premium Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Attendees list & manual validation */}
            {activeTab === 'attendees' && (
              <div className="space-y-6">
                
                {/* Stats Dashboard Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-2xl p-5 shadow-lg flex items-center gap-4">
                    <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs font-semibold">Total Registrants</p>
                      <h4 className="text-2xl font-black text-white mt-0.5">{totalRegistrations}</h4>
                    </div>
                  </div>

                  <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-2xl p-5 shadow-lg flex items-center gap-4">
                    <div className="p-3.5 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
                      <AlertTriangle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs font-semibold">Pending Verification</p>
                      <h4 className="text-2xl font-black text-white mt-0.5">{pendingApprovals}</h4>
                    </div>
                  </div>

                  <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-2xl p-5 shadow-lg flex items-center gap-4">
                    <div className="p-3.5 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs font-semibold">Est. Earnings</p>
                      <h4 className="text-2xl font-black text-white mt-0.5">₹{estimatedRevenue}</h4>
                    </div>
                  </div>
                </div>

                {/* Filter and Table Panel */}
                <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 relative max-w-sm">
                      <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search attendee by name, email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0a1f1f] border border-[#1a4d4d] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff88] transition-colors"
                      />
                    </div>

                    <div className="flex gap-2">
                      {['ALL', 'PENDING', 'PAYMENT_PENDING', 'APPROVED', 'REJECTED'].map(filter => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setStatusFilter(filter)}
                          className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all ${
                            statusFilter === filter
                              ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30'
                              : 'bg-transparent text-gray-400 border-[#1a4d4d] hover:text-white'
                          }`}
                        >
                          {filter.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingAttendees ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin mb-2" />
                      <p className="text-xs text-gray-500">Retrieving registrants list...</p>
                    </div>
                  ) : filteredAttendees.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-[#1a4d4d] rounded-2xl bg-[#0a1f1f]/20">
                      <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No registrants match your search filter.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1a4d4d] text-gray-400 text-xs font-bold uppercase tracking-wider">
                            <th className="py-4 px-3">Registrant</th>
                            <th className="py-4 px-3">Contact</th>
                            <th className="py-4 px-3">IEEE Status</th>
                            <th className="py-4 px-3">Status</th>
                            <th className="py-4 px-3">Registered At</th>
                            <th className="py-4 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a4d4d]/60 text-sm">
                          {filteredAttendees.map(reg => {
                            let badgeStyle = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                            if (reg.status === 'APPROVED' || reg.status === 'ATTENDED') {
                              badgeStyle = 'bg-green-500/10 text-green-400 border-green-500/20';
                            } else if (reg.status === 'REJECTED') {
                              badgeStyle = 'bg-red-500/10 text-red-400 border-red-500/20';
                            } else if (reg.status === 'PAYMENT_PENDING') {
                              badgeStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                            }

                            return (
                              <tr key={reg.id} className="hover:bg-[#0a1f1f]/35 transition-colors">
                                <td className="py-4 px-3">
                                  <div className="font-bold text-white leading-normal">
                                    {reg.formData?.name || reg.user?.name || 'Anonymous'}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">{reg.user?.college || 'No college'}</div>
                                </td>
                                <td className="py-4 px-3">
                                  <div className="text-white text-xs">{reg.formData?.email || reg.user?.email}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{reg.formData?.phone || reg.user?.phone || 'No phone'}</div>
                                </td>
                                <td className="py-4 px-3">
                                  {reg.isMember === true ? (
                                    <div className="flex flex-col">
                                      <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 w-max">
                                        Member
                                      </span>
                                      <span className="text-xs text-gray-500 mt-1 font-mono">{reg.ieeeMemberId || 'N/A'}</span>
                                    </div>
                                  ) : reg.isMember === false ? (
                                    <span className="text-gray-500 text-xs font-semibold">Non-Member</span>
                                  ) : (
                                    <span className="text-gray-600 text-xs italic">—</span>
                                  )}
                                </td>
                                <td className="py-4 px-3">
                                  <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                                    {reg.status?.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-4 px-3 text-gray-400 text-xs">
                                  {new Date(reg.registeredAt).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                </td>
                                <td className="py-4 px-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    {(reg.status === 'PAYMENT_PENDING' || reg.paymentProof) ? (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedAttendee(reg)}
                                        className="text-[#00ff88] hover:text-[#00cc70] bg-[#00ff88]/5 hover:bg-[#00ff88]/10 border border-[#00ff88]/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                      >
                                        Verify Proof
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedAttendee(reg)}
                                        className="text-gray-400 hover:text-white bg-[#1a4d4d]/40 hover:bg-[#1a4d4d]/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                      >
                                        View Details
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>

      {/* ── SCREENSHOT VALIDATION & RESPONSE VIEW MODAL ── */}
      {selectedAttendee && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row">
            
            {/* Modal Body: Left column (Screenshot Proof) */}
            <div className="flex-1 p-6 md:p-8 bg-[#0a1f1f]/50 border-b md:border-b-0 md:border-r border-[#1a4d4d] flex flex-col items-center justify-center min-h-[300px]">
              <h3 className="text-sm font-bold text-gray-400 mb-4 self-start">PAYMENT VERIFICATION PROOF</h3>
              {selectedAttendee.paymentProof ? (
                <div className="w-full flex-1 flex items-center justify-center rounded-2xl overflow-hidden bg-black/40 border border-[#1a4d4d] p-2">
                  <img 
                    src={selectedAttendee.paymentProof} 
                    alt="Payment Proof Receipt" 
                    className="max-w-full max-h-[50vh] object-contain hover:scale-[1.05] transition-transform duration-300 rounded-lg"
                  />
                </div>
              ) : (
                <div className="text-center py-16 text-gray-600">
                  <QrCode className="w-12 h-12 mx-auto mb-2 text-gray-700" />
                  <p className="text-sm font-medium">No payment screenshot proof uploaded</p>
                  <p className="text-xs text-gray-600 mt-1">This user registered for a free event or did not attach an image receipt.</p>
                </div>
              )}
            </div>

            {/* Modal Body: Right column (Attendee Info & Action coordinates) */}
            <div className="w-full md:w-[380px] p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a4d4d]">
                  <h2 className="text-xl font-extrabold text-white">Attendee Details</h2>
                  <button
                    onClick={() => setSelectedAttendee(null)}
                    className="text-gray-400 hover:text-white p-1 hover:bg-[#1a4d4d] rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-5 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block font-bold uppercase tracking-wider">Registrant Name</span>
                    <span className="text-white text-base font-extrabold mt-0.5 block">
                      {selectedAttendee.formData?.name || selectedAttendee.user?.name || 'Anonymous'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 text-xs block font-bold uppercase tracking-wider">Email Address</span>
                    <span className="text-white font-semibold mt-0.5 block truncate">
                      {selectedAttendee.formData?.email || selectedAttendee.user?.email}
                    </span>
                  </div>

                  {selectedAttendee.paymentRef && (
                    <div>
                      <span className="text-gray-500 text-xs block font-bold uppercase tracking-wider">Transaction Reference ID / UPI Ref</span>
                      <span className="text-yellow-400 font-mono font-bold mt-0.5 block bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-xs">
                        {selectedAttendee.paymentRef}
                      </span>
                    </div>
                  )}

                  {selectedAttendee.isMember !== null && selectedAttendee.isMember !== undefined && (
                    <div>
                      <span className="text-gray-500 text-xs block font-bold uppercase tracking-wider">IEEE Member Status</span>
                      <span className="text-white font-semibold mt-0.5 block">
                        {selectedAttendee.isMember ? (
                          <span className="text-blue-400 font-extrabold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                            IEEE Member {selectedAttendee.ieeeMemberId ? `(ID: ${selectedAttendee.ieeeMemberId})` : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not an IEEE Member</span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Dynamic Fields Responses Section */}
                  <div className="pt-2">
                    <span className="text-gray-500 text-xs block font-bold uppercase tracking-wider mb-2">Registration Answers</span>
                    <div className="space-y-2 max-h-[22vh] overflow-y-auto pr-1">
                      {Object.entries(selectedAttendee.formData || {}).map(([key, val]) => {
                        // Skip name/email/phone/college if we already showed them, but actually showing them inside is good
                        return (
                          <div key={key} className="bg-[#0a1f1f]/80 p-2.5 rounded-xl border border-[#1a4d4d] text-xs">
                            <span className="text-gray-500 font-bold block capitalize">{key}</span>
                            <span className="text-white font-medium mt-0.5 block leading-normal">{String(val)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-[#1a4d4d] mt-6 space-y-3">
                {(selectedAttendee.status === 'PAYMENT_PENDING' || selectedAttendee.status === 'PENDING') ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment(selectedAttendee.id, 'REJECT')}
                      disabled={processingAttendeeId !== null}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-950/20 hover:bg-red-900 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white font-bold py-3.5 rounded-2xl transition-all duration-300"
                    >
                      {processingAttendeeId === selectedAttendee.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4.5 h-4.5" />
                      )}
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVerifyPayment(selectedAttendee.id, 'APPROVE')}
                      disabled={processingAttendeeId !== null}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-extrabold py-3.5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {processingAttendeeId === selectedAttendee.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0a1f1f]" />
                      ) : (
                        <CheckCircle className="w-4.5 h-4.5 text-[#0a1f1f]" />
                      )}
                      <span>Approve</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-gray-400 text-xs font-semibold block mb-2">REGISTRATION DECISION MADE</span>
                    <div className={`py-3 rounded-2xl text-center border font-bold text-sm ${
                      (selectedAttendee.status === 'APPROVED' || selectedAttendee.status === 'ATTENDED')
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {selectedAttendee.status === 'APPROVED' || selectedAttendee.status === 'ATTENDED' ? 'APPROVED & VALIDATED' : 'REJECTED'}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── DELETE EVENT CONFIRMATION MODAL ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0d2f2f] border-2 border-red-900/50 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#1a4d4d]">
              <div className="bg-red-950/80 border border-red-500/30 p-2 rounded-xl text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Delete Event?</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-white p-1 hover:bg-[#1a4d4d] rounded-lg transition-all ml-auto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <p className="text-gray-300 leading-relaxed">
                This action is <span className="text-red-400 font-bold uppercase">irreversible</span>. Once you confirm, all associated participant records, schedules, payments, and ticket details for this event will be permanently deleted.
              </p>
              
              <div className="bg-[#0a1f1f] border border-red-900/30 rounded-2xl p-4 space-y-2">
                <span className="text-gray-400 text-xs font-bold block uppercase tracking-wider">Event Name to Confirm:</span>
                <span className="text-red-400 font-mono font-bold text-base select-all bg-red-950/40 border border-red-900/40 px-3 py-1.5 rounded-lg block">
                  {eventData?.title}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 text-xs font-bold block uppercase tracking-wider">
                  Type the event name exactly as shown above to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Type event name..."
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-[#0a1f1f] border border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-red-500 transition-all duration-300 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#1a4d4d]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 flex items-center justify-center bg-[#1a4d4d]/30 hover:bg-[#1a4d4d]/60 border border-[#1a4d4d] text-white font-bold py-3.5 rounded-xl transition-all duration-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={deleteConfirmText !== eventData?.title || deletingEvent}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-extrabold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100 disabled:from-red-700 disabled:to-red-700"
              >
                {deletingEvent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Trash2 className="w-4.5 h-4.5 text-white" />
                )}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditEventPage;
