import React, { useState } from 'react';
import { Award, Trophy, CheckCircle2, AlertTriangle, ShieldCheck, Mail, Loader2, Sparkles, Check, X } from 'lucide-react';
import { events as eventsApi } from '../../services/api';

const WinnerSelection = ({ eventId, config, submissions = [], onWinnersSelected }) => {
  const [selectedWinnerIds, setSelectedWinnerIds] = useState(() => {
    // Pre-select existing winners if any
    return submissions.filter(s => s.decision === 'winner' || s.status === 'winner').map(s => s.id);
  });
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isCompleted = config?.status === 'completed';
  const targetWinnerCount = config?.winnerCount || 1;
  const scoringEnabled = !!config?.scoringEnabled;

  // Filter non-draft submissions for winner selection
  const eligibleSubmissions = submissions.filter(s => s.status !== 'draft');

  // Sort: if scoring is enabled, sort by totalScore desc, then submittedAt
  const sortedSubmissions = [...eligibleSubmissions].sort((a, b) => {
    if (scoringEnabled) {
      const scoreA = a.scores?.[0]?.totalScore ?? -1;
      const scoreB = b.scores?.[0]?.totalScore ?? -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
    }
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return timeB - timeA;
  });

  const toggleWinner = (submissionId) => {
    if (isCompleted) return;
    setError('');
    setSelectedWinnerIds((prev) => {
      if (prev.includes(submissionId)) {
        return prev.filter(id => id !== submissionId);
      } else {
        return [...prev, submissionId];
      }
    });
  };

  const handleConfirmWinners = async () => {
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      await eventsApi.selectIdeaWinners(eventId, selectedWinnerIds);
      setSuccessMsg('🏆 Winners announced successfully! Emails sent to all participants and event status set to Completed.');
      setShowConfirmModal(false);
      if (onWinnersSelected) {
        onWinnersSelected();
      }
    } catch (err) {
      console.error('Failed to announce winners:', err);
      setError(err.message || 'Failed to complete winner selection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-6 text-white space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1a4d4d]">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-bold tracking-wide">Winner Selection & Event Closure</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Pick winner(s) from the submission pool. Completing this action will notify all participants via email and lock further submission edits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#142929] border border-[#1a4d4d] px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300 font-medium">Configured Winner Slots:</span>
            <span className="font-extrabold text-[#00ff88] text-sm">{targetWinnerCount}</span>
          </div>

          {isCompleted ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Event Completed & Locked
            </div>
          ) : (
            <button
              type="button"
              disabled={selectedWinnerIds.length === 0 || submitting}
              onClick={() => setShowConfirmModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Finalize Winners & Send Emails ({selectedWinnerIds.length})
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Submissions Ranking List ── */}
      {sortedSubmissions.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-xs border border-dashed border-[#1a4d4d] rounded-xl">
          No submitted ideas available for winner selection yet.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between px-2">
            <span>Ranked Submissions ({scoringEnabled ? 'Sorted by Score' : 'Sorted by Date'})</span>
            <span>Selected: {selectedWinnerIds.length} / {targetWinnerCount}</span>
          </div>

          <div className="divide-y divide-[#1a4d4d] border border-[#1a4d4d] rounded-xl overflow-hidden bg-[#142929]">
            {sortedSubmissions.map((sub, idx) => {
              const user = sub.registration?.user;
              const isSelected = selectedWinnerIds.includes(sub.id);
              const score = sub.scores?.[0]?.totalScore;

              return (
                <div
                  key={sub.id}
                  onClick={() => !isCompleted && toggleWinner(sub.id)}
                  className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-all ${
                    isSelected ? 'bg-yellow-500/10 border-l-4 border-l-yellow-400' : 'hover:bg-[#1f3d3d]/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#0c1e1e] border border-[#1a4d4d] flex items-center justify-center text-xs font-bold text-gray-300">
                      #{idx + 1}
                    </div>

                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {user?.name || 'Anonymous'}
                        {sub.status === 'winner' && (
                          <span className="bg-yellow-400 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            Winner 🏆
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{user?.email} {user?.college ? `• ${user.college}` : ''}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {scoringEnabled && (
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Total Score</span>
                        <span className="text-sm font-extrabold text-[#00ff88]">
                          {score !== undefined && score !== null ? Number(score).toFixed(1) : 'Unscored'}
                        </span>
                      </div>
                    )}

                    {!isCompleted && (
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-yellow-400 border-yellow-400 text-black'
                            : 'border-[#1a4d4d] bg-[#0c1e1e] text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Winner Selection</h3>
                <p className="text-xs text-gray-400">Final action to close event and email participants</p>
              </div>
            </div>

            <div className="bg-[#142929] border border-[#1a4d4d] p-4 rounded-xl text-xs space-y-2 text-gray-300">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#00ff88]" /> What will happen next:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Selected {selectedWinnerIds.length} submission(s) will be marked as <strong className="text-yellow-400">Winner 🏆</strong>.</li>
                <li>All other submissions will be marked as <strong className="text-gray-300">Not Selected</strong>.</li>
                <li>Event configuration status will transition to <strong className="text-emerald-400">Completed</strong>.</li>
                <li>Automatic emails will be sent to all participants notifying them of the results using Nodemailer templates.</li>
                <li>Further submission updates, additions, or scoring edits will be permanently locked.</li>
              </ul>
            </div>

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
                disabled={submitting}
                onClick={handleConfirmWinners}
                className="px-5 py-2 rounded-xl text-xs font-extrabold text-black bg-yellow-400 hover:bg-yellow-300 transition-all flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Confirm & Send Emails
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinnerSelection;
