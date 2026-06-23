import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GrowthChart from "../animations/GrowthChart";
import AnimatedBadge from "../animations/AnimateRibbon";
import ContactPage from "../ContactPage";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { events as eventsApi, homepage as homepageApi } from "../../services/api";
import { Link } from "react-router-dom";
import { CalendarDays, X } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

import Logo from "./Logo";
import { dummyEventsData, TARGET_LOCATION } from "./HomeConstants";
import CollaborationEventCard from "./CollaborationEventCard";
import Wave from "./Wave";
const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [sections, setSections] = useState([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState("HACKATHON");
  const [selectedDayPopover, setSelectedDayPopover] = useState(null);

  // Default/Fallback homepage configurator values
  const DEFAULT_HERO_SLIDES = [
    "./Hero/1.png",
    "./Hero/2.png",
    "./Hero/3.png",
    "./Hero/4.png",
    "./Hero/5.png"
  ];

  const DEFAULT_COMMUNITY_IMAGES = [
    "/community/comm1.png",
    "/community/comm2.png",
    "/community/comm3.png",
    "/community/comm4.jpeg",
    "/community/comm5.jpeg",
    "/community/comm6.jpeg",
  ];

  const DEFAULT_TESTIMONIALS = [
    {
      name: "Abdul Samad",
      avatar: "/testimonial/abdul-samad.jpg",
      avatarUrl: "/testimonial/abdul-samad.jpg",
      badge: "A",
      role: "CEO, Appetite Studio",
      quote: "Hack for Good was a great initiative to support impactful ideas. Augustine was supportive throughout the event from the very beginning and helped us with volunteer coordination during the hackathon. Wishing Augustine and Lenient Tree the best for more such community-driven events ahead.",
      link: "https://www.linkedin.com/in/4samad?utm_source=share_via&utm_content=profile&utm_medium=member_android"
    },
    {
      name: "Ray Podder",
      avatar: "/testimonial/ray-podder.jpeg",
      avatarUrl: "/testimonial/ray-podder.jpeg",
      badge: "O",
      role: "One Network Solutions",
      quote: "It was a privilege working with the Lenient Tree. What impressed me wasn't just their talent, but their willingness to question assumptions, think differently, and embrace uncertainty. As AI makes knowledge and execution increasingly abundant, the future belongs to those who can turn insight into impact and imagination into value. The students I met showed exactly that potential. That's the kind of creator mindset the future demands.",
      link: "https://www.linkedin.com/in/raypodder?utm_source=share_via&utm_content=profile&utm_medium=member_android"
    },
    {
      name: "Soham Chatterjee",
      avatar: "/testimonial/soham.jpeg",
      avatarUrl: "/testimonial/soham.jpeg",
      badge: "I",
      role: "IISER Berhampur",
      quote: "It was a privilege to collaborate with Lenient Tree for the successful conduct of the ThinkerRoot Ideathon. We are proud to have supported the initiative as the educational partner from Indian Institute of Science Education and Research Berhampur.",
      link: "https://www.linkedin.com/in/soham-chatterjee-908510256?utm_source=share_via&utm_content=profile&utm_medium=member_android"
    }
  ];

  const [heroSlides, setHeroSlides] = useState(DEFAULT_HERO_SLIDES);
  const [communityImages, setCommunityImages] = useState(DEFAULT_COMMUNITY_IMAGES);
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);

  // Clone 2 items on the left and 2 items on the right for infinite circular appearance
  const extendedCommunityImages = communityImages.length >= 2 ? [
    communityImages[communityImages.length - 2],
    communityImages[communityImages.length - 1],
    ...communityImages,
    communityImages[0],
    communityImages[1],
  ] : [...communityImages];

  const [currentCommunityIndex, setCurrentCommunityIndex] = useState(0); // Index from 0 to 5
  const [slideWidth, setSlideWidth] = useState(46); // Responsive percent width of center slide
  const [isCommunityHovered, setIsCommunityHovered] = useState(false);

  // Responsive slide width logic for community showcase
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setSlideWidth(75); // 75% on mobile
      } else if (window.innerWidth < 1024) {
        setSlideWidth(55); // 55% on tablet
      } else {
        setSlideWidth(46); // 46% on desktop
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Autoplay logic for community showcase (slides through index 0 to 5)
  useEffect(() => {
    if (isCommunityHovered) return;
    const maxIndex = communityImages.length - 1;

    const interval = setInterval(() => {
      setCurrentCommunityIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [isCommunityHovered, communityImages]);

  const nextCommunitySlide = () => {
    const maxIndex = communityImages.length - 1;
    setCurrentCommunityIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevCommunitySlide = () => {
    const maxIndex = communityImages.length - 1;
    setCurrentCommunityIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const extendedTestimonials = testimonials.length >= 2 ? [
    testimonials[testimonials.length - 2],
    testimonials[testimonials.length - 1],
    ...testimonials,
    testimonials[0],
    testimonials[1],
  ] : [...testimonials];

  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [testimonialWidth, setTestimonialWidth] = useState(31.5);
  const [testimonialGap, setTestimonialGap] = useState(24);
  const [isTestimonialHovered, setIsTestimonialHovered] = useState(false);

  // Responsive layout logic for testimonials
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setTestimonialWidth(100);
        setTestimonialGap(0);
      } else if (window.innerWidth < 1024) {
        setTestimonialWidth(48);
        setTestimonialGap(20);
      } else {
        setTestimonialWidth(31.5);
        setTestimonialGap(24);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getTestimonialStartIndex = () => {
    if (window.innerWidth >= 1024) {
      return currentTestimonialIndex + 1;
    } else {
      return currentTestimonialIndex + 2;
    }
  };

  // Autoplay logic for testimonials
  useEffect(() => {
    if (isTestimonialHovered) return;
    const maxIndex = testimonials.length - 1;
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isTestimonialHovered, testimonials]);

  const nextTestimonial = () => {
    const maxIndex = testimonials.length - 1;
    setCurrentTestimonialIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevTestimonial = () => {
    const maxIndex = testimonials.length - 1;
    setCurrentTestimonialIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  // Map database event model to what CollaborationEventCard expects
  const mapDbEventToCard = (event) => {
    // Map categories to colors
    const categoryColors = {
      Hackathon: "blue",
      Ideathon: "red",
      Webinar: "purple",
      Techfest: "green",
      Other: "blue",
    };

    return {
      id: event.id,
      title: event.title,
      category: event.category,
      prizePool:
        event.prizeAmount && event.prizeAmount > 0
          ? `₹ ${event.prizeAmount.toLocaleString()} Prize`
          : event.prizeType === "NONE"
            ? "Free Entry"
            : event.prizeType === "MERCH"
              ? "Official Merch"
              : event.prizeType,
      location: event.venueName || (event.mode === "ONLINE" ? "Virtual" : event.mode),
      format: event.mode === "ONLINE" ? "Online" : "In-person",
      participants: event.maxParticipants ? `${event.maxParticipants}+` : "Open",
      color: categoryColors[event.category] || "green",
      eventPoster: event.eventPoster,
      bannerImage: event.bannerImage,
      isPremium: event.isPremium,
    };
  };

  const [allDbEvents, setAllDbEvents] = useState([]);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setIsLoadingSections(true);
        const data = await homepageApi.get();
        const sorted = (data?.sections || []).sort((a, b) => a.order - b.order);
        setSections(sorted);
      } catch (err) {
        console.error("Failed to fetch homepage sections:", err);
        setSections([
          { id: '1', key: 'hackathons', title: 'Upcoming Hackathons', order: 1 },
          { id: '2', key: 'ideathons', title: 'Upcoming Ideathons', order: 2 },
          { id: '3', key: 'webinars', title: 'Upcoming Webinars', order: 3 },
          { id: '4', key: 'events', title: 'Upcoming Events', order: 4 },
        ]);
      } finally {
        setIsLoadingSections(false);
      }
    };

    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);
        const res = await eventsApi.getAll({ limit: 100 });
        const eventArray = (Array.isArray(res) ? res : res.data) || [];
        setAllDbEvents(eventArray);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    const fetchHomepageConfig = async () => {
      try {
        const data = await homepageApi.get();
        if (data) {
          if (data.banners && data.banners.length > 0) {
            setHeroSlides(data.banners.map(b => b.secureUrl || b.imageUrl));
          }
          if (data.community && data.community.length > 0) {
            setCommunityImages(data.community.map(c => c.secureUrl || c.imageUrl));
          }
          if (data.testimonials && data.testimonials.length > 0) {
            setTestimonials(data.testimonials);
          }
        }
      } catch (error) {
        console.error("Failed to fetch homepage configurator data:", error);
      }
    };

    fetchSections();
    fetchEvents();
    fetchHomepageConfig();
  }, []);

  useEffect(() => {
    console.log("allDbEvents", allDbEvents);
    console.log("isLoadingEvents", isLoadingEvents);
  }, [allDbEvents, isLoadingEvents]);

  const slidesContainerRef = useRef(null);
  const ctaTextRef = useRef(null);
  const ctaSubtitleRef = useRef(null);
  const ctaButtonRef = useRef(null);
  const ctaRef = useRef(null);
  const communityRef = useRef(null);
  const marqueeRef = useRef(null);


  const timelineRef = useRef(null);
  const eventsRef = useRef(null);

  // --- ADDED: Calendar data and functions ---
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const eventColors = ["red", "blue", "purple", "yellow"];
  const eventDaysForCurrentMonth = [5, 8, 14, 22, 27];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  if (marqueeRef.current) {
    gsap.to(marqueeRef.current, {
      x: "-50%",
      duration: 30,
      ease: "none",
      repeat: -1,
    });
  }

  const logos = [
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
    "/muLearn.png",
    "/TinkerHub_Kristu Jyoti.png",
    "/6.png",
  ];

  const getGoogleCalendarLink = (event) => {
    const formatGCalDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };
    const start = formatGCalDate(event.startDate);
    const end = formatGCalDate(event.endDate || event.startDate);
    const text = encodeURIComponent(event.title || "");
    const details = encodeURIComponent(event.subtitle || event.description || "");
    const loc = encodeURIComponent(event.venueName || (event.mode === "ONLINE" ? "Online" : "In-Person"));
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${loc}`;
  };

  const handleDayClick = (day, dayEvents) => {
    setSelectedDayPopover({
      day,
      month: selectedMonth,
      year: selectedYear,
      events: dayEvents,
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    // Map database events to days in the selected month
    const calendarEventMap = {};
    allDbEvents.forEach(e => {
        if (!e.startDate) return;
        const start = new Date(e.startDate);
        const end = e.endDate ? new Date(e.endDate) : start;
        
        const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        
        while (current <= last) {
            if (current.getMonth() === selectedMonth && current.getFullYear() === selectedYear) {
                const day = current.getDate();
                if (!calendarEventMap[day]) calendarEventMap[day] = [];
                calendarEventMap[day].push(e);
            }
            current.setDate(current.getDate() + 1);
        }
    });

    const getDayEvents = (day) => {
      const events = calendarEventMap[day] || [];
      const uniqueEvents = [...new Set(events.map(e => e.category || "Other"))].slice(0, 3);
      return uniqueEvents.map(type => {
        const t = type.toLowerCase();
        if (t.includes('hackathon')) return 'bg-blue-500';
        if (t.includes('ideathon')) return 'bg-yellow-500';
        if (t.includes('techfest')) return 'bg-red-500';
        if (t.includes('webinar')) return 'bg-purple-500';
        return 'bg-gray-500';
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

      const events = getDayEvents(day);
      const dayEvents = calendarEventMap[day] || [];

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day, dayEvents)}
          className={`relative flex flex-col items-center p-2 cursor-pointer transition-all duration-200 hover:bg-white/5 rounded-2xl ${
            dayEvents.length > 0 ? "hover:scale-[1.03]" : ""
          }`}
        >
          {/* Event indicator bars ABOVE the date */}
          {events.length > 0 && (
            <div className="flex w-full mb-1">
              {events.map((color, idx) => (
                <div
                  key={idx}
                  className={`h-1 sm:h-1.5 ${color}`}
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
  // --- END: Calendar data and functions ---

  useEffect(() => {
    if (!slidesContainerRef.current) return;
    const slides = slidesContainerRef.current.children;
    const slideCount = slides.length;

    gsap.set(slides, { autoAlpha: 0, scale: 1.05 });
    gsap.set(slides[0], { autoAlpha: 1, scale: 1 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
    for (let i = 0; i < slideCount; i++) {
      const nextIndex = (i + 1) % slideCount;
      tl.to(
        slides[i],
        { autoAlpha: 0, scale: 1.05, duration: 1.2, ease: "power2.inOut" },
        "+=3.3"
      )
        .to(
          slides[nextIndex],
          { autoAlpha: 1, scale: 1, duration: 1.2, ease: "power2.inOut" },
          "-=1.1"
        )
        .addLabel(`slide${nextIndex}`)
        .call(() => setCurrentSlide(nextIndex), null, ">-1.1");
    }
    timelineRef.current = tl;
    return () => tl.kill();
  }, [heroSlides]);

  const words = ["Techfests", "Ideathon", "Hackathon", "Webinar", "Workshops"];

  // Rotating words effect
  useEffect(() => {
    const textInterval = setInterval(() => {
      const rotatingSpan = ctaTextRef.current?.querySelector(
        ".rotating-words span"
      );
      if (rotatingSpan) {
        gsap.to(rotatingSpan, {
          y: 50,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
            gsap.fromTo(
              rotatingSpan,
              { y: -50, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
            );
          },
        });
      } else {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    }, 2000);
    return () => clearInterval(textInterval);
  }, [words.length]);

  useEffect(() => {
    if (
      !ctaRef.current ||
      !ctaTextRef.current ||
      !ctaSubtitleRef.current ||
      !ctaButtonRef.current
    ) {
      return;
    }

    // Ensure elements are visible by default
    gsap.set(
      [ctaTextRef.current, ctaSubtitleRef.current, ctaButtonRef.current],
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      }
    );

    // --- Community section animation ---
    const communityContent = communityRef.current?.querySelector(".flex-col");
    let communityTween;
    if (communityContent) {
      communityTween = gsap.fromTo(
        communityContent.children,
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: communityRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }

    return () => {
      // Clean up specific community scroll trigger and tween
      if (communityTween) {
        if (communityTween.scrollTrigger) {
          communityTween.scrollTrigger.kill();
        }
        communityTween.kill();
      }
    };
  }, []);

  const goToSlide = (index) => {
    if (!timelineRef.current || !slidesContainerRef.current) return;
    const slides = slidesContainerRef.current.children;
    const slideCount = slides.length;
    timelineRef.current.pause();

    const targetTime = index === 0 ? 0 : timelineRef.current.labels[`slide${index}`];

    for (let i = 0; i < slideCount; i++) {
      gsap.to(slides[i], {
        autoAlpha: i === index ? 1 : 0,
        scale: i === index ? 1 : 1.05,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: i === index ? () => {
          setCurrentSlide(index);
          if (targetTime !== undefined) timelineRef.current.play(targetTime);
        } : undefined,
      });
    }
  };

  useEffect(() => {
    if (!isLoadingEvents && !isLoadingSections) {
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoadingEvents, isLoadingSections]);

  return (
    <div className="min-h-screen bg-[#022F2E] text-white overflow-x-hidden">
      {/* Add CSS for flashing animation */}
      <style>{`
        @keyframes flash {
          0%,
          100% {
            opacity: 1;
            box-shadow: 0 0 20px #64ff00;
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 8px #64ff00;
          }
        }
        .flash-dot {
          animation: flash 1s infinite;
        }
      `}</style>

      <main className="relative bg-[#022F2E]">
        <Header />
        <section className="container mt-20 mx-auto px-3 sm:px-6 pt-4 sm:pt-8 max-w-[1360px] bg-[#022F2E]">
          <div className="relative w-full aspect-[2/1] sm:aspect-[3.4/1] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
            <div
              ref={slidesContainerRef}
              className="relative w-full h-full inset-0 rounded-2xl sm:rounded-3xl overflow-hidden"
            >
              {heroSlides.map((src, index) => (
                <div
                  key={index}
                  className="absolute w-full h-full inset-0 rounded-2xl sm:rounded-3xl overflow-hidden"
                >
                  <img
                    src={src}
                    alt={`Slide ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover sm:object-contain rounded-2xl sm:rounded-3xl"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
            <div className="relative h-full flex flex-col items-center justify-center text-center px-4 sm:px-8 pointer-events-none">
              <div className="mb-4 sm:mb-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-2 sm:mb-4 relative"></div>
              </div>
            </div>
            <div className="absolute bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 z-20 pointer-events-auto">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 hover:scale-125 ${index === currentSlide
                    ? "bg-emerald-400 shadow-lg shadow-emerald-400/50"
                    : "bg-white/50 hover:bg-white/70"
                    }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          ref={eventsRef}
          className="container mt-10 sm:mt-16 md:mt-24 mx-auto px-3 sm:px-6 py-4 sm:py-12 md:py-12 bg-[#022F2E]"
        >
          {/* Section Header */}
          <div className="mb-8 px-2 sm:px-3 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Explore Dynamic <span className="text-[#64F422]">Blueprints</span>
            </h2>
            <p className="text-gray-400 mt-2 text-sm max-w-lg mx-auto">
              Discover upcoming hackathons, ideathons, webinars, techfests and more.
            </p>
          </div>

          {/* Category Filter Tabs — Hackathon & Ideathon are showcased inline;
               other categories route directly to the Explore page filtered by that category. */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-10 px-2">
            {[
              { id: "HACKATHON", label: "Hackathons", inline: true },
              { id: "IDEATHON",  label: "Ideathons",  inline: true },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategoryTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 border ${
                  activeCategoryTab === tab.id
                    ? "bg-[#64F422] border-[#64F422] text-slate-900 shadow-xl shadow-[#64F422]/20"
                    : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
            {/* Other categories → go straight to Explore with a filter */}
            {[
              { id: "Webinar",  label: "Webinars"  },
              { id: "Techfest", label: "Techfests"  },
              { id: "Other",    label: "Others"     },
            ].map((tab) => (
              <Link
                key={tab.id}
                to={`/explore?category=${tab.id}`}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 border bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/10"
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {isLoadingEvents ? (
            // Render loading skeletons
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-[300px]">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="p-2 animate-pulse">
                  <div className="w-full h-[280px] sm:h-[400px] bg-slate-800/50 rounded-3xl border border-white/5"></div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {(() => {
                const filteredEvents = allDbEvents.filter((event) => {
                  // Inline tabs are HACKATHON and IDEATHON only.
                  return event.category?.toUpperCase() === activeCategoryTab;
                });

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-[300px]">
                    {filteredEvents.length > 0 ? (
                      filteredEvents.slice(0, 8).map((event) => {
                        const mappedEvent = mapDbEventToCard(event);
                        return (
                          <Link key={event.id} to={`/event/${event.slug || event.id}`}>
                            <CollaborationEventCard event={mappedEvent} />
                          </Link>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-16 text-center text-white/50 bg-[#041a1a]/40 border border-[#143d3d] rounded-3xl p-8 flex flex-col items-center justify-center gap-3">
                        <CalendarDays className="w-12 h-12 text-[#64F422]/60" />
                        <p className="text-base font-bold text-white/80">No upcoming events in this category.</p>
                        <p className="text-xs text-gray-400">Stay tuned! We are planning exciting events for you.</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Link
              to="/explore"
              className="w-full sm:w-60 text-center bg-[#64F422] text-slate-900 py-3.5 rounded-[12px] text-sm sm:text-base font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-400/40"
            >
              Explore All Blueprints
            </Link>
            <Link
              to="/calender"
              className="w-full sm:w-60 text-center bg-white/5 border border-white/10 text-white py-3.5 rounded-[12px] text-sm sm:text-base font-bold transition-all hover:bg-white/10 hover:border-white/20"
            >
              View Calendar
            </Link>
          </div>
        </section>



        <section
          ref={ctaRef}
          className="w-full relative py-20 sm:py-32 md:py-40 lg:py-48 bg-[#042029] text-center overflow-hidden"
          style={{
            backgroundImage: `url("/vectorhome2.png")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Glowing Top Light Strip */}
          <div className="absolute top-0 inset-x-0 h-[2px] sm:h-[4px] bg-[#9AE600] shadow-[0_0_8px_#9AE600,0_0_15px_rgba(154,230,0,0.8)] z-10" />

          {/* Spotlight Lighting UI */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Volumetric glow coming down from the entire top light strip */}
            <div
              className="absolute top-0 inset-x-0 h-[300px] opacity-30 blur-[40px]"
              style={{
                background: 'linear-gradient(to bottom, #9AE600 0%, rgba(154,230,0,0.2) 40%, transparent 100%)',
              }}
            />

            {/* Ambient neon-green glow at the top center */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[350px] opacity-40 blur-[100px]"
              style={{
                background: 'radial-gradient(ellipse at top, #9AE600 0%, transparent 80%)',
              }}
            />

            {/* Volumetric Spotlight 1 (Left-ish, pointing right-down) */}
            <div 
              className="absolute top-0 left-[30%] sm:left-[35%] -translate-x-1/2 w-[250px] sm:w-[350px] md:w-[450px] h-[350px] sm:h-[500px] md:h-[600px] opacity-40 blur-[40px] sm:blur-[60px] md:blur-[80px]"
              style={{
                transformOrigin: 'top center',
                transform: 'rotate(12deg)',
              }}
            >
              <div 
                className="w-full h-full bg-gradient-to-b from-white via-[#9AE600]/10 via-white/5 to-transparent"
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              />
            </div>

            {/* Volumetric Spotlight 2 (Right-ish, pointing left-down) */}
            <div 
              className="absolute top-0 left-[70%] sm:left-[65%] -translate-x-1/2 w-[250px] sm:w-[350px] md:w-[450px] h-[350px] sm:h-[500px] md:h-[600px] opacity-40 blur-[40px] sm:blur-[60px] md:blur-[80px]"
              style={{
                transformOrigin: 'top center',
                transform: 'rotate(-12deg)',
              }}
            >
              <div 
                className="w-full h-full bg-gradient-to-b from-white via-[#9AE600]/10 via-white/5 to-transparent"
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              />
            </div>

            {/* Bright Source Flares on the top border strip */}
            <div className="absolute top-0 left-[30%] sm:left-[35%] -translate-x-1/2 w-[60px] sm:w-[90px] h-[6px] sm:h-[8px] bg-white rounded-full blur-[2px] opacity-90" />
            <div className="absolute top-0 left-[70%] sm:left-[65%] -translate-x-1/2 w-[60px] sm:w-[90px] h-[6px] sm:h-[8px] bg-white rounded-full blur-[2px] opacity-90" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <h2 ref={ctaTextRef} className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 mt-8 px-2 ">
              Your Gateway to
              <div className="mt-4 sm:mt-6 h-24 sm:h-40 md:h-48 lg:h-56 xl:h-64 overflow-hidden relative">
                <span className="rotating-words block text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem]  italic font-bold text-white/90">
                  <span className="inline-block font-['Fitzgerald-Italic'] animate-scroll-up bg-gradient-to-b from-[#FFFFFF] to-[#999999] bg-clip-text text-transparent pb-2">
                    {words[currentWordIndex]}
                  </span>
                </span>
              </div>
            </h2>
            <p ref={ctaSubtitleRef} className="italic text-lg sm:text-xl md:text-2xl text-white/70 mb-8 sm:mb-12">
              & much more....
            </p>
            <button
              ref={ctaButtonRef}
              className="inline-block bg-[#64F422] text-black font-bold min-w-[250px] sm:min-w-[300px] md:min-w-[350px] px-10 sm:px-12 md:px-16 py-4 sm:py-5 text-base sm:text-lg rounded-[20px] sm:rounded-[28px] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-400/50"
            >
              Know More
            </button>
          </div>
        </section>
        {/* Community Section */}
        <section
          ref={communityRef}
          className="py-12 sm:py-32 relative bg-[#042029]"
          style={{
            backgroundImage: `url("/vectorhome2.png")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Floating Elements */}
          <div className="hidden lg:block absolute top-1/4 left-6 lg:left-24 w-40 sm:w-48 lg:w-80 transform -rotate-12 rounded-lg z-20">

            <AnimatedBadge />
            {/* <img src="/8.png" alt="Ticket" className="w-full" /> */}
          </div>
          <div className="hidden lg:block absolute bottom-80 right-12 lg:right-24 w-32 sm:w-40 lg:w-80 transform rotate-12 z-20">
            <GrowthChart />
            {/* <img src="/7.png" alt="Envelope" className="w-full" /> */}
          </div>
          <div className="hidden lg:block absolute bottom-1/4 left-12 lg:left-24 w-16 h-16 lg:w-24 lg:h-24 bg-yellow-500 transform rotate-45"></div>
          <div className="hidden lg:block absolute top-12 lg:top-24 right-16 lg:right-32 w-16 h-16 lg:w-24 lg:h-24 bg-red-600 transform rotate-12"></div>
          <div className="hidden lg:block absolute bottom-1/5 right-1/4 w-16 h-16 lg:w-24 lg:h-24 bg-blue-500 transform -rotate-45"></div>

          <div className="flex flex-col items-center gap-6 sm:gap-8">
            <div className="w-full sm:w-4/5 md:w-3/5 bg-slate-800/70 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-3 sm:p-4 border-t-2 sm:border-t-4 border-green-400 relative z-10">
              <img
                src="/img1.png"
                alt="About Us Graphic"
                className="w-full rounded-xl sm:rounded-2xl"
              />
            </div>

            <div className="w-full -mt-12 sm:-mt-16 md:-mt-40 max-w-5xl bg-[#042029]/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border-4 border-[#9AE600] shadow-2xl shadow-[#9AE600]/20 relative z-10">
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  {monthNames[selectedMonth]} {selectedYear}
                </h4>
                {/* Navigation Buttons - Left Side */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Previous Month Button */}
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

                  {/* Next Month Button */}
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

                {/* Month and Year - Right Side */}

              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center mb-4">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                  (day) => (
                    <div key={day} className="text-white/60 text-sm sm:text-base md:text-lg py-2 sm:py-3">
                      {day}
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-3">{renderCalendar()}</div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-6 md:gap-8 lg:gap-12 relative z-10 w-full px-4 sm:px-0 mt-12 lg:mt-20">
              {[
                { number: "4000+", label: "Members" },
                { number: "2000+", label: "Students" },
                { number: "20+", label: "Sponsors" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden bg-[#133F3D] rounded-[1.5rem] sm:rounded-[2rem] px-8 sm:px-10 lg:px-14 py-6 sm:py-8 flex items-center justify-center border-2 border-[#64F422]/80 shadow-[0_0_25px_rgba(100,244,34,0.4)] w-full sm:w-auto"
                >
                  {/* Subtle inner shape for depth */}
                  <div className="absolute -left-10 sm:-left-16 top-1/2 transform -translate-y-1/2 w-28 sm:w-36 h-32 sm:h-48 bg-white/5 rounded-[50%] blur-[2px]"></div>

                  <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-light text-white">
                      {stat.number.replace('+', '')}
                    </span>
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-light text-white">
                      +
                    </span>
                    <span className="text-lg sm:text-xl lg:text-2xl text-white font-medium tracking-wide pt-1">
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Community Showcase Section */}
        <section
          ref={communityRef}
          className="py-12 sm:py-32 relative bg-[#042029]"
          style={{
            backgroundImage: `url("/vectorhome2.png")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Background Wavy Pattern */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="wave-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M0 50 Q 25 25, 50 50 T 100 50" stroke="#9AE600" strokeWidth="0.5" fill="none" opacity="0.3" />
                  <path d="M0 60 Q 25 35, 50 60 T 100 60" stroke="#9AE600" strokeWidth="0.5" fill="none" opacity="0.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#wave-pattern)" />
            </svg>
          </div>

          <div className="relative z-10 w-full">
            {/* Section Header */}
            <div className="flex justify-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white px-8 sm:px-12 py-3 sm:py-4 border-4 border-[#9AE600] rounded-full bg-[#0D3838]/80 backdrop-blur-sm shadow-xl shadow-[#9AE600]/20">
                Our Community
              </h2>
            </div>

            {/* Image Gallery - Carousel */}
            <div 
              className="w-full relative group/carousel overflow-hidden py-4"
              onMouseEnter={() => setIsCommunityHovered(true)}
              onMouseLeave={() => setIsCommunityHovered(false)}
            >
              {/* Carousel Track */}
              <div 
                className="flex transition-transform duration-700 ease-out gap-0 items-center"
                style={{
                  transform: `translateX(calc(50% - ${(currentCommunityIndex + 2) * slideWidth}% - ${slideWidth / 2}%))`,
                }}
              >
                {extendedCommunityImages.map((src, index) => {
                  // Map extended array index to original 0-5 index
                  const originalIndex = (index - 2 + 6) % 6;
                  const isActive = originalIndex === currentCommunityIndex;

                  return (
                    <div 
                      key={index} 
                      onClick={() => setCurrentCommunityIndex(originalIndex)}
                      className={`flex-shrink-0 relative transition-all duration-700 ease-out rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer ${
                        isActive 
                          ? "z-10 scale-100 border-4 border-[#9AE600] shadow-2xl shadow-[#9AE600]/30" 
                          : "z-0 scale-90 sm:scale-85 opacity-70 hover:opacity-90"
                      }`}
                      style={{
                        width: `${slideWidth}%`,
                      }}
                    >
                      <div className="w-full h-[200px] sm:h-[300px] md:h-[380px] lg:h-[440px] relative">
                        <img
                          src={src}
                          alt={`Community Event ${originalIndex + 1}`}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        {/* Dark Dimming Overlay for inactive slides */}
                        <div 
                          className={`absolute inset-0 bg-[#042029]/75 backdrop-blur-[0.5px] transition-opacity duration-700 ${
                            isActive ? "opacity-0 pointer-events-none" : "opacity-100"
                          }`}
                        />
                        {/* Subtle Gradient Text Overlay for active slide */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-4 sm:p-6 transition-opacity duration-700 ${
                          isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}>
                          <span className="text-white font-semibold text-sm sm:text-lg tracking-wider">
                            Community Showcase {originalIndex + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prev/Next buttons (visible on desktop hover or touch screen always) */}
              <button
                onClick={prevCommunitySlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0D3838]/85 backdrop-blur-md border-2 border-[#9AE600] flex items-center justify-center text-[#9AE600] hover:bg-[#9AE600] hover:text-[#042029] hover:scale-110 shadow-lg shadow-[#9AE600]/20 active:scale-95 transition-all duration-300 z-20 md:opacity-0 md:group-hover/carousel:opacity-100"
                aria-label="Previous community image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              <button
                onClick={nextCommunitySlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0D3838]/85 backdrop-blur-md border-2 border-[#9AE600] flex items-center justify-center text-[#9AE600] hover:bg-[#9AE600] hover:text-[#042029] hover:scale-110 shadow-lg shadow-[#9AE600]/20 active:scale-95 transition-all duration-300 z-20 md:opacity-0 md:group-hover/carousel:opacity-100"
                aria-label="Next community image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-[#0D3838]/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 z-20">
                {communityImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentCommunityIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentCommunityIndex
                        ? "w-8 bg-[#9AE600] shadow-md shadow-[#9AE600]/40"
                        : "w-2.5 bg-white/40 hover:bg-white/60"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Join Community CTA Section */}
        <section className="relative bg-[#042029] py-16 sm:py-20 md:py-24 overflow-hidden" style={{
          backgroundImage: `url("/vectorhome2.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
          {/* Background Wavy Pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="join-wave-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M0 50 Q 25 25, 50 50 T 100 50" stroke="#9AE600" strokeWidth="0.5" fill="none" opacity="0.3" />
                  <path d="M0 60 Q 25 35, 50 60 T 100 60" stroke="#9AE600" strokeWidth="0.5" fill="none" opacity="0.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#join-wave-pattern)" />
            </svg>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-3xl sm:rounded-[40px] p-8 sm:p-12 md:p-16 shadow-2xl border-4 border-teal-600/50">
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                {/* Left Content */}
                <div className="text-white space-y-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-medium leading-relaxed">
                    Lenient Tree has hosted <span className="font-bold">100+ events</span> across India, driven by one mission:{" "}
                    <span className="font-bold text-white">Connecting students with the industry.</span>
                  </h3>

                  <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed">
                    But we're not just a group of people we're everyone who wants to grow, everyone who wants a change in life, and everyone who refuses to give up on themselves. If you're ready to push yourself and become your best self, you belong here.
                  </p>

                  <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white">
                    Join us, and grow with us.
                  </p>

                  <a
                    href="https://whatsapp.com/channel/0029Vb5XhFRICVfhgaoKYN2A"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full sm:w-auto text-center bg-[#9AE600] hover:bg-[#8BD500] text-black font-bold text-lg sm:text-xl px-12 py-4 sm:py-5 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#9AE600]/30 mt-4"
                  >
                    Join Community
                  </a>
                </div>

                {/* Right Image */}
                <div className="flex justify-center items-center">
                  <img
                    src="/lt-coin.png"
                    alt="Lenient Tree Coin"
                    className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* --- TESTIMONIALS SECTION --- */}
        <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden" style={{ background: "#f0f4ee" }}>

          {/* test-vector-1 — small, top-left of the section */}
          <img
            src="/test-vector-1.png"
            alt=""
            aria-hidden="true"
            className="absolute top-0 left-0 w-48 sm:w-72 md:w-96 pointer-events-none select-none z-0"
            style={{ objectFit: "contain", objectPosition: "top left" }}
          />

          <img
            src="/test-vector-2.png"
            alt=""
            aria-hidden="true"
            className="absolute top-0 right-0 w-full md:w-[75%] h-full object-cover object-right pointer-events-none select-none z-0"
          />
          {/* test-vector-3 — bottom-left of the section */}
          <img
            src="/test-vector-3.png"
            alt=""
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-48 sm:w-72 md:w-96 pointer-events-none select-none z-0"
            style={{ objectFit: "contain", objectPosition: "bottom left" }}
          />

          <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-[1100px]">

            {/* === MAIN TESTIMONIAL CARD === */}



            <div className="relative z-10 flex flex-col md:flex-row min-h-[380px] sm:min-h-[420px]" style={{ gap: 0 }}>

              {/* LEFT: Testimonial content */}
              <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8 z-10">
                <div className="bg-white/50 backdrop-blur-md rounded-3xl p-6 sm:p-8 md:p-10 border border-white/40 h-full flex flex-col justify-center shadow-sm">
                  {/* Large curly quote */}
                  <div className="mb-1">
                    <img src="/quote.png" alt="Quote" className="w-12 sm:w-14 h-auto" />
                  </div>

                  <blockquote className="text-[#1a1a1a] text-base sm:text-lg md:text-xl leading-relaxed font-medium mb-6 sm:mb-8 max-w-md">
                    Lenient Tree is bringing&nbsp; events from all over the world at
                    your fingertips, all you have to do is join and show your
                    skills. We value student's satisfaction and joy more than
                    anything.
                  </blockquote>

                  {/* Author */}
                  <div className="mx-auto">
                    <p className="font-bold text-sm sm:text-base tracking-widest text-[#1a1a1a] uppercase mb-2">
                      Augustine Vadakumcherry
                    </p>
                    {/* LT Badge */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                        {/* <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 20V7H12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 11C13.5 10 16 8.5 17.5 6.5C19 4.5 17.5 3 16 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg> */}
                        <img src="/logo1.png" className="w-4 h-4" alt="" />
                      </div>
                      <p className="text-sm sm:text-base font-medium text-[#333]">Lenient Tree</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Teal panel with person photo */}
              <div className="relative flex-shrink-0 w-full md:w-[320px] lg:w-[380px] flex items-end justify-center p-4 sm:p-6 md:p-8 z-10">
                <div
                  className="relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden flex items-end justify-center"
                  style={{ background: "#0E7A67" }}
                >
                  <img
                    src="/augustine1.png"
                    alt="Augustine Vadakumcherry"
                    className="relative z-10 w-auto h-full max-h-[380px] object-cover object-bottom grayscale"
                    style={{ display: "block" }}
                  />
                </div>
              </div>
            </div>
            {/* === TESTIMONIES LABEL === */}
            <div className="mt-6 sm:mt-8">
              <h2 className="text-[#1a1a1a] text-2xl sm:text-3xl font-bold flex items-center gap-2">
                Testimonies
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="inline-block">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </h2>
            </div>            {/* === THREE INDIVIDUAL TESTIMONIAL CARDS === */}
            <div 
              className="w-full relative group/testimonials overflow-hidden py-8"
              onMouseEnter={() => setIsTestimonialHovered(true)}
              onMouseLeave={() => setIsTestimonialHovered(false)}
            >
              {/* Carousel Track */}
              <div 
                className="flex transition-transform duration-700 ease-out items-stretch"
                style={{
                  gap: `${testimonialGap}px`,
                  transform: `translateX(calc(-${getTestimonialStartIndex() * testimonialWidth}% - ${getTestimonialStartIndex() * testimonialGap}px))`,
                }}
              >
                {extendedTestimonials.map((t, index) => {
                  const originalIndex = (index - 2 + 3) % 3;
                  const isActive = originalIndex === currentTestimonialIndex;

                  return (
                    <div 
                      key={index}
                      onClick={() => setCurrentTestimonialIndex(originalIndex)}
                      className={`flex-shrink-0 bg-[#073434] rounded-2xl p-6 text-white flex flex-col gap-4 relative overflow-hidden transition-all duration-700 ease-out cursor-pointer ${
                        isActive 
                          ? "z-10 scale-100 border-4 border-[#64F422] shadow-2xl shadow-[#64F422]/20" 
                          : "z-0 scale-90 sm:scale-85 opacity-70 hover:opacity-90"
                      }`}
                      style={{
                        width: `${testimonialWidth}%`,
                      }}
                    >
                      {/* Header: large avatar left, name+badge right-aligned */}
                      <div className="flex items-center justify-between gap-4 select-none">
                        <img
                          src={t.avatar || t.avatarUrl}
                          alt={t.name}
                          className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                          draggable={false}
                        />
                        <div className="text-right">
                          {t.link ? (
                            <a 
                              href={t.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="font-bold text-sm tracking-wider hover:text-[#64F422] transition-colors duration-300 hover:underline"
                            >
                              {t.name}
                            </a>
                          ) : (
                            <p className="font-bold text-sm tracking-wider">{t.name}</p>
                          )}
                          <div className="flex items-center justify-end gap-2 mt-1.5">
                            <span className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-gray-300 text-black rounded-full flex-shrink-0">{t.badge}</span>
                            <p className="text-xs text-gray-400">{t.role}</p>
                          </div>
                        </div>
                      </div>
                      {/* Quote + text */}
                      <div className="flex-grow select-none">
                        <p className="text-3xl font-bold text-[#64F422] leading-none mb-2">"</p>
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {t.quote}
                        </p>
                      </div>
                      {/* Dark Overlay for inactive slides */}
                      <div 
                        className={`absolute inset-0 bg-[#073434]/80 backdrop-blur-[0.5px] transition-opacity duration-700 ${
                          isActive ? "opacity-0 pointer-events-none" : "opacity-100"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Prev/Next buttons (visible on desktop hover or touch screen always) */}
              <button
                onClick={prevTestimonial}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0D3838]/85 backdrop-blur-md border-2 border-[#64F422] flex items-center justify-center text-[#64F422] hover:bg-[#64F422] hover:text-[#042029] hover:scale-110 shadow-lg shadow-[#64F422]/20 active:scale-95 transition-all duration-300 z-20 md:opacity-0 md:group-hover/testimonials:opacity-100"
                aria-label="Previous testimonial"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              <button
                onClick={nextTestimonial}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0D3838]/85 backdrop-blur-md border-2 border-[#64F422] flex items-center justify-center text-[#64F422] hover:bg-[#64F422] hover:text-[#042029] hover:scale-110 shadow-lg shadow-[#64F422]/20 active:scale-95 transition-all duration-300 z-20 md:opacity-0 md:group-hover/testimonials:opacity-100"
                aria-label="Next testimonial"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-2 bg-[#0D3838]/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 z-20">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonialIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentTestimonialIndex
                        ? "w-8 bg-[#64F422] shadow-md shadow-[#64F422]/40"
                        : "w-2.5 bg-white/40 hover:bg-white/60"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <ContactPage />
      </main>

      {/* Calendar Day Detail Popover Modal */}
      {selectedDayPopover && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setSelectedDayPopover(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-[#042029]/95 border-2 border-[#9AE600] rounded-3xl p-6 shadow-2xl text-left transform scale-100 transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedDayPopover(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-[#64F422] flex items-center gap-2">
                <CalendarDays className="w-6 h-6" />
                <span>
                  {new Date(
                    selectedDayPopover.year,
                    selectedDayPopover.month,
                    selectedDayPopover.day
                  ).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Events scheduled for this date</p>
            </div>

            {/* Modal Body */}
            <div className="max-h-[350px] overflow-y-auto pr-1 space-y-4">
              {selectedDayPopover.events.length === 0 ? (
                <div className="text-center py-8 text-white/50 flex flex-col items-center justify-center gap-3">
                  <CalendarDays className="w-12 h-12 text-white/20" />
                  <p className="text-sm font-semibold">No events scheduled on this day.</p>
                  <Link
                    to="/explore"
                    onClick={() => setSelectedDayPopover(null)}
                    className="text-xs text-[#9AE600] hover:underline"
                  >
                    Browse other events
                  </Link>
                </div>
              ) : (
                selectedDayPopover.events.map((event) => {
                  return (
                    <div
                      key={event.id}
                      className="bg-slate-800/40 border border-white/5 hover:border-[#9AE600]/30 rounded-2xl p-4 transition-all duration-300 flex flex-col sm:flex-row gap-4"
                    >
                      {/* Thumbnail */}
                      {(event.eventPoster || event.bannerImage) && (
                        <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-slate-900/50 flex-shrink-0">
                          <img
                            src={event.eventPoster || event.bannerImage}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Text details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-1.5 ${
                            event.category === "Hackathon" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                            event.category === "Ideathon" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                            event.category === "Webinar" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                            event.category === "Techfest" ? "bg-red-500/20 text-red-300 border-red-500/30" :
                            "bg-gray-500/20 text-gray-300 border-gray-500/30"
                          }`}>
                            {event.category || "Event"}
                          </span>
                          <h4 className="text-white font-bold text-sm sm:text-base leading-snug hover:text-[#9AE600] transition-colors line-clamp-1">
                            {event.title}
                          </h4>
                          {event.subtitle && (
                            <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{event.subtitle}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-gray-400 text-[11px] mt-2">
                            <span>{event.mode === "ONLINE" ? "🌐 Online" : `📍 ${event.venueName || "In-Person"}`}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
                          <Link
                            to={`/event/${event.id}`}
                            onClick={() => setSelectedDayPopover(null)}
                            className="text-xs bg-[#9AE600] text-slate-900 font-bold px-3 py-1.5 rounded-lg hover:scale-105 transition-all"
                          >
                            Details
                          </Link>
                          <a
                            href={getGoogleCalendarLink(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-1.5 rounded-lg transition-all"
                          >
                            Add to GCal
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- FOOTER SECTION --- */}
      <Footer />
    </div>
  );
};

export default Home;
