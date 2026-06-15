import React, { useEffect, useRef, useState } from "react";

interface LiquidVideoCanvasProps {
  videoUrl: string;
  scrollProgress: number;
  onVideoError?: () => void;
  onVideoReady?: () => void;
  onEntranceComplete?: () => void;
}

const checkIsMobile = () => {
  if (typeof window === "undefined") return false;
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const smallScreen = window.innerWidth < 1024; // tablets and mobiles included
  return mobileUA || smallScreen;
};

export function LiquidVideoCanvas({ 
  videoUrl, 
  scrollProgress, 
  onVideoError,
  onVideoReady,
  onEntranceComplete
}: LiquidVideoCanvasProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetPercentRef = useRef(0);
  const smoothPercentRef = useRef(0);
  const consecutiveErrorsRef = useRef(0);
  const [isMobile, setIsMobile] = useState(() => checkIsMobile());
  const isMobileRef = useRef(isMobile);

  // Keep ref of isMobile in sync without triggers
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  // Keep refs of callback props to avoid resetting main playback loop when callbacks change
  const onVideoReadyRef = useRef(onVideoReady);
  const onEntranceCompleteRef = useRef(onEntranceComplete);
  const onVideoErrorRef = useRef(onVideoError);

  useEffect(() => {
    onVideoReadyRef.current = onVideoReady;
    onEntranceCompleteRef.current = onEntranceComplete;
    onVideoErrorRef.current = onVideoError;
  }, [onVideoReady, onEntranceComplete, onVideoError]);

  const entrancePhaseRef = useRef<"loading" | "animating" | "complete">("loading");
  const entranceStartTimeRef = useRef<number | null>(null);
  const hasNotifiedReadyRef = useRef(false);

  // Listen to window resize to determine mobile state reactively
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset landing sequence metrics cleanly if target source url updates
  useEffect(() => {
    entrancePhaseRef.current = "loading";
    entranceStartTimeRef.current = null;
    hasNotifiedReadyRef.current = false;
  }, [videoUrl]);

  // Keep targetPercent updated based on scroll progress from parent container
  useEffect(() => {
    targetPercentRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset video state when source changes
    if (videoUrl) {
      video.currentTime = 0;
      video.preload = "auto";
      video.load(); // Request browser to aggressively cache and preload frames
    }

    let rafId: number;
    let isSeeking = false;
    let nextSeekTime: number | null = null;

    // Failsafe safety timeout: if video takes too long to load, show content anyway
    const safetyTimeout = setTimeout(() => {
      if (entrancePhaseRef.current === "loading") {
        console.log("Failsafe: video ready sequence forced.");
        entrancePhaseRef.current = "animating";
        entranceStartTimeRef.current = performance.now();
        if (onVideoReadyRef.current && !hasNotifiedReadyRef.current) {
          hasNotifiedReadyRef.current = true;
          onVideoReadyRef.current();
        }
      }
    }, 3500);

    const checkViewportAndConfig = () => {
      video.autoplay = false;
      video.pause();
    };

    const handleSeeking = () => {
      isSeeking = true;
    };

    const handleSeeked = () => {
      isSeeking = false;
      if (nextSeekTime !== null) {
        const target = nextSeekTime;
        nextSeekTime = null;
        if (video.readyState >= 1 && video.duration > 0) {
          isSeeking = true;
          video.currentTime = target;
        }
      }
    };

    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("loadedmetadata", checkViewportAndConfig);
    checkViewportAndConfig();

    // High performance animation loop coordinating video frame seeks on all devices/resolutions
    const tick = () => {
      const targetPercent = targetPercentRef.current;
      let smoothPercent = smoothPercentRef.current;

      // Super clean, high-performance LERP
      smoothPercent += (targetPercent - smoothPercent) * 0.12;

      if (Math.abs(targetPercent - smoothPercent) < 0.0001) {
        smoothPercent = targetPercent;
      }

      smoothPercentRef.current = smoothPercent;

      // Stretch video blur timing so the second screen remains highly readable (subtle base blur up to 5px),
      // and deep cinematic 55px blur applies only as we scroll towards the last screen.
      const subtleBaseProgress = Math.max(0, Math.min(1, (smoothPercent - 0.1) / 0.45));
      const progressiveFactor = Math.max(0, Math.min(1, (smoothPercent - 0.55) / 0.4));
      
      const blurVal = (subtleBaseProgress * 5) + (progressiveFactor * 50); // buttery smooth responsive blur up to 55px at the very end
      const scaleVal = 1.03 + Math.max(0, Math.min(1, (smoothPercent - 0.1) / 0.9)) * 0.08; // gorgeous scale adjustment

      // Entrance zoom-out and fade-in calculation
      let entranceZoom = 1.0;
      let entranceOpacity = 1.0;

      if (entrancePhaseRef.current === "loading") {
        entranceZoom = 1.12; // starts slightly zoomed-in to introduce cinema feel
        entranceOpacity = 0; // starts invisible to avoid browser black frame flashing
        
        if (video && video.readyState >= 3) {
          entrancePhaseRef.current = "animating";
          entranceStartTimeRef.current = performance.now();
          if (onVideoReadyRef.current && !hasNotifiedReadyRef.current) {
            hasNotifiedReadyRef.current = true;
            onVideoReadyRef.current();
          }
        }
      }

      if (entrancePhaseRef.current === "animating") {
        const startTime = entranceStartTimeRef.current || performance.now();
        const duration = 1400; // 1.4 seconds optimized premium cinematic duration
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Decelerating cubic ease out curve: smooth and elegant
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        entranceZoom = 1.12 - 0.12 * easeOut; // gracefully transitions back to 1.0
        entranceOpacity = Math.min(1.0, elapsed / 500); // fade in video opacity over 0.5 seconds

        if (progress >= 1) {
          entrancePhaseRef.current = "complete";
          if (onEntranceCompleteRef.current) {
            onEntranceCompleteRef.current();
          }
        }
      }

      // Apply style values directly to the DOM to bypass React lifecycle latency and avoid layout stutters
      if (video) {
        video.style.filter = `blur(${blurVal}px)`;
        video.style.transform = `scale(${scaleVal * entranceZoom})`;
        video.style.opacity = `${entranceOpacity}`;
      }

      if (video.readyState >= 1 && video.duration > 0) {
        const calculatedTime = smoothPercent * video.duration;
        const clampedTime = Math.max(0, Math.min(video.duration, calculatedTime));
        
        // Only trigger heavy browser seek operation if difference is meaningful
        if (Math.abs(video.currentTime - clampedTime) > 0.008) {
          if (!isSeeking && !video.seeking) {
            isSeeking = true;
            video.currentTime = clampedTime;
          } else {
            nextSeekTime = clampedTime;
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const handleResize = () => {
      checkViewportAndConfig();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(safetyTimeout);
      cancelAnimationFrame(rafId);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("loadedmetadata", checkViewportAndConfig);
      window.removeEventListener("resize", handleResize);
    };
  }, [videoUrl]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.warn("LiquidVideoCanvas: Video source error or load interruption.", e);
    consecutiveErrorsRef.current += 1;
    
    // Prevent infinite error looping by only retrying up to 3 times
    if (consecutiveErrorsRef.current <= 3 && onVideoError) {
      console.log("Attempting automatic self-healing recovery...");
      setTimeout(() => {
        onVideoError();
      }, 1000);
    }
  };

  const handleLoadedData = () => {
    // Reset error count on successful load
    consecutiveErrorsRef.current = 0;
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden select-none bg-black z-[1]">
      <video
        ref={videoRef}
        src={videoUrl || undefined}
        id="scrubbable-liquid-video"
        loop
        muted
        playsInline
        preload="auto"
        onError={handleVideoError}
        onLoadedData={handleLoadedData}
        style={{
          opacity: 0,
          willChange: "transform, filter, opacity",
        }}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
    </div>
  );
}
