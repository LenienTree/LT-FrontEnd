import { FaChevronRight } from "react-icons/fa6";
import { LuCalendarClock } from "react-icons/lu";
import { FaLinkedin } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { BsThreadsFill } from "react-icons/bs";
import { IoLogoGithub } from "react-icons/io";
import { IoLogoInstagram } from "react-icons/io";
import Earth from "./HomeEarth";
import { FaFacebook } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import TreeWithFallingLeaves from "./animations/FallingLeaves";
import TeamHalfCircle from "./TeamHalfCircle";
import { StarsBackground } from "./canvas/StarsBackground";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
function AboutNew() {
  const members = [
    { id: 1, name: "Mohammad Fayaz Shah", state: "Jammu Kashmir" },
    { id: 2, name: "Meera Surendran", state: "Kerala" },
    { id: 3, name: "Meera Surendran", state: "Kerala" },
    { id: 4, name: "Meera Surendran", state: "Kerala" },
    { id: 5, name: "Meera Surendran", state: "Kerala" },
    { id: 6, name: "Meera Surendran", state: "Kerala" },
    { id: 7, name: "Meera Surendran", state: "Kerala" },
    { id: 8, name: "Meera Surendran", state: "Kerala" },
    { id: 9, name: "Meera Surendran", state: "Kerala" },
    { id: 10, name: "Meera Surendran", state: "Kerala" },
    { id: 11, name: "Meera Surendran", state: "Kerala" },
    { id: 12, name: "Meera Surendran", state: "Kerala" },
  ];
  const teamMembers = [
    {
      name: "Augustine",
      surname: "Vadakumchery",
      role: "Founder",
      img: "/event.png",
      x: "https://x.com/augustine",
      linkedin: "https://linkedin.com/in/augustine",
    },
    {
      name: "Akhil",
      surname: "Kumar S",
      role: "CDO",
      img: "/event.png",
      x: "https://x.com/akhil",
      linkedin: "https://linkedin.com/in/akhil",
    },
    {
      name: "John",
      surname: "Doe",
      role: "CTO",
      img: "/event.png",
      x: "https://x.com/john",
      linkedin: "https://linkedin.com/in/john",
    },
    {
      name: "Jane",
      surname: "Smith",
      role: "COO",
      img: "/event.png",
      x: "https://x.com/jane",
      linkedin: "https://linkedin.com/in/jane",
    },
    {
      name: "Alex",
      surname: "Brown",
      role: "CMO",
      img: "/event.png",
      x: "https://x.com/alex",
      linkedin: "https://linkedin.com/in/alex",
    },
  ];
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overlayExpanded, setOverlayExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isEarthLoaded, setIsEarthLoaded] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [active, setActive] = useState("About");

  const mainRef = useRef(null);
  const earthRef = useRef(null);
  const journeyPointsRef = useRef([]);
  const heroSectionRef = useRef(null);
  const eventSectionRef = useRef(null);
  const journeyRef = useRef(null);
  const teamRef = useRef(null);
  const svgRef = useRef(null);
  const stateHeadRef = useRef(null);
  const connectRef = useRef(null);
  const footerRef = useRef(null);
  const teamPinRef = useRef(null);
  const logoRef = useRef(null);

  const [startHalfCircle, setStartHalfCircle] = useState(false);

  const scrollToTeam = () => {
    teamRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    let timeout;
    if (menuOpen) {
      // Wait for the clip-path expansion (700ms) before showing links
      timeout = setTimeout(() => setOverlayExpanded(true), 300); // start links slightly after overlay
    } else {
      // Immediately hide links when menu closes
      setOverlayExpanded(false);
    }

    return () => clearTimeout(timeout);
  }, [menuOpen]);

  useEffect(() => {
    const path = document.querySelector("#journeyPath");
    if (!path) return;

    const total = path.getTotalLength();
    const samples = 300;
    const pts = [];

    for (let i = 0; i <= samples; i++) {
      const p = path.getPointAtLength((i / samples) * total);
      pts.push({ x: p.x, y: p.y });
    }

    journeyPointsRef.current = pts;
  }, []);

  useEffect(() => {
    const minDuration = 3000;
    const maxDuration = 8000;

    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setLoading(false);
        setExiting(false);
        setShowContent(true);
      }, 500);
    }, minDuration);

    const maxTimer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setExiting(false);
        setShowContent(true);
      }
    }, maxDuration);

    return () => {
      clearTimeout(timer);
      clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    if (!teamRef.current) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const trigger = ScrollTrigger.create({
        trigger: teamRef.current,
        start: "top top",
        onEnter: () => setStartHalfCircle(true),
        onLeaveBack: () => setStartHalfCircle(false),
      });

      return () => {
        trigger.kill();
      };
    });

    return () => mm.revert();
  }, []);

  useEffect(() => {
    if (loading || exiting) {
      document.body.style.overflow = "hidden"; // Disable scroll
    } else {
      document.body.style.overflow = "auto"; // Restore scroll
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [loading, exiting]);

  useLayoutEffect(() => {
    if (!heroSectionRef.current) return;
    if (!eventSectionRef.current) return;
    if (!journeyRef.current) return;
    if (!teamRef.current) return;
    if (!stateHeadRef.current) return;
    if (!connectRef.current) return;
    if (!footerRef.current) return;

    const mm = gsap.matchMedia();

    const ctx = gsap.context(() => {
      if (heroSectionRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: "top 80%",
            // toggleActions: "play none none none",
            // scrub: 0.5 ,
          },
        });

        tl.fromTo(
          heroSectionRef.current.querySelector("img"),
          { opacity: 0, x: -50 },
          {
            opacity: 1,
            // delay: 1,
            x: 0,
            duration: 1,
            ease: "power2.out",
          },
        ).fromTo(
          heroSectionRef.current.querySelector(".text-hero"),
          { opacity: 0, y: -50 },
          {
            opacity: 1,
            // delay : 1,
            y: 0,
            z: 23,
            duration: 1,
            ease: "power2.out",
          },
        );
      }

      if (eventSectionRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: eventSectionRef.current,
            start: "top bottom",
            end: "bottom 80%",
            // toggleActions: "play none none none",
            scrub: 0.5,
          },
        });

        tl.fromTo(
          eventSectionRef.current.querySelector(".text-event"),
          { opacity: 0, x: -50 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: "power2.out",
          },
        )
          .fromTo(
            eventSectionRef.current.querySelector(".event-button"),
            { opacity: 0, x: -50 },
            {
              opacity: 1,
              x: 0,
              duration: 1,
              ease: "power2.out",
            },
          )
          .fromTo(
            eventSectionRef.current.querySelector(".event-info"),
            { opacity: 0, x: -50 },
            {
              opacity: 1,
              x: 0,
              duration: 1,
              ease: "power2.out",
            },
          );
      }

      if (journeyRef.current) {
        const path = journeyRef.current.querySelector("#journeyPath");
        let pathLength = 0;

        if (path) {
          pathLength = path.getTotalLength();

          gsap.set(path, {
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength,
          });
        }
        const isLg = window.matchMedia("(min-width: 992px)").matches;
        const revealAt = [
          { selector: ".nov", p: 0.15, fromX: 120 },
          { selector: ".jan", p: 0.37, fromX: -120 },
          { selector: ".march", p: 0.58, fromX: 120 },
        ];

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: journeyRef.current,
            start: "top +=400 ",
            end: "bottom +=600 ",
            scrub: 1.5,
          },
        });
        tl.to(
          path,
          {
            strokeDashoffset: 0,
            ease: "none",
          },
          0,
        );

        if (isLg) {
          revealAt.forEach(({ selector, fromX }) => {
            const el = journeyRef.current.querySelector(selector);
            if (!el) return;

            gsap.set(el, { opacity: 0, x: fromX });
            el.dataset.revealed = "0";
          });
        }

        if (isLg && logoRef.current) {
          gsap.set(logoRef.current, {
            xPercent: -50,
            yPercent: -50,
          });
          gsap.set(logoRef.current, {
            opacity: 0,
            scale: 0,
            transformOrigin: "50% 50%",
            motionPath: {
              path: path,
              align: path,
              alignOrigin: [0.5, 0.5],
              autoRotate: true,
              start: 0.15,
              end: 0.85,
            },
          });

          tl.to(
            logoRef.current,
            {
              motionPath: {
                path: path,
                align: path,
                alignOrigin: [0.5, 0.5],
                autoRotate: true,
                start: 0,
                end: 1,
              },
              duration: 5,
              ease: "none",

              onUpdate: function () {
                const prog = this.progress();

                if (prog > 0.05) {
                  gsap.set(path, {
                    strokeDasharray: "6 12",
                  });
                }
                const fadeInEnd = 0.08; // logo fully visible by 8% progress
                const fadeOutStart = 0.92; // start fading out near end

                let o = 1;

                if (prog < fadeInEnd) {
                  o = prog / fadeInEnd; // 0 -> 1
                } else if (prog > fadeOutStart) {
                  o = (1 - prog) / (1 - fadeOutStart); // 1 -> 0
                }

                o = gsap.utils.clamp(0, 1, o);
                const easedO = gsap.parseEase("power2.out")(o);

                gsap.set(logoRef.current, {
                  opacity: easedO,
                  scale: easedO,
                });

                revealAt.forEach(({ selector, p: hitPoint, fromX }) => {
                  const el = journeyRef.current.querySelector(selector);
                  if (!el) return;

                  // reveal window: how long it takes (in progress units) to fully appear
                  const windowSize = 0.08; // tweak 0.05 (fast) -> 0.15 (slow)

                  // map progress into 0..1 around the hitPoint
                  const tRaw = (prog - hitPoint) / windowSize;
                  const t = gsap.utils.clamp(0, 1, tRaw);

                  // optional easing for nicer feel while still scrubbing
                  const eased = gsap.parseEase("power3.out")(t);

                  gsap.set(el, {
                    opacity: eased,
                    x: gsap.utils.interpolate(fromX, 0, eased),
                  });
                });
              },
            },
            0,
          );
        } else {
          // Small / tablet animation (your original)
          tl.fromTo(
            journeyRef.current.querySelector(".nov"),
            { opacity: 0, x: -50 },
            { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
            0.2,
          )
            .fromTo(
              journeyRef.current.querySelector(".jan"),
              { opacity: 0, x: 50 },
              { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
              0.45,
            )
            .fromTo(
              journeyRef.current.querySelector(".march"),
              { opacity: 0, x: 50 },
              { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
              0.7,
            );
        }

        tl.fromTo(
          journeyRef.current.querySelector(".journey-text"),
          { opacity: 0, y: -50 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          0,
        );
      }

      if (teamRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: teamRef.current,
            // markers : true ,
            start: "top 80%", // Pin starts when section hits the very top
            end: "bottom bottom", // How long the section stays locked (in pixels)
            // pin: true, // Locks the trigger element in place
            scrub: 0.5, // Smoothly ties animation to scroll
            // anticipatePin: 1, // Prevents slight "glitches" during pin start
          },
        });

        tl.fromTo(
          teamRef.current.querySelector(".team"),
          { opacity: 0, y: -50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
          },
        ).fromTo(
          teamRef.current.querySelector(".team-info").children,
          { opacity: 0, y: -50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            stagger: 0.25,
          },
        );
      }

      if (stateHeadRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stateHeadRef.current,
            start: "top 80%",
            end: "bottom 60%",
            // toggleActions: "play none none none",
            // scrub: 0.3,
          },
        });

        tl.fromTo(
          stateHeadRef.current.querySelector(".head-text"),
          { opacity: 0, y: -50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
          },
        ).fromTo(
          stateHeadRef.current.querySelector(".head").children,
          { opacity: 0, y: -50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
            stagger: 0.25,
          },
        );
      }

      if (connectRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: connectRef.current,
            start: "top bottom",
            end: "bottom 80%",
            // toggleActions: "play none none none",
            scrub: 0.5,
          },
        });

        tl.from(connectRef.current.children, {
          opacity: 0,
          x: -40,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.25, // 👈 this makes them go one after another
        });
      }

      if (footerRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top bottom",
            end: "bottom 80%",
            // toggleActions: "play none none none",
            scrub: 0.5,
          },
        });

        tl.from(footerRef.current.querySelector(".footer").children, {
          opacity: 0,
          x: -40,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.25, // 👈 this makes them go one after another
        }).from(footerRef.current.querySelector(".footer-text"), {
          opacity: 0,
          duration: 1.5,
          ease: "power2.out",
        });
      }

      ScrollTrigger.refresh();
    }, mainRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (loading || exiting) {
      // Block scrolling safely
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none"; // blocks gestures
    } else {
      // Restore scrolling
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [loading, exiting]);

  return (
    <>
      {(loading || exiting) && (
        <div
          style={{
            position: "fixed",
            inset: 0, // covers top, bottom, left, right
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "white",
            zIndex: 9999,
            transition: "transform 1s ease, opacity 0.5s ease",
            transform: exiting ? "translateY(-100%)" : "translateY(0)",
            opacity: exiting ? 0 : 1,
            pointerEvents: "all",
          }}
        >
          <TreeWithFallingLeaves />
        </div>
      )}

      {/* {!isEarthLoaded && (
       <TreeWithFallingLeaves />
      )} */}

      <StarsBackground className=" z-[55] " />

      {/* <div
        ref={earthRef}
        className="hidden lg:block fixed top-[-60px] left-0 w-full h-[108vh]   overflow-hidden pointer-events-none"
      >
        <Earth
          scrollRef={[
            eventSectionRef,
            heroSectionRef,
            journeyRef,
            teamRef,
            stateHeadRef,
            connectRef,
            journeyPointsRef,
          ]}
          onLoaded={() => setIsEarthLoaded(true)}
        />
      </div> */}

      <div className="fixed lg:opacity-0 pointer-events-none z-0 bg-[#022f2e] w-screen h-screen"></div>
      <div
        ref={mainRef}
        className={`min-h-screen   relative  bg-[url('./assets/star.png')] lg:bg-none w-screen bg-cover bg-center transition-all duration-700 ease-out transform`}
      >
        <div className="pointer-events-none fixed inset-0 z-0 bg-[#022F2E]/45   bg-cover bg-center  " />
        <section className="relative z-10">


          {/* CIRCULAR OVERLAY (Mobile: includes nav + bell + profile) */}
          <div
            className={`
    fixed inset-0 h-screen z-40 bg-[#102025]/95 
    backdrop-blur-md
    transition-[clip-path] duration-700 ease-[cubic-bezier(.22,1,.36,1)]
    ${menuOpen
                ? "[clip-path:circle(150%_at_92%_7%)]"
                : "[clip-path:circle(0px_at_92%_7%)] pointer-events-none"
              }
    lg:hidden
  `}
          >
            {/* Center content */}

          </div>
        </section>

        <section
          ref={heroSectionRef}
          className="relative bg-transparent h-[100vh] pt-10 bg-[url(./assets/hero-bg1.png)] w-screen bg-cover bg-center"
        >
          {/* Earth 3D globe is rendered once in the team section with all required refs */}
          <img
            className="absolute z-[0] lg:invisible bottom-10 scale-150
         drop-shadow-[0_50px_140px_rgba(21,128,61,0.95)]
"
            src="/hero-earth.png"
            alt="hero-section-image"
          />

          <div className="z-30 relative flex justify-center flex-col items-center pt-[250px] text-hero isolate">
            <div
              className="text-3xl lg:w-[70%]  text-left  flex gap-10 font-bold bg-gradient-to-b lg:h-[10vh]  from-white from-[0%]
  via-[#f7ffe4] via-[50%]
  to-[#cfef80] to-[100%]
  bg-clip-text text-transparent lg:text-6xl lg:text-left lg:pr-44 
 md:text-5xl "
            >
              <div className="flex items-center justify-start">
                <h1>Professional</h1>
              </div>
              <div className="flex items-end">
                <h1>event linking</h1>
              </div>
            </div>
            <div
              className="z-30 text-3xl font-bold bg-gradient-to-b
  from-white from-[0%]
  via-[#f7ffe4] via-[50%]
  to-[#cfef80] to-[100%]
  bg-clip-text text-transparent flex gap-1"
            >
              <div className="flex items-start lg:pt-5">
                <h1 className=" via text-lg lg:text-xl">via</h1>
              </div>
              <div className="flex items-end">
                <h1 className=" tree text-6xl lg:text-[14rem] md:text-9xl">
                  Lenient tree
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={eventSectionRef}
          className=" bg-[#102025] z-20 h-full w-full py-10 "
        >
          <div className="flex max-w-[1281px] mx-auto relative flex-col lg:flex-row-reverse gap-4 lg:gap-5">
            <div className="flex flex-col mx-5 lg:mx-0 lg:w-1/2 md:mt-10 lg:mt-0">
              {/* Image 1 - full width but cropped */}
              <div className="w-full h-64 md:h-full lg:w-[630px] lg:h-[366px] overflow-hidden">
                <img
                  src="./hero-img.png"
                  alt="hero-img"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              {/* Images 2 & 3 - 40% / 40% and cropped */}
              <div className="flex gap-4 mt-4">
                <div className="w-[49%] h-48 lg:h-[324px] lg:w-[307px] overflow-hidden">
                  <img
                    src="./hero-img.png"
                    alt="hero-img"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                <div className="w-[49%] h-48 lg:h-[324px] lg:w-[307px] overflow-hidden">
                  <img
                    src="./hero-img.png"
                    alt="hero-img"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row lg:flex-col gap-12 md:gap-5 lg:gap-12 lg:mx-0 lg:w-1/2 mx-auto">
              <div className="text-event w-[90%] md:w-1/2 mx-auto md:ml-5 md:mx-0 lg:w-auto lg:mx-0 flex flex-col  lg:gap-8">
                <h1 className="flex flex-col  text-5xl lg:text-8xl font-bold text tracking-wide">
                  <span>Lenient Tree</span>
                  <span>and our team</span>
                </h1>
                <h1 className="lg:text-xl">
                  Lenient Tree is your go-to platform for career growth offering
                  hands-on workshops, portfolio help, hackathon prep, startup
                  support and guidance. We connect students and professionals to
                  real-world skills and innovation, making the leap from
                  classroom to career smoother, smarter, and more exciting.
                  Learn, build, and grow with us!
                </h1>
              </div>
              <div>
                <div className="w-[90%] mx-auto md:w-full lg:w-full lg:mx-0 flex flex-col lg:gap-6">
                  <div className="event-button flex bg-slate-400 bg-opacity-15 justify-around min-[380px]:justify-between min-[380px]:gap-8 rounded-full py-2  md:gap-4  lg:w-full  lg:mx-auto lg:gap-16 lg:px-2">
                    <div className="flex gap-3 pl-3  ">
                      <img
                        className="w-[4.5rem] h-[4.5rem]  lg:w-32 lg:h-32  rounded-full border-2 border-solid border-green-800 "
                        src="/event.png"
                        alt="event logo"
                      />
                      <img
                        className="w-[4.5rem] h-[4.5rem]  lg:w-32 lg:h-32 rounded-full border-2 border-solid border-green-800"
                        src="/event.png"
                        alt="event logo"
                      />
                      <img
                        className="w-[4.5rem] h-[4.5rem] hidden min-[380px]:block lg:w-32 lg:h-32 rounded-full border-2 border-solid border-green-800"
                        src="/event.png"
                        alt="event logo"
                      />
                    </div>
                    <div
                      onClick={scrollToTeam}
                      className="w-[4.5rem] h-[4.5rem] lg:w-32 lg:h-32 mr-4 rounded-full flex items-center justify-center border-4 bg-[#9AE600] border-solid border-green-100 cursor-pointer"
                    >
                      <FaChevronRight className="w-12 h-12 lg:w-20 lg:h-20" />
                    </div>
                  </div>
                  <div className="event-info flex justify-evenly text-black gap-6 text-sm min-[390px]:text-base lg:text-lg py-5 lg:p-5">
                    <div className="flex flex-col shadow-[inset_0_-2px_6px_rgba(0,0,0,0.4)] bg-white text-black p-2 lg:w-1/3 rounded-2xl relative lg:text-2xl lg:p-5 ">
                      <h1 className="mx-1">
                        See Events
                        <span>
                          <FaChevronRight className="inline w-4 h-4 mb-1" />
                        </span>
                      </h1>
                      <LuCalendarClock className="font-bold mx-1 " />
                    </div>
                    <div className=" flex flex-col shadow-[inset_0_-2px_6px_rgba(0,0,0,0.4)] bg-white p-2 rounded-2xl lg:w-2/3 lg:text-3xl lg:p-5 ">
                      <h1 className="mx-1">No. of Events conducted</h1>
                      <h2 className="mx-1 font-bold">200+</h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={journeyRef}
          className="bg-[#102025] bg-transparent z-20 lg:pb-14"
        >
          <div className="  relative max-w-[1281px] py-10 lg:pb-20 h-full lg:h-[1280px] w-full ">
            <img
              ref={logoRef}
              src="/earth-about.png"
              alt="logo"
              className="lg:block hidden w-24 h-24 absolute top-0 left-0 z-20 pointer-events-none"
            />
            <svg
              className="absolute hidden overflow-visible lg:block top-0 left-0 w-full h-full pointer-events-none z-0"
              viewBox="0 0 1000 1200"
              preserveAspectRatio="none"
            >
              <path
                id="journeyPath"
                d="M 374 5 
   C 568 35 698 220 560 344 
   C 280 403 244 488 448 631 
   C 877 818 403 1147 321 1176 
   C 184 1288 164 1292 76 1600"
                fill="none"
                stroke="#3FA9A3"
                strokeWidth="1"
                opacity="0.4"
              />
            </svg>

            <div className="bg-[#102025] journey-text lg:absolute lg:top-[150px] lg:left-[150px] w-[60%] mx-auto lg:mx-0  lg:py-2 lg:w-[29%]  rounded-full  lg:ml-10 flex items-center border border-[#3B5445] justify-center">
              <h1 className="pt-1 px-4 text-xl lg:text-3xl  font-bold">
                OUR JOURNEY{" "}
                <span>
                  <FaChevronRight className="inline w-4 h-4 mb-1 font-bold" />
                </span>
              </h1>
            </div>
            <div className=" lg:flex lg:flex-col lg:relative lg:px-20">
              <div className="nov flex flex-col rounded-[3rem] mt-10 mx-4 md:mx-auto lg:mx-0 md:w-[50%] lg:w-[324px] lg:self-end  gap-5 p-6 bg-[#102025] bg-opacity-70 border border-[#3B5445] ">
                <div className="flex items-center justify-around gap-6">
                  <img
                    className="w-24 h-24"
                    src="/earth-about.png"
                    alt="earth logo"
                  />
                  <div className="flex flex-col">
                    <span className=" text-3xl font-bold">12 Nov,</span>
                    <span className=" text-3xl font-bold">2024</span>
                  </div>
                </div>
                <h1 className="text-xl px-3">
                  {" "}
                  <span>Lenient Tree</span>bridges the education-industry gap,
                  empowering learners with practical, real-world skills to take
                  control of their careers.
                </h1>
              </div>
              <div className="jan flex flex-col rounded-[3rem] mt-10 md:mx-auto md:w-[50%] lg:mx-0 mx-4 lg:w-[324px] lg:self-start gap-5 p-6 bg-[#102025] bg-opacity-70 border border-[#3B5445]">
                <div className="flex items-center justify-around gap-6 lg:gap-2">
                  <div className="flex flex-col">
                    <span className=" text-3xl font-bold">30 Jan, </span>
                    <span className=" text-3xl font-bold">2025</span>
                  </div>
                  <img
                    className="w-24 h-24 inline"
                    src="/earth-about.png"
                    alt="earth logo"
                  />
                </div>
                <h1 className="text-xl px-3">
                  {" "}
                  <span>Lenient Tree</span>bridges the education-industry gap,
                  empowering learners with practical, real-world skills to take
                  control of their careers.
                </h1>
              </div>
              <div className="march flex flex-col rounded-[3rem] md:mx-auto mt-10 md:w-[50%] lg:mx-0 lg:w-[324px] mx-4 lg:self-end  gap-5 p-6 bg-[#102025] bg-opacity-70 border border-[#3B5445]">
                <h1 className="text-xl px-3">
                  {" "}
                  <span>Lenient Tree</span>bridges the education-industry gap,
                  empowering learners with practical, real-world skills to take
                  control of their careers.
                </h1>
                <div className="flex items-center justify-center gap-6">
                  <img
                    className="w-24 h-24"
                    src="/earth-about.png"
                    alt="earth logo"
                  />
                  <div className="flex flex-col">
                    <span className=" text-3xl font-bold">19 March, </span>
                    <span className=" text-3xl font-bold">2025</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={teamRef}
          className="bg-[#055B57] scroll-mt-20 bg-transparent py-10 h-full  lg:pb-32 lg:pt-32 w-full relative "
        >
          <div className="absolute hidden lg:block inset-0 pointer-events-none  overflow-visible">
            <Earth scrollRef={[eventSectionRef, heroSectionRef, journeyRef, teamRef, journeyPointsRef, stateHeadRef, connectRef]} onLoaded={() => setIsEarthLoaded(true)} />
          </div>
          <div className="team absolute top-0 lg:top-[150px] mx-auto left-0 right-0 lg:left-auto lg:right-[50px] 2xl:right-[200px] w-[200px] xl:w-[400px]">
            <div className="w-full bg-[#102025] rounded-full border-2 border-[#3B5445] flex items-center justify-center">
              <h1 className="py-2 text-xl xl:text-3xl 2xl:text-5xl font-bold tracking-wider text-center">
                OUR TEAM
              </h1>
            </div>
          </div>
          <div className="block lg:hidden team-info">
            <div className=" mt-10 flex gap-3 lg:w-2/5 items-center justify-center">
              <img
                className="border-[5px] border-[#9AE600] w-[40%] rounded-full"
                src="/event.png"
                alt="team-image"
              />
              <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">
                  <h1>Augustine</h1>
                  <h2>Vadakumchery</h2>
                </div>
                <div className="bg-[#022F2E] w-[100%] rounded-full border-2  border-[#102025]  flex items-center justify-center">
                  <h1 className=" py-1 text-xl font-bold tracking-wider">
                    Founder
                  </h1>
                </div>
                <div className="flex gap-4 mt-2 text-xl text-[#9AE600]">
                  <a href="#" className="hover:scale-110 transition">
                    <FaXTwitter />
                  </a>
                  <a href="#" className="hover:scale-110 transition">
                    <FaLinkedin />
                  </a>
                </div>
              </div>
            </div>
            <div className=" mt-10 flex gap-7 lg:w-3/5 items-center justify-center">
              <img
                className="border-[5px] border-[#9AE600] w-[40%] rounded-full"
                src="/event.png"
                alt="team-image"
              />
              <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">
                  <h1>Akhil</h1>
                  <h2>Kumar S</h2>
                </div>
                <div className="bg-[#022F2E] w-[105px] rounded-full border-2  border-[#102025]  flex  justify-center">
                  <h1 className=" py-1 text-xl font-bold tracking-wider">
                    CDO
                  </h1>
                </div>
                <div className="flex gap-4 mt-2 text-xl text-[#9AE600]">
                  <a href="#" className="hover:scale-110 transition">
                    <FaXTwitter />
                  </a>
                  <a href="#" className="hover:scale-110 transition">
                    <FaLinkedin />
                  </a>
                </div>
              </div>
            </div>
            <div className=" mt-10 flex gap-7 lg:w-3/5 items-center justify-center">
              <img
                className="border-[5px] border-[#9AE600] w-[40%] rounded-full"
                src="/event.png"
                alt="team-image"
              />
              <div className="flex flex-col gap-2">
                <div className=" text-xl font-bold">
                  <h1>Akhil</h1>
                  <h2>Kumar S</h2>
                </div>
                <div className="bg-[#022F2E] w-[105px] rounded-full border-2  border-[#102025]  flex items-center justify-center">
                  <h1 className=" py-1 text-xl font-bold tracking-wider">
                    CDO
                  </h1>
                </div>
                <div className="flex gap-4 mt-2 text-xl text-[#9AE600]">
                  <a href="#" className="hover:scale-110 transition">
                    <FaXTwitter />
                  </a>
                  <a href="#" className="hover:scale-110 transition">
                    <FaLinkedin />
                  </a>
                </div>
              </div>
            </div>
            <div className=" mt-10 flex gap-7 lg:w-3/5 items-center justify-center">
              <img
                className="border-[5px] border-[#9AE600] w-[40%] rounded-full"
                src="/event.png"
                alt="team-image"
              />
              <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">
                  <h1>Akhil</h1>
                  <h2>Kumar S</h2>
                </div>
                <div className="bg-[#022F2E] w-[105px] rounded-full border-2  border-[#102025]  flex  justify-center">
                  <h1 className=" py-1 text-xl font-bold tracking-wider">
                    CDO
                  </h1>
                </div>
                <div className="flex gap-4 mt-2 text-xl text-[#9AE600]">
                  <a href="#" className="hover:scale-110 transition">
                    <FaXTwitter />
                  </a>
                  <a href="#" className="hover:scale-110 transition">
                    <FaLinkedin />
                  </a>
                </div>
              </div>
            </div>
            <div className=" mt-10 flex gap-7 lg:w-3/5 items-center justify-center">
              <img
                className="border-[5px] border-[#9AE600] w-[40%] rounded-full"
                src="/event.png"
                alt="team-image"
              />
              <div className="flex flex-col gap-2">
                <div className=" text-xl font-bold">
                  <h1>Akhil</h1>
                  <h2>Kumar S</h2>
                </div>

                <div className="bg-[#022F2E] w-[105px] rounded-full border-2  border-[#102025]  flex items-center justify-center">
                  <h1 className=" py-1 text-xl font-bold tracking-wider">
                    CDO
                  </h1>
                </div>
                <div className="flex gap-4 mt-2 text-xl text-[#9AE600]">
                  <a href="#" className="hover:scale-110 transition">
                    <FaXTwitter />
                  </a>
                  <a href="#" className="hover:scale-110 transition">
                    <FaLinkedin />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky hidden lg:flex top-0 h-full  items-center justify-center">
            <TeamHalfCircle teamPinRef={teamPinRef} />
          </div>
        </section>

        <section
          ref={stateHeadRef}
          className="bg-[#055B57] bg-transparent py-15 lg:pt-56 pb-20 lg:mb-16 w-full mx-auto h-full overflow-x-hidden"
        >
          <div className="bg-[#102025] head-text w-[70%] lg:w-[40%] mx-auto rounded-full border-2 border-[#102025] flex items-center justify-center">
            <h1 className="py-1 md:p-1.5 text-xl md:text-3xl font-bold tracking-wider">
              STATE HEADS
            </h1>
          </div>

          <div className="head flex flex-wrap justify-center gap-14 mt-10 px-10 text-black mx-auto">
            {members.map((member) => (
              <div
                key={member.id}
                className="group relative overflow-hidden flex flex-col bg-slate-100 w-[332px] rounded-[30px] gap-3 p-5 hover:bg-[#102025] transition-colors duration-100 ease-out border hover:border-[#055B57] border-[#102025]
"
              >
                {/* 🔥 SVG Background */}
                <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-[20%] overflow-visible">
                  <svg
                    className="absolute top-0 right-0 w-full h-full
  transition-transform duration-500 ease-out overflow-visible
  "
                    viewBox="0 0 285 142"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g opacity="0.6" clipPath="url(#clip0)">
                      <path
                        d="M231.682 8.41524C222.633 23.527 224.344 33.0013 236.816 36.8383C255.523 42.5937 300.005 44.8958 318.598 57.3808C337.191 69.8655 393.883 60.2139 403.579 38.7861C413.275 17.3583 430.732 -15.6689 338.679 -15.6689C277.31 -15.6689 241.645 -7.64105 231.682 8.41524Z"
                        fill="#ACD50A"
                      />
                      <path
                        d="M80.9906 38.2521C55.6521 80.565 60.4439 107.093 95.3633 117.837C147.744 133.952 272.294 140.398 324.355 175.356C376.415 210.313 535.154 183.288 562.302 123.291C589.45 63.2927 638.329 -29.1836 380.581 -29.1836C208.747 -29.1836 108.885 -6.70548 80.9906 38.2521Z"
                        fill="#D6FFE4"
                      />
                      <path
                        d="M93.5485 35.7659C69.5674 75.8121 74.1025 100.919 107.151 111.087C156.726 126.339 274.603 132.439 323.876 165.525C373.147 198.609 523.381 173.032 549.075 116.249C574.769 59.4651 621.03 -28.0571 377.089 -28.0571C214.461 -28.0571 119.948 -6.7832 93.5485 35.7659Z"
                        fill="#C7F3CF"
                      />
                      <path
                        d="M106.106 33.2793C83.4827 71.0586 87.7611 94.7445 118.939 104.337C165.707 118.725 276.913 124.481 323.396 155.693C369.878 186.905 511.609 162.776 535.848 109.206C560.088 55.637 603.73 -26.9312 373.598 -26.9312C220.175 -26.9312 131.012 -6.86141 106.106 33.2793Z"
                        fill="#B8E6C7"
                      />
                      <path
                        d="M118.663 30.7931C97.397 66.3057 101.419 88.5704 130.726 97.5872C174.688 111.112 279.221 116.522 322.916 145.862C366.609 175.201 499.836 152.52 522.621 102.165C545.406 51.8093 586.43 -25.8047 370.105 -25.8047C225.887 -25.8047 142.074 -6.93913 118.663 30.7931Z"
                        fill="#A9DAB5"
                      />
                      <path
                        d="M131.221 28.3065C111.312 61.5523 115.077 82.3959 142.514 90.8371C183.67 103.499 281.531 108.564 322.436 136.031C363.341 163.497 488.064 142.264 509.394 95.1224C530.725 47.9812 569.13 -24.6787 366.614 -24.6787C231.601 -24.6787 153.138 -7.01734 131.221 28.3065Z"
                        fill="#9ACE9C"
                      />
                      <path
                        d="M143.779 25.8203C125.228 56.7994 128.736 76.2218 154.302 84.0875C192.652 95.8861 283.84 100.605 321.957 126.2C360.072 151.793 476.291 132.008 496.167 88.0806C516.044 44.1536 551.831 -23.5522 363.122 -23.5522C237.315 -23.5522 164.202 -7.09506 143.779 25.8203Z"
                        fill="#8BC18D"
                      />
                      <path
                        d="M156.337 23.3337C139.143 52.046 142.395 70.0472 166.09 77.3374C201.634 88.2726 286.15 92.6467 321.477 116.368C356.804 140.089 464.519 121.751 482.941 81.0383C501.363 40.3255 534.531 -22.4263 359.631 -22.4263C243.029 -22.4263 175.265 -7.17327 156.337 23.3337Z"
                        fill="#7DB584"
                      />
                      <path
                        d="M168.894 20.8475C153.057 47.2931 156.052 63.8732 177.877 70.5878C210.615 80.6598 288.458 84.6885 320.997 106.537C353.534 128.385 452.746 111.495 469.713 73.9965C486.681 36.4979 517.231 -21.2998 356.138 -21.2998C248.742 -21.2998 186.328 -7.25098 168.894 20.8475Z"
                        fill="#6EA972"
                      />
                      <path
                        d="M181.452 18.3609C166.973 42.5397 169.711 57.6986 189.665 63.8377C219.596 73.0464 290.768 76.7297 320.517 96.7057C350.266 116.681 440.973 101.239 456.487 66.9543C472 32.6698 499.931 -20.1738 352.646 -20.1738C254.456 -20.1738 197.391 -7.32919 181.452 18.3609Z"
                        fill="#649C5F"
                      />
                      <path
                        d="M194.01 15.8747C180.888 37.7867 183.369 51.5245 201.453 57.0881C228.578 65.4334 293.077 68.7715 320.038 86.8747C346.997 104.978 429.201 90.9828 443.26 59.9124C457.319 28.8421 482.631 -19.0474 349.155 -19.0474C260.169 -19.0474 208.455 -7.40691 194.01 15.8747Z"
                        fill="#509056"
                      />
                      <path
                        d="M206.568 13.388C194.803 33.0333 197.028 45.3499 213.241 50.338C237.56 57.82 295.387 60.8127 319.558 77.0432C343.729 93.2734 417.429 80.7263 430.033 52.8702C442.638 25.014 465.332 -17.9214 345.663 -17.9214C265.883 -17.9214 219.518 -7.48512 206.568 13.388Z"
                        fill="#418448"
                      />
                      <path
                        d="M219.124 10.9019C208.718 28.2804 210.686 39.1759 225.028 43.5884C246.541 50.2071 297.695 52.8545 319.078 67.2122C340.46 81.5697 405.656 70.4704 416.806 45.8284C427.956 21.1864 448.032 -16.7949 342.171 -16.7949C271.596 -16.7949 230.581 -7.56284 219.124 10.9019Z"
                        fill="#3A7732"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0">
                        <rect width="285" height="150" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>

                {/* Content */}
                <div className="relative flex gap-8">
                  <img
                    className="w-24 rounded-3xl border-[3px] border-[#3B5445]"
                    src="/event.png"
                    alt="state head images"
                  />

                  <div className="text-xl text-right  cursor-pointer ">
                    <h1 className="font-[600] text-[#000000] group-hover:text-[#ffffff] transition-colors duration-300">
                      {member.name}
                    </h1>
                    <h1 className="text-[15px]  lg:text-lg text-[#000000]/70 group-hover:text-[#ffffff]/70 transition-colors duration-300 ">
                      {member.state}
                    </h1>
                  </div>
                </div>

                <div className="relative flex gap-10 items-center justify-center text-slate-700 group-hover:text-white transition-colors duration-300">
                  <FaLinkedin className="text-2xl hover:text-[#9ae600] cursor-pointer" />
                  <IoLogoGithub className="text-2xl hover:text-[#9ae600] cursor-pointer" />
                  <FaSquareXTwitter className="text-2xl hover:text-[#9ae600] cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          ref={connectRef}
          className="bg-[#102025] py-16 pb-24 w-full mx-auto relative rounded-t-3xl flex flex-col items-center justify-around"
        >
          {/* Background Image */}
          <img
            src="./earth-about.png"
            alt="footer image"
            className="absolute hidden lg:block -bottom-[250px] right-[-150px] w-[700px] opacity-80 pointer-events-none"
          />

          {/* Top Content */}
          <div className="w-[90%] px-6 flex mx-auto flex-col items-center lg:items-start text-center lg:text-left gap-5">
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl lg:text-6xl font-bold leading-tight">
                Partner With{" "}
                <span className="text-[#9AE600]">Lenient Tree</span>
              </h1>

              <p className="text-slate-400 lg:text-xl max-w-xl">
                Connect with high-potential talent and drive industry
                innovation. We bridge the gap between academic foundation and
                professional excellence.
              </p>
            </div>

            <button
              className="
    bg-[#9AE600] w-full lg:w-[500px]
    text-black font-bold lg:text-xl px-8 py-3 rounded-xl
    transition-all duration-200
    shadow-[0_4px_10px_rgba(154,230,0,0.5),inset_0_-2px_6px_rgba(0,0,0,0.4)]
    hover:shadow-[0_6px_15px_rgba(154,230,0,0.6),inset_0_4px_8px_rgba(0,0,0,0.3)]

    active:scale-95 active:shadow-[inset_0_-3px_8px_rgba(0,0,0,0.5)]
  "
            >
              Get in touch
            </button>
          </div>

          {/* Contact Card */}
          <div className="mt-16 w-[90%] mx-auto px-6">
            <div className="bg-[#022F2E] rounded-3xl p-8 flex flex-col lg:flex-row items-center justify-around gap-8 text-center lg:text-left">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-[#A1A1A1]">Email</span>
                <span className="text-lg lg:text-2xl font-bold hover:text-[#D8F999] cursor-pointer">
                  lenienttree@gmail.com
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm text-[#A1A1A1]">Phone</span>
                <span className="text-lg lg:text-2xl font-bold hover:text-[#D8F999] cursor-pointer">
                  +91 1234567890
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm text-[#A1A1A1]">Website</span>
                <span className="text-lg lg:text-2xl font-bold hover:text-[#D8F999] cursor-pointer">
                  www.lenienttree.com
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={footerRef}
          className="bg-[#022F2e] relative pt-15 z-[22] px-15 w-full mx-auto rounded-t-3xl -mt-6 overflow-hidden"
        >
          <div className="footer w-full text-center lg:text-left lg:items-start items-center mx-auto text-2xl flex flex-col gap-10 pt-10 lg:flex-row lg:justify-around lg:text-lg">
            <div className=" ">
              <div className="flex  flex-col ">
                <h1 className="pb-2 font-bold">Lenient Tree</h1>
                <h1 className=" pb-2 text-lg">Access to events are easy</h1>
                <h1 className=" text-lg"> &copy; 2025 The Lenient Tree</h1>
                <h1 className=" text-lg">All rights reserved</h1>
              </div>
              <div className="flex  lg:justify-normal  lg:gap-4 gap-8 pt-5">
                <BsThreadsFill className="text-2xl" />
                <IoLogoInstagram className=" text-2xl" />
                <FaFacebook className="text-2xl" />
                <FaSquareXTwitter className=" text-2xl" />
                <FaLinkedin className=" text-2xl" />
              </div>
            </div>
            <div className="flex  flex-col gap-3 text-[#D8F999]">
              <h1 className="font-bold">Quick Links</h1>
              <h1>Home</h1>
              <h1>Calendar</h1>
              <h1>About</h1>
              <h1>Subcriptions</h1>
            </div>
            <div className="flex  flex-col gap-3 text-[#D8F999]">
              <h1 className="font-bold">Essentials</h1>
              <h1>Terms & Conditions</h1>
              <h1>Privacy Policy</h1>
              <h1>Blogs</h1>
            </div>
            <div className="flex  flex-col gap-3 text-[#D8F999]">
              <h1 className="font-bold">Partners</h1>
              <h1>UK Limited</h1>
              <h1>Degraph</h1>
              <h1>Anony events</h1>
            </div>
          </div>
          <div className="text-center overflow-hidden">
            <h1 className="footer-text text-[#102025] text-8xl md:text-[13rem] lg:text-[23rem] lg:-mt-44 md:-mt-20 font-bold leading-none translate-y-1/2">
              LENIENT
            </h1>
          </div>
        </section>
      </div>
    </>
  );
}
export default AboutNew;
