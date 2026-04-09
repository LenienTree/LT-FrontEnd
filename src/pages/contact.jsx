import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Tag, Loader2, AlertCircle, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { events as eventsApi } from '../services/api';

/* ─── Category badge colours ─────────────────────────────────────────────── */
const CATEGORY_COLORS = {
  HACKATHON:    { bg: 'bg-violet-500/20',  text: 'text-violet-300',  border: 'border-violet-500/30' },
  WORKSHOP:     { bg: 'bg-blue-500/20',    text: 'text-blue-300',    border: 'border-blue-500/30'   },
  SEMINAR:      { bg: 'bg-amber-500/20',   text: 'text-amber-300',   border: 'border-amber-500/30'  },
  COMPETITION:  { bg: 'bg-red-500/20',     text: 'text-red-300',     border: 'border-red-500/30'    },
  CULTURAL:     { bg: 'bg-pink-500/20',    text: 'text-pink-300',    border: 'border-pink-500/30'   },
  SPORTS:       { bg: 'bg-green-500/20',   text: 'text-green-300',   border: 'border-green-500/30'  },
  NETWORKING:   { bg: 'bg-cyan-500/20',    text: 'text-cyan-300',    border: 'border-cyan-500/30'   },
  OTHER:        { bg: 'bg-gray-500/20',    text: 'text-gray-300',    border: 'border-gray-500/30'   },
};

function getCategoryStyle(category = 'OTHER') {
  return CATEGORY_COLORS[category?.toUpperCase()] ?? CATEGORY_COLORS.OTHER;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/* ─── Single Event Card ───────────────────────────────────────────────────── */
function EventCard({ event, onClick }) {
  const [imgError, setImgError] = useState(false);
  const cat = getCategoryStyle(event.category);

  const posterSrc = !imgError && (event.posterUrl || event.poster || event.bannerUrl || event.banner);

  return (
    <div
      onClick={() => onClick(event._id || event.id)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer border border-white/10 bg-[#0d2626] hover:border-[#00ff88]/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#00ff88]/10 flex flex-col"
    >
      {/* Poster / Placeholder */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-gradient-to-br from-[#0a1f1f] to-[#0d3333] flex-shrink-0">
        {posterSrc ? (
          <img
            src={posterSrc}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
            <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center">
              <Calendar size={28} className="text-[#00ff88]/60" />
            </div>
            <span className="text-gray-500 text-xs text-center line-clamp-2">{event.title}</span>
          </div>
        )}

        {/* Mode badge top-right */}
        <div className="absolute top-3 right-3">
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border backdrop-blur-sm ${
            event.mode === 'ONLINE'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}>
            {event.mode === 'ONLINE' ? '🌐 Online' : '📍 Offline'}
          </span>
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d2626] via-transparent to-transparent opacity-80" />
      </div>

      {/* Info section */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Category */}
        <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
          {event.category || 'EVENT'}
        </span>

        {/* Title */}
        <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-[#00ff88] transition-colors duration-300">
          {event.title}
        </h3>

        {/* Subtitle */}
        {event.subtitle && (
          <p className="text-gray-400 text-xs line-clamp-1">{event.subtitle}</p>
        )}

        {/* Date */}
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-auto pt-2 border-t border-white/5">
          <Calendar size={11} />
          <span>{formatDate(event.startDate)}</span>
        </div>
      </div>

      {/* Hover glow border */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-[#00ff88]/0 group-hover:ring-[#00ff88]/30 transition-all duration-300 pointer-events-none" />
    </div>
  );
}

/* ─── Skeleton loader card ────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/5 bg-[#0d2626] animate-pulse">
      <div className="w-full aspect-[3/4] bg-[#1a4d4d]/30" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 bg-[#1a4d4d]/40 rounded-full" />
        <div className="h-4 w-full bg-[#1a4d4d]/40 rounded" />
        <div className="h-3 w-3/4 bg-[#1a4d4d]/30 rounded" />
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function EventsPage() {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  /* Fetch events on mount */
  useEffect(() => {
    setLoading(true);
    eventsApi.getAll({ limit: 100 })
      .then(data => {
        // API may return { events, total } or a raw array
        const list = Array.isArray(data) ? data : (data?.events ?? []);
        setAllEvents(list);
        setError('');
      })
      .catch(err => {
        setError(err.message || 'Failed to load events. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  /* Derive category list */
  const categories = useMemo(() => {
    const set = new Set(allEvents.map(e => e.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [allEvents]);

  /* Filter events */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allEvents.filter(e => {
      const matchesSearch = !q
        || (e.title ?? '').toLowerCase().includes(q)
        || (e.subtitle ?? '').toLowerCase().includes(q)
        || (e.category ?? '').toLowerCase().includes(q)
        || (e.description ?? '').toLowerCase().includes(q);
      const matchesCat = activeCategory === 'ALL' || e.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [allEvents, searchQuery, activeCategory]);

  const handleCardClick = (id) => navigate(`/event/${id}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071515] via-[#0a1f1f] to-[#071515]">
      <Header />

      {/* Page hero */}
      <div className="pt-32 pb-10 px-6 text-center">
        <span className="inline-block text-[#00ff88] text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 bg-[#00ff88]/10 rounded-full border border-[#00ff88]/20">
          Discover Events
        </span>
        <h1 className="text-white text-4xl md:text-5xl font-bold mb-3">
          Explore <span className="text-[#00ff88]">Events</span>
        </h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Browse workshops, hackathons, seminars and more — and register in seconds.
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="sticky top-[72px] z-30 bg-gradient-to-b from-[#071515]/95 to-transparent backdrop-blur-md pb-4 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events by name, category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d2626] border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-2.5 pl-10 pr-10 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category pills — horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-full border transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-[#00ff88] text-[#071515] border-[#00ff88]'
                    : 'bg-transparent text-gray-400 border-[#1a4d4d] hover:border-[#00ff88]/50 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content area */}
      <main className="max-w-7xl mx-auto px-6 pb-20 mt-6">

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 px-5 py-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-sm mb-8">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto underline text-red-300 hover:text-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Results summary */}
        {!loading && !error && (
          <div className="flex items-center justify-between mb-5">
            <p className="text-gray-400 text-sm">
              {filtered.length === 0
                ? 'No events found'
                : `${filtered.length} event${filtered.length !== 1 ? 's' : ''} found`}
              {searchQuery && <span className="text-[#00ff88]"> for "{searchQuery}"</span>}
            </p>
            {(searchQuery || activeCategory !== 'ALL') && (
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
                className="text-xs text-gray-400 hover:text-[#00ff88] transition-colors flex items-center gap-1"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* Event grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map(event => (
              <EventCard
                key={event._id || event.id}
                event={event}
                onClick={handleCardClick}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-full bg-[#00ff88]/5 border border-[#00ff88]/10 flex items-center justify-center">
              <Tag size={32} className="text-[#00ff88]/30" />
            </div>
            <p className="text-gray-400 text-sm">No events match your search.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
              className="text-xs text-[#00ff88] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
