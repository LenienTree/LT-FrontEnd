import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, SlidersHorizontal, Calendar, MapPin, Award, Users, RefreshCw } from "lucide-react";
import { events } from "../../services/api";
import Header from "../layout/Header";
import Footer from "../layout/Footer";

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // States for search and filter controls
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "ALL");
  const [mode, setMode] = useState(searchParams.get("mode") || "ALL");
  const [isPaid, setIsPaid] = useState(searchParams.get("isPaid") || "ALL");
  const [status, setStatus] = useState(searchParams.get("status") || "ALL");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

  // Fetch events when filters/query/page changes
  useEffect(() => {
    fetchFilteredEvents();
  }, [category, mode, isPaid, status, page, searchParams]);

  const fetchFilteredEvents = async () => {
    setLoading(true);
    try {
      const apiParams = {
        page,
        limit: 9,
      };

      const queryParam = searchParams.get("search");
      if (queryParam) apiParams.search = queryParam;
      if (category !== "ALL") apiParams.category = category;
      if (mode !== "ALL") apiParams.mode = mode;
      if (status !== "ALL") apiParams.status = status;
      if (isPaid !== "ALL") {
        apiParams.isPaid = isPaid === "PAID" ? "true" : "false";
      }

      const response = await events.getAll(apiParams);
      const list = response?.events || (Array.isArray(response) ? response : []);
      setEventsList(list);
      setTotal(response?.pagination?.total || list.length);
      setTotalPages(response?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load explore events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync state if URL query param changes
  useEffect(() => {
    const urlQuery = searchParams.get("search") || "";
    setSearchQuery(urlQuery);
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set("search", searchQuery.trim());
    } else {
      newParams.delete("search");
    }
    newParams.set("page", "1");
    setPage(1);
    setSearchParams(newParams);
  };

  const handleFilterChange = (filterType, value) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", "1");
    setPage(1);

    if (filterType === "category") {
      setCategory(value);
      if (value !== "ALL") newParams.set("category", value);
      else newParams.delete("category");
    } else if (filterType === "mode") {
      setMode(value);
      if (value !== "ALL") newParams.set("mode", value);
      else newParams.delete("mode");
    } else if (filterType === "isPaid") {
      setIsPaid(value);
      if (value !== "ALL") newParams.set("isPaid", value);
      else newParams.delete("isPaid");
    } else if (filterType === "status") {
      setStatus(value);
      if (value !== "ALL") newParams.set("status", value);
      else newParams.delete("status");
    }

    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setPage(newPage);
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategory("ALL");
    setMode("ALL");
    setIsPaid("ALL");
    setStatus("ALL");
    setPage(1);
    setSearchParams({});
  };

  const categories = ["ALL", "HACKATHON", "IDEATHON", "WEBINAR", "QUIZ", "WORKSHOP", "OTHER"];

  return (
    <div className="min-h-screen bg-bgColor flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-6 pt-28 pb-16">
        {/* Page Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Explore <span className="text-[#9AE600]">Events</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            Discover hackathons, webinars, workshops and more organized by dynamic communities.
          </p>
        </div>

        {/* Search & Action Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#9AE600]" />
                Filters
              </h2>
              <button
                onClick={resetFilters}
                className="text-xs text-[#9AE600] hover:text-[#b4f033] transition-colors flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                Reset all
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleFilterChange("category", cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      category === cat
                        ? "bg-[#9AE600] border-[#9AE600] text-black"
                        : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {cat === "ALL" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Filter */}
            <div className="mb-6">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">
                Event Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["ALL", "ONLINE", "OFFLINE"].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleFilterChange("mode", m)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold text-center transition-all border ${
                      mode === m
                        ? "bg-[#9AE600] border-[#9AE600] text-black"
                        : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {m === "ALL" ? "All" : m.charAt(0) + m.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">
                Pricing
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["ALL", "FREE", "PAID"].map((p) => (
                  <button
                    key={p}
                    onClick={() => handleFilterChange("isPaid", p)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold text-center transition-all border ${
                      isPaid === p
                        ? "bg-[#9AE600] border-[#9AE600] text-black"
                        : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {p === "ALL" ? "All" : p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="mb-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">
                Timeline
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["ALL", "UPCOMING", "RUNNING", "PAST"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleFilterChange("status", s)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold text-center transition-all border ${
                      status === s
                        ? "bg-[#9AE600] border-[#9AE600] text-black"
                        : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="relative mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, description or organizer..."
                className="w-full pl-12 pr-28 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-[#9AE600] focus:bg-white/10 transition-all"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#9AE600] text-black text-xs font-bold rounded-xl hover:bg-[#85cc00] transition-colors"
              >
                Search
              </button>
            </form>

            {/* Events display */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-96 rounded-3xl bg-white/5 border border-white/10 p-5 flex flex-col justify-between animate-pulse"
                  >
                    <div className="w-full h-40 bg-white/10 rounded-2xl mb-4" />
                    <div className="space-y-3 flex-grow">
                      <div className="h-4 bg-white/10 rounded w-1/3" />
                      <div className="h-6 bg-white/10 rounded w-5/6" />
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                    <div className="h-10 bg-white/10 rounded-xl mt-4 w-full" />
                  </div>
                ))}
              </div>
            ) : eventsList.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-50" />
                <h3 className="text-lg font-bold text-white mb-2">No Events Found</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  We couldn't find any events matching your selected search query or filter configuration. Try resetting your filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-6 px-6 py-2.5 bg-[#9AE600] text-black text-sm font-bold rounded-full hover:bg-[#85cc00] transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventsList.map((event) => (
                    <div
                      key={event.id}
                      className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 hover:bg-white/10 transition-all duration-300 flex flex-col h-full shadow-lg"
                    >
                      {/* Banner Image */}
                      <div className="relative aspect-[16/9] overflow-hidden bg-black/20">
                        {event.bannerImage ? (
                          <img
                            src={event.bannerImage}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0f2427] to-[#1a383d] text-gray-500 text-xs">
                            No Banner Available
                          </div>
                        )}
                        <span className="absolute top-3 right-3 px-2.5 py-1 text-[10px] uppercase font-bold rounded-full bg-black/60 backdrop-blur-md text-[#9AE600] border border-[#9AE600]/30 tracking-wider">
                          {event.category}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-2.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#9AE600]" />
                            {new Date(event.startDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#9AE600]" />
                            {event.mode === "ONLINE" ? "Online" : "Venue"}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white line-clamp-1 mb-1 group-hover:text-[#9AE600] transition-colors">
                          {event.title}
                        </h3>

                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed flex-grow">
                          {event.subtitle || event.description}
                        </p>

                        {/* Event Details Footer */}
                        <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between text-xs text-gray-300">
                          {event.prizeAmount ? (
                            <span className="flex items-center gap-1.5 font-bold text-[#9AE600]">
                              <Award className="w-4 h-4 text-[#9AE600]" />
                              {event.prizeType === "CASH" ? `₹${event.prizeAmount}` : "Prizes"}
                            </span>
                          ) : (
                            <span className="text-gray-500">No Prize</span>
                          )}

                          <span className="flex items-center gap-1 text-gray-400">
                            <Users className="w-3.5 h-3.5" />
                            {event._count?.registrations ?? 0} registered
                          </span>
                        </div>

                        <Link
                          to={`/event/${event.id}`}
                          className="w-full mt-4 py-2.5 text-center text-xs font-bold text-black bg-[#9AE600] group-hover:bg-[#a9f50f] rounded-xl transition-all shadow-md block"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      disabled={page === 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all"
                    >
                      Prev
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          page === i + 1
                            ? "bg-[#9AE600] text-black"
                            : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={page === totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
