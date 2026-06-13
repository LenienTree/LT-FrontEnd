// src/components/About.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import clsx from "clsx";
import Earth from "./Earth";
import Contact from "./Contact";
import { StarsCanvas } from "./canvas";
import { motion } from "framer-motion";
import AnimatedGallery from "./animations/AnimatedGallery";
import Header from "./layout/Header";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Logo component from Home
const Logo = () => (
  <div className="bg-black py-1 px-2 rounded-lg flex flex-col items-center justify-center h-14 w-auto cursor-pointer">
    <img src="/logo.png" alt="Logo" width={20} />
    <span className="text-white text-[9px] tracking-tight leading-tight mt-0.5">
      Lenient Tree
    </span>
  </div>
);

// --- Icon Components ---
const BellIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);
const GridIcon = () => (
  <div className="w-6 h-6 grid grid-cols-2 gap-1">
    <div className="w-2 h-2 bg-[#9ef01a] rounded-sm"></div>
    <div className="w-2 h-2 bg-[#9ef01a] rounded-sm"></div>
    <div className="w-2 h-2 bg-[#9ef01a] rounded-sm"></div>
    <div className="w-2 h-2 bg-[#9ef01a] rounded-sm"></div>
  </div>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" className="w-5 h-5">
    <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
  </svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5">
    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
  </svg>
);
const GitHubIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" className="w-5 h-5">
    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9 26.3 26.2 58 34.4 93.9 36.2 37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5">
    <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z" />
  </svg>
);
const HamburgerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// --- Data Arrays ---
const executiveTeam = [
  {
    name: "Antony Augustine",
    title: "Chief Executive Officer",
    img: "https://i.imgur.com/4hBDY6y.png",
  },
  {
    name: "Antony Augustine",
    title: "Chief Design Officer",
    img: "https://i.imgur.com/4hBDY6y.png",
  },
  {
    name: "Antony Augustine",
    title: "Chief Technical Officer",
    img: "https://i.imgur.com/4hBDY6y.png",
  },
  {
    name: "Antony Augustine",
    title: "Chief Management Officer",
    img: "https://i.imgur.com/4hBDY6y.png",
  },
];
const founder = [
  {
    name: "Antony Augustine",
    title: "Chief Executive Officer",
    img: "https://i.imgur.com/4hBDY6y.png",
  },
];
const mainTeam = [
  {
    name: "MARK ZHONG",
    title: "Senior Designer",
    img: "https://i.imgur.com/jUNh2tK.png",
  },
  {
    name: "HEUGO EUGENE",
    title: "Technical Lead",
    img: "https://i.imgur.com/y1fwp0d.png",
  },
  {
    name: "ARNAV GHANI",
    title: "Graphic Designer",
    img: "https://i.imgur.com/8QpJaQy.png",
  },
  {
    name: "HENRY DOCKSON",
    title: "Marketing Expert",
    img: "https://i.imgur.com/y1fwp0d.png",
  },
  {
    name: "ARNAV GHANI",
    title: "Graphic Designer",
    img: "https://i.imgur.com/8QpJaQy.png",
  },
  {
    name: "MARK ZHONG",
    title: "Senior Designer",
    img: "https://i.imgur.com/jUNh2tK.png",
  },
  {
    name: "ARNAV GHANI",
    title: "Graphic Designer",
    img: "https://i.imgur.com/8QpJaQy.png",
  },
  {
    name: "MARK ZHONG",
    title: "Senior Designer",
    img: "https://i.imgur.com/jUNh2tK.png",
  },
  {
    name: "HENRY DOCKSON",
    title: "Marketing Expert",
    img: "https://i.imgur.com/y1fwp0d.png",
  },
];

// --- Story Content Card (Updated Layout: 1/3 Image, 2/3 Text) ---
const StoryCard = ({ title, content, image, reverse = false }) => {
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    const imageEl = imageRef.current;
    const textEl = textRef.current;

    if (card && imageEl && textEl) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      });

      // Image appears first, then text
      tl.fromTo(
        imageEl,
        { opacity: 0, x: reverse ? 50 : -50, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power2.out" },
      ).fromTo(
        textEl,
        { opacity: 0, x: reverse ? -50 : 50 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" },
        "-=0.4",
      );
    }
  }, [reverse]);

  return (
    <div
      ref={cardRef}
      className={clsx(
        "flex flex-col lg:flex-row gap-6 lg:gap-8 items-start mb-12 max-w-7xl mx-auto",
        { "lg:flex-row-reverse": reverse },
      )}
    >
      {/* Image Content - 1/3 width */}
      <div ref={imageRef} className="w-full lg:w-1/3">
        <div className="bg-gray-800 rounded-3xl overflow-hidden shadow-lg h-64 lg:h-96">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      </div>
      {/* Text Content - 2/3 width */}
      <div ref={textRef} className="w-full lg:w-2/3">
        <div className="bg-white rounded-3xl p-6 lg:p-12 shadow-lg min-h-[250px] lg:min-h-[300px] flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4 lg:mb-6">
            <GridIcon />
            <h3 className="text-xl lg:text-3xl font-bold text-gray-800">
              {title}
            </h3>
          </div>
          <p className="leading-relaxed text-gray-700 text-base lg:text-lg">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Executive Team Card (Standardized Dimensions) ---
const ExecutiveTeamCard = ({ member }) => (
  <div
    className="bg-gradient-to-b from-white/95 via-white/90 to-[#9ef01a]/30 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-center border border-white/20 hover:border-[#9ef01a]/40 transition-all duration-300 transform hover:scale-105 mx-auto"
    style={{ width: "300px", height: "450px", borderRadius: "16px" }}
  >
    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6 inline-block">
      <img
        src="https://images.pexels.com/photos/9604304/pexels-photo-9604304.jpeg?_gl=1*1ip60fo*_ga*MTIwMTM2NTczNi4xNzIyNTI0MTM4*_ga_8JE65Q40S6*czE3NTcyMjkwMDckbzc5JGcxJHQxNzU3MjI5MDI0JGo0MyRsMCRoMA.."
        alt={member.name}
        className="w-32 h-32 md:w-40 md:h-40 rounded-xl object-cover mx-auto"
      />
    </div>
    <h4 className="font-bold text-xl md:text-2xl text-gray-800 mb-2">
      {member.name}
    </h4>
    <p className="text-gray-600 text-base md:text-lg mb-6 md:mb-8">
      {member.title}
    </p>
    <div className="flex justify-center gap-4">
      <a
        href="#"
        aria-label="LinkedIn"
        className="w-10 h-10 bg-gray-300 hover:bg-blue-600 rounded-lg flex items-center justify-center text-gray-600 hover:text-white transition-colors duration-300"
      >
        <LinkedInIcon />
      </a>
      <a
        href="#"
        aria-label="Twitter"
        className="w-10 h-10 bg-gray-300 hover:bg-black rounded-lg flex items-center justify-center text-gray-600 hover:text-white transition-colors duration-300"
      >
        <TwitterIcon />
      </a>
    </div>
  </div>
);

// --- Horizontal Team Card ---
const HorizontalTeamCard = ({ member }) => (
  <div className="bg-gradient-to-r from-white/90 to-white/95 backdrop-blur-sm rounded-3xl p-6 flex items-center gap-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
      <img
        src="/profile.png"
        alt={member.name}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex-grow">
      <h4 className="font-bold text-xl text-gray-800 mb-1">{member.name}</h4>
      <p className="text-gray-600 text-sm mb-4">{member.title}</p>
      <div className="flex gap-3">
        <a
          href="#"
          aria-label="LinkedIn"
          className="text-gray-500 hover:text-blue-600 transition-colors"
        >
          <LinkedInIcon />
        </a>
        <a
          href="#"
          aria-label="GitHub"
          className="text-gray-500 hover:text-gray-800 transition-colors"
        >
          <GitHubIcon />
        </a>
        <a
          href="#"
          aria-label="Twitter"
          className="text-gray-500 hover:text-black transition-colors"
        >
          <TwitterIcon />
        </a>
      </div>
    </div>
  </div>
);

// --- Cursor Blob Component (Hidden on Mobile) ---
const CursorBlob = () => {
  const blobRef = useRef(null);
  useEffect(() => {
    const blob = blobRef.current;
    if (!blob) return;
    gsap.set(blob, { x: -150, y: -150, scale: 0, opacity: 0 });
    const handleMouseMove = (e) => {
      gsap.to(blob, {
        duration: 0.8,
        x: e.clientX - 150,
        y: e.clientY - 150,
        ease: "power2.out",
      });
    };
    const handleMouseEnter = () => {
      gsap.to(blob, {
        duration: 0.5,
        scale: 1,
        opacity: 0.6,
        ease: "back.out(1.7)",
      });
    };
    const handleMouseLeave = () => {
      gsap.to(blob, { duration: 0.3, scale: 0, opacity: 0, ease: "power2.in" });
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);
  return (
    <div
      ref={blobRef}
      className="hidden lg:block fixed w-[300px] h-[300px] pointer-events-none z-30 mix-blend-screen"
      style={{
        background:
          "radial-gradient(circle, rgba(158, 240, 26, 0.4) 0%, rgba(158, 240, 26, 0.2) 30%, rgba(158, 240, 26, 0.1) 60%, transparent 100%)",
        borderRadius: "50%",
        filter: "blur(20px)",
      }}
    />
  );
};

const About = () => {
  const mainRef = useRef(null);
  const earthRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs for scroll animations
  const heroSectionRef = useRef(null);
  const founderSectionRef = useRef(null);
  const [isEarthLoaded, setIsEarthLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const executivesSectionRef = useRef(null);
  const chiefOfficersSectionRef = useRef(null);
  const teamSectionRef = useRef(null);
  const organizeSectionRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsEarthLoaded(true); // Skip loading on mobile
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Existing hover animations
      const cards = gsap.utils.toArray(".hover-card");
      cards.forEach((card) => {
        card.addEventListener("mouseenter", () =>
          gsap.to(card, {
            duration: 0.3,
            y: -5,
            scale: 1.02,
            ease: "power2.out",
          }),
        );
        card.addEventListener("mouseleave", () =>
          gsap.to(card, { duration: 0.3, y: 0, scale: 1, ease: "power2.out" }),
        );
      });

      // Scroll animations for sections
      // Hero section animation
      if (heroSectionRef.current) {
        // gsap.to(earthRef.current, {
        //   opacity: 0.15,
        //   duration: 1,
        //   ease: "power2.out",
        //   scrollTrigger: {
        //     trigger: heroSectionRef.current,
        //     start: "top 80%",
        //     toggleActions: "play none none reverse",
        //   },
        // });
        gsap.fromTo(
          heroSectionRef.current.querySelector("h2"),
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: heroSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
        gsap.fromTo(
          heroSectionRef.current.querySelector("p"),
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: 0.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: heroSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
        gsap.fromTo(
          heroSectionRef.current.querySelector("img"),
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 1,
            delay: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: heroSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      // Founder section animation
      if (founderSectionRef.current) {
        gsap.fromTo(
          founderSectionRef.current.querySelector("h2"),
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: founderSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
        gsap.fromTo(
          founderSectionRef.current.querySelectorAll(".founder-card"),
          { opacity: 0, y: 50, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: 0.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: founderSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      // Executives section animation
      if (executivesSectionRef.current) {
        gsap.fromTo(
          executivesSectionRef.current.querySelector("h2"),
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: executivesSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
        gsap.fromTo(
          executivesSectionRef.current.querySelectorAll(".executive-card"),
          { opacity: 0, y: 50, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.2,
            delay: 0.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: executivesSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      // Chief officers section animation
      if (chiefOfficersSectionRef.current) {
        gsap.fromTo(
          chiefOfficersSectionRef.current.querySelector("h2"),
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: chiefOfficersSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
        gsap.fromTo(
          chiefOfficersSectionRef.current.querySelectorAll(".chief-card"),
          { opacity: 0, y: 50, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.2,
            delay: 0.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: chiefOfficersSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      // Team section animation
      if (teamSectionRef.current) {
        //   gsap.to(earthRef.current, {
        //   opacity: 100,
        //   duration: 1,
        //   ease: "power2.out",
        //   scrollTrigger: {
        //     trigger: teamSectionRef.current,
        //     start: "top 80%",
        //     toggleActions: "play none none reverse",
        //   },
        // });
        gsap.fromTo(
          teamSectionRef.current.querySelector("h2"),
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: teamSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
        gsap.fromTo(
          teamSectionRef.current.querySelectorAll(".team-card"),
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            delay: 0.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: teamSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      // Organize section animation
      if (organizeSectionRef.current) {
        gsap.fromTo(
          organizeSectionRef.current.querySelector("h2"),
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: organizeSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
        gsap.fromTo(
          organizeSectionRef.current.querySelector("p"),
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: 0.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: organizeSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
        gsap.fromTo(
          organizeSectionRef.current.querySelector("button"),
          { opacity: 0, y: 30, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            delay: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: organizeSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }
    }, [mainRef, earthRef]);
    return () => ctx.revert();
  }, []);

  const heroStyle = {
    backgroundImage: `radial-gradient(ellipse at 50% 150%, rgba(158, 240, 26, 0.25) 0%, transparent 50%), url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 1500'%3e%3cdefs%3e%3cpath fill='none' stroke-width='1' stroke-opacity='0.2' stroke='%236fff54' id='a' d='M0-115.5c214.4 0 410.8 40.3 567.4 115.5 156.6 75.2 274.9 181.3 336.1 303.3 61.2 122 65.2 258.1 5.4 384.8-59.8 126.7-163.4 240.3-294.5 321.3-131.1 81-285.8 126.4-444.9 126.4-159.1 0-313.8-45.4-444.9-126.4-131.1-81-234.7-194.6-294.5-321.3-59.8-126.7-55.8-262.8 5.4-384.8 61.2-122 179.5-228.1 336.1-303.3C-410.8-75.2-214.4-115.5 0-115.5Z'/%3e%3c/defs%3e%3cg transform='translate(1000 750)'%3e%3cuse href='%23a' transform='scale(0.96)'/%3e%3cuse href='%23a' transform='scale(0.81)'/%3e%3cuse href='%23a' transform='scale(0.66)'/%3e%3cuse href='%23a' transform='scale(0.51)'/%3e%3cuse href='%23a' transform='scale(0.36)'/%3e%3cuse href='%23a' transform='scale(0.21)'/%3e%3c/g%3e%3c/svg%3e")`,
    backgroundRepeat: "no-repeat, repeat",
    backgroundSize: "150% auto, auto",
    backgroundPosition: "center bottom",
  };

  const navLinkClasses =
    "px-2 py-1 mx-4 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300";
  const activeNavLinkClasses = "bg-[#0B3B3B] text-lime-400 shadow-md";
  const mobileNavLinkClasses =
    "block w-full text-center py-3 text-lg text-gray-200 hover:bg-slate-700/50 rounded-lg transition-colors duration-200";

  return (
    <>
      {!isEarthLoaded && (
        <div className="hidden lg:flex fixed inset-0 z-[100] bg-gradient-to-b from-green-500 to-black items-center justify-center">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-8">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-20 h-20 mx-auto mb-4 animate-pulse"
              />
              <span className="text-white text-2xl font-bold tracking-wide">
                Lenient Tree
              </span>
            </div>

            {/* Animated Spinner */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-[#9ef01a]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#9ef01a] border-t-transparent rounded-full animate-spin"></div>
            </div>

            {/* Loading Text */}
            <p className="text-white text-lg font-medium mb-2">
              Loading Experience...
            </p>
            <p className="text-gray-400 text-sm">Preparing 3D environment</p>

            {/* Loading Bar */}
            <div className="w-64 h-1 bg-gray-700 rounded-full mx-auto mt-6 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#9ef01a] to-[#64F422] rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={earthRef}
        className="hidden lg:block fixed top-[-60px] left-0 w-full h-[108vh] bg-gradient-to-b from-green-500 to-black  overflow-hidden pointer-events-none"
      >
        <StarsCanvas className="z-[45]" />
        <Earth
          scrollRef={[
            heroSectionRef,
            founderSectionRef,
            organizeSectionRef,
            teamSectionRef,
          ]}
          onLoaded={() => setIsEarthLoaded(true)}
        />
      </div>

      <div
        className="min-h-screen bg-gradient-to-b from-green-500 to-black text-white overflow-x-hidden"
        ref={mainRef}
      >
        <CursorBlob />
        <header className="sticky top-0 z-50 bg-[#022F2E]/80 backdrop-blur-lg border-b border-slate-700/50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Logo />

            {/* Hamburger Button - Mobile Only */}
            <button
              className="md:hidden p-2 rounded-full bg-slate-800/60 border border-slate-700/60 hover:bg-slate-700/80"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-[#41c40d]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Desktop Navigation */}
            <nav
              className="hidden md:block bg-slate-800/60 backdrop-blur-sm rounded-full px-8 py-3 border border-slate-700/60 shadow-xl"
              style={{
                boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(255, 255, 255, 0.05), 0 10px 25px rgba(0, 0, 0, 0.2)`,
              }}
            >
              <ul className="flex items-center space-x-2">
                <li>
                  <a
                    href="/"
                    className="px-2 py-1 mx-4 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="/"
                    className="px-2 py-1 mx-4 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300"
                  >
                    Calendar
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className="px-2 py-1 mx-4 rounded-full text-sm font-medium bg-[#0B3B3B] text-[#9ae600] shadow-md transition-all duration-300"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="/"
                    className="px-2 py-1 mx-4 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300"
                  >
                    Leaderboards
                  </a>
                </li>
              </ul>
            </nav>

            {/* Right Section - Always Visible */}
            <div className="hidden md:flex  items-center space-x-3">
              <div className="relative cursor-pointer">
                <svg
                  className="w-7 h-7 text-lime-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-[#1A202C]">
                  3
                </span>
              </div>
              <img
                src="/profile.png"
                alt="Profile"
                className="h-11 w-11 rounded-full border-2 border-slate-600 hover:border-lime-400 transition-all duration-300 cursor-pointer"
              />
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed top-20 left-0 w-full bg-[#022F2E]/95 backdrop-blur-lg border-t border-slate-700/50 z-40 py-4 px-6 animate-in slide-in-from-top-4 duration-300">
              <nav className="flex flex-col space-y-3">
                <a
                  href="/"
                  className="px-4 py-3 rounded-full text-base font-medium bg-[#0B3B3B] text-[#9ae600] shadow-md text-center"
                >
                  Home
                </a>
                <a
                  href="/"
                  className="px-4 py-3 rounded-full text-base font-medium text-gray-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300 text-center"
                >
                  Calendar
                </a>
                <a
                  href="/about"
                  className="px-4 py-3 rounded-full text-base font-medium text-gray-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300 text-center"
                >
                  About
                </a>
                <a
                  href="/"
                  className="px-4 py-3 rounded-full text-base font-medium text-gray-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300 text-center"
                >
                  Leaderboards
                </a>
              </nav>
            </div>
          )}
        </header>

        <main>
          {/* <section
          className="relative flex items-center top-[-50px] md:top-[-100px] z-10 justify-center overflow-hidden"
          style={heroStyle}
        >
          <div className="w-full max-w-[100vw]">
            <img
              className="w-full h-auto object-contain"
              src="/img1.png"
              alt="About Hero"
            />
          </div>
        </section> */}
          <section className="min-h-screen z-20 bg-[#102025] md:bg-transparent relative flex items-center justify-center overflow-hidden">
            {/* Background Lines map or SVG could animate here as well */}
            <div className="absolute inset-0  pointer-events-none" />

            <div className="cursor-default relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center pt-28 pb-40 px-4 text-white/90">
              <div className="space-y-1 text-2xl sm:text-7xl font-medium tracking-wide">
                <h1 className="inline-block align-baseline">
                  <span className="font-semibold text-white">Professional</span>{" "}
                  <span className="text-white/80">event linking</span>
                </h1>
              </div>

              <div className="mt-4 flex items-baseline gap-3 relative">
                <span className="uppercase tracking-[0.35em] text-sm text-white/70 absolute top-3 -left-12">
                  via
                </span>
                <h1 className="text-5xl sm:text-6xl md:text-9xl font-bold tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-50 to-slate-300">
                    Lenient tree
                  </span>
                  {/* green cross accent over the t */}
                </h1>
              </div>

              <div className="mt-6 max-w-xl">
                <h2 className="text-base sm:text-lg md:text-xl font-medium text-white/80">
                  Discover events, track peers, connect anywhere...
                </h2>
              </div>
            </div>

            {/* Top left heading (animated fade-in & up) */}
            {/* <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col items-start mb-6"
              >
                <span className="text-white opacity-100 text-2xl sm:text-3xl font-semibold">
                  Professional
                </span>
                <span className="text-gray-300 text-xl sm:text-2xl font-medium -mt-1">
                  event linking
                </span>
              </motion.div> */}
            {/* Via label (animated fade-in) */}
            {/* <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.28 }}
                className="flex items-center justify-start mb-2"
              >
                <span className="text-white text-lg font-medium mr-2">via</span>
              </motion.div> */}
            {/* Main Title (animated scale and fade-in) */}
            {/* <motion.h1
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.4, type: "spring" }}
                className="text-[3rem] sm:text-[5rem] md:text-[6rem] font-extrabold text-center leading-none bg-gradient-to-b from-[#ebebeb] to-[#757575] bg-clip-text text-transparent drop-shadow-lg mb-6"
              >
                Lenient tree
              </motion.h1> */}
            {/* Subtitle (animated fade-in) */}
            {/* <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-white text-lg sm:text-xl font-medium mt-4"
              >
                Discover events, track peers, connect anywhere...
              </motion.p> */}

            {/* </div> */}
          </section>

          <section
            ref={heroSectionRef}
            className="md:py-16 lg:py-24 bg-[#102025]"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 text-center sm:text-left">
                Lenient Tree and our team
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed  max-w-5xl mx-auto sm:mx-0">
                Lenient Tree is your go-to platform for career growth—offering
                hands-on workshops, portfolio help, hackathon prep, startup
                support, and guidance. We connect students and professionals to
                real-world skills and innovation, making the leap from classroom
                to career smoother, smarter, and more exciting. Learn, build,
                and grow with us!
              </p>
              <div className="w-full ">
                <AnimatedGallery />
                {/* <img
                    src="/ig4.png"
                    alt="The Lenient Tree team"
                    className="w-full h-auto rounded-2xl md:rounded-3xl shadow-2xl"
                  /> */}
              </div>
            </div>
          </section>

          <section className="py-16 lg:py-24 bg-[#102025]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white mb-12 lg:mb-20 tracking-wider">
                OUR STORY
              </h2>
              <StoryCard
                title="Our Aim"
                content="At Lenient Tree, our aim is simple: to empower individuals students, fresh graduates, and working professionals alike to take control of their career journeys by offering meaningful, practical, and innovation-driven learning experiences. We understand that today's world demands more than just a degree. It calls for real-world skills, a creative mindset, and the confidence to take initiative. That's why we've built a platform that bridges the often-wide gap between education and industry expectations."
                image="/ig3.png"
              />
              <StoryCard
                title="Our Story"
                content="At Lenient Tree, our aim is simple: to empower individuals students, fresh graduates, and working professionals alike to take control of their career journeys by offering meaningful, practical, and innovation-driven learning experiences. We understand that today's world demands more than just a degree. It calls for real-world skills, a creative mindset, and the confidence to take initiative. That's why we've built a platform that bridges the often-wide gap between education and industry expectations."
                image="/ig5.png"
                reverse
              />
              <StoryCard
                title="Achievements"
                content="At Lenient Tree, our aim is simple: to empower individuals students, fresh graduates, and working professionals alike to take control of their career journeys by offering meaningful, practical, and innovation-driven learning experiences. We understand that today's world demands more than just a degree. It calls for real-world skills, a creative mindset, and the confidence to take initiative. That's why we've built a platform that bridges the often-wide gap between education and industry expectations."
                image="/ig6.png"
              />
            </div>
          </section>

          <section
            ref={founderSectionRef}
            className="py-16 lg:py-24 bg-[#102025]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white mb-12 lg:mb-20 tracking-wider">
                FOUNDER
              </h2>
              <div className="flex justify-center">
                {founder.map((member, index) => (
                  <div key={index} className="hover-card founder-card">
                    <ExecutiveTeamCard member={member} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            ref={executivesSectionRef}
            className="py-16 lg:py-24 bg-[#102025]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white mb-12 lg:mb-20 tracking-wider">
                EXECUTIVES
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {executiveTeam.map((member, index) => (
                  <div key={index} className="hover-card executive-card">
                    <ExecutiveTeamCard member={member} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            ref={chiefOfficersSectionRef}
            className="py-16 lg:py-24 bg-[#102025]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white mb-12 lg:mb-20 tracking-wider">
                Chief Officers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {executiveTeam.map((member, index) => (
                  <div key={index} className="hover-card chief-card">
                    <ExecutiveTeamCard member={member} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section ref={teamSectionRef} className="py-16 lg:py-24 bg-[#102025]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white mb-12 lg:mb-20 tracking-wider">
                MEET THE TEAM
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mainTeam.map((member, index) => (
                  <div key={index} className="hover-card team-card">
                    <HorizontalTeamCard member={member} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative z-[100]">
            <Contact className="" />
            {/* <StarsCanvas /> */}
          </section>
          {/* Organize Event Section - Extended to fill footer gap */}
          <section
            ref={organizeSectionRef}
            className="py-16 lg:py-24 pb-24 ] bg-white bg-[url('./assets/Vector.png')] relative"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6 sm:mb-8">
                Organize an event
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-10 sm:mb-12 leading-relaxed max-w-3xl mx-auto">
                Organize an event and publish it for maximum views. The more
                views the better the outcome will be. We will help you reach
                your destined audience and do nothing to get more views than any
                other websites.
              </p>
              <button className="bg-[#64F422] hover:bg-[#8efc5c] text-black font-bold py-3 px-8 sm:py-4 sm:px-12 rounded-[24px] text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                ORGANIZE AN EVENT
              </button>
            </div>
            {/* Extended background to fill footer gap */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-white/95"></div>
          </section>
        </main>

        {/* Footer with 24px border radius on top corners */}
        <footer className="relative bg-[#102025] rounded-tl-[24px] rounded-tr-[24px] py-16 lg:py-20 overflow-hidden -mt-6">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-0 pointer-events-none">
            <span
              className="block font-bold text-black/15 select-none"
              style={{
                fontFamily: "monospace",
                fontSize: "clamp(80px, 20vw, 250px)",
                lineHeight: "1",
              }}
            >
              LENIENT
            </span>
          </div>
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
              <div className="lg:col-span-1 text-center md:text-left">
                <h4 className="text-white text-3xl font-bold mb-4">
                  Lenient Tree
                </h4>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Access to events are now easy
                </p>
                <p className="text-white/70 mb-6 leading-relaxed">
                  © 2025 The Lenient Tree
                  <br />
                  All rights reserved
                </p>
                <div className="flex gap-3 justify-center md:justify-start">
                  <a
                    href="#"
                    aria-label="Instagram"
                    className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-lg text-white hover:bg-[#00e676] hover:text-[#102025] transition-all duration-300"
                  >
                    <InstagramIcon />
                  </a>
                  <a
                    href="#"
                    aria-label="Facebook"
                    className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-lg text-white hover:bg-[#00e676] hover:text-[#102025] transition-all duration-300"
                  >
                    <FacebookIcon />
                  </a>
                  <a
                    href="#"
                    aria-label="Twitter"
                    className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-lg text-white hover:bg-[#00e676] hover:text-[#102025] transition-all duration-300"
                  >
                    <TwitterIcon />
                  </a>
                  <a
                    href="#"
                    aria-label="LinkedIn"
                    className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-lg text-white hover:bg-[#00e676] hover:text-[#102025] transition-all duration-300"
                  >
                    <LinkedInIcon />
                  </a>
                </div>
              </div>
              <div className="text-center md:text-left">
                <h4 className="text-[#9ef01a] font-bold text-lg mb-6">
                  Quick Links
                </h4>
                <ul className="space-y-4">
                  <li>
                    <a
                      href="#"
                      className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                    >
                      Calendar
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                    >
                      Subscriptions
                    </a>
                  </li>
                </ul>
              </div>
              <div className="text-center md:text-left">
                <h4 className="text-[#9ef01a] font-bold text-lg mb-6">
                  Essentials
                </h4>
                <ul className="space-y-4">
                  <li>
                    <Link
                      to="/terms"
                      className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                    >
                      Terms &amp; Conditions
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/privacy"
                      className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                    >
                      Blogs
                    </a>
                  </li>
                </ul>
              </div>
              <div className="text-center md:text-left">
                <h4 className="text-[#9ef01a] font-bold text-lg mb-6">
                  Partners
                </h4>
                <ul className="space-y-4">
                  <li>
                    <a
                      href="#"
                      className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                    >
                      Paid Promotion
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                    >
                      Collaboration
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                    >
                      Organize an event
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default About;
