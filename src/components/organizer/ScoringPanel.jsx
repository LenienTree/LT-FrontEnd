import React, { useState, useEffect } from 'react';
import { Save, Loader2, Award, CheckCircle, AlertTriangle, X, Check, HelpCircle } from 'lucide-react';
import { events as eventsApi } from '../../services/api';

const ScoringPanel = ({ eventId, submission, scoringCriteria = [], onScoreSaved }) => {
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (submission?.scores && Array.isArray(submission.scores) && submission.scores.length > 0) {
      const latest = submission.scores[0]; // Primary score entry
      if (latest?.criteriaScores) {
        setScores(latest.criteriaScores || {});
      }
      if (latest?.comments) {
        setComments(latest.comments);
      }
    } else {
      setScores({});
      setComments('');
    }
  }, [submission]);

  const handleScoreChange = (criterionId, val) => {
    setError('');
    const num = val === '' ? '' : Number(val);
    setScores(prev => ({ ...prev, [criterionId]: num }));
  };

  // Compute total score sum dynamically
  const calculatedTotalScore = scoringCriteria.reduce((sum, c) => {
    const scoreVal = Number(scores[c.id] || 0);
    const weight = Number(c.weight || 1);
    return sum + (scoreVal * weight);
  }, 0);

  // Validate all criteria scores
  const validateScores = () => {
    for (const c of scoringCriteria) {
      const val = scores[c.id];
      if (val !== undefined && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          return `Invalid number entered for criterion: "${c.title}"`;
        }
        if (num < 0) {
          return `Score for "${c.title}" cannot be negative.`;
        }
        if (num > Number(c.maxScore)) {
          return `Score for "${c.title}" (${num}) exceeds maximum allowed points of ${c.maxScore}.`;
        }
      }
    }
    return null;
  };

  const handleOpenConfirm = (e) => {
    if (e) e.preventDefault();
    setError('');
    
    const validationError = validateScores();
    if (validationError) {
      setError(validationError);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleSaveScore = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await eventsApi.scoreIdeaSubmission(eventId, submission.id, {
        criteriaScores: scores,
        totalScore: calculatedTotalScore,
        comments
      });
      setSuccess('Scores successfully saved!');
      setShowConfirmModal(false);
      setTimeout(() => setSuccess(''), 4000);
      if (onScoreSaved) onScoreSaved();
    } catch (err) {
      console.error('Score submission error:', err);
      setError(err.message || 'Failed to save scores.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-6 space-y-6 text-white">
      <div className="flex items-center justify-between border-b border-[#1a4d4d] pb-4">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-[#00ff88]" />
          <div>
            <h4 className="text-lg font-bold text-white">Evaluation & Scoring Panel</h4>
            <p className="text-xs text-gray-400">Score each criterion for this submission</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 uppercase tracking-wider block font-medium">Computed Total Score</span>
          <span className="text-2xl font-extrabold text-[#00ff88]">{calculatedTotalScore.toFixed(1)}</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 text-xs text-[#00ff88] flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {scoringCriteria.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No evaluation criteria configured.</p>
      ) : (
        <div className="space-y-4">
          {scoringCriteria.map((c) => {
            const currentVal = scores[c.id];
            const isExceeded = currentVal !== undefined && currentVal !== '' && (Number(currentVal) > Number(c.maxScore) || Number(currentVal) < 0);

            return (
              <div
                key={c.id}
                className={`p-4 bg-[#142929] border rounded-xl flex flex-wrap items-center justify-between gap-4 transition-colors ${
                  isExceeded ? 'border-red-500/80 bg-red-950/10' : 'border-[#1a4d4d]'
                }`}
              >
                <div className="max-w-md">
                  <h5 className="font-semibold text-white text-sm">{c.title}</h5>
                  {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                  <span className="text-[10px] text-gray-400">
                    Max points: <strong className="text-gray-200">{c.maxScore}</strong> {c.weight > 1 ? `(Weight: x${c.weight})` : ''}
                  </span>
                  {isExceeded && (
                    <p className="text-[11px] text-red-400 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Score cannot exceed maximum of {c.maxScore} points
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={c.maxScore}
                    value={scores[c.id] ?? ''}
                    onChange={(e) => handleScoreChange(c.id, e.target.value)}
                    placeholder="0"
                    className={`w-28 bg-[#0c1e1e] border text-white px-3 py-2 rounded-xl text-sm text-center font-bold focus:outline-none transition-colors ${
                      isExceeded
                        ? 'border-red-500 text-red-300 focus:border-red-400'
                        : 'border-[#1a4d4d] focus:border-[#00ff88]'
                    }`}
                  />
                  <span className="text-xs text-gray-400 font-semibold">/ {c.maxScore}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Evaluator Feedback / Comments</label>
        <textarea
          rows={3}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add constructive comments, notes, or evaluation feedback regarding this idea..."
          className="w-full bg-[#0c1e1e] border border-[#1a4d4d] focus:border-[#00ff88] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleOpenConfirm}
          disabled={saving}
          className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-extrabold px-6 py-3 rounded-xl text-sm transition-all shadow-lg hover:shadow-[#00ff88]/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Evaluation Score
        </button>
      </div>

      {/* ── Confirmation Popup Modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c1e1e] border-2 border-[#1a4d4d] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-fadeIn text-white">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00ff88]/20 border border-[#00ff88]/40 flex items-center justify-center text-[#00ff88]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Confirm Evaluation Score</h3>
                <p className="text-xs text-gray-400">
                  For: {submission?.registration?.user?.name || 'Participant'}
                </p>
              </div>
            </div>

            {/* Score Summary Box */}
            <div className="bg-[#142929] border border-[#1a4d4d] rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#1a4d4d]">
                <span className="text-xs text-gray-300 font-medium">Computed Total Score</span>
                <span className="text-xl font-extrabold text-[#00ff88]">{calculatedTotalScore.toFixed(1)}</span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-300 max-h-40 overflow-y-auto pr-1">
                {scoringCriteria.map((c) => (
                  <div key={c.id} className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-400 truncate max-w-[200px]">{c.title}</span>
                    <span className="font-bold text-white">
                      {scores[c.id] ?? 0} / {c.maxScore} {c.weight > 1 ? `(x${c.weight})` : ''}
                    </span>
                  </div>
                ))}
              </div>

              {comments && (
                <div className="pt-2 border-t border-[#1a4d4d]">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Comments:</span>
                  <p className="text-xs text-gray-300 italic line-clamp-2 mt-0.5">"{comments}"</p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              This will update the submission score and rank this participant in the evaluation leaderboard.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-[#142929] border border-[#1a4d4d]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveScore}
                className="px-5 py-2 rounded-xl text-xs font-extrabold text-black bg-[#00ff88] hover:bg-[#00cc6a] transition-all flex items-center gap-1.5 shadow-lg shadow-[#00ff88]/20"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm & Save Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoringPanel;
