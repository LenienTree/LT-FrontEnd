import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { Search, Loader2, AlertCircle, X, Calendar, MapPin } from "lucide-react";
import Footer from "../components/layout/Footer";
import PublishEventCard from "../components/organizer/PublishEventCard";
import OrganizeEventCTA from "../components/organizer/OrganizeEventCTA";
import { events as eventsApi } from "../services/api";

/* ─── Category colour map ─────────────────────────────────────────────────── */
const CAT_STYLES = {
    Hackathon: { pill: "bg-blue-500/20 text-blue-300 border-blue-500/30",   dot: "bg-blue-500",   cal: "bg-blue-500" },
    Ideathon:  { pill: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", dot: "bg-yellow-400", cal: "bg-yellow-400" },
    Webinar:   { pill: "bg-purple-500/20 text-purple-300 border-purple-500/30", dot: "bg-purple-500", cal: "bg-purple-500" },
    Conclave:  { pill: "bg-red-500/20 text-red-300 border-red-500/30",      dot: "bg-red-500",    cal: "bg-red-500" },
    Other:     { pill: "bg-gray-500/20 text-gray-300 border-gray-500/30",   dot: "bg-gray-400",   cal: "bg-gray-400" },
};
const getStyle = (cat) => CAT_STYLES[cat] ?? CAT_STYLES.Other;

function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── Event poster card ───────────────────────────────────────────────────── */
function EventCard({ event, onClick }) {
    const [imgError, setImgError] = useState(false);
    const poster = !imgError && (event.eventPoster || event.bannerImage);
    const s = getStyle(event.category);

    return (
        <div
            onClick={() => onClick(event._id || event.id)}
            className="group cursor-pointer flex flex-col"
        >
            <div className="rounded-2xl overflow-hidden bg-[#0D3838] border border-[#9AE600]/10 hover:border-[#9AE600]/50 shadow-lg hover:shadow-[#9AE600]/10 transition-all duration-300 hover:scale-[1.02] flex flex-col h-full">
                {/* Poster — locked 3:4 aspect ratio */}
                <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#0a1f1f] to-[#0d3333]" style={{ paddingBottom: "133.33%" }}>
                    <div className="absolute inset-0">
                    {poster ? (
                        <img
                            src={poster}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                            <Calendar size={30} className="text-[#9AE600]/40" />
                            <span className="text-gray-500 text-xs text-center line-clamp-2">{event.title}</span>
                        </div>
                    )}
                    {/* Mode badge */}
                    <div className="absolute top-2 right-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm ${event.mode === "ONLINE" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"}`}>
                            {event.mode === "ONLINE" ? "🌐 Online" : "📍 Offline"}
                        </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D3838] via-transparent to-transparent opacity-70" />
                    </div>
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1.5">
                    <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.pill}`}>
                        {event.category || "Event"}
                    </span>
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-[#9AE600] transition-colors">
                        {event.title}
                    </h3>
                    {event.subtitle && (
                        <p className="text-gray-400 text-xs line-clamp-1">{event.subtitle}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1 pt-2 border-t border-white/5">
                        <Calendar size={10} />
                        <span>{formatDate(event.startDate)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Skeleton card ───────────────────────────────────────────────────────── */
function SkeletonCard() {
    return (
        <div className="rounded-2xl overflow-hidden bg-[#0D3838] border border-white/5 animate-pulse">
            <div className="w-full bg-[#1a4d4d]/30" style={{ paddingBottom: "133.33%" }} />
            <div className="p-3 space-y-2">
                <div className="h-3 w-16 bg-[#1a4d4d]/40 rounded-full" />
                <div className="h-4 w-full bg-[#1a4d4d]/40 rounded" />
                <div className="h-3 w-2/3 bg-[#1a4d4d]/30 rounded" />
            </div>
        </div>
    );
}

/* ─── Main CalendarPage ───────────────────────────────────────────────────── */
export default function CalenderPage() {
    const navigate = useNavigate();
    const [currentDate] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    // API state
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const CATEGORIES = ["All", "Hackathon", "Ideathon", "Webinar", "Conclave", "Other"];

    /* Fetch all events once — same pattern as Home.jsx */
    useEffect(() => {
        setLoading(true);
        eventsApi.getAll({ limit: 200 })
            .then(res => {
                // Backend returns buildPaginatedResult: { data: events[], meta: {} }
                // api.js unwraps the outer { success, data } so we get { data: [], meta: {} }
                const list = (Array.isArray(res) ? res : res.data) || [];
                setAllEvents([...list].reverse());
                setError("");
            })
            .catch(err => setError(err.message || "Failed to load events."))
            .finally(() => setLoading(false));
    }, []);

    /* Filtered events for the poster grid - no filters by default */
    const filteredEvents = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return allEvents.filter(e => {
            const matchesCat = activeCategory === "All" || e.category === activeCategory;
            const matchesSearch = !q
                || (e.title ?? "").toLowerCase().includes(q)
                || (e.subtitle ?? "").toLowerCase().includes(q)
                || (e.description ?? "").toLowerCase().includes(q);
            return matchesCat && matchesSearch;
        });
    }, [allEvents, searchQuery, activeCategory]);

    /* Build a map of day → event categories for the calendar dots */
    const calendarEventMap = useMemo(() => {
        const map = {};
        allEvents.forEach(e => {
            if (!e.startDate) return;
            const d = new Date(e.startDate);
            if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
                const day = d.getDate();
                if (!map[day]) map[day] = [];
                map[day].push(e.category || "Other");
            }
        });
        return map;
    }, [allEvents, selectedMonth, selectedYear]);

    /* ── Calendar render ── */
    const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
    const getFirstDay = (m, y) => new Date(y, m, 1).getDay();

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
        const firstDay = getFirstDay(selectedMonth, selectedYear);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`e-${i}`} className="p-2" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday =
                day === currentDate.getDate() &&
                selectedMonth === currentDate.getMonth() &&
                selectedYear === currentDate.getFullYear();

            const dayEvents = calendarEventMap[day] || [];
            // Show at most 3 unique category dots
            const dots = [...new Set(dayEvents)].slice(0, 3);

            days.push(
                <div key={day} className="relative flex flex-col items-center p-2">
                    {dots.length > 0 && (
                        <div className="flex gap-0.5 mb-1 h-2">
                            {dots.map((cat, idx) => (
                                <div
                                    key={idx}
                                    className={`flex-1 h-2 rounded-sm ${getStyle(cat).cal}`}
                                />
                            ))}
                        </div>
                    )}
                    <span
                        className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full text-sm sm:text-base md:text-lg font-medium transition-all ${
                            isToday
                                ? "bg-[#9AE600] text-slate-900 font-bold ring-4 ring-[#9AE600]/30"
                                : dots.length > 0
                                ? "text-white ring-1 ring-[#9AE600]/20"
                                : "text-white/90 hover:text-white"
                        }`}
                    >
                        {day}
                    </span>
                </div>
            );
        }
        return days;
    };

    const handleEventClick = (id) => navigate(`/event/${id}`);

    return (
        <div
            className="min-h-screen bg-[#022F2E]"
            style={{ backgroundImage: `url("/vectorhome2.png")`, backgroundSize: "cover", backgroundPosition: "center" }}
        >
            <div className="p-20">
                <Header />
            </div>

            {/* ── Calendar ── */}
            <div className="w-full max-w-5xl mx-auto bg-[#0D3838]/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border-4 border-[#9AE600] shadow-2xl shadow-[#9AE600]/20 mb-8">
                <div className="flex mt-10 justify-between items-center mb-6 sm:mb-8">
                    <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                        {monthNames[selectedMonth]} {selectedYear}
                    </h4>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => {
                                if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
                                else setSelectedMonth(selectedMonth - 1);
                            }}
                            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-700/50 hover:bg-slate-600/50 border-2 border-slate-600/50 transition-all"
                            aria-label="Previous month"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => {
                                if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
                                else setSelectedMonth(selectedMonth + 1);
                            }}
                            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-700/50 hover:bg-slate-600/50 border-2 border-slate-600/50 transition-all"
                            aria-label="Next month"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center mb-4">
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
                        <div key={d} className="text-white/60 text-sm sm:text-base md:text-lg py-2 sm:py-3">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2 sm:gap-3">{renderCalendar()}</div>
            </div>

            {/* ── Legend ── */}
            <div className="max-w-5xl mx-auto bg-[#0D3838]/80 backdrop-blur-lg rounded-2xl p-6 border-2 border-[#9AE600]/50 mb-10">
                <h3 className="text-xl font-bold text-white mb-4">Event Types</h3>
                <div className="flex flex-wrap gap-4">
                    {Object.entries(CAT_STYLES).map(([cat, s]) => (
                        <div key={cat} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm ${s.dot}`} />
                            <span className="text-white/80 text-sm">{cat}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Event Discovery Section ── */}
            <div className="container mx-auto px-4 pb-16">
                <div className="max-w-7xl mx-auto">

                    {/* Section heading */}
                    <div className="text-center mb-10">
                        <span className="inline-block text-[#9AE600] text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 bg-[#9AE600]/10 rounded-full border border-[#9AE600]/20">
                            Browse
                        </span>
                        <h2 className="text-white text-3xl md:text-4xl font-bold">All Events</h2>
                    </div>

                    {/* Search bar */}
                    <div className="mb-6 relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search events by name, description..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0D3838] border-2 border-[#9AE600]/30 text-white placeholder-gray-500 py-3 pl-10 pr-10 rounded-xl focus:outline-none focus:border-[#9AE600] transition-all duration-300 text-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Category filter pills */}
                    <div className="mb-8 flex flex-wrap justify-center gap-3">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                                    activeCategory === cat
                                        ? "bg-[#9AE600] text-black border-[#9AE600] shadow-lg scale-105"
                                        : "bg-transparent text-gray-300 border-[#9AE600]/20 hover:border-[#9AE600]/50 hover:text-white"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                        {(searchQuery || activeCategory !== "All") && (
                            <button
                                onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                                className="px-4 py-2 rounded-full text-xs text-gray-400 border border-white/10 hover:text-white hover:border-white/30 flex items-center gap-1 transition-all"
                            >
                                <X size={12} /> Clear
                            </button>
                        )}
                    </div>

                    {/* Results count */}
                    {!loading && !error && (
                        <p className="text-center text-gray-400 text-sm mb-6">
                            {filteredEvents.length === 0
                                ? "No events found"
                                : `${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""}`}
                            {searchQuery && <span className="text-[#9AE600]"> for "{searchQuery}"</span>}
                        </p>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="flex items-center gap-3 px-5 py-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-sm mb-8 max-w-xl mx-auto">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span>{error}</span>
                            <button onClick={() => window.location.reload()} className="ml-auto underline text-red-300 hover:text-red-200">Retry</button>
                        </div>
                    )}

                    {/* Masonry grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredEvents.map(event => (
                                <EventCard
                                    key={event._id || event.id}
                                    event={event}
                                    onClick={handleEventClick}
                                />
                            ))}
                        </div>
                    ) : !error ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-16 h-16 rounded-full bg-[#9AE600]/5 border border-[#9AE600]/10 flex items-center justify-center">
                                <Calendar size={28} className="text-[#9AE600]/30" />
                            </div>
                            <p className="text-gray-400 text-sm">No events match your search.</p>
                            <button
                                onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                                className="text-xs text-[#9AE600] hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : null}

                    <div className="mt-16">
                        <PublishEventCard />
                    </div>
                </div>
            </div>

            <OrganizeEventCTA />
            <Footer />
        </div>
    );
}
