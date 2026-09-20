import React, { useState, useEffect } from 'react';
import { 
  Users, Award, Filter, Eye, Loader2, FileText, ExternalLink, X, Check, Search, BarChart2, Zap
} from 'lucide-react';
import { events as eventsApi } from '../../services/api';
import ScoringPanel from './ScoringPanel';
import WinnerSelection from './WinnerSelection';

const SubmissionsList = ({ eventId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRoundNumber, setActiveRoundNumber] = useState(1);
  const [allRounds, setAllRounds] = useState([]);
  const [config, setConfig] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' | 'winners'

  useEffect(() => {
    if (eventId) fetchSubmissions(activeRoundNumber);
  }, [eventId, statusFilter, activeRoundNumber]);

  const fetchSubmissions = async (roundNum = activeRoundNumber) => {
    setLoading(true);
    setError('');
    try {
      const res = await eventsApi.getEventIdeaSubmissions(eventId, statusFilter, roundNum);
      const data = res?.data || res;
      if (Array.isArray(data?.config?.rounds)) setAllRounds(data.config.rounds);
      setConfig(data?.config || null);
      setSubmissions(Array.isArray(data?.submissions) ? data.submissions : []);
    } catch (err) {
      console.error('Failed to fetch event submissions:', err);
      setError(err.message || 'Failed to fetch idea submissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (submissionId, newStatus) => {
    try {
      await eventsApi.updateIdeaSubmissionStatus(eventId, submissionId, newStatus);
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: newStatus } : s));
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to update submission status:', err);
    }
  };

  const handleSetDecision = async (submissionId, decision) => {
    if (!config?.id) return;
    try {
      await eventsApi.setSubmissionDecision(eventId, config.id, submissionId, decision);
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, decision } : s));
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(prev => prev ? { ...prev, decision } : null);
      }
    } catch (err) {
      console.error('Failed to set submission decision:', err);
      alert(err.message || 'Failed to update decision');
    }
  };

  const handleAutoShortlist = async () => {
    if (!config?.id) return;
    const count = config.shortlistCount || config.winnerCount || 1;
    if (!window.confirm(`Auto-shortlist top ${count} participants based on total score? Remaining participants will be placed on the waitlist.`)) {
      return;
    }
    try {
      const res = await eventsApi.autoShortlistSubmissions(eventId, config.id);
      await fetchSubmissions();
      alert(`Auto-shortlisting complete! Shortlisted: ${res?.data?.shortlistedCount ?? count}, Waitlisted: ${res?.data?.waitlistedCount ?? 0}`);
    } catch (err) {
      console.error('Failed to auto-shortlist:', err);
      alert(err.message || 'Failed to auto-shortlist');
    }
  };

  const handlePromote = async (submissionId) => {
    if (!config?.id) return;
    if (!window.confirm('Promote this waitlisted participant to Shortlisted? A promotion email will be sent to them.')) {
      return;
    }
    try {
      await eventsApi.promoteSubmission(eventId, config.id, submissionId);
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, decision: 'shortlisted', promotedAt: new Date().toISOString() } : s));
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(prev => prev ? { ...prev, decision: 'shortlisted', promotedAt: new Date().toISOString() } : null);
      }
    } catch (err) {
      console.error('Failed to promote submission:', err);
      alert(err.message || 'Failed to promote submission');
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    const user = s.registration?.user;
    const searchMatch = !searchQuery || 
      user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.college?.toLowerCase().includes(searchQuery.toLowerCase());
    return searchMatch;
  });

  const scoringEnabled = !!config?.scoringEnabled;
  const isScreeningRound = config?.roundType === 'screening';
  const scoringCriteria = Array.isArray(config?.scoringCriteria) ? config.scoringCriteria : [];

  // Parse schema fields to resolve human-readable labels
  const schemaFields = React.useMemo(() => {
    if (!config?.submissionSchema) return [];
    if (Array.isArray(config.submissionSchema)) return config.submissionSchema;
    try {
      const parsed = JSON.parse(config.submissionSchema);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [config?.submissionSchema]);

  const getFieldLabel = (key) => {
    const matched = schemaFields.find(f => f.id === key || f.label === key);
    if (matched?.label) return matched.label;

    return key
      .replace(/^field_\d+_?/, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase()) || key;
  };

  // Summary Counts
  const totalCount = submissions.length;
  const submittedCount = submissions.filter(s => s.status === 'submitted').length;
  const inReviewCount = submissions.filter(s => s.decision === 'pending' || s.status === 'under_review').length;
  const scoredCount = submissions.filter(s => (s.scores && s.scores.length > 0) || s.status === 'scored').length;
  const winnerCount = submissions.filter(s => s.decision === 'winner' || s.status === 'winner').length;
  const shortlistedCount = submissions.filter(s => s.decision === 'shortlisted').length;
  const waitlistedCount = submissions.filter(s => s.decision === 'waitlisted').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
        <p className="text-gray-400 text-sm">Loading event submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-white">
      {/* ── Multi-Round Selector Pills ── */}
      {allRounds.length > 1 && (
        <div className="flex items-center gap-2 bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-3">
          <span className="text-xs text-gray-400 font-bold px-2">View Round:</span>
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

      {/* ── Summary Dashboard Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-4 text-center">
          <span className="text-xs text-gray-400 font-semibold block">Total</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-4 text-center">
          <span className="text-xs text-emerald-400 font-semibold block">
            {isScreeningRound ? 'Shortlisted' : 'Submitted'}
          </span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
            {isScreeningRound ? shortlistedCount : submittedCount}
          </span>
        </div>
        <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-4 text-center">
          <span className="text-xs text-amber-400 font-semibold block">
            {isScreeningRound ? 'Waitlisted' : 'In Review'}
          </span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
            {isScreeningRound ? waitlistedCount : inReviewCount}
          </span>
        </div>
        <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-4 text-center">
          <span className="text-xs text-blue-400 font-semibold block">Scored</span>
          <span className="text-2xl font-extrabold text-blue-400 mt-1 block">{scoredCount}</span>
        </div>
        <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-4 text-center">
          <span className="text-xs text-yellow-400 font-semibold block">Winners</span>
          <span className="text-2xl font-extrabold text-yellow-400 mt-1 block">{winnerCount}</span>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-3 border-b border-[#1a4d4d] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'submissions'
              ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/20'
              : 'bg-[#142929] text-gray-300 hover:text-white border border-[#1a4d4d]'
          }`}
        >
          <FileText className="w-4 h-4" /> All Submissions ({totalCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('winners')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'winners'
              ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
              : 'bg-[#142929] text-yellow-400 hover:text-yellow-300 border border-yellow-500/30'
          }`}
        >
          <Award className="w-4 h-4" /> Winner Selection & Announcement 🏆
        </button>
      </div>

      {activeTab === 'winners' ? (
        <WinnerSelection
          eventId={eventId}
          config={config}
          submissions={submissions}
          onWinnersSelected={fetchSubmissions}
        />
      ) : (
        <>
          {/* ── Filter & Search Controls ── */}
      <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 relative flex-grow max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by participant name, email or college..."
            className="w-full bg-[#142929] border border-[#1a4d4d] focus:border-[#00ff88] text-white pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          {isScreeningRound && (
            <button
              type="button"
              onClick={handleAutoShortlist}
              className="bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88] font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-4 h-4" /> Auto-Shortlist Top {config?.shortlistCount || 'N'} by Score
            </button>
          )}

          <Filter className="w-4 h-4 text-[#00ff88]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#142929] border border-[#1a4d4d] text-[#00ff88] px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="winner">Winner</option>
            <option value="not_selected">Not Selected</option>
          </select>
        </div>
      </div>

      {/* ── Submissions Table / List ── */}
      {filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-[#1a4d4d] rounded-2xl text-gray-400">
          No idea submissions match the current filters.
        </div>
      ) : (
        <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#142929] text-gray-400 text-xs uppercase tracking-wider border-b border-[#1a4d4d]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Participant</th>
                  <th className="py-3.5 px-4 font-semibold">Submitted Date</th>
                  <th className="py-3.5 px-4 font-semibold">{isScreeningRound ? 'Screening Decision' : 'Status'}</th>
                  {scoringEnabled && <th className="py-3.5 px-4 font-semibold">Total Score</th>}
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a4d4d]">
                {filteredSubmissions.map((sub) => {
                  const user = sub.registration?.user;
                  const latestScore = sub.scores?.[0]?.totalScore;

                  return (
                    <tr key={sub.id} className="hover:bg-[#142929]/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{user?.name || 'Anonymous User'}</div>
                        <div className="text-xs text-gray-400">{user?.email}</div>
                        {user?.college && <div className="text-[10px] text-gray-500">{user.college}</div>}
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-300">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Draft'}
                      </td>

                      <td className="py-4 px-4">
                        {isScreeningRound ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={sub.decision || 'pending'}
                              onChange={(e) => handleSetDecision(sub.id, e.target.value)}
                              className={`border text-xs font-bold px-2.5 py-1 rounded-lg focus:outline-none ${
                                sub.decision === 'shortlisted'
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                  : sub.decision === 'waitlisted'
                                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                  : 'bg-[#142929] border-[#1a4d4d] text-gray-300'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="waitlisted">Waitlisted</option>
                            </select>
                            {sub.decision === 'waitlisted' && (
                              <button
                                type="button"
                                onClick={() => handlePromote(sub.id)}
                                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 px-2 py-1 rounded-md text-[11px] font-bold transition-all inline-flex items-center gap-1"
                                title="Promote waitlisted submission to shortlisted"
                              >
                                <Zap className="w-3 h-3" /> Promote
                              </button>
                            )}
                          </div>
                        ) : (
                          <select
                            value={sub.decision && sub.decision !== 'pending' ? sub.decision : sub.status}
                            onChange={(e) => handleUpdateStatus(sub.id, e.target.value)}
                            className="bg-[#142929] border border-[#1a4d4d] text-xs font-bold px-2.5 py-1 rounded-lg focus:outline-none text-[#00ff88]"
                          >
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="pending">Pending</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="waitlisted">Waitlisted</option>
                            <option value="winner">Winner 🏆</option>
                            <option value="not_selected">Not Selected</option>
                          </select>
                        )}
                      </td>

                      {scoringEnabled && (
                        <td className="py-4 px-4 font-extrabold text-[#00ff88] text-base">
                          {latestScore !== undefined && latestScore !== null ? Number(latestScore).toFixed(1) : '-'}
                        </td>
                      )}

                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSubmission(sub)}
                          className="inline-flex items-center gap-1.5 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88] font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review / Score
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ── Submission Modal / Drawer ── */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#0c1e1e] border-2 border-[#1a4d4d] rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1a4d4d] pb-4">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>Submission from {selectedSubmission.registration?.user?.name || 'Participant'}</span>
                  <span className="text-xs bg-[#142929] border border-[#1a4d4d] text-[#00ff88] px-2.5 py-0.5 rounded-full font-semibold">
                    Status: {selectedSubmission.status}
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedSubmission.registration?.user?.email} • {selectedSubmission.registration?.user?.phone || 'Phone N/A'} • {selectedSubmission.registration?.user?.college || 'College N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-[#142929] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form Responses (Wide & Spacious) */}
            <div className="space-y-4 bg-[#142929] border border-[#1a4d4d] rounded-2xl p-6">
              <h4 className="text-base font-bold text-[#00ff88] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Submitted Answers
              </h4>

              {selectedSubmission.data && typeof selectedSubmission.data === 'object' && Object.keys(selectedSubmission.data).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedSubmission.data).map(([key, val]) => {
                    const label = getFieldLabel(key);
                    const strVal = String(val || '');
                    const isUrl = /^https?:\/\/[^\s]+$/i.test(strVal.trim());

                    return (
                      <div key={key} className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-xl p-4 space-y-1.5 break-words">
                        <span className="text-xs text-white font-bold uppercase tracking-wider block">{label}</span>
                        {isUrl ? (
                          <a
                            href={strVal.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#6ee7b7] hover:text-[#a7f3d0] hover:underline font-medium text-sm inline-flex items-center gap-1.5 break-all transition-colors group"
                          >
                            <span>{strVal}</span>
                            <ExternalLink className="w-4 h-4 shrink-0 text-[#6ee7b7] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                        ) : (
                          <span className="text-sm text-gray-200 block whitespace-pre-wrap leading-relaxed">
                            {strVal || <span className="text-gray-500 italic">No answer provided</span>}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No answers submitted.</p>
              )}
            </div>

            {/* Attachments */}
            {Array.isArray(selectedSubmission.attachments) && selectedSubmission.attachments.length > 0 && (
              <div className="space-y-3 bg-[#142929] border border-[#1a4d4d] rounded-2xl p-6">
                <h4 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#6ee7b7]" /> Attachments & Files
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedSubmission.attachments.map((att, idx) => {
                    const label = att.fieldId ? getFieldLabel(att.fieldId) : (att.name || 'Attachment');
                    return (
                      <div key={idx} className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-xl p-3.5 flex items-center justify-between gap-3">
                        <div className="truncate">
                          <span className="text-xs text-white font-bold block truncate">{label}</span>
                          {att.name && att.name !== label && (
                            <span className="text-[10px] text-gray-400 block truncate">{att.name}</span>
                          )}
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-[#6ee7b7]/15 hover:bg-[#6ee7b7]/25 text-[#6ee7b7] hover:text-[#a7f3d0] font-bold px-3 py-1.5 rounded-lg border border-[#6ee7b7]/30 inline-flex items-center gap-1 shrink-0 transition-all"
                        >
                          Open <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scoring Panel (if enabled) or Manual Tagging */}
            {scoringEnabled ? (
              <ScoringPanel
                eventId={eventId}
                submission={selectedSubmission}
                scoringCriteria={scoringCriteria}
                onScoreSaved={fetchSubmissions}
              />
            ) : (
              <div className="p-4 bg-[#142929] border border-[#1a4d4d] rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-white">Manual Status Tagging</h4>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Current Status:</span>
                  <select
                    value={selectedSubmission.status}
                    onChange={(e) => handleUpdateStatus(selectedSubmission.id, e.target.value)}
                    className="bg-[#0c1e1e] border border-[#1a4d4d] text-xs font-bold text-[#00ff88] px-3 py-1.5 rounded-lg focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="scored">Scored</option>
                    <option value="winner">Winner 🏆</option>
                    <option value="not_selected">Not Selected</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default SubmissionsList;
