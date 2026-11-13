"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";

export default function PageLoader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Progress counting animation
    const obj = { val: 0 };
    const progressTween = gsap.to(obj, {
      val: 100,
      duration: 2.2,
      ease: "power2.out",
      onUpdate: () => {
        setProgress(Math.floor(obj.val));
      },
    });

    // 2. Wipe reveal exit animation upon completion
    const exitTween = gsap.to(".loader-container", {
      yPercent: -100,
      duration: 1.0,
      ease: "power4.inOut",
      delay: 2.4,
      onComplete: onComplete,
    });

    // Stagger fade-in text elements
    gsap.fromTo(
      ".loader-text",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1.0, ease: "power3.out", stagger: 0.2 }
    );

    return () => {
      progressTween.kill();
      exitTween.kill();
    };
  }, [onComplete]);

  return (
    <div className="loader-container fixed inset-0 w-full h-screen bg-brand-dark-blue text-brand-yellow z-[9999] flex flex-col justify-between p-[var(--padding-x)] py-16 overflow-hidden select-none">
      {/* Top message */}
      <div className="overflow-hidden">
        <p className="loader-text font-herbik italic text-[1.6rem] md:text-[2rem] opacity-80">
          Hello, welcome to fromanother!
        </p>
      </div>

      {/* Middle/Bottom: Progress Tracker */}
      <div className="flex flex-col gap-6 w-full max-w-[80rem] mx-auto">
        <div className="flex justify-between items-end">
          <p className="loader-text text-[1.2rem] uppercase tracking-widest opacity-60">
            Initialising experiences
          </p>
          <p className="text-[6rem] md:text-[10rem] font-semibold leading-[0.8em] tracking-tighter">
            {progress}%
          </p>
        </div>

        {/* Progress bar line */}
        <div className="w-full h-[1px] bg-brand-yellow/20 relative">
          <div
            className="h-full bg-brand-yellow absolute top-0 left-0 transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
