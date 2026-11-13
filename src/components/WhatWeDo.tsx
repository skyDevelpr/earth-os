"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CATEGORIES = [
  {
    num: "01",
    subNum: "2.1",
    title: "Direction",
    services: ["Art Direction", "Design Concept", "Commercials & CGI", "Brand Identity"],
  },
  {
    num: "02",
    subNum: "2.2",
    title: "Digital",
    services: ["Web Experience", "Social Media", "Asset Production"],
  },
  {
    num: "03",
    subNum: "2.3",
    title: "Offline",
    services: ["Immersive Event", "Interactive Art", "OOH / Billboard", "Print Ads"],
  },
];

export default function WhatWeDo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Stagger fade-in columns on scroll
    const anim = gsap.fromTo(
      containerRef.current.querySelectorAll(".what-we-do-col"),
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          end: "bottom 25%",
        },
      }
    );

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []);

  return (
    <section
      id="what_we_do"
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col justify-center px-[var(--padding-x)] py-32"
    >
      <div className="w-full max-w-[120rem] mx-auto flex flex-col gap-16">
        {/* Section Header */}
        <div className="flex items-center justify-between w-full border-b border-brand-yellow/10 pb-8">
          <div className="flex items-center gap-4 text-brand-yellow font-herbik italic text-[1.2rem] font-medium opacity-60">
            <span>2</span>
            <div className="w-6 h-[1px] bg-brand-yellow" />
            <span>What We Do</span>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-x-16 lg:gap-x-24">
          {CATEGORIES.map((cat, idx) => (
            <div
              key={cat.title}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="what-we-do-col flex flex-col gap-8 transition-all duration-700 ease-out-quart"
              style={{
                opacity: hoveredIdx !== null && hoveredIdx !== idx ? 0.35 : 1,
                filter: hoveredIdx !== null && hoveredIdx !== idx ? "blur(2px)" : "none",
              }}
            >
              {/* Header inside column */}
              <div className="flex justify-between items-end border-b border-brand-yellow/10 pb-4">
                <span className="font-herbik italic text-[1.4rem] opacity-60">
                  {cat.subNum}
                </span>
                <h3 className="text-[2.8rem] lg:text-[4rem] font-semibold uppercase tracking-tight font-twk">
                  {cat.title}
                </h3>
              </div>

              {/* Services List */}
              <ul className="flex flex-col gap-3">
                {cat.services.map((service, sIdx) => (
                  <li
                    key={service}
                    style={{ "--i": sIdx } as React.CSSProperties}
                    className="text-[1.6rem] md:text-[1.8rem] lg:text-[2.2rem] font-light opacity-80 hover:opacity-100 hover:text-brand-blue hover:translate-x-2 transition-all duration-300 flex items-center gap-3 cursor-default"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/30" />
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
