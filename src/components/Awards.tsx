"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const AWARDS_LIST = [
  { platform: "Awwwards", name: "Site of the Day", project: "monopo Saigon", year: "2022" },
  { platform: "FWA", name: "Site of the Day", project: "monopo Saigon", year: "2022" },
  { platform: "CSS Design Awards", name: "Site of the Day", project: "monopo Saigon", year: "2022" },
  { platform: "FWA", name: "Site of the Day", project: "fromanother", year: "2024" },
  { platform: "Awwwards", name: "Developer Award", project: "fromanother", year: "2024" },
];

export default function Awards() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Stagger fade-in award items
    const anim = gsap.fromTo(
      containerRef.current.querySelectorAll(".award-item-row"),
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
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
      id="awards"
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col justify-center px-[var(--padding-x)] py-32 bg-[#d2e4f4] text-brand-dark-blue"
    >
      <div className="w-full max-w-[120rem] mx-auto flex flex-col gap-16">
        {/* Section Header */}
        <div className="flex justify-between items-center border-b border-brand-dark-blue/15 pb-8">
          <div className="flex items-center gap-4 font-herbik italic text-[1.2rem] font-medium">
            <span>6</span>
            <div className="w-6 h-[1px] bg-brand-dark-blue" />
            <span>Awards</span>
          </div>
        </div>

        {/* Awards list column */}
        <div className="flex flex-col w-full">
          {AWARDS_LIST.map((award, index) => (
            <div
              key={index}
              className="award-item-row grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 py-8 border-b border-brand-dark-blue/15 hover:bg-brand-dark-blue/[0.03] transition-all duration-300 items-center px-4"
            >
              {/* Year */}
              <span className="font-herbik italic text-[1.6rem] md:text-[2.2rem] opacity-60">
                {award.year}
              </span>

              {/* Platform */}
              <h3 className="text-[2rem] md:text-[2.8rem] font-semibold uppercase tracking-tight font-twk">
                {award.platform}
              </h3>

              {/* Award name */}
              <span className="text-[1.4rem] md:text-[1.8rem] font-normal opacity-85">
                {award.name}
              </span>

              {/* Project name */}
              <span className="text-[1.2rem] md:text-[1.6rem] font-medium uppercase tracking-widest opacity-60 md:text-right">
                {award.project}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
