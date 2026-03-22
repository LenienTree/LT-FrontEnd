import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./ImageHoverEffect.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GrowthChart from "./animations/GrowthChart";
import AnimatedBadge from "./animations/AnimateRibbon";
import ContactPage from "./ContactPage";
import Header from "./Header";
import Footer from "./Footer";
import { events as eventsApi } from "../services/api";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

// Logo component remains unchanged
const Logo = () => (
  <div className="flex flex-col items-center justify-center h-14 w-auto cursor-pointer">
    <img src="/logo1.png" alt="Logo" width={60} />
    <span className="text-white text-[9px] tracking-tight leading-tight mt-0.5">
    </span>
  </div>
);

// --- FIX #1: Moved constant data outside the component ---
// This array will now be created only once, not on every render.
const dummyEventsData = [
  {
    id: 1,
    title: "Hackathon @TEC20",
    prizePool: "$ 20K Prize Pool",
    location: "TEC Grounds, Rajagiri",
    format: "Online",
    participants: "1099",
    color: "blue",
  },
  {
    id: 2,
    title: "Web3 Conclave",
    prizePool: "$ 50K Prize Pool",
    location: "Bangalore",
    participants: "5000+",
    color: "green",
  },
  {
    id: 3,
    title: "Startup Challenge",
    prizePool: "Ideathon",
    format: "Online",
    participants: "250 Teams",
    color: "red",
  },
  {
    id: 4,
    title: "Game Jam 2024",
    prizePool: "$ 10K Prize Pool",
    location: "Mumbai",
    participants: "800",
    color: "green",
  },
];

const CollaborationEventCard = React.memo(({ event }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const tlRef = useRef(null);
  console.log("Event data", event)

  const getCardColors = (color) => {
    switch (color) {
      case "green":
        return {

          borderColor: "border-green-400",
          glowColor: "shadow-[0_0_20px_rgba(34,197,94,0.8)]",
          logoColor: "text-white",
        };
      case "blue":
        return {

          borderColor: "border-blue-400",
          glowColor: "shadow-[0_0_20px_rgba(59,130,246,0.8)]",
          logoColor: "text-white",
        };
      case "red":
        return {

          borderColor: "border-red-400",
          glowColor: "shadow-[0_0_20px_rgba(239,68,68,0.8)]",
          logoColor: "text-yellow-300",
        };
      default:
        return {

          borderColor: "border-green-400",
          glowColor: "shadow-[0_0_20px_rgba(34,197,94,0.8)]",
          logoColor: "text-white",
        };
    }
  };

  const colors = getCardColors(event.color);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const frontCard = card.querySelector(".front-card");
    const topElements = card.querySelector(".top-elements");
    const bottomCard = card.querySelector(".bottom-card");

    gsap.set(frontCard, { opacity: 1, scale: 1 });
    gsap.set(topElements, { yPercent: -100, opacity: 0 });
    gsap.set(bottomCard, { yPercent: 100, opacity: 0 });
    gsap.set(card, { y: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(card, { y: -8, duration: 0.4, ease: "power2.out" }, 0)
      .to(
        frontCard,
        { opacity: 0, scale: 0.9, duration: 0.3, ease: "power2.out" },
        0
      )
      .to(
        topElements,
        { yPercent: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
        0.15
      )
      .to(
        bottomCard,
        { yPercent: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
        0.15
      );

    tlRef.current = tl;
    return () => tl.kill();
  }, [event.id]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    tlRef.current?.play();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    tlRef.current?.reverse();
  };

  return (
    <div className="p-2 sm:p-3">
      <div
        ref={cardRef}
        className={`relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden cursor-pointer border-2 transition-shadow duration-300 ${colors.bgColor
          } ${isHovered
            ? `${colors.borderColor} ${colors.glowColor}`
            : "border-white/20"
          }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative h-full">
          {/* Front Card */}
          <div className="front-card absolute inset-0 w-full h-full text-center bg-[#0d2f2f]">
            {event.eventPoster ? (
              <img src={event.eventPoster} alt="Event Poster" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-8">
                <div>
                  <p className="text-sm sm:text-lg font-medium text-white/90 mb-4 sm:mb-8">
                    In collaboration with
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className={`text-6xl sm:text-8xl font-bold ${colors.logoColor}`}>
                    <svg
                      className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-2 sm:mb-4"
                      viewBox="0 0 100 100"
                      fill="currentColor"
                    >
                      <path d="M20 20 L20 80 L40 80 L40 60 L50 60 C60 60 65 55 65 45 C65 35 60 30 50 30 L40 30 L40 50 L50 50 C52 50 54 48 54 45 C54 42 52 40 50 40 L30 40 L30 20 Z" />
                      <circle cx="70" cy="25" r="3" fill="currentColor" />
                      <circle cx="75" cy="30" r="2.5" fill="currentColor" />
                      <circle cx="72" cy="35" r="2" fill="currentColor" />
                      <circle cx="78" cy="28" r="2" fill="currentColor" />
                      <circle cx="76" cy="22" r="2" fill="currentColor" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-4 ${colors.logoColor}`}>
                    Lenient Tree
                  </h3>
                  <p className="text-base sm:text-lg text-white/80">Community Partner</p>
                </div>
              </div>
            )}
          </div>
          {/* Top Elements */}
          <div className="top-elements absolute top-0 left-0 right-0 p-3 sm:p-6 flex justify-between items-start pointer-events-none">
            <span className="bg-black/60 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
              {event.prizePool}
            </span>
            <div
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${event.color === "blue"
                ? "bg-blue-400"
                : event.color === "green"
                  ? "bg-green-400"
                  : event.color === "red"
                    ? "bg-red-400"
                    : "bg-green-400"
                }`}
            ></div>
          </div>
          {/* Bottom Card */}
          <div className="bottom-card absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm p-4 sm:p-6 rounded-b-2xl">
            <h4 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-6">
              {event.title}
            </h4>
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {event.location && (
                <div className="flex items-center gap-2 sm:gap-3 text-white/90">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className="text-xs sm:text-sm">: {event.location}</span>
                </div>
              )}
              {event.format && (
                <div className="flex items-center gap-2 sm:gap-3 text-white/90">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      x="2"
                      y="3"
                      width="20"
                      height="14"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <span className="text-xs sm:text-sm">: {event.format}</span>
                </div>
              )}
              <div className="flex items-center gap-2 sm:gap-3 text-white/90">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span className="text-xs sm:text-sm">: {event.participants}</span>
              </div>
            </div>
            <button className="w-full bg-green-400 text-black py-2 sm:py-3 rounded-xl flex justify-center items-center gap-2 font-bold text-sm sm:text-base transition-all hover:bg-green-300">
              <span>Click to know more</span>
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M13 17l5-5-5-5"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// A small helper component for the testimonial background waves
const Wave = ({ className, style }) => (
  <div
    className={`absolute bg-green-200/5 rounded-[100%] ${className}`}
    style={style}
  />
);

const ImageHoverEffect = ({ imageSrc }) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const planeMeshRef = useRef(null);
  const animationFrameRef = useRef(null);

  const mousePositionRef = useRef({ x: 0.5, y: 0.5 });
  const targetMousePositionRef = useRef({ x: 0.5, y: 0.5 });
  const prevPositionRef = useRef({ x: 0.5, y: 0.5 });
  const aberrationIntensityRef = useRef(0.0);
  const easeFactorRef = useRef(0.02);

  const vertexShader = `
      varying vec2 vUv;
      void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
  `;

  const fragmentShader = `
      varying vec2 vUv;
      uniform sampler2D u_texture;    
      uniform vec2 u_mouse;
      uniform vec2 u_prevMouse;
      uniform float u_aberrationIntensity;

      void main() {
          vec2 gridUV = floor(vUv * vec2(20.0, 20.0)) / vec2(20.0, 20.0);
          vec2 centerOfPixel = gridUV + vec2(1.0/20.0, 1.0/20.0);
          
          vec2 mouseDirection = u_mouse - u_prevMouse;
          
          vec2 pixelToMouseDirection = centerOfPixel - u_mouse;
          float pixelDistanceToMouse = length(pixelToMouseDirection);
          float strength = smoothstep(0.3, 0.0, pixelDistanceToMouse);
       
          vec2 uvOffset = strength * - mouseDirection * 0.2;
          vec2 uv = vUv - uvOffset;

          vec4 colorR = texture2D(u_texture, uv + vec2(strength * u_aberrationIntensity * 0.01, 0.0));
          vec4 colorG = texture2D(u_texture, uv);
          vec4 colorB = texture2D(u_texture, uv - vec2(strength * u_aberrationIntensity * 0.01, 0.0));

          gl_FragColor = vec4(colorR.r, colorG.g, colorB.b, 1.0);
      }
  `;

  const resizeHandlerRef = useRef(null);

  const initializeScene = (texture) => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    sceneRef.current = new THREE.Scene();

    cameraRef.current = new THREE.PerspectiveCamera(
      80,
      width / height,
      0.01,
      10
    );
    cameraRef.current.position.z = 1;

    const shaderUniforms = {
      u_mouse: { value: new THREE.Vector2() },
      u_prevMouse: { value: new THREE.Vector2() },
      u_aberrationIntensity: { value: 0.0 },
      u_texture: { value: texture },
    };

    planeMeshRef.current = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 2),
      new THREE.ShaderMaterial({
        uniforms: shaderUniforms,
        vertexShader,
        fragmentShader,
      })
    );

    sceneRef.current.add(planeMeshRef.current);

    rendererRef.current = new THREE.WebGLRenderer({ alpha: true });
    rendererRef.current.setSize(width, height);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);

    // ✅ This ensures the WebGL canvas perfectly fits its parent
    Object.assign(rendererRef.current.domElement.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      position: "absolute",
      inset: "0",
      display: "block",
    });

    containerRef.current.appendChild(rendererRef.current.domElement);

    // ✅ Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current)
        return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      rendererRef.current.setSize(newWidth, newHeight);
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
    };
    resizeHandlerRef.current = handleResize;
    window.addEventListener("resize", handleResize);
  };

  const animateScene = () => {
    if (
      !planeMeshRef.current ||
      !sceneRef.current ||
      !cameraRef.current ||
      !rendererRef.current
    )
      return;

    const mousePosition = mousePositionRef.current;
    const targetMousePosition = targetMousePositionRef.current;
    const prevPosition = prevPositionRef.current;
    const easeFactor = easeFactorRef.current;

    mousePosition.x += (targetMousePosition.x - mousePosition.x) * easeFactor;
    mousePosition.y += (targetMousePosition.y - mousePosition.y) * easeFactor;

    planeMeshRef.current.material.uniforms.u_mouse.value.set(
      mousePosition.x,
      1.0 - mousePosition.y
    );
    planeMeshRef.current.material.uniforms.u_prevMouse.value.set(
      prevPosition.x,
      1.0 - prevPosition.y
    );

    aberrationIntensityRef.current = Math.max(
      0.0,
      aberrationIntensityRef.current - 0.05
    );
    planeMeshRef.current.material.uniforms.u_aberrationIntensity.value =
      aberrationIntensityRef.current;

    rendererRef.current.render(sceneRef.current, cameraRef.current);

    animationFrameRef.current = requestAnimationFrame(animateScene);
  };

  const handleMouseMove = (event) => {
    if (!containerRef.current) return;

    easeFactorRef.current = 0.02;
    const rect = containerRef.current.getBoundingClientRect();
    prevPositionRef.current = { ...targetMousePositionRef.current };

    targetMousePositionRef.current.x = (event.clientX - rect.left) / rect.width;
    targetMousePositionRef.current.y = (event.clientY - rect.top) / rect.height;

    aberrationIntensityRef.current = 1;
  };

  const handleMouseEnter = (event) => {
    if (!containerRef.current) return;

    easeFactorRef.current = 0.02;
    const rect = containerRef.current.getBoundingClientRect();

    mousePositionRef.current.x = targetMousePositionRef.current.x =
      (event.clientX - rect.left) / rect.width;
    mousePositionRef.current.y = targetMousePositionRef.current.y =
      (event.clientY - rect.top) / rect.height;
  };

  const handleMouseLeave = () => {
    easeFactorRef.current = 0.05;
    targetMousePositionRef.current = { ...prevPositionRef.current };
  };

  useEffect(() => {
    if (!imageRef.current) return;

    const texture = new THREE.TextureLoader().load(imageSrc, () => {
      initializeScene(texture);
      animateScene();
    });

    return () => {
      // Cancel animation frame
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);

      // Remove resize event listener
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
      }

      // Remove canvas from DOM
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }

      // Dispose WebGL resources
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }

      if (planeMeshRef.current) {
        planeMeshRef.current.geometry.dispose();
        planeMeshRef.current.material.dispose();
      }

      if (sceneRef.current) {
        sceneRef.current = null;
      }
    };
  }, [imageSrc]);

  return (
    <>
      <div
        ref={containerRef}
        className="image-container"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          ref={imageRef}
          className="hidden-image absolute inset-0 w-full h-full object-cover rounded-3xl"
          src={imageSrc}
          alt="WebGL Effect"
        />
      </div>
    </>
  );
};
const TARGET_LOCATION = {
  name: "Ernakulam",
  coords: {
    lat: 9.9816, // Ernakulam Latitude
    lng: 76.2999, // Ernakulam Longitude
  },
};
const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dbEvents, setDbEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Map database event model to what CollaborationEventCard expects
  const mapDbEventToCard = (event) => {
    // Map categories to colors
    const categoryColors = {
      Hackathon: "blue",
      Ideathon: "red",
      Webinar: "purple",
      Conclave: "green",
      Other: "blue",
    };

    return {
      id: event.id,
      title: event.title,
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
    };
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);
        const res = await eventsApi.getAll({ limit: 4 });

        // Backend returns result of buildPaginatedResult: { data: events[], meta: {} }
        // Our api.js wrapper returns the 'data' field of the response
        const eventArray = (Array.isArray(res) ? res : res.data) || [];

        const mapped = eventArray.map(mapDbEventToCard);
        setDbEvents(mapped);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        // Fallback to dummy data if API fails or returns empty
        setDbEvents(dummyEventsData);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const slidesContainerRef = useRef(null);
  const ctaTextRef = useRef(null);
  const ctaSubtitleRef = useRef(null);
  const ctaButtonRef = useRef(null);
  const ctaRef = useRef(null);
  const communityRef = useRef(null);
  const marqueeRef = useRef(null);

  const heroSlides = [
    "./Hero/1.png",
    "./Hero/2.png",
    "./Hero/3.png",
    "./Hero/4.png",
    "./Hero/5.png"
  ];

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

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    // Static event patterns - predefined and consistent
    const getStaticEvents = (day) => {
      // Static patterns based on day number (won't change on re-render)
      const eventPatterns = {
        1: [],
        2: ['hackathon', 'ideathon'],
        3: ['conclave'],
        4: ['ideathon', 'webinar'],
        5: [],
        6: ['hackathon'],
        7: ['conclave', 'ideathon'],
        8: [],
        9: ['webinar', 'hackathon', 'ideathon'],
        10: [],
        11: ['ideathon', 'conclave'],
        12: ['hackathon', 'webinar'],
        13: [],
        14: ['conclave', 'ideathon'],
        15: [],
        16: ['hackathon', 'webinar'],
        17: ['ideathon', 'conclave', 'hackathon'],
        18: [],
        19: ['webinar', 'hackathon'],
        20: ['ideathon'],
        21: [],
        22: ['conclave', 'hackathon'],
        23: ['hackathon', 'webinar', 'ideathon'],
        24: ['conclave', 'webinar'],
        25: ['ideathon', 'hackathon'],
        26: ['hackathon', 'conclave'],
        27: ['ideathon', 'webinar'],
        28: [],
        29: ['webinar', 'hackathon'],
        30: ['conclave', 'ideathon'],
        31: ['hackathon', 'webinar', 'ideathon']
      };

      const events = eventPatterns[day] || [];
      // Map event types to colors: hackathon=blue, ideathon=yellow, conclave=red, webinar=purple
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
  }, []);

  const words = ["Techfests", "Ideathon", "Hackathon", "Webinar", "Conclaves"];

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

    const ctaTl = gsap.timeline({
      scrollTrigger: {
        trigger: ctaRef.current,
        start: "top 90%",
        end: "bottom 25%",
        toggleActions: "play none none reverse",
      },
    });

    ctaTl
      .from(ctaTextRef.current, {
        y: -80,
        opacity: 0,
        scale: 0.9,
        filter: "blur(10px)",
        duration: 1.8,
        ease: "power3.inOut",
      })
      .from(
        ctaSubtitleRef.current,
        {
          y: -50,
          opacity: 0,
          duration: 1.2,
          ease: "power2.out",
        },
        "-=1.5"
      )
      .from(
        ctaButtonRef.current,
        {
          y: -30,
          opacity: 0,
          scale: 0.8,
          duration: 2,
          ease: "back.out(1.7)",
        },
        "-=1.2"
      );

    // --- ADDED: Community section animation ---
    const communityContent = communityRef.current?.querySelector(".flex-col");
    if (communityContent) {
      gsap.fromTo(
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
    // --- END: Community section animation ---

    return () => {
      // Clean up all ScrollTriggers created in this effect
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      ctaTl.kill();
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

  return (
    <div className="min-h-screen bg-[#022F2E] text-white overflow-x-hidden">
      {/* Add CSS for flashing animation */}
      <style jsx>{`
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
          <div className="relative h-72 sm:h-80 md:h-96 lg:h-[500px]  rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
            <div
              ref={slidesContainerRef}
              className="relative w-full h-full inset-0 rounded-2xl sm:rounded-3xl overflow-hidden"
            >
              {heroSlides.map((src, index) => (
                <div
                  key={index}
                  className="absolute w-full h-full inset-0 rounded-2xl sm:rounded-3xl overflow-hidden"
                >
                  <div className="hidden md:block w-full h-full absolute inset-0">
                    <ImageHoverEffect imageSrc={src} />
                  </div>
                  <img
                    src={src}
                    alt={`Slide ${index + 1}`}
                    className="md:hidden absolute inset-0 w-full h-full object-contain rounded-2xl sm:rounded-3xl"
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
          className="container mt-12 sm:mt-16 md:mt-24 mx-auto px-3 sm:px-6 py-8 sm:py-12 md:py-16 bg-[#022F2E]"
        >
          <div className="mb-6 sm:mb-8 px-2 sm:px-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Upcoming Events</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 min-h-[400px]">
            {isLoadingEvents ? (
              // Loading Skeleton
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="w-full h-80 bg-slate-800/50 rounded-2xl border-2 border-white/5"></div>
                </div>
              ))
            ) : dbEvents.length > 0 ? (
              dbEvents.map((event) => (
                <Link key={event.id} to={`/event/${event.id}`}>
                  <CollaborationEventCard event={event} />
                </Link>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-white/50">
                <p className="text-xl">No upcoming events found.</p>
              </div>
            )}
          </div>
          <a
            href="/"
            className="block w-fit mx-auto mt-8 sm:mt-12 bg-[#64F422] text-slate-900 px-6 sm:px-8 py-2.5 sm:py-3 rounded-[12px] text-sm sm:text-base font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-400/40"
          >
            View Calendar
          </a>
        </section>


        <section
          ref={ctaRef}
          className="w-full relative py-20 sm:py-32 md:py-40 lg:py-48 bg-[#022F2E] text-center overflow-hidden border-t-2 sm:border-t-4 border-green-400"
          style={{
            backgroundImage: `url("/vectorhome2.png")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Spotlight Lighting UI */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] opacity-40 blur-[120px]"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.7) 0%, transparent 80%)',
              }}
            />
          </div>

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 -top-40 sm:-top-80 h-[400px] sm:h-[900px] bg-[radial-gradient(ellipse_at_bottom,_rgba(124,255,79,0.9),_transparent_65%)] blur-3xl opacity-80" />
          </div>
          <div className="hidden md:block absolute bottom-0 left-6 sm:left-12 w-16 h-16 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-500 to-purple-800 transform -skew-x-12 -mb-4 sm:-mb-8"></div>
          <div className="hidden md:block absolute bottom-0 right-6 sm:right-12 w-16 h-16 sm:w-32 sm:h-32 bg-red-600 transform skew-x-12 -mb-4 sm:-mb-8"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <h2 ref={ctaTextRef} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 mt-8 px-2">
              Your Gateway to
              <div className="mt-4 sm:mt-6 h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 overflow-hidden relative">
                <span className="rotating-words block text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-serif italic font-bold text-white/90">
                  <span className="inline-block animate-scroll-up">
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
          className="py-32 mt-2 relative bg-[#022F2E]"
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

            <div className="w-full -mt-12 sm:-mt-16 md:-mt-40 max-w-5xl bg-[#0D3838]/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border-4 border-[#9AE600] shadow-2xl shadow-[#9AE600]/20 relative z-10">
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

            <div className="flex flex-col sm:flex-row md:gap-8 lg:gap-12 relative z-10 w-full px-4 sm:px-0">
              {[
                { number: "4000+", label: "Members" },
                { number: "2000+", label: "Students" },
                { number: "20+", label: "Sponsors" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-slate-800/70 backdrop-blur-lg rounded-2xl mt-20 lg:mt-40 sm:rounded-3xl px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 text-center border-2 border-green-400/90 shadow-2xl shadow-green-400/50 flex-1"
                >
                  <span className="block text-2xl sm:text-3xl font-bold font-mono">
                    {stat.number}
                  </span>
                  <span className="block text-sm sm:text-base text-white/70 mt-1">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Community Showcase Section */}
        <section
          ref={communityRef}
          className="py-32 mt-2 relative bg-[#022F2E]"
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

            {/* Image Gallery - Full Width Static */}
            <div className="w-full flex gap-0">
              {/* Left Image */}
              <div className="w-1/3">
                <img
                  src="/community/comm2.png"
                  alt="Community Event 1"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Center Image */}
              <div className="w-1/3">
                <img
                  src="/community/comm1.png"
                  alt="Community Event 2"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Right Image */}
              <div className="w-1/3">
                <img
                  src="/community/comm3.png"
                  alt="Community Event 3"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Join Community CTA Section */}
        <section className="relative bg-[#022F2E] py-16 sm:py-20 md:py-24 overflow-hidden" style={{
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

                  <button className="w-full sm:w-auto bg-[#9AE600] hover:bg-[#8BD500] text-black font-bold text-lg sm:text-xl px-12 py-4 sm:py-5 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#9AE600]/30 mt-4">
                    Join Community
                  </button>
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


        {/* --- PARTNERS/LOGOS SECTION --- */}
        <section className="relative bg-[#022F2E] py-12 sm:py-16 md:py-20 overflow-hidden" style={{
        }}>
          <div className="relative z-10">
            {/* Section Header */}
            <div className="flex justify-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white px-8 sm:px-12 py-3 sm:py-4 border-4 border-[#9AE600] rounded-full bg-[#0D3838]/80 backdrop-blur-sm shadow-xl shadow-[#9AE600]/20">
                Our Partners
              </h2>
            </div>

            {/* Top Row - Left to Right */}
            <div className="overflow-hidden mb-8 sm:mb-12 bg-[#155B57]">
              <div className="flex animate-scroll-left gap-12 sm:gap-16 md:gap-24">
                {[...logos, ...logos, ...logos, ...logos].map((logo, index) => (
                  <img
                    key={`left-${index}`}
                    src={logo}
                    alt={`Partner Logo ${index}`}
                    className="h-12 sm:h-16 md:h-20 max-w-52 flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity"
                  />
                ))}
              </div>
            </div>

            {/* Bottom Row - Right to Left */}
            <div className="overflow-hidden bg-[#155B57] p-2">
              <div className="flex animate-scroll-right gap-12 sm:gap-16 md:gap-24">
                {[...logos, ...logos, ...logos, ...logos].map((logo, index) => (
                  <img
                    key={`right-${index}`}
                    src={logo}
                    alt={`Partner Logo ${index}`}
                    className="h-12 sm:h-16 md:h-20 max-w-52 flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- TESTIMONIALS SECTION --- */}
        <section className="relative bg-[#022F2E] py-12 sm:py-16 md:py-24 overflow-hidden" style={{
        }}>
          {/* Wavy Background Elements */}
          <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
            <Wave
              style={{
                width: "800px",
                height: "800px",
                top: "-400px",
                left: "-300px",
              }}
            />
            <Wave
              style={{
                width: "750px",
                height: "750px",
                top: "-380px",
                left: "-280px",
              }}
            />
            <Wave
              style={{
                width: "700px",
                height: "700px",
                top: "-360px",
                left: "-240px",
              }}
            />
            <Wave
              style={{
                width: "650px",
                height: "650px",
                top: "-340px",
                left: "-240px",
              }}
            />
            <Wave
              className="bg-green-200/10"
              style={{
                width: "800px",
                height: "800px",
                bottom: "-450px",
                right: "-400px",
              }}
            />
            <Wave
              className="bg-green-200/10"
              style={{
                width: "750px",
                height: "750px",
                bottom: "-430px",
                right: "-380px",
              }}
            />
          </div>

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            {/* Top Section: Large Testimonial & Image */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
              {/* Large Testimonial Card */}
              <div className="bg-gray-100/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg text-slate-800 flex flex-col justify-center">
                <p className="text-4xl sm:text-5xl font-bold">"</p>
                <blockquote className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed my-3 sm:my-4">
                  Lenient Tree is bringing events from all over the world at
                  your fingertips, all you have to do is join and show your
                  skills. We value student's satisfaction and joy more than
                  anything.
                </blockquote>
                <div className="mt-4 sm:mt-6">
                  <p className="font-bold text-base sm:text-lg tracking-wider">
                    AUGUSTINE VADAKUMCHERRY
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black rounded-full flex items-center justify-center">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="sm:w-[14px] sm:h-[14px]"
                      >
                        <path
                          d="M6 20V7H12"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 11C13.5 10 16 8.5 17.5 6.5C19 4.5 17.5 3 16 4.5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-md font-medium text-slate-700">
                      Lenient Tree
                    </p>
                  </div>
                </div>
              </div>

              {/* Person's Image Card - IMPROVED */}
              <div className="bg-teal-600 rounded-2xl flex items-end justify-center overflow-hidden h-64 sm:h-72 md:h-80 lg:h-96 w-full transition-all duration-500 hover:shadow-xl hover:shadow-teal-500/30">
                <img
                  src="https://images.unsplash.com/photo-1741675121661-3ace9d68caba?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Augustine Vadakumcherry"
                  className="w-auto h-full object-cover object-bottom grayscale hover:grayscale-0 transition-all duration-500 hover:scale-105"
                />
              </div>
            </div>

            {/* Bottom Section: Three Small Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Card 1: Mark Zhong */}
              <div className="bg-[#073434] rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      alt="Mark Zhong"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold text-sm">MARK ZHONG</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-gray-300 text-black rounded-full">
                          a
                        </span>
                        <p className="text-xs text-gray-400">aCCUTARY</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-400">"</p>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Hi, I am happy with Lenient Tree and hope to work with them
                  more often.
                </p>
              </div>

              {/* Card 2: Henry Dockson */}
              <div className="bg-[#073434] rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      alt="Henry Dockson"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold text-sm">HENRY DOCKSON</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-gray-500 text-white rounded-full">
                          B
                        </span>
                        <p className="text-xs text-gray-400">Bilency</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-400">"</p>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Lenient Tree is growing everyday, and I want to be part of it.
                  Investment such as this is always a great option in my
                  opinion.
                </p>
              </div>

              {/* Card 3: Arnav Ghani */}
              <div className="bg-[#073434] rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      alt="Arnav Ghani"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold text-sm">ARNAV GHANI</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-gray-300 text-black rounded-full">
                          @
                        </span>
                        <p className="text-xs text-gray-400">Artystry H&C</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-400">"</p>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Creativity is not limited for Lenient Tree, they help us get
                  the best results. It's their ART.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ContactPage />
      </main>

      {/* --- FOOTER SECTION --- */}
      <Footer />
    </div>
  );
};

export default Home;
