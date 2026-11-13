"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Ensure ScrollTrigger is registered
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 1. Initialize Lenis
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential smoothing ease
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    // 2. Sync ScrollTrigger update with Lenis scroll
    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    // 3. Add Lenis RAF handling to GSAP ticker
    const updatePhysics = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updatePhysics);

    // 4. Disable GSAP lag smoothing to maintain scroll sync alignment
    gsap.ticker.lagSmoothing(0);

    // Ensure initial scroll reset
    window.scrollTo(0, 0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updatePhysics);
    };
  }, []);

  return <>{children}</>;
}
