import React, { useState, useEffect, useRef, useCallback } from "react";

interface ScrambleTextProps {
  text: string;
  isHovered: boolean;
  className?: string;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";

export function ScrambleText({ text, isHovered, className = "" }: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef(0);

  const stopScramble = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayText(text);
  }, [text]);

  const startScramble = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    frameRef.current = 0;
    const targetLength = text.length;
    
    // Each character will be decoded at a specific target frame.
    // Index i decodes at frame: i * 4. This creates a left-to-right progressive decoding.
    // Total frames will be targetLength * 4 + 4 (to let final characters settle and show correctly)
    const totalFrames = targetLength * 4 + 4;

    intervalRef.current = setInterval(() => {
      frameRef.current += 1;
      const currentFrame = frameRef.current;

      const scrambled = text
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";
          
          // Progressive decoding threshold
          const decodeFrame = index * 4;
          
          if (currentFrame >= decodeFrame) {
            return char;
          }
          
          // Return a random character
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      setDisplayText(scrambled);

      if (currentFrame >= totalFrames) {
        stopScramble();
      }
    }, 25); // ~40 FPS animation frequency
  }, [text, stopScramble]);

  useEffect(() => {
    if (isHovered) {
      startScramble();
    } else {
      stopScramble();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, startScramble, stopScramble]);

  return (
    <span className={className}>
      {displayText}
    </span>
  );
}
