import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Calendar, Users, Award, ExternalLink, ShieldCheck, ShieldAlert, Award as AwardIcon, Check, X, ClipboardCheck, ArrowLeft, Loader2, Send, Link2 } from "lucide-react";
import { organizer as organizerApi, events as eventsApi } from "../../services/api";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import ReferralManager from "../shared/ReferralManager";

export default function OrganizerDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    activeEvents: 0,
    attendedCount: 0,
  });
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("overview"); // 'overview' | 'referrals'

  // Management modal states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsMeta, setParticipantsMeta] = useState(null);
  const [participantsPage, setParticipantsPage] = useState(1);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [globalCertUrl, setGlobalCertUrl] = useState("");
  const [bulkIssuing, setBulkIssuing] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  // Keys already rendered as dedicated columns (or used internally) — everything
  // else in formData is a custom/extra field added via the form builder and must
  // be shown so organizers can actually see those answers.
  const RESERVED_FORMDATA_KEYS = new Set([
    "name", "email", "phone", "phone number", "college", "teammembers", "linkedinpostlink",
  ]);

  // Coerce any field value (checkbox booleans → Yes/No, numbers → string) to text.
  const displayValue = (v) => (typeof v === "boolean" ? (v ? "Yes" : "No") : String(v));

  const hasValue = (v) => v !== null && v !== undefined && v !== "" && typeof v !== "object";

  // Extract custom field answers from the primary registrant's formData (skips the
  // keys already shown as dedicated columns and the internal teamMembers array).
  const getExtraAnswers = (formData) => {
    if (!formData || typeof formData !== "object") return [];
    return Object.entries(formData)
      .filter(([k, v]) => !RESERVED_FORMDATA_KEYS.has(String(k).toLowerCase()) && hasValue(v))
      .map(([k, v]) => [k, displayValue(v)]);
  };

  // Every answered field for a team member (name is rendered separately as the label),
  // so phone/email/college and any custom fields collected per member are all visible.
  const getMemberFields = (member) => {
    if (!member || typeof member !== "object") return [];
    return Object.entries(member)
      .filter(([k, v]) => String(k).toLowerCase() !== "name" && hasValue(v))
      .map(([k, v]) => [k, displayValue(v)]);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await organizerApi.getDashboard();
      // data: { stats: { totalEvents, totalRegistrations, activeEvents, attendedCount }, events }
      setStats({
        totalEvents: data.totals?.totalEvents || data.events?.length || 0,
        totalRegistrations: data.totals?.totalParticipants || data.events?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0,
        activeEvents: data.totals?.approvedParticipants || data.events?.filter(e => e.status === "APPROVED").length || 0,
        attendedCount: 0
      });
      setEventsList(data.events || []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEventManage = async (event, pageNum = 1) => {
    setSelectedEvent(event);
    setLoadingParticipants(true);
    setBulkMessage("");
    try {
      const res = await eventsApi.getParticipants(event.id, { page: pageNum, limit: 10 });
      // getParticipants returns a paginated result ({ data, meta }); unwrap the
      // array so participants.map/.filter/.length work (raw arrays also handled).
      const list = Array.isArray(res)
        ? res
        : (Array.isArray(res?.data) ? res.data : []);
      setParticipants(list);
      setParticipantsMeta(res?.meta || null);
      setParticipantsPage(pageNum);
    } catch (err) {
      console.error("Failed to load participants:", err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleApproveRegistration = async (regId) => {
    try {
      await eventsApi.approveRegistration(selectedEvent.id, regId);
      setParticipants(prev => prev.map(p => p.id === regId ? { ...p, status: "APPROVED" } : p));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleRejectRegistration = async (regId) => {
    try {
      await eventsApi.rejectRegistration(selectedEvent.id, regId);
      setParticipants(prev => prev.map(p => p.id === regId ? { ...p, status: "REJECTED" } : p));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleMarkAttendance = async (regId) => {
    try {
      await eventsApi.markAttendance(selectedEvent.id, regId);
      setParticipants(prev => prev.map(p => p.id === regId ? { ...p, status: "ATTENDED" } : p));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleBulkIssueCertificates = async () => {
    if (!globalCertUrl.trim()) {
      alert("Please enter a valid base or template Certificate URL.");
      return;
    }
    const attendedUsers = participants.filter(p => p.status === "ATTENDED");
    if (attendedUsers.length === 0) {
      alert("No participants have been marked as ATTENDED yet.");
      return;
    }

    setBulkIssuing(true);
    setBulkMessage("");
    try {
      const recipients = attendedUsers.map(u => ({
        userId: u.userId,
        certificateUrl: globalCertUrl,
      }));

      const results = await organizerApi.bulkIssueCertificates({
        eventId: selectedEvent.id,
        recipients,
      });

      const successCount = results.filter(r => r.status === "SUCCESS").length;
      setBulkMessage(`Successfully issued certificates to ${successCount} attended users.`);
      setGlobalCertUrl("");
    } catch (err) {
      setBulkMessage("Failed to issue certificates: " + err.message);
    } finally {
      setBulkIssuing(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgColor flex flex-col text-white">
      <Header />

      <main className="flex-grow container mx-auto px-6 pt-28 pb-16">
        {selectedEvent ? (
          /* Participant Management View */
          <div>
            <button
              onClick={() => {
                setSelectedEvent(null);
                fetchDashboardData();
              }}
              className="mb-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>

            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
                Manage Registrations
                <span className="text-xs uppercase font-bold px-3 py-1 rounded-full bg-[#9AE600]/20 text-[#9AE600] border border-[#9AE600]/20">
                  {selectedEvent.title}
                </span>
              </h1>
              <p className="text-gray-400 mt-2 text-sm">
                Review registrations, mark attendance, and issue completion certificates.
              </p>
            </div>

            {/* Certificate Bulk Issuing box */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 backdrop-blur-md">
              <h2 className="text-sm font-bold text-[#9AE600] flex items-center gap-2 mb-3">
                <Award className="w-4 h-4" />
                Bulk Certificate Generator
              </h2>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Automatically generate and issue certificates to all participants marked as <strong>ATTENDED</strong>. Input a template PDF/credential link below.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. https://certificates.lenienttree.com/template.pdf"
                  value={globalCertUrl}
                  onChange={(e) => setGlobalCertUrl(e.target.value)}
                  className="flex-grow px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#9AE600]"
                />
                <button
                  onClick={handleBulkIssueCertificates}
                  disabled={bulkIssuing}
                  className="px-6 py-2.5 bg-[#9AE600] text-black text-xs font-bold rounded-xl hover:bg-[#85cc00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {bulkIssuing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Issue in Bulk
                </button>
              </div>
              {bulkMessage && (
                <p className="mt-3 text-xs text-emerald-400 font-semibold">{bulkMessage}</p>
              )}
            </div>

            {/* Participants list */}
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-sm font-bold">Registration Funnel ({participantsMeta?.total ?? selectedEvent?._count?.registrations ?? participants.length} total)</h3>
              </div>

              {loadingParticipants ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#9AE600] mb-2" />
                  <span>Loading participants list...</span>
                </div>
              ) : participants.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  No registrations recorded yet.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[10px] text-gray-400 uppercase font-bold tracking-wider border-b border-white/10">
                        <th className="px-6 py-3">Participant</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Phone</th>
                        <th className="px-6 py-3">College</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {participants.map((reg) => (
                        <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-semibold">
                            {reg.user?.name || reg.formData?.name || "Anonymous"}
                            {getExtraAnswers(reg.formData).length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {getExtraAnswers(reg.formData).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-normal"
                                    title={`${k}: ${v}`}
                                  >
                                    <span className="text-gray-500 capitalize">{k}:</span>
                                    <span className="text-gray-300">{v}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {Array.isArray(reg.formData?.teamMembers) && reg.formData.teamMembers.length > 0 && (
                              <div className="mt-2 space-y-1.5 border-l-2 border-white/10 pl-2.5">
                                {reg.formData.teamMembers.map((m, mi) => (
                                  <div key={mi}>
                                    <p className="text-[11px] text-gray-400 font-medium">
                                      Member {mi + 1}: <span className="text-gray-300">{m?.name || "Unnamed"}</span>
                                    </p>
                                    {getMemberFields(m).length > 0 && (
                                      <div className="mt-0.5 flex flex-wrap gap-1">
                                        {getMemberFields(m).map(([k, v]) => (
                                          <span
                                            key={k}
                                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-normal"
                                            title={`${k}: ${v}`}
                                          >
                                            <span className="text-gray-500 capitalize">{k}:</span>
                                            <span className="text-gray-300">{v}</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-300">{reg.user?.email || "-"}</td>
                          <td className="px-6 py-4 text-gray-300">{reg.formData?.phone || reg.formData?.Phone || reg.formData?.['Phone Number'] || reg.user?.phone || "-"}</td>
                          <td className="px-6 py-4 text-gray-400">{reg.user?.college || "-"}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              reg.status === "ATTENDED"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : reg.status === "APPROVED"
                                ? "bg-blue-500/20 text-blue-400"
                                : reg.status === "REJECTED"
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {reg.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-1.5">
                            {reg.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleApproveRegistration(reg.id)}
                                  className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded transition-all"
                                  title="Approve"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRejectRegistration(reg.id)}
                                  className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded transition-all"
                                  title="Reject"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {reg.status === "APPROVED" && (
                              <button
                                onClick={() => handleMarkAttendance(reg.id)}
                                className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition-all flex items-center gap-1 font-semibold"
                              >
                                <ClipboardCheck className="w-3.5 h-3.5" />
                                Check In
                              </button>
                            )}
                            {reg.status === "ATTENDED" && (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Checked In
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {participantsMeta && participantsMeta.totalPages > 1 && (
                  <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] text-gray-400 font-semibold">
                      Showing page <span className="text-white font-bold">{participantsPage}</span> of <span className="text-white font-bold">{participantsMeta.totalPages}</span> ({participantsMeta.total} total registrants)
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={participantsPage === 1}
                        onClick={() => handleOpenEventManage(selectedEvent, participantsPage - 1)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all"
                      >
                        Prev
                      </button>
                      {[...Array(participantsMeta.totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handleOpenEventManage(selectedEvent, i + 1)}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all ${
                            participantsPage === i + 1
                              ? "bg-[#9AE600] text-black"
                              : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        disabled={participantsPage === participantsMeta.totalPages}
                        onClick={() => handleOpenEventManage(selectedEvent, participantsPage + 1)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        ) : view === "referrals" ? (
          /* Referral Tracking View */
          <div>
            <button
              onClick={() => setView("overview")}
              className="mb-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <ReferralManager mode="organizer" accent="#9AE600" />
            </div>
          </div>
        ) : (
          /* Organizer Overview View */
          <div>
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
                Organizer <span className="text-[#9AE600]">Dashboard</span>
              </h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">
                Create event blueprints, review registrations, track attendance, and reward participants.
              </p>
            </div>

            {error && (
              <div className="mb-6 px-4 py-3 bg-rose-900/40 border border-rose-500/50 rounded-2xl text-rose-400 text-sm">
                {error}
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Blueprints</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{stats.totalEvents}</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-[#9AE600]/20 flex items-center justify-center text-[#9AE600]">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Registrations</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{stats.totalRegistrations}</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Approved Events</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{stats.activeEvents}</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <AwardIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Accomplishments</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{stats.attendedCount}</p>
                </div>
              </div>
            </div>

            {/* Actions panel */}
            <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
              <h3 className="text-lg font-bold">My Blueprinted Events</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView("referrals")}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-full hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Referrals
                </button>
                <Link
                  to="/organize"
                  className="px-5 py-2.5 bg-[#9AE600] text-black text-xs font-bold rounded-full hover:bg-[#85cc00] transition-colors"
                >
                  + Organize New Event
                </Link>
              </div>
            </div>

            {/* Events list table */}
            {loading ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#9AE600] mb-3" />
                <span>Synchronizing dashboard information...</span>
              </div>
            ) : eventsList.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                <LayoutDashboard className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-40" />
                <h4 className="text-base font-bold text-white mb-2">No blueprints found</h4>
                <p className="text-gray-400 text-xs max-w-sm mx-auto mb-6">
                  You haven't blueprinted any events yet. Click organize below to create your draft.
                </p>
                <Link
                  to="/organize"
                  className="px-6 py-2.5 bg-[#9AE600] text-black text-xs font-bold rounded-full hover:bg-[#85cc00] transition-colors"
                >
                  Create First Event
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventsList.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-white/20 transition-all hover:bg-white/10 shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {event.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          event.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : event.status === "PENDING"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : event.status === "REJECTED"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {event.status}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white truncate mb-1">
                        {event.title}
                      </h4>
                      <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 text-[#9AE600]" />
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>

                      {/* slots display */}
                      <div className="flex justify-between items-center text-xs text-gray-300 border-t border-white/5 pt-4 mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-500" />
                          Registrations
                        </span>
                        <span className="font-bold text-[#9AE600]">
                          {event.total ?? 0} {event.maxParticipants ? `/ ${event.maxParticipants}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => handleOpenEventManage(event)}
                        className="py-2 bg-[#9AE600]/10 border border-[#9AE600]/20 hover:bg-[#9AE600] text-[#9AE600] hover:text-black text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        Manage
                      </button>
                      <Link
                        to={`/organize/edit/${event.id}`}
                        className="py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-center"
                      >
                        Edit Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
