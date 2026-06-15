import React, { useState, useEffect, useRef } from "react";
import { Menu, X, ArrowRight, Calendar, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate, useSpring } from "motion/react";
import Lenis from "lenis";
import { LiquidVideoCanvas } from "./components/LiquidVideoCanvas";
import { ProgressiveBlur } from "./components/ProgressiveBlur";
import { ScrambleText } from "./components/ScrambleText";
import { ScrambleIn } from "./components/ScrambleIn";
import { StatsGrid } from "./components/StatsGrid";

// Reusable ScrollReveal component replicating clean spring slide-reveal animation logic
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 18,
        delay,
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// Ultra-premium, mathematically centered Squash Hamburger icon
function SquashHamburger({ isOpen, isMobile = false }: { isOpen: boolean; isMobile?: boolean }) {
  const width = isMobile ? "w-[15px]" : "w-[18px]";
  const height = isMobile ? "h-[10px]" : "h-[12px]";
  const thickness = isMobile ? "h-[1.2px]" : "h-[1.5px]";
  const topMiddle = isMobile ? "top-[4px]" : "top-[5px]";
  const topBottom = isMobile ? "top-[8px]" : "top-[10px]";
  const yShift = isMobile ? 4 : 5;

  return (
    <div className={`${width} ${height} flex flex-col justify-between items-center relative select-none shrink-0`}>
      <motion.span
        animate={isOpen ? { rotate: 45, y: yShift } : { rotate: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`${width} ${thickness} bg-white rounded-full absolute top-0 left-0`}
        style={{ transformOrigin: "center" }}
      />
      <motion.span
        animate={isOpen ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`${width} ${thickness} bg-white rounded-full absolute ${topMiddle} left-0`}
      />
      <motion.span
        animate={isOpen ? { rotate: -45, y: -yShift } : { rotate: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`${width} ${thickness} bg-white rounded-full absolute ${topBottom} left-0`}
        style={{ transformOrigin: "center" }}
      />
    </div>
  );
}

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoEntranceComplete, setVideoEntranceComplete] = useState(false);
  const [videoErrorCount, setVideoErrorCount] = useState(0);
  const [isDownloadHovered, setIsDownloadHovered] = useState(false);
  const [isCardDownloadHovered, setIsCardDownloadHovered] = useState(false);
  const [isAboutHovered, setIsAboutHovered] = useState(false);
  const [isMetricsHovered, setIsMetricsHovered] = useState(false);

  const { scrollY, scrollYProgress } = useScroll();

  // Ultra-smooth dynamic inertia spring config for a slower, cinematic, liquid movement on desktop scroll
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 15,
    damping: 32,
    mass: 1.8,
    restDelta: 0.01
  });

  // Translating the title up by up to 120px as we scroll for high-end cinematic parallax
  const yScaleValue = useTransform(smoothScrollY, [0, 1000], [0, -120]);
  const transform = useMotionTemplate`rotateX(24deg) translateY(${yScaleValue}px) translateZ(15px)`;
  
  // High-performance viewport-independent scroll progress mappings
  const cinematicOpacity = useTransform(scrollYProgress, [0.08, 0.22, 0.42, 0.65], [0, 1, 1, 0]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.26], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.26], [1, 0.96]);
  const descOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const descY = useTransform(scrollYProgress, [0, 0.12], [0, -30]);

  const fetchVideoSource = (forceRefresh = false) => {
    if (videoErrorCount >= 2) {
      console.warn("Activating high-availability Vimeo loop fallback.");
      setVideoUrl("https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054ab1797d090a9e1b289539fb7b57b&profile_id=139&oauth2_token_id=57447761");
      return;
    }

    const url = forceRefresh ? "/api/video-src?refresh=true" : "/api/video-src";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.url) {
          setVideoUrl(data.url);
        }
      })
      .catch((err) => {
        console.error("Failed to load background video:", err);
        // Ultimate stable fallback CDN loop
        setVideoUrl("https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054ab1797d090a9e1b289539fb7b57b&profile_id=139&oauth2_token_id=57447761");
      });
  };

  // Set default values and setup native scroll listeners
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split("T")[0]);
    setSelectedTime("11:00 AM");

    fetchVideoSource();

    const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const smallScreen = window.innerWidth < 768;
    const isMobileDevice = mobileUA || smallScreen;

    let lenis: Lenis | null = null;
    let rafId: number;

    if (!isMobileDevice) {
      // Initialize Lenis smooth scroll engine only on desktop
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Premium exponential deceleration
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    }

    // Native window scroll tracker - operates cleanly across all screen sizes and trackpads
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight <= 0) return;
      setScrollProgress(scrollTop / scrollHeight);
    };

    if (lenis) {
      lenis.on("scroll", handleScroll);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) {
      setEmailError("Please enter a valid corporate email address.");
      return;
    }
    setEmailError("");
    setBookingSuccess(true);
    setTimeout(() => {
      setIsDemoModalOpen(false);
      setBookingSuccess(false);
      setEmailInput("");
    }, 2800);
  };

  return (
    <div 
      id="edra-root-canvas" 
      className="relative w-full min-h-screen bg-black select-none overflow-x-hidden"
    >
      {/* Background Video with progressive blur and opacity fading */}
      {videoUrl && (
        <LiquidVideoCanvas 
          videoUrl={videoUrl} 
          scrollProgress={scrollProgress} 
          onEntranceComplete={() => setVideoEntranceComplete(true)}
          onVideoError={() => {
            setVideoErrorCount((prev) => {
              const nextCount = prev + 1;
              if (nextCount >= 2) {
                // Instantly pivot to the ultra-reliable, high-bandwidth Vimeo stream
                setVideoUrl("https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054ab1797d090a9e1b289539fb7b57b&profile_id=139&oauth2_token_id=57447761");
              } else {
                fetchVideoSource(true);
              }
              return nextCount;
            });
          }} 
        />
      )}

      {/* Progressive bottom blur layer */}
      <ProgressiveBlur position="bottom" backgroundColor="#000000" height="150px" blurAmount="4px" className="fixed bottom-0 z-30" />

      {/* HEADER SECTION: Fixed smoothly to top of viewport */}
      <motion.header 
        id="edra-main-header" 
        initial={{ opacity: 0 }}
        animate={{ opacity: videoEntranceComplete ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 h-20 px-4 sm:px-8 flex items-center justify-between z-50 bg-transparent pointer-events-auto"
      >
        {/* DESKTOP / TABLET HEADER LAYOUT (visible on sm: and up) */}
        <div id="edra-desktop-header" className="hidden sm:flex items-center justify-between w-full h-full">
          <div id="header-left-group" className="flex items-center gap-2">
            {/* Logo Button */}
            <motion.button
              id="edra-logo-pill"
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setIsMenuOpen(false);
                setIsDemoModalOpen(false);
              }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.22)" }}
              whileTap={{ scale: 0.98 }}
              className={`h-12 px-5 bg-white/15 backdrop-blur-md rounded-[14px] flex items-center gap-2.5 cursor-pointer transition-colors duration-150 ${isMenuOpen ? "hidden md:flex" : "flex"}`}
            >
              <svg 
                viewBox="-50 -50 100 100" 
                className="w-[18px] h-[18px] text-white shrink-0"
              >
                <g fill="currentColor">
                  <path d="M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z" />
                  <path d="M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z" transform="rotate(90)" />
                  <path d="M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z" transform="rotate(180)" />
                  <path d="M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z" transform="rotate(270)" />
                </g>
              </svg>
              <span className="font-sans text-[16px] font-medium tracking-tight text-white leading-none">
                SynapseX
              </span>
            </motion.button>

            {/* Expanding Menu Pill Button (Skiper3 Inspired Layout with Squash Hamburger) */}
            <motion.div
              id="edra-hamburger-btn"
              layout
              initial={false}
              animate={{ 
                width: !isMenuOpen ? 48 : "290px",
                backgroundColor: !isMenuOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.15)"
              }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="h-12 rounded-[14px] flex items-center overflow-hidden backdrop-blur-md relative font-sans"
            >
              {/* Stable, single menu button - NO unmounts, perfect squash animation */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center justify-center text-white cursor-pointer shrink-0 transition-all duration-200 z-10 shadow-none border-none outline-none focus:outline-none active:outline-none ${
                  isMenuOpen 
                    ? "w-9 h-9 rounded-[11px] bg-white/10 hover:bg-white/20 ml-1.5 shadow-none" 
                    : "w-12 h-12 rounded-[14px] shadow-none"
                }`}
                aria-label="Toggle Menu"
              >
                <SquashHamburger isOpen={isMenuOpen} />
              </button>

              {/* Slider content that shows when open */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isMenuOpen ? 1 : 0,
                  x: isMenuOpen ? 0 : 15,
                  pointerEvents: isMenuOpen ? "auto" : "none"
                }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-6 ml-auto pr-6 shrink-0"
              >
                <span 
                  onMouseEnter={() => setIsAboutHovered(true)}
                  onMouseLeave={() => setIsAboutHovered(false)}
                  onClick={() => {
                    const el = document.getElementById("edra-main-scrolling-content");
                    if (el) {
                      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
                    }
                    setIsMenuOpen(false);
                  }}
                  className="font-sans font-normal text-[16px] text-white/85 hover:text-white cursor-pointer transition-colors leading-[1]"
                >
                  <ScrambleText text="About" isHovered={isAboutHovered} className="text-white/85 hover:text-white" />
                </span>
                <span 
                  onMouseEnter={() => setIsMetricsHovered(true)}
                  onMouseLeave={() => setIsMetricsHovered(false)}
                  onClick={() => {
                    window.scrollTo({ top: window.innerHeight * 2, behavior: "smooth" });
                    setIsMenuOpen(false);
                  }}
                  className="font-sans font-normal text-[16px] text-white/85 hover:text-white cursor-pointer transition-colors leading-[1]"
                >
                  <ScrambleText text="Metrics" isHovered={isMetricsHovered} className="text-white/85 hover:text-white" />
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* RIGHT GROUP: Download header pill button */}
          <div id="header-right-group">
            <motion.a
              id="edra-book-demo-pill"
              href="https://www.instagram.com/dmitriyinin"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setIsDownloadHovered(true)}
              onMouseLeave={() => setIsDownloadHovered(false)}
              whileHover={{ scale: 1.03, backgroundColor: "#e2e2e6" }}
              whileTap={{ scale: 0.97 }}
              className="h-12 px-6 bg-white rounded-full flex items-center gap-2.5 cursor-pointer transition-all duration-150 shadow-sm text-black decoration-none"
            >
              <i className="bi bi-apple text-[16px] shrink-0 text-black -translate-y-[1px]"></i>
              <ScrambleText
                text="Download"
                isHovered={isDownloadHovered}
                className="font-sans font-medium text-[16px] text-black normal-case leading-none"
              />
            </motion.a>
          </div>
        </div>

        {/* MOBILE HEADER LAYOUT (visible on screens < sm) */}
        <div id="edra-mobile-header" className="flex sm:hidden items-center justify-between w-full h-full gap-2 relative">
          {/* Combined Left Container (fluid and perfectly balanced to avoid layout shifts) */}
          <div className="flex items-center h-9 flex-grow min-w-0 mr-4 relative">
            {/* Logo Button on Left with smooth pixel-based width and padding collapse to prevent wrapping or snapping */}
            <motion.button
              id="edra-logo-pill-mobile"
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setIsMobileMenuOpen(false);
              }}
              initial={false}
              animate={{ 
                opacity: isMobileMenuOpen ? 0 : 1,
                scale: isMobileMenuOpen ? 0.93 : 1,
                width: isMobileMenuOpen ? 0 : 108,
                marginRight: isMobileMenuOpen ? 0 : 6,
                paddingLeft: isMobileMenuOpen ? 0 : 12,
                paddingRight: isMobileMenuOpen ? 0 : 12,
                pointerEvents: isMobileMenuOpen ? "none" : "auto"
              }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="h-9 bg-white/15 backdrop-blur-md rounded-[10px] flex items-center justify-start gap-1.5 cursor-pointer shrink-0 overflow-hidden shadow-none border-none outline-none whitespace-nowrap flex-nowrap"
            >
              <svg 
                viewBox="-50 -50 100 100" 
                className="w-[14px] h-[14px] text-white shrink-0"
              >
                <g fill="currentColor">
                  <path d="M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z" />
                  <path d="M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z" transform="rotate(90)" />
                  <path d="M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z" transform="rotate(180)" />
                  <path d="M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z" transform="rotate(270)" />
                </g>
              </svg>
              <span className="font-sans text-[13px] font-medium tracking-tight text-white leading-none shrink-0">
                SynapseX
              </span>
            </motion.button>
    
            {/* Inline Mini-Expanding Capsule Menu matching landscape slide mechanics */}
            <motion.div
              id="edra-hamburger-capsule-mobile"
              layout
              initial={false}
              animate={{ 
                width: !isMobileMenuOpen ? 36 : "100%",
                backgroundColor: "rgba(255,255,255,0.15)"
              }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="h-9 rounded-[10px] flex items-center overflow-hidden backdrop-blur-md relative font-sans shadow-none border-none shrink-0"
            >
              {/* Squash Hamburger for mobile inside the capsule container with background */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`flex items-center justify-center text-white cursor-pointer shrink-0 z-10 shadow-none border-none outline-none focus:outline-none active:outline-none transition-all duration-200 ${
                  isMobileMenuOpen 
                    ? "w-7 h-7 rounded-[8px] bg-white/10 hover:bg-white/20 ml-1" 
                    : "w-9 h-9 rounded-[10px]"
                }`}
                aria-label="Toggle Menu Mobile"
              >
                <SquashHamburger isOpen={isMobileMenuOpen} isMobile={true} />
              </button>

              {/* Slider content that shows when open */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isMobileMenuOpen ? 1 : 0,
                  x: isMobileMenuOpen ? 0 : 10,
                  pointerEvents: isMobileMenuOpen ? "auto" : "none"
                }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3.5 ml-auto pr-3.5 shrink-0"
              >
                <span 
                  onClick={() => {
                    const el = document.getElementById("edra-main-scrolling-content");
                    if (el) {
                      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="font-sans font-normal text-[13px] text-white/85 hover:text-white cursor-pointer transition-colors leading-[1]"
                >
                  About
                </span>
                <span 
                  onClick={() => {
                    window.scrollTo({ top: window.innerHeight * 2, behavior: "smooth" });
                    setIsMobileMenuOpen(false);
                  }}
                  className="font-sans font-normal text-[13px] text-white/85 hover:text-white cursor-pointer transition-colors leading-[1]"
                >
                  Metrics
                </span>
              </motion.div>
            </motion.div>
          </div>
 
          {/* Right Mobile Side: Beautifully scaled down Apple Download button (always in its place in the normal layout flow) */}
          <motion.a
            id="edra-book-demo-pill-mobile"
            href="https://www.instagram.com/dmitriyinin"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03, backgroundColor: "#e2e2e6" }}
            whileTap={{ scale: 0.97 }}
            className="h-9 px-3.5 bg-white rounded-full flex items-center gap-1.5 cursor-pointer shadow-none text-black decoration-none shrink-0"
          >
            <i className="bi bi-apple text-[13px] shrink-0 text-black -translate-y-[0.5px]"></i>
            <span className="font-sans font-medium text-[13px] text-black normal-case leading-none">
              Download
            </span>
          </motion.a>
        </div>
      </motion.header>

      {/* MAIN CONTAINER */}
      <motion.main 
        id="edra-main-scrolling-content" 
        initial={{ opacity: 0 }}
        animate={{ opacity: videoEntranceComplete ? 1 : 0 }}
        transition={{ duration: 1.0, ease: "easeOut" }}
        className="relative w-full flex flex-col pt-20 pb-36 px-4 sm:px-8 z-10 pointer-events-auto"
      >
        {/* Ambient background grids */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05] pointer-events-none" />

        {/* SECTION 1: Static Hero Section without perspective */}
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative w-full max-w-7xl mx-auto flex flex-col min-h-[80vh] justify-between pt-8 pb-16 pointer-events-auto"
        >
          <div className="w-full flex-1 flex flex-col justify-between gap-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
              {/* TOP LEFT: Large Main Display Title */}
              <div className="text-left select-none">
                <h1 className="font-sans font-light text-[50px] sm:text-[70px] md:text-[85px] lg:text-[100px] text-white leading-[0.95] tracking-[-0.03em] flex flex-col items-start">
                  <ScrambleIn text="Brain" scrollProgress={scrollProgress} delay={100} trigger={videoEntranceComplete} />
                  <ScrambleIn text="And Body" scrollProgress={scrollProgress} delay={300} trigger={videoEntranceComplete} />
                </h1>
              </div>
              {/* TOP RIGHT: Empty */}
              <div className="hidden md:block"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full mt-auto items-end pt-12">
              {/* BOTTOM LEFT: Product Descriptive Text Block */}
              <motion.div
                style={{ opacity: descOpacity, y: descY }}
                className="max-w-sm text-left pointer-events-auto"
              >
                <motion.p
                  initial={{ opacity: 0, y: 25 }}
                  animate={videoEntranceComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
                  transition={{ duration: 0.9, ease: [0.215, 0.610, 0.355, 1.000], delay: 0.2 }}
                  className="font-sans text-[14px] sm:text-[15px] text-white/60 leading-relaxed"
                >
                  Built at the intersection of neuroscience and artificial intelligence. SynapseX continuously maps neural pathways, cognitive load, and physiological states into a single adaptive intelligence layer.
                </motion.p>
              </motion.div>

              {/* BOTTOM RIGHT: Large Accent Header */}
              <div className="flex flex-col items-end text-right select-none">
                <h2 className="font-sans font-light text-[55px] sm:text-[70px] md:text-[85px] lg:text-[100px] text-white leading-[0.95] tracking-[-0.03em] flex flex-col items-end">
                  <ScrambleIn text="One" scrollProgress={scrollProgress} delay={200} trigger={videoEntranceComplete} />
                  <ScrambleIn text="Network" scrollProgress={scrollProgress} delay={400} trigger={videoEntranceComplete} />
                </h2>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 1.5: Cinematic Scroll Perspective Paragraph Block */}
        <div 
          className="relative w-full max-w-5xl mx-auto py-24 sm:py-32 pointer-events-none"
          style={{
            transformStyle: "preserve-3d",
            perspective: "400px",
          }}
        >
          <motion.div
            style={{
              transformStyle: "preserve-3d",
              transform,
              opacity: cinematicOpacity,
            }}
            className="w-full text-center"
          >
            <h2 className="font-sans font-normal text-[22px] sm:text-[30px] md:text-[36px] lg:text-[42px] text-white leading-[1.35] tracking-[-0.02em] select-none px-6 sm:px-12 text-center">
              A neural-AI interface built on the architecture of the human nervous system. SynapseX translates synaptic activity into computational intelligence. Every signal becomes measurable, structured, and visible. It continuously reconstructs internal state as a dynamic neural map. Biological noise is filtered into actionable cognitive patterns.
            </h2>
          </motion.div>
        </div>

        {/* SECTION 2: Modern Stats screen (Full-Width Swipe Coverflow with no border truncation) */}
        <div className="w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] relative mt-16 pointer-events-auto overflow-hidden">
          <ScrollReveal>
            <StatsGrid />
          </ScrollReveal>
        </div>
      </motion.main>

      {/* INTERACTIVE SCHEDULING DIALOG MODAL */}
      <AnimatePresence>
        {isDemoModalOpen && (
          <div 
            id="demo-modal-wrapper" 
            className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto pointer-events-auto"
          >
            <motion.div
              id="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!bookingSuccess) setIsDemoModalOpen(false);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-[6px]"
            />

            <motion.div
              id="modal-content-card"
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-[460px] bg-[#0d0d0f] border border-white/10 rounded-[24px] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {bookingSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-5">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-serif text-2xl text-white mb-3">
                      Your Demo is Slotted
                    </h3>
                    <p className="text-[13.5px] text-white/60 max-w-[320px] leading-relaxed font-sans px-2">
                      An invitation and spatial design catalog link have been dispatched to <span className="font-semibold text-white">{emailInput}</span>. We're excited to guide you.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="form">
                    <div className="flex items-center justify-between pb-4 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        <h3 className="font-sans font-bold text-[19px] text-white">
                          Schedule a Product Walkthrough
                        </h3>
                      </div>
                      <button
                        id="dismiss-modal-btn"
                        onClick={() => setIsDemoModalOpen(false)}
                        className="w-8 h-8 rounded-full hover:bg-white/[0.04] flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <X className="w-4 h-4 text-white" strokeWidth={1.8} />
                      </button>
                    </div>

                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                      {/* Date Select picker */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider block">
                          Select Preferred Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <input
                            id="demo-date-picker"
                            required
                             type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full bg-white/[0.03] transition-colors focus:bg-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Time Select picker */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider block">
                          Select Time Window
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {["10:00 AM", "11:00 AM", "1:30 PM", "3:30 PM"].map((timeOption) => (
                            <button
                              key={timeOption}
                              id={`time-opt-${timeOption.replace(/[\s:]/g, '-')}`}
                              type="button"
                              onClick={() => setSelectedTime(timeOption)}
                              className={`py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center
                                ${selectedTime === timeOption
                                  ? "bg-white text-black shadow-sm"
                                  : "bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                                }
                              `}
                            >
                              {timeOption}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1.5 text-left pt-2">
                        <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider block">
                          Corporate Email Address
                        </label>
                        <input
                          id="corporate-email-field"
                           required
                          type="email"
                          placeholder="you@company.com"
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value);
                            if (emailError) setEmailError("");
                          }}
                          className={`w-full bg-white/[0.03] transition-colors focus:bg-white/[0.06] rounded-xl px-4 py-3 text-sm text-white outline-none border ${
                            emailError ? "border-red-500/50 focus:border-red-500" : "border-transparent focus:border-white/10"
                          }`}
                        />
                        {emailError && (
                          <motion.span
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-red-400 font-medium block mt-1"
                          >
                            {emailError}
                          </motion.span>
                        )}
                      </div>

                      {/* Submit form trigger */}
                      <button
                        id="submit-booking-btn"
                        type="submit"
                        className="w-full h-12 bg-white hover:bg-zinc-100 rounded-xl font-bold text-[12px] uppercase tracking-[0.14em] text-black cursor-pointer mt-6 flex items-center justify-center gap-2 transition-all"
                      >
                        Confirm Slot Request
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
