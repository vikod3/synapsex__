import React, { useState, useEffect, useRef } from "react";

interface ScrambleInProps {
  text: string;
  scrollProgress: number;
  delay?: number; // initial delay before scramble-in starts
  className?: string;
  trigger?: boolean; // trigger to control start sequence
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";

export function ScrambleIn({ text, scrollProgress, delay = 0, className = "", trigger = true }: ScrambleInProps) {
  // To avoid layout shifts, we initialize the text as non-breaking spaces of the exact same length as text
  const [displayText, setDisplayText] = useState(() => 
    text.split("").map(c => c === " " ? " " : "\u00A0").join("")
  );
  const [opacity, setOpacity] = useState(1);
  const phaseRef = useRef<"idle" | "scrambling-in" | "revealed" | "scrambling-out" | "hidden">("idle");
  const progressRef = useRef(0); // 0 to 1 progress of the current scramble animation
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep scrollProgress reaction synchronized
  const scrollActive = scrollProgress > 0.015;

  useEffect(() => {
    if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);

    if (!trigger) return;

    if (scrollActive) {
      if (phaseRef.current === "idle") {
        phaseRef.current = "hidden";
        setDisplayText(text.split("").map(c => c === " " ? " " : "\u00A0").join(""));
        setOpacity(0);
      } else if (phaseRef.current === "revealed" || phaseRef.current === "scrambling-in") {
        startAnimation("scrambling-out");
      }
    } else {
      if (phaseRef.current === "idle" || phaseRef.current === "hidden" || phaseRef.current === "scrambling-out") {
        const activeDelay = phaseRef.current === "idle" ? delay : 0;
        startTimeoutRef.current = setTimeout(() => {
          startAnimation("scrambling-in");
        }, activeDelay);
      }
    }

    return () => {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [scrollActive, delay, trigger]);

  const startAnimation = (targetPhase: "scrambling-in" | "scrambling-out") => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    phaseRef.current = targetPhase;
    progressRef.current = 0;
    lastTimeRef.current = performance.now();
    animate();
  };

  const animate = () => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    lastTimeRef.current = now;

    // Advanced duration control for professional, high-performance look
    const duration = phaseRef.current === "scrambling-in" ? 900 : 700;
    progressRef.current = Math.min(1, progressRef.current + delta / duration);

    const t = progressRef.current;

    if (phaseRef.current === "scrambling-in") {
      setOpacity(1);
      // We reveal from left to right.
      // Every character space has a threshold.
      const updated = text
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";

          // Calculate progression marker per character index
          const charThreshold = index / text.length;
          
          if (t >= charThreshold + 0.15) {
            // Over the threshold: resolve to the actual character
            return char;
          } else if (t >= charThreshold - 0.1) {
            // Close to threshold: scramble character actively
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          } else {
            // Still unrevealed: return empty string or non-breaking space
            return "\u00A0";
          }
        })
        .join("");

      setDisplayText(updated);

      if (t >= 1) {
        phaseRef.current = "revealed";
        setDisplayText(text); // Ensure precise fallback match
        return;
      }
    } else if (phaseRef.current === "scrambling-out") {
      // Scramble out deletes from right to left or left to right, scrambling and slowly vanishing
      // Let's do a glamorous progressive left-to-right crumble
      const updated = text
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";

          const charThreshold = index / text.length;

          if (t >= charThreshold + 0.2) {
            // Completely dissolved: blank space
            return "\u00A0";
          } else if (t >= charThreshold - 0.05) {
            // Active scramble glitch
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          } else {
            // Not yet scrambled
            return char;
          }
        })
        .join("");

      setDisplayText(updated);
      
      // Gradually fade opacity to absolute zero during scrambling out
      setOpacity(Math.max(0, 1 - t * 1.5));

      if (t >= 1) {
        phaseRef.current = "hidden";
        setDisplayText(text.split("").map(c => c === " " ? " " : "\u00A0").join(""));
        setOpacity(0);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(animate);
  };

  return (
    <span 
      className={className} 
      style={{ 
        opacity, 
        transition: "opacity 0.1s linear",
        display: "inline-block",
      }}
    >
      {displayText}
    </span>
  );
}
