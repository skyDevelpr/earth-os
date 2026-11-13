"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";

export default function Hero() {
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const words = ["AGENCY", "STUDIO", "COLLECTIVE"];
  const videoRef = useRef<HTMLVideoElement>(null);

  // Rotate active word (AGENCY -> STUDIO -> COLLECTIVE)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Title entrance animation on mount
  useEffect(() => {
    gsap.fromTo(
      ".hero-reveal",
      { opacity: 0, y: 50, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power4.out", stagger: 0.15, delay: 0.5 }
    );
  }, []);

  // Sync scroll lock for theater mode
  useEffect(() => {
    if (isTheaterOpen) {
      document.documentElement.classList.add("lenis-stopped");
      if (videoRef.current) videoRef.current.play();
    } else {
      document.documentElement.classList.remove("lenis-stopped");
      if (videoRef.current) videoRef.current.pause();
    }
  }, [isTheaterOpen]);

  return (
    <>
      <section
        id="hero"
        className="relative h-screen w-full flex items-center justify-center px-[var(--padding-x)] overflow-hidden"
      >
        {/* Main Hero Container */}
        <div className="w-full max-w-[129.6rem] relative flex flex-col justify-between h-[60%]">
          {/* Top details: Languages */}
          <div className="absolute top-0 right-0 flex items-center gap-4 text-[1rem] md:text-[1.6rem] font-herbik italic font-medium opacity-80">
            <span className="hover:opacity-100 transition-opacity cursor-pointer">VN</span>
            <div className="w-[1px] h-4 bg-brand-yellow/30" />
            <span className="hover:opacity-100 transition-opacity cursor-pointer">CN</span>
            <div className="w-[1px] h-4 bg-brand-yellow/30" />
            <span className="hover:opacity-100 transition-opacity cursor-pointer">FR</span>
          </div>

          {/* Big Typography Header */}
          <div className="my-auto">
            <h1 className="text-[4.5rem] md:text-[8rem] lg:text-[11rem] font-semibold leading-[0.9em] uppercase tracking-tighter select-none font-twk">
              <div className="overflow-hidden block">
                <span className="hero-reveal block">We are an</span>
              </div>
              <div className="overflow-hidden block">
                <span className="hero-reveal block italic font-normal text-brand-yellow/90">
                  Artist — led
                </span>
              </div>
              <div className="overflow-hidden flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="hero-reveal block">Creative</span>

                {/* Inline loop video box overlay */}
                <span className="hero-reveal inline-flex items-center">
                  <button
                    onClick={() => setIsTheaterOpen(true)}
                    type="button"
                    className="relative inline-block w-[7rem] h-[3rem] md:w-[12rem] md:h-[5rem] lg:w-[22.7rem] lg:h-[7.9rem] bg-brand-yellow/20 rounded-[0.4rem] overflow-hidden border border-brand-yellow/30 hover:scale-105 hover:border-brand-yellow transition-all duration-300 cursor-pointer"
                    aria-label="Toggle featured video"
                  >
                    <video
                      loop
                      muted
                      playsInline
                      autoPlay
                      className="absolute inset-0 w-full h-full object-cover"
                    >
                      <source
                        src="https://stream.mux.com/Z02DKxTDFK3IuRBMPa4sqOaOTxiE00kPZcjQZ00Kj2EUxM/medium.mp4"
                        type="video/mp4"
                      />
                    </video>
                  </button>
                </span>
              </div>

              {/* Rotating word list */}
              <div className="overflow-hidden block">
                <span className="hero-reveal flex items-center gap-4 text-brand-yellow">
                  <span className="relative inline-grid overflow-hidden h-[1.1em] w-full max-w-[50rem]">
                    {words.map((word, idx) => (
                      <span
                        key={word}
                        style={{ gridColumn: "1/-1", gridRow: "1/-1" }}
                        className={`transition-all duration-700 ease-out-quart transform block ${
                          idx === activeWordIndex
                            ? "translate-y-0 opacity-100 filter-none"
                            : "translate-y-[100%] opacity-0 filter blur-[10px]"
                        }`}
                      >
                        {word}
                      </span>
                    ))}
                  </span>
                </span>
              </div>
            </h1>
          </div>

          {/* Bottom details: Founding date */}
          <div className="absolute bottom-0 left-0 font-herbik italic text-[1.2rem] md:text-[1.6rem] font-medium opacity-80">
            Since 2020
          </div>
        </div>
      </section>

      {/* 3. Full-Screen Theater Modal */}
      {isTheaterOpen && (
        <div className="fixed inset-0 w-full h-screen bg-black/95 z-[9995] flex items-center justify-center p-[var(--padding-x)]">
          <button
            onClick={() => setIsTheaterOpen(false)}
            className="absolute top-8 right-8 font-twk uppercase text-[1.4rem] md:text-[1.8rem] tracking-wider text-white hover:opacity-60 transition-opacity cursor-pointer focus:outline-none"
          >
            Close
          </button>

          {/* Main Video Container */}
          <div className="w-full max-w-[120rem] aspect-video relative rounded-lg overflow-hidden border border-white/10 shadow-2xl">
            <video
              ref={videoRef}
              controls
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source
                src="https://stream.mux.com/Z02DKxTDFK3IuRBMPa4sqOaOTxiE00kPZcjQZ00Kj2EUxM/medium.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
      )}
    </>
  );
}
