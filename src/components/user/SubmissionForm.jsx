import React, { useState, useEffect } from 'react';
import { 
  Send, Save, Loader2, CheckCircle, AlertTriangle, FileText, Lock, Calendar, Award
} from 'lucide-react';
import { events as eventsApi } from '../../services/api';
import DynamicFieldRenderer from '../shared/DynamicFieldRenderer';

const SubmissionForm = ({ eventId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeRoundNumber, setActiveRoundNumber] = useState(1);
  const [allRounds, setAllRounds] = useState([]);
  const [round1Submission, setRound1Submission] = useState(null);
  const [isShortlistedForFinal, setIsShortlistedForFinal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [config, setConfig] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [formData, setFormData] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [uploadingFields, setUploadingFields] = useState({});

  const [justSubmitted, setJustSubmitted] = useState(false);
  const [viewingForm, setViewingForm] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadSubmissionData(activeRoundNumber);
    }
  }, [eventId, activeRoundNumber]);

  const loadSubmissionData = async (roundNum = activeRoundNumber) => {
    setLoading(true);
    setError('');
    try {
      const res = await eventsApi.getUserIdeaSubmission(eventId, roundNum);
      const data = res?.data || res;

      setIsRegistered(!!data?.isRegistered);
      setConfig(data?.config || null);
      setSubmission(data?.submission || null);
      if (Array.isArray(data?.rounds)) setAllRounds(data.rounds);
      setRound1Submission(data?.round1Submission || null);
      setIsShortlistedForFinal(!!data?.isShortlistedForFinal);

      if (data?.submission?.data) {
        setFormData(data.submission.data || {});
      } else {
        setFormData({});
      }
      if (data?.submission?.attachments && Array.isArray(data.submission.attachments)) {
        setAttachments(data.submission.attachments);
      } else {
        setAttachments([]);
      }
    } catch (err) {
      console.error('Failed to load submission data:', err);
      setError(err.message || 'Failed to load submission form details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFileUpload = async (fieldId, file) => {
    setUploadingFields(prev => ({ ...prev, [fieldId]: true }));
    setError('');
    try {
      let uploadedUrl = '';
      let fileKey = '';

      try {
        const presignedRes = await eventsApi.getPresignedUploadUrl(eventId, file.name, file.type);
        const presignedData = presignedRes?.data || presignedRes;
        
        if (presignedData?.uploadUrl) {
          const putRes = await fetch(presignedData.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: file,
          });
          if (putRes.ok) {
            uploadedUrl = presignedData.fileUrl;
            fileKey = presignedData.key;
          }
        }
      } catch (presignedErr) {
        console.warn('Presigned upload fallback to direct S3 backend endpoint:', presignedErr);
      }

      if (!uploadedUrl) {
        const uploadRes = await eventsApi.uploadIdeaSubmissionFile(eventId, file);
        const uploadData = uploadRes?.data || uploadRes;
        uploadedUrl = uploadData?.secure_url || uploadData?.url || '';
        fileKey = uploadData?.key || '';
      }

      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, [fieldId]: uploadedUrl }));
        setAttachments(prev => [...prev.filter(a => a.fieldId !== fieldId), { fieldId, name: file.name, url: uploadedUrl, key: fileKey }]);
      } else {
        throw new Error('Upload returned no URL');
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setError(err.message || 'File upload failed. Please try again.');
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  const handleSubmit = async (targetStatus) => {
    setSaving(true);
    setError('');
    setSuccess('');

    if (targetStatus === 'submitted' && config?.submissionSchema) {
      const schemaFields = Array.isArray(config.submissionSchema) ? config.submissionSchema : [];
      for (const field of schemaFields) {
        if (field.required && !formData[field.id]) {
          setError(`Please fill in required field: "${field.label}"`);
          setSaving(false);
          return;
        }
      }
    }

    try {
      const res = await eventsApi.submitIdea(eventId, {
        data: formData,
        attachments,
        status: targetStatus,
        roundNumber: activeRoundNumber
      });
      const savedSub = res?.data || res;
      setSubmission(savedSub);
      
      if (targetStatus === 'submitted') {
        setJustSubmitted(true);
        setSuccess('🎉 Idea submission successfully submitted! Check your email for confirmation.');
      } else {
        setSuccess('Draft saved successfully.');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setError(err.message || 'Failed to submit idea.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
        <p className="text-gray-400 text-sm">Loading submission form...</p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-8 text-center space-y-4 max-w-2xl mx-auto">
        <Lock className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Registration Required</h3>
        <p className="text-gray-300 text-sm">
          You must be a registered participant for this event to submit an idea. Please register first.
        </p>
      </div>
    );
  }

  const isConfigOpen = config?.status === 'open';
  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'scored' || submission?.status === 'winner' || submission?.status === 'not_selected';
  const isFinalRound = activeRoundNumber === 2 || config?.roundType === 'final';
  const isGatedLocked = isFinalRound && !isShortlistedForFinal;

  // ── Registration-Like Completion Success Screen ──
  if (justSubmitted && !viewingForm) {
    return (
      <div className="bg-[#0c1e1e] border-2 border-[#00ff88]/40 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden animate-fadeIn">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#00ff88]/10 rounded-full blur-3xl pointer-events-none" />
        
        <CheckCircle className="w-20 h-20 text-[#00ff88] mx-auto mb-6 animate-bounce" />
        <h1 className="text-3xl text-white font-bold mb-3">Idea Submission Complete!</h1>
        <p className="text-gray-300 mb-6 text-sm max-w-md mx-auto leading-relaxed">
          Your idea has been successfully submitted! A confirmation receipt has been sent to your registered email address.
        </p>

        <div className="bg-[#142929] border border-[#1a4d4d] rounded-2xl p-5 mb-8 text-left space-y-2 text-xs text-gray-300">
          <div className="flex justify-between items-center pb-2 border-b border-[#1a4d4d]">
            <span className="text-gray-400">Submission Status</span>
            <span className="bg-[#00ff88] text-black font-extrabold px-2.5 py-0.5 rounded-full uppercase text-[10px]">
              {submission?.status || 'SUBMITTED'}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-gray-400">Submitted Timestamp</span>
            <span className="text-white font-medium">
              {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>
          {attachments.length > 0 && (
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-400">Attachments Uploaded</span>
              <span className="text-[#00ff88] font-medium">{attachments.length} file(s)</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setViewingForm(true)}
            className="w-full sm:w-auto bg-[#1a4d4d] hover:bg-[#256666] text-white font-bold text-xs px-6 py-3 rounded-xl transition-all"
          >
            Review Submitted Details
          </button>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-full sm:w-auto bg-[#00ff88] hover:bg-[#00cc6a] text-black font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            Back to Event Overview ↑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-white">
      {/* ── Multi-Round Selector Pills ── */}
      {allRounds.length > 1 && (
        <div className="flex items-center gap-2 bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-3">
          <span className="text-xs text-gray-400 font-bold px-2">Submission Round:</span>
          {allRounds.map((r) => (
            <button
              key={r.id || r.roundNumber}
              type="button"
              onClick={() => setActiveRoundNumber(r.roundNumber)}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeRoundNumber === r.roundNumber
                  ? 'bg-[#00ff88] text-black shadow-md shadow-[#00ff88]/20'
                  : 'bg-[#142929] text-gray-300 hover:text-white border border-[#1a4d4d]'
              }`}
            >
              Round {r.roundNumber} ({r.roundType})
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center gap-3 text-[#00ff88]">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Submitted Read-Only Banner */}
      {isSubmitted && (
        <div className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-[#00ff88]" />
            <div>
              <h3 className="text-lg font-bold text-[#00ff88]">Submission Received (Round {activeRoundNumber})</h3>
              <p className="text-xs text-gray-300">
                Submitted on {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Date N/A'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#00ff88] text-black text-xs font-bold rounded-full uppercase tracking-wider">
            Status: {submission.status}
          </span>
        </div>
      )}

      {/* Gated Access Block for Final Round */}
      {isGatedLocked ? (
        <div className="bg-[#0c1e1e] border-2 border-amber-500/30 rounded-2xl p-8 text-center space-y-4 max-w-2xl mx-auto shadow-xl">
          <Lock className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
          <h3 className="text-2xl font-bold text-white">Final Round Access Restricted</h3>
          
          {round1Submission?.decision === 'waitlisted' ? (
            <div className="space-y-3">
              <span className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Status: Waitlisted for Screening Round
              </span>
              <p className="text-gray-300 text-sm leading-relaxed max-w-md mx-auto">
                You are currently on the Waitlist for Round 1 (Screening). If the event organizer promotes your submission to shortlisted, Round 2 access will unlock automatically for you!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="inline-block bg-red-500/20 text-red-400 border border-red-500/40 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Status: Not Shortlisted for Final Round
              </span>
              <p className="text-gray-300 text-sm leading-relaxed max-w-md mx-auto">
                Round 2 (Final) is restricted to participants who were shortlisted during Round 1 (Screening).
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Form Container */
        <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-6 sm:p-8 space-y-8">
          <div className="border-b border-[#1a4d4d] pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>Idea Submission Form</span>
              <span className="text-xs bg-[#142929] border border-[#1a4d4d] text-[#00ff88] px-2.5 py-0.5 rounded-full font-semibold">
                Round {activeRoundNumber} ({config?.roundType || 'standalone'})
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Provide details for your project/idea submission as per event guidelines.
            </p>
          </div>

          <DynamicFieldRenderer
            fields={Array.isArray(config?.submissionSchema) ? config.submissionSchema : []}
            values={formData}
            onChange={handleFieldChange}
            onFileUpload={handleFileUpload}
            disabled={isSubmitted || saving}
            uploadingFields={uploadingFields}
          />

          {/* Action Buttons */}
          {!isSubmitted && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#1a4d4d]">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={saving}
                className="flex items-center gap-2 bg-[#1a4d4d] hover:bg-[#256666] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </button>

              <button
                type="button"
                onClick={() => handleSubmit('submitted')}
                disabled={saving || !isConfigOpen}
                className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-bold px-8 py-3.5 rounded-xl text-sm shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Final Submit Idea (Round {activeRoundNumber})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubmissionForm;

