import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Upload, Trash2, Plus } from 'lucide-react';
import { events as eventsApi } from '../../services/api';

const EditEventModal = ({ isOpen, eventToEdit, onClose, onSuccess }) => {
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [loadingEditData, setLoadingEditData] = useState(false);

  const bannerInputRef = useRef(null);
  const posterInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !eventToEdit) return;

    let isMounted = true;
    setLoadingEditData(true);
    setEditError('');
    setEditSuccess('');

    eventsApi.getById(eventToEdit.id)
      .then(full => {
        if (!isMounted) return;
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
      })
      .catch(err => {
        if (!isMounted) return;
        // Fallback to minimal details if getById fails
        setEditForm({
          title: eventToEdit.title || '',
          subtitle: eventToEdit.subtitle || '',
          description: '',
          category: eventToEdit.category || 'Hackathon',
          mode: eventToEdit.mode || 'ONLINE',
          startDate: eventToEdit.startDate ? eventToEdit.startDate.slice(0, 16) : '',
          endDate: eventToEdit.endDate ? eventToEdit.endDate.slice(0, 16) : '',
          registrationDeadline: '',
          prizeType: eventToEdit.prizeType || 'NONE',
          prizeAmount: eventToEdit.prizeAmount ?? 0,
          isPaid: eventToEdit.isPaid ?? false,
          ticketPrice: eventToEdit.ticketPrice ?? 0,
          theme: '',
          venueName: eventToEdit.venueName || '',
          address: '',
          mapLink: '',
          bannerImage: eventToEdit.bannerImage || '',
          eventPoster: eventToEdit.eventPoster || '',
          faqs: [],
          announcements: [],
        });
      })
      .finally(() => {
        if (isMounted) setLoadingEditData(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, eventToEdit]);

  if (!isOpen) return null;

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !eventToEdit) return;
    try {
      setSavingEdit(true);
      const res = await eventsApi.uploadBanner(eventToEdit.id, file);
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
    if (!file || !eventToEdit) return;
    try {
      setSavingEdit(true);
      const res = await eventsApi.uploadPoster(eventToEdit.id, file);
      setEditForm(prev => ({ ...prev, eventPoster: res?.eventPoster || URL.createObjectURL(file) }));
      setEditSuccess('Poster updated!');
      setTimeout(() => setEditSuccess(''), 2000);
    } catch (err) {
      setEditError(err.message || 'Poster upload failed.');
    } finally {
      setSavingEdit(false);
    }
  };

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
    if (faq.id && eventToEdit) {
      try {
        await eventsApi.deleteFAQ(eventToEdit.id, faq.id);
      } catch (_) { /* silent */ }
    }
    setEditForm(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  };

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
    if (ann.id && eventToEdit) {
      try {
        await eventsApi.deleteAnnouncement(eventToEdit.id, ann.id);
      } catch (_) { /* silent */ }
    }
    setEditForm(prev => ({ ...prev, announcements: prev.announcements.filter((_, i) => i !== index) }));
  };

  const handleEditSave = async () => {
    if (!eventToEdit) return;
    setSavingEdit(true);
    setEditError('');
    setEditSuccess('');
    try {
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
      await eventsApi.update(eventToEdit.id, payload);

      for (const faq of (editForm.faqs || [])) {
        if (!faq.question?.trim() || !faq.answer?.trim()) continue;
        if (faq.id) {
          await eventsApi.updateFAQ(eventToEdit.id, faq.id, { question: faq.question, answer: faq.answer });
        } else {
          await eventsApi.createFAQ(eventToEdit.id, { question: faq.question, answer: faq.answer, order: faq.order || 0 });
        }
      }

      for (const ann of (editForm.announcements || [])) {
        if (!ann.title?.trim() || !ann.content?.trim()) continue;
        if (ann.id) {
          await eventsApi.updateAnnouncement(eventToEdit.id, ann.id, { title: ann.title, content: ann.content });
        } else {
          await eventsApi.createAnnouncement(eventToEdit.id, { title: ann.title, content: ann.content });
        }
      }

      setEditSuccess('Event updated successfully!');
      
      const updatedPayload = { 
        ...payload, 
        id: eventToEdit.id, 
        bannerImage: editForm.bannerImage, 
        eventPoster: editForm.eventPoster 
      };

      if (onSuccess) {
        setTimeout(() => onSuccess(updatedPayload), 1500);
      } else {
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update event.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[#0d2f2f] border-b border-[#1a4d4d] px-8 py-5 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-white text-xl font-bold">Edit Event</h2>
          <button
            onClick={onClose}
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
            {editError && (
              <div className="px-4 py-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-400 text-sm">{editError}</div>
            )}
            {editSuccess && (
              <div className="px-4 py-3 bg-green-900/40 border border-green-500/50 rounded-xl text-green-400 text-sm">{editSuccess}</div>
            )}

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Title *</label>
              <input
                type="text" name="title" value={editForm.title || ''} onChange={handleEditFormChange}
                className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Subtitle</label>
              <input
                type="text" name="subtitle" value={editForm.subtitle || ''} onChange={handleEditFormChange}
                className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Description *</label>
              <textarea
                name="description" value={editForm.description || ''} onChange={handleEditFormChange} rows={5}
                className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 resize-none"
              />
            </div>

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

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Theme</label>
              <input
                type="text" name="theme" value={editForm.theme || ''} onChange={handleEditFormChange}
                className="w-full bg-transparent border-2 border-[#1a4d4d] text-white py-3 px-4 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                placeholder="e.g. Workshop, AI, Design"
              />
            </div>

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

            <div className="space-y-4 p-4 bg-[#0a1f1f]/50 rounded-xl border border-[#1a4d4d]">
              <p className="text-gray-400 text-sm font-medium">Event Images</p>
              <div className="grid grid-cols-2 gap-4">
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

            <div className="flex gap-4 pt-4 border-t border-[#1a4d4d]">
              <button
                type="button" onClick={onClose}
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
  );
};

export default EditEventModal;
