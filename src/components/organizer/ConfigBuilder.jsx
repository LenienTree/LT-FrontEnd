import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, Loader2, CheckCircle, AlertTriangle, 
  ChevronUp, ChevronDown, ToggleLeft, ToggleRight, Calendar, Award, CheckSquare, Layers, FileText
} from 'lucide-react';
import { events as eventsApi } from '../../services/api';

const ConfigBuilder = ({ eventId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Configuration States
  const [activeRoundNumber, setActiveRoundNumber] = useState(1);
  const [allRounds, setAllRounds] = useState([]);
  const [roundType, setRoundType] = useState('standalone'); // 'standalone' | 'screening' | 'final'
  const [shortlistCount, setShortlistCount] = useState(10);
  const [submissionSchema, setSubmissionSchema] = useState([]);
  const [openMode, setOpenMode] = useState('manual'); // 'manual' | 'scheduled'
  const [openAt, setOpenAt] = useState('');
  const [closeAt, setCloseAt] = useState('');
  const [status, setStatus] = useState('not_open');
  const [scoringEnabled, setScoringEnabled] = useState(false);
  const [scoringCriteria, setScoringCriteria] = useState([]);
  const [cashPrizeDetails, setCashPrizeDetails] = useState({
    totalAmount: '',
    firstPlace: '',
    secondPlace: '',
    thirdPlace: '',
    currency: 'INR',
    notes: ''
  });
  const [winnerCount, setWinnerCount] = useState(1);

  // Helper to format ISO date to datetime-local input string
  const formatForInput = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (!eventId) return;
    fetchConfig(activeRoundNumber);
  }, [eventId, activeRoundNumber]);

  const fetchConfig = async (roundNum = activeRoundNumber) => {
    setLoading(true);
    setError('');
    try {
      const res = await eventsApi.getIdeaSubmissionConfig(eventId, roundNum);
      const data = res?.data || res;
      if (data) {
        if (Array.isArray(data.rounds)) setAllRounds(data.rounds);
        setRoundType(data.roundType || (roundNum === 2 ? 'final' : 'standalone'));
        setShortlistCount(data.shortlistCount ?? 10);
        setSubmissionSchema(Array.isArray(data.submissionSchema) ? data.submissionSchema : []);
        setOpenMode(data.openMode || 'manual');
        setOpenAt(formatForInput(data.openAt));
        setCloseAt(formatForInput(data.closeAt));
        setStatus(data.status || 'not_open');
        setScoringEnabled(!!data.scoringEnabled);
        setScoringCriteria(Array.isArray(data.scoringCriteria) ? data.scoringCriteria : []);
        if (data.cashPrizeDetails && typeof data.cashPrizeDetails === 'object') {
          setCashPrizeDetails({
            totalAmount: data.cashPrizeDetails.totalAmount ?? '',
            firstPlace: data.cashPrizeDetails.firstPlace ?? '',
            secondPlace: data.cashPrizeDetails.secondPlace ?? '',
            thirdPlace: data.cashPrizeDetails.thirdPlace ?? '',
            currency: data.cashPrizeDetails.currency || 'INR',
            notes: data.cashPrizeDetails.notes || ''
          });
        }
        setWinnerCount(data.winnerCount || 1);
      }
    } catch (err) {
      console.error('Failed to fetch idea submission config:', err);
    } finally {
      setLoading(false);
    }
  };

  // Schema Field Operations
  const addSchemaField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      label: 'New Question / Field',
      type: 'text', // text | textarea | number | url | file | select
      required: false,
      placeholder: '',
      description: '',
      options: []
    };
    setSubmissionSchema([...submissionSchema, newField]);
  };

  const updateSchemaField = (id, key, value) => {
    setSubmissionSchema(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeSchemaField = (id) => {
    setSubmissionSchema(prev => prev.filter(f => f.id !== id));
  };

  const moveSchemaField = (index, direction) => {
    const newFields = [...submissionSchema];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;
    setSubmissionSchema(newFields);
  };

  // Scoring Criteria Operations
  const addCriterion = () => {
    const newCriterion = {
      id: `criteria_${Date.now()}`,
      title: 'Innovation & Originality',
      description: 'Uniqueness of the idea and problem solution',
      maxScore: 10,
      weight: 1
    };
    setScoringCriteria([...scoringCriteria, newCriterion]);
  };

  const updateCriterion = (id, key, value) => {
    setScoringCriteria(prev => prev.map(c => c.id === id ? { ...c, [key]: value } : c));
  };

  const removeCriterion = (id) => {
    setScoringCriteria(prev => prev.filter(c => c.id !== id));
  };

  // Submit Save Config
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      roundNumber: activeRoundNumber,
      roundType: activeRoundNumber === 2 ? 'final' : roundType,
      shortlistCount: roundType === 'screening' ? Number(shortlistCount) || null : null,
      submissionSchema,
      openMode,
      openAt: openMode === 'scheduled' && openAt ? new Date(openAt).toISOString() : null,
      closeAt: openMode === 'scheduled' && closeAt ? new Date(closeAt).toISOString() : null,
      status,
      scoringEnabled,
      scoringCriteria: scoringEnabled ? scoringCriteria : [],
      cashPrizeDetails,
      winnerCount: Number(winnerCount) || 1
    };

    try {
      await eventsApi.saveIdeaSubmissionConfig(eventId, payload);
      setSuccess(`Round ${activeRoundNumber} configuration saved successfully!`);
      fetchConfig(activeRoundNumber);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Save config error:', err);
      setError(err.message || 'Failed to save idea submission configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenNow = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await eventsApi.openIdeaSubmission(eventId, activeRoundNumber);
      setStatus('open');
      setSuccess(`Submissions manually opened for Round ${activeRoundNumber}!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to open submissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseNow = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await eventsApi.closeIdeaSubmission(eventId, activeRoundNumber);
      setStatus('closed');
      setSuccess(`Submissions manually closed for Round ${activeRoundNumber}!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to close submissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
        <p className="text-gray-400 text-sm">Loading idea submission configuration...</p>
      </div>
    );
  }

  const round1Config = allRounds.find(r => r.roundNumber === 1);
  const round2Config = allRounds.find(r => r.roundNumber === 2);
  const canAddRound2 = round1Config?.roundType === 'screening' || roundType === 'screening';

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-white">
      {/* ── Round Selection Header ── */}
      <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6 text-[#00ff88]" />
          <div>
            <h3 className="text-lg font-bold text-white">Rounds Configuration</h3>
            <p className="text-xs text-gray-400">Configure single-round or multi-round (Screening + Final) hackathon workflow</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveRoundNumber(1)}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeRoundNumber === 1
                ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/20'
                : 'bg-[#142929] text-gray-300 hover:text-white border border-[#1a4d4d]'
            }`}
          >
            Round 1 ({round1Config?.roundType || roundType})
          </button>

          {(canAddRound2 || round2Config) && (
            <button
              type="button"
              onClick={() => setActiveRoundNumber(2)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeRoundNumber === 2
                  ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/20'
                  : 'bg-[#142929] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {round2Config ? 'Round 2 (Final)' : '+ Add Round 2 (Final)'}
            </button>
          )}
        </div>
      </div>

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

      {/* ── Round Type & Shortlist Configuration ── */}
      {activeRoundNumber === 1 ? (
        <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-[#00ff88] uppercase tracking-wider">Round 1 Type & Purpose</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setRoundType('standalone')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                roundType === 'standalone'
                  ? 'bg-[#00ff88]/10 border-[#00ff88] text-white'
                  : 'bg-[#142929] border-[#1a4d4d] text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="font-bold text-sm text-white">Standalone Round</div>
              <div className="text-xs text-gray-300 mt-1">Single-round event. Winners will be selected directly from this round.</div>
            </div>

            <div
              onClick={() => setRoundType('screening')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                roundType === 'screening'
                  ? 'bg-[#00ff88]/10 border-[#00ff88] text-white'
                  : 'bg-[#142929] border-[#1a4d4d] text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="font-bold text-sm text-white">Screening Round</div>
              <div className="text-xs text-gray-300 mt-1">First round to filter/shortlist participants who qualify for Round 2 (Final).</div>
            </div>
          </div>

          {roundType === 'screening' && (
            <div className="pt-3 border-t border-[#1a4d4d] flex items-center gap-4">
              <label className="text-xs font-semibold text-gray-300">Default Shortlist Target Count:</label>
              <input
                type="number"
                min="1"
                value={shortlistCount}
                onChange={(e) => setShortlistCount(e.target.value)}
                className="bg-[#142929] border border-[#1a4d4d] text-white px-3 py-1.5 rounded-lg text-xs w-28 focus:outline-none focus:border-[#00ff88]"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-4 h-4" /> Round 2 (Final Round) — Gated Access for Shortlisted Participants Only
          </div>
        </div>
      )}

      {/* ── Section 1: Open Mode & Schedule ── */}
      <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between border-b border-[#1a4d4d] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-[#00ff88]" />
            <div>
              <h3 className="text-lg font-bold text-white">Submission Status & Schedule</h3>
              <p className="text-xs text-gray-400">Control when participants can submit ideas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenNow}
              disabled={saving}
              className="bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88] px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              Open Now
            </button>
            <button
              type="button"
              onClick={handleCloseNow}
              disabled={saving}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              Close Now
            </button>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-[#1a4d4d] border border-[#00ff88]/30 text-[#00ff88] px-3 py-1.5 rounded-lg text-sm font-medium focus:outline-none focus:border-[#00ff88]"
            >
              <option value="not_open">Status: Not Open</option>
              <option value="open">Status: Open</option>
              <option value="closed">Status: Closed</option>
              <option value="evaluation">Status: In Evaluation</option>
              <option value="completed">Status: Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Access Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOpenMode('manual')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                  openMode === 'manual'
                    ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]'
                    : 'border-[#1a4d4d] bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                Manual Toggle
              </button>
              <button
                type="button"
                onClick={() => setOpenMode('scheduled')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                  openMode === 'scheduled'
                    ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]'
                    : 'border-[#1a4d4d] bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                Scheduled Timings
              </button>
            </div>
          </div>

          {openMode === 'scheduled' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Open At</label>
                <input
                  type="datetime-local"
                  value={openAt}
                  onChange={(e) => setOpenAt(e.target.value)}
                  className="w-full bg-[#1a4d4d]/50 border border-[#1a4d4d] focus:border-[#00ff88] text-white px-3 py-2 rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Close At</label>
                <input
                  type="datetime-local"
                  value={closeAt}
                  onChange={(e) => setCloseAt(e.target.value)}
                  className="w-full bg-[#1a4d4d]/50 border border-[#1a4d4d] focus:border-[#00ff88] text-white px-3 py-2 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Dynamic Submission Form Builder ── */}
      <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#1a4d4d] pb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-[#00ff88]" />
            <div>
              <h3 className="text-lg font-bold text-white">Idea Submission Form Fields</h3>
              <p className="text-xs text-gray-400">Design the custom fields participants must fill when submitting their idea</p>
            </div>
          </div>
          <button
            type="button"
            onClick={addSchemaField}
            className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold px-4 py-2 rounded-xl text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Field
          </button>
        </div>

        {submissionSchema.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#1a4d4d] rounded-xl text-gray-400">
            No custom fields configured yet. Click "Add Field" to build your submission schema.
          </div>
        ) : (
          <div className="space-y-4">
            {submissionSchema.map((field, idx) => (
              <div key={field.id} className="p-4 bg-[#142929] border border-[#1a4d4d] rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-grow">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateSchemaField(field.id, 'label', e.target.value)}
                      placeholder="Field Label / Question"
                      className="bg-[#0c1e1e] border border-[#1a4d4d] focus:border-[#00ff88] text-white font-semibold px-3 py-1.5 rounded-lg text-sm w-full focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={field.type}
                      onChange={(e) => updateSchemaField(field.id, 'type', e.target.value)}
                      className="bg-[#0c1e1e] border border-[#1a4d4d] text-gray-300 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="text">Short Text</option>
                      <option value="textarea">Paragraph / Long Text</option>
                      <option value="number">Number</option>
                      <option value="url">URL Link (GitHub/Figma/Drive)</option>
                      <option value="file">File Upload (PDF/ZIP)</option>
                      <option value="select">Dropdown Select</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer px-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateSchemaField(field.id, 'required', e.target.checked)}
                        className="accent-[#00ff88]"
                      />
                      Required
                    </label>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSchemaField(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSchemaField(idx, 1)}
                        disabled={idx === submissionSchema.length - 1}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSchemaField(field.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateSchemaField(field.id, 'placeholder', e.target.value)}
                    placeholder="Placeholder text..."
                    className="bg-[#0c1e1e] border border-[#1a4d4d] text-gray-300 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    value={field.description || ''}
                    onChange={(e) => updateSchemaField(field.id, 'description', e.target.value)}
                    placeholder="Helper description for participants..."
                    className="bg-[#0c1e1e] border border-[#1a4d4d] text-gray-300 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 3: Cash Prize Details & Winners ── */}
      <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#1a4d4d] pb-4">
          <Award className="w-6 h-6 text-[#00ff88]" />
          <div>
            <h3 className="text-lg font-bold text-white">Prize Pool & Winner Allocation</h3>
            <p className="text-xs text-gray-400">Configure award amounts and winner counts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Total Prize Pool ({cashPrizeDetails.currency})</label>
            <input
              type="number"
              value={cashPrizeDetails.totalAmount}
              onChange={(e) => setCashPrizeDetails({ ...cashPrizeDetails, totalAmount: e.target.value })}
              placeholder="e.g. 50000"
              className="w-full bg-[#1a4d4d]/50 border border-[#1a4d4d] focus:border-[#00ff88] text-white px-3 py-2 rounded-xl text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">1st Place Prize</label>
            <input
              type="number"
              value={cashPrizeDetails.firstPlace}
              onChange={(e) => setCashPrizeDetails({ ...cashPrizeDetails, firstPlace: e.target.value })}
              placeholder="e.g. 25000"
              className="w-full bg-[#1a4d4d]/50 border border-[#1a4d4d] focus:border-[#00ff88] text-white px-3 py-2 rounded-xl text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Winner Slots Count</label>
            <input
              type="number"
              min="1"
              value={winnerCount}
              onChange={(e) => setWinnerCount(e.target.value)}
              className="w-full bg-[#1a4d4d]/50 border border-[#1a4d4d] focus:border-[#00ff88] text-white px-3 py-2 rounded-xl text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Section 4: Evaluation & Scoring Criteria ── */}
      <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#1a4d4d] pb-4">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-6 h-6 text-[#00ff88]" />
            <div>
              <h3 className="text-lg font-bold text-white">Evaluation & Scoring</h3>
              <p className="text-xs text-gray-400">Enable jury scoring criteria for judging submissions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScoringEnabled(!scoringEnabled)}
            className="flex items-center gap-2 text-sm font-semibold focus:outline-none"
          >
            {scoringEnabled ? (
              <ToggleRight className="w-8 h-8 text-[#00ff88]" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-gray-500" />
            )}
            <span className={scoringEnabled ? 'text-[#00ff88]' : 'text-gray-400'}>
              {scoringEnabled ? 'Scoring Active' : 'Scoring Disabled'}
            </span>
          </button>
        </div>

        {scoringEnabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-medium">Evaluation Criteria</span>
              <button
                type="button"
                onClick={addCriterion}
                className="flex items-center gap-1.5 text-xs bg-[#1a4d4d] hover:bg-[#00ff88] hover:text-black text-white font-medium px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Criterion
              </button>
            </div>

            {scoringCriteria.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No evaluation criteria added yet.</p>
            ) : (
              <div className="space-y-3">
                {scoringCriteria.map((criterion) => (
                  <div key={criterion.id} className="p-3 bg-[#142929] border border-[#1a4d4d] rounded-xl flex items-center justify-between gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-grow">
                      <input
                        type="text"
                        value={criterion.title}
                        onChange={(e) => updateCriterion(criterion.id, 'title', e.target.value)}
                        placeholder="Criteria Title"
                        className="bg-[#0c1e1e] border border-[#1a4d4d] text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
                      />
                      <input
                        type="text"
                        value={criterion.description || ''}
                        onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                        placeholder="Description / Guidance"
                        className="bg-[#0c1e1e] border border-[#1a4d4d] text-gray-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-400">Max Score:</label>
                        <input
                          type="number"
                          value={criterion.maxScore}
                          onChange={(e) => updateCriterion(criterion.id, 'maxScore', Number(e.target.value))}
                          className="bg-[#0c1e1e] border border-[#1a4d4d] text-white text-xs px-2 py-1.5 rounded-lg w-20 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCriterion(criterion.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Save Action Bar ── */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-bold px-8 py-3.5 rounded-xl text-base shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Saving Configuration...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" /> Save Idea Submission Config
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfigBuilder;
