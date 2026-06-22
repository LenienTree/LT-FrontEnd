import React, { useState, useEffect, useRef } from "react";
import { Search, Calendar, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { events } from "../../services/api";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with a debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await events.getAll({ search: query, limit: 5 });
        // Since getAll wraps paginated events in { events, pagination } as per backend response,
        // let's check structure.
        // Wait, standard backend events.getAll response is { events, pagination } or array.
        // Let's assume response.events or response.
        const list = response?.events || (Array.isArray(response) ? response : []);
        setSuggestions(list);
      } catch (err) {
        console.error("Search fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/explore?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (eventId) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/event/${eventId}`);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
  };

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search hackathons, webinars..."
          className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-[#9AE600] focus:bg-white/10 transition-all duration-200"
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Suggestion Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#1b2b30]/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden z-50">
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-gray-400">
                <div className="w-4 h-4 border-2 border-white/30 border-t-[#9AE600] rounded-full animate-spin mx-auto mb-2" />
                Searching events...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No events found matching "{query}"
              </div>
            ) : (
              <div className="py-1">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#9AE600]/80 tracking-wider">
                  Matches
                </div>
                {suggestions.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleSuggestionClick(event.id)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-xs font-semibold text-white truncate">
                        {event.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400">
                        <span className="capitalize">{event.category.toLowerCase()}</span>
                        <span>•</span>
                        <span>{new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  </button>
                ))}
                <button
                  onClick={handleSubmit}
                  className="w-full px-4 py-2 text-center text-xs text-[#9AE600] hover:text-[#b4f033] font-semibold hover:bg-white/5 transition-all border-t border-white/5"
                >
                  See all results
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
