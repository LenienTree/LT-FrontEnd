import React, { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";

const CollaborationEventCard = React.memo(({ event }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const tlRef = useRef(null);

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
        className={`relative w-full sm:w-80 h-[380px] sm:h-[400px] rounded-lg overflow-hidden cursor-pointer border-2 transition-shadow duration-300 ${colors.bgColor || ""} ${isHovered
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

export default CollaborationEventCard;
