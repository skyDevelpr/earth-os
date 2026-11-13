"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;

    const progressAnim = gsap.fromTo(
      barRef.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "html",
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      }
    );

    return () => {
      progressAnim.scrollTrigger?.kill();
      progressAnim.kill();
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-[0.2rem] z-[10000] pointer-events-none">
      <div
        ref={barRef}
        className="h-full w-full bg-brand-yellow origin-left transform scale-x-0"
      />
    </div>
  );
}
