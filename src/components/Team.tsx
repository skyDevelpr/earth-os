"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import WebGLImage from "./WebGLImage";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TEAM_ITEMS = [
  {
    location: "Saigon",
    title: "Footing",
    desc: "Saigon is where we found our footing. Fast, ambitious, never satisfied — shaped how we work and what we expect from ourselves.",
    image: "https://images.prismic.io/fromanother-2026/abvHx7bci2UF6QeN_Team_01.jpg?auto=format,compress",
  },
  {
    location: "Hong Kong",
    title: "Partnership",
    desc: "What started in China as a creative partnership which became the foundation of everything we've built. The curiosity never stops there.",
    image: "https://images.prismic.io/fromanother-2026/abpGZLbci2UF6KTT_02.jpg?auto=format,compress",
  },
  {
    location: "Paris",
    title: "Roots",
    desc: "But good work doesn't stay in one place — and neither did we. We go wherever the next brief takes us.",
    image: "https://images.prismic.io/fromanother-2026/abvHxrbci2UF6QeL_Team_03.jpg?auto=format,compress",
  },
  {
    location: "Global",
    title: "People",
    desc: "The offices gave us roots in new places. The people gave us reasons to keep going.",
    image: "https://images.prismic.io/fromanother-2026/abvHx7bci2UF6QeM_Team_04.jpg?auto=format,compress",
  },
];

export default function Team() {
  const pinRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!pinRef.current) return;

    // Pin Team section on desktop for 300vh scroll
    const trigger = ScrollTrigger.create({
      trigger: pinRef.current,
      start: "top top",
      end: "+=300%",
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const prog = self.progress;
        setProgress(prog);

        // Determine active card index (0 to 3)
        const activeIdx = Math.min(
          Math.floor(prog * TEAM_ITEMS.length),
          TEAM_ITEMS.length - 1
        );
        setActiveIndex(activeIdx);
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <section
      ref={pinRef}
      id="team"
      className="relative w-full h-screen md:h-[300vh] bg-brand-dark-blue text-brand-yellow select-none"
    >
      {/* Sticky container for desktop scroll rig */}
      <div className="md:sticky md:top-0 md:left-0 w-full h-screen flex flex-col justify-between p-[var(--padding-x)] py-16 overflow-hidden">
        
        {/* Top Header */}
        <div className="w-full max-w-[120rem] mx-auto flex justify-between items-center z-10">
          <div className="flex items-center gap-4 text-brand-yellow font-herbik italic text-[1.2rem] font-medium opacity-60">
            <span>4</span>
            <div className="w-6 h-[1px] bg-brand-yellow" />
            <span>Our Team</span>
          </div>
          <span className="text-[1.2rem] font-medium uppercase tracking-widest opacity-50">
            {activeIndex + 1} / {TEAM_ITEMS.length}
          </span>
        </div>

        {/* Middle Content area (splits into left text and right diagonal cards) */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-[120rem] mx-auto w-full gap-16 relative">
          
          {/* Left Text Block */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6 items-start justify-center z-10">
            <h2 className="text-[3.6rem] md:text-[5.6rem] lg:text-[7.2rem] font-semibold leading-[0.95em] uppercase tracking-tighter font-twk">
              Driven by <br />
              <span className="italic font-normal font-herbik text-brand-yellow/85 lowercase">
                creative
              </span>{" "}
              curiosity
            </h2>

            {/* Display active card description */}
            <div className="relative h-[12rem] w-full max-w-[40rem] overflow-hidden mt-4">
              {TEAM_ITEMS.map((item, idx) => (
                <div
                  key={item.location}
                  className={`absolute inset-0 transition-all duration-700 ease-out-quart flex flex-col gap-2 ${
                    idx === activeIndex
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                >
                  <span className="text-[1.2rem] font-semibold uppercase tracking-widest text-brand-yellow/50">
                    {item.location} — {item.title}
                  </span>
                  <p className="text-[1.4rem] md:text-[1.6rem] leading-[1.5em] font-light opacity-80">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right diagonal cross-scroll card stack */}
          <div className="w-full lg:w-1/2 h-[35rem] relative flex items-center justify-center">
            <div className="relative w-[25.5rem] h-[27.8rem]">
              {TEAM_ITEMS.map((item, idx) => (
                <div
                  key={item.location}
                  style={{
                    // Pass current scroll progress and indices directly to CSS variables
                    "--index": idx,
                    "--progress": progress,
                    "--last-index": 3,
                    "--stack-gap": "3.2rem",
                    "--width": "25.5rem",
                    "--height": "27.8rem",
                  } as React.CSSProperties}
                  className="absolute inset-0 rounded-lg overflow-hidden border border-brand-yellow/10 transition-all duration-300 will-change-transform shadow-2xl md:translate-x-[calc(calc(100%_+_var(--stack-gap))*calc(var(--index)_-_var(--progress)*var(--last-index)))] md:translate-y-[calc(calc(100%_+_var(--stack-gap))*calc(var(--index)_-_var(--progress)*var(--last-index)))]"
                >
                  <WebGLImage
                    src={item.image}
                    alt={item.location}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Subtle info label on cards */}
                  <div className="absolute bottom-4 left-4 text-white text-[1.2rem] font-semibold uppercase tracking-wider bg-black/40 px-3 py-1 rounded">
                    {item.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Pagination */}
        <div className="w-full max-w-[120rem] mx-auto flex justify-center gap-2 z-10">
          {TEAM_ITEMS.map((p, idx) => (
            <div
              key={p.location}
              className={`h-[1px] transition-all duration-500 bg-brand-yellow ${
                idx === activeIndex ? "w-10 opacity-100" : "w-6 opacity-30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
