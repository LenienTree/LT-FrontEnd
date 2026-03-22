import React, { useState } from "react";
import Header from "../components/Header";
import { Search } from "lucide-react";
import Footer from "../components/Footer";
import PublishEventCard from "../components/PublishEventCard";
import OrganizeEventCTA from "../components/OrganizeEventCTA";

export default function CalenderPage() {
    const [currentDate] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    // Placeholder event data
    const events = [
        { id: 1, title: "Evoke ", type: "Ideathon", image: "./events/evoke.png", color: "bg-red-600" },
        { id: 2, title: "Girlathon", type: "Hackathon", image: "./events/girlathon.png", color: "bg-purple-600" },
        { id: 3, title: "Hack-Finity", type: "Hackathon", image: "./events/hack-finity-1.png", color: "bg-red-500" },
        { id: 4, title: "Hack-Finity", type: "Hackathon", image: "./events/hack-finity-2.png", color: "bg-red-500" },
        { id: 5, title: "Line Following Robot", type: "Hackathon", image: "./events/line-following-robot.png", color: "bg-green-700" },
        { id: 6, title: "Pen Testing", type: "Conclave", image: "./events/pen-testing.png", color: "bg-gray-900" },
        { id: 7, title: "Prime", type: "Webinar", image: "./events/prime.png", color: "bg-teal-600" },
        { id: 8, title: "Prime Merch", type: "Ideathon", image: "./events/prime-merch.png", color: "bg-cyan-600" },
    ];

    const filterButtons = [
        { name: "All", color: "bg-[#9AE600]" },
        { name: "Hackathon", color: "bg-white" },
        { name: "Ideathon", color: "bg-white" },
        { name: "Conclave", color: "bg-white" },
        { name: "Webinar", color: "bg-white" },
    ];

    const filteredEvents = events.filter(event => {
        const matchesFilter = selectedFilter === "All" || event.type === selectedFilter;
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
        const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
        const days = [];

        const getStaticEvents = (day) => {
            const eventPatterns = {
                1: [], 2: ['hackathon', 'ideathon'], 3: ['conclave'], 4: ['ideathon', 'webinar'],
                5: [], 6: ['hackathon'], 7: ['conclave', 'ideathon'], 8: [],
                9: ['webinar', 'hackathon', 'ideathon'], 10: [], 11: ['ideathon', 'conclave'],
                12: ['hackathon', 'webinar'], 13: [], 14: ['conclave', 'ideathon'], 15: [],
                16: ['hackathon', 'webinar'], 17: ['ideathon', 'conclave', 'hackathon'], 18: [],
                19: ['webinar', 'hackathon'], 20: ['ideathon'], 21: [],
                22: ['conclave', 'hackathon'], 23: ['hackathon', 'webinar', 'ideathon'],
                24: ['conclave', 'webinar'], 25: ['ideathon', 'hackathon'],
                26: ['hackathon', 'conclave'], 27: ['ideathon', 'webinar'], 28: [],
                29: ['webinar', 'hackathon'], 30: ['conclave', 'ideathon'],
                31: ['hackathon', 'webinar', 'ideathon']
            };

            const events = eventPatterns[day] || [];
            return events.map(type => {
                switch (type) {
                    case 'hackathon': return 'bg-blue-500';
                    case 'ideathon': return 'bg-yellow-500';
                    case 'conclave': return 'bg-red-500';
                    case 'webinar': return 'bg-purple-500';
                    default: return 'bg-gray-500';
                }
            });
        };

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday =
                day === currentDate.getDate() &&
                selectedMonth === currentDate.getMonth() &&
                selectedYear === currentDate.getFullYear();

            const events = getStaticEvents(day);

            days.push(
                <div key={day} className="relative flex flex-col items-center p-2">
                    {events.length > 0 && (
                        <div className="flex w-full h-10 mb-1">
                            {events.map((color, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2 sm:h-2 ${color}`}
                                    style={{ width: `${100 / events.length}%` }}
                                />
                            ))}
                        </div>
                    )}
                    <span
                        className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full text-sm sm:text-base md:text-lg font-medium transition-all ${isToday
                            ? "bg-[#9AE600] text-slate-900 font-bold ring-4 ring-[#9AE600]/30"
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

    return (
        <div className="min-h-screen bg-[#022F2E]" style={{
            backgroundImage: `url("/vectorhome2.png")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
        }}>
            <div className="p-20">
                <Header />
            </div>

            {/* Publish Event Card */}

            {/* Calendar Card */}
            <div className="w-full max-w-5xl mx-auto bg-[#0D3838]/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border-4 border-[#9AE600] shadow-2xl shadow-[#9AE600]/20 mb-8">
                <div className="flex mt-10 justify-between items-center mb-6 sm:mb-8">
                    <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                        {monthNames[selectedMonth]} {selectedYear}
                    </h4>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => {
                                if (selectedMonth === 0) {
                                    setSelectedMonth(11);
                                    setSelectedYear(selectedYear - 1);
                                } else {
                                    setSelectedMonth(selectedMonth - 1);
                                }
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
                                if (selectedMonth === 11) {
                                    setSelectedMonth(0);
                                    setSelectedYear(selectedYear + 1);
                                } else {
                                    setSelectedMonth(selectedMonth + 1);
                                }
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
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                        <div key={day} className="text-white/60 text-sm sm:text-base md:text-lg py-2 sm:py-3">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2 sm:gap-3">{renderCalendar()}</div>
            </div>

            {/* Event Legend */}
            <div className="max-w-5xl mx-auto bg-[#0D3838]/80 backdrop-blur-lg rounded-2xl p-6 border-2 border-[#9AE600]/50">
                <h3 className="text-xl font-bold text-white mb-4">Event Types</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-white/90">Hackathon</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-white/90">Ideathon</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-white/90">Conclave</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <span className="text-white/90">Webinar</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pt-32 pb-16">
                <div className="max-w-7xl mx-auto">
                    {/* Search Bar */}
                    <div className="mb-8">
                        <div className="relative max-w-4xl mx-auto">
                            <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-lg">
                                <div className="pl-4 pr-2">
                                    <Search className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search for events"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 py-3 px-2 text-gray-700 placeholder-gray-400 focus:outline-none"
                                />
                                <button className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="mb-8 flex flex-wrap justify-center gap-3">
                        {filterButtons.map((filter) => (
                            <button
                                key={filter.name}
                                onClick={() => setSelectedFilter(filter.name)}
                                className={`px-8 py-2.5 rounded-full font-medium transition-all ${selectedFilter === filter.name
                                    ? "bg-[#9AE600] text-black shadow-lg scale-105"
                                    : "bg-white text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                {filter.name}
                            </button>
                        ))}
                    </div>

                    {/* Event Collage - Masonry Layout */}
                    <div className="mb-12">
                        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                            {filteredEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="break-inside-avoid mb-4"
                                >
                                    <div className={`${event.color} rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer`}>
                                        <div className="relative">
                                            <img
                                                src={event.image}
                                                alt={event.title}
                                                className="w-full h-48 object-cover opacity-90"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h3 className="text-white font-bold text-lg">{event.title}</h3>
                                                <p className="text-white/80 text-sm">{event.type}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <PublishEventCard />
                    <div className="mb-12">
                        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                            {filteredEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="break-inside-avoid mb-4"
                                >
                                    <div className={`${event.color} rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer`}>
                                        <div className="relative">
                                            <img
                                                src={event.image}
                                                alt={event.title}
                                                className="w-full h-48 object-cover opacity-90"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h3 className="text-white font-bold text-lg">{event.title}</h3>
                                                <p className="text-white/80 text-sm">{event.type}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>



                </div>
            </div>

            {/* Organize Event CTA */}
            <OrganizeEventCTA />
            <Footer />
        </div>
    );
}
