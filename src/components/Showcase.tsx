"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import WebGLImage from "./WebGLImage";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const PROJECTS = [
  {
    num: "01",
    title: "Powered to Play All Day",
    desc: "OnePlus",
    services: ["Creative Direction", "Art Direction", "CGI Production", "Production"],
    image: "https://images.prismic.io/fromanother-2026/abpl77bci2UF6KfN_01_Oneplus-Flute_Thumbnail_small.jpg?auto=format,compress",
  },
  {
    num: "02",
    title: "The Eternal Horse x Marina IFC",
    desc: "Marina IFC",
    services: ["Visual Direction", "Visual Production", "On-site supervise"],
    image: "https://images.prismic.io/fromanother-2026/acT3UpGXnQHGY-3T_10_Horse_Cover_small.jpg?auto=format,compress",
  },
  {
    num: "03",
    title: "Year of the Rabbit",
    desc: "La Mer",
    services: ["Creative Direction", "Art Direction", "Concept CGI Art"],
    image: "https://images.prismic.io/fromanother-2026/abu3Lbbci2UF6QLD_LAmer_01_small.jpg?auto=format,compress",
  },
  {
    num: "04",
    title: "Louis Vuitton Series",
    desc: "Louis Vuitton",
    services: ["Direction", "Production", "Photography"],
    image: "https://images.prismic.io/fromanother-2026/adSsY5GXnQHGZTTP_08_LV_1_small.jpg?auto=format,compress",
  },
  {
    num: "05",
    title: "Oriens Lumina Walks",
    desc: "Moment Factory",
    services: ["Experiential", "Motion Design", "On-set Production", "Lighting Direction"],
    image: "https://images.prismic.io/fromanother-2026/abp_9rbci2UF6LEv_09_Moment-Factory_17_small.jpg?auto=format,compress",
  },
  {
    num: "06",
    title: "Perfection at Play",
    desc: "OnePlus Gauss",
    services: ["Art Direction", "Creative Direction", "CGI Art", "Management", "Production"],
    image: "https://images.prismic.io/fromanother-2026/abptHLbci2UF6KpU_03_Oneplus-Gauss_20_small.jpg?auto=format,compress",
  },
];

export default function Showcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !sliderRef.current) return;

    // Desktop GSAP scroll-pinned slider timeline
    const totalProjects = PROJECTS.length;
    const pinDuration = window.innerHeight * 5;

    const pinTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: `+=${pinDuration}`,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const newIndex = Math.min(
          Math.floor(progress * totalProjects),
          totalProjects - 1
        );
        setActiveIndex(newIndex);
      },
    });

    // Translate slider horizontally
    const translateAnim = gsap.fromTo(
      sliderRef.current,
      { xPercent: 0 },
      {
        xPercent: -80 * (totalProjects - 1),
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${pinDuration}`,
          scrub: 1,
        },
      }
    );

    return () => {
      pinTrigger.kill();
      translateAnim.scrollTrigger?.kill();
      translateAnim.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      id="showcase"
      className="relative min-h-screen w-full bg-brand-yellow text-brand-dark-blue flex flex-col justify-between overflow-hidden select-none py-16 md:py-24"
    >
      {/* Top Header Row */}
      <div className="w-full px-[var(--padding-x)] flex justify-between items-center z-10">
        <div className="flex items-center gap-4 font-herbik italic text-[1.2rem] font-medium">
          <span>3</span>
          <div className="w-6 h-[1px] bg-brand-dark-blue" />
          <span>Featured Work</span>
        </div>

        {/* Ticks progress indicator */}
        <div className="flex gap-2">
          {PROJECTS.map((p, idx) => (
            <div
              key={p.num}
              className={`h-[2px] w-6 transition-all duration-500 ${
                idx === activeIndex ? "bg-brand-dark-blue w-10" : "bg-brand-dark-blue/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Horizontal Slide Container */}
      <div className="flex-1 flex items-center overflow-x-auto md:overflow-x-hidden py-12">
        <div
          ref={sliderRef}
          className="flex gap-8 md:gap-16 px-[var(--padding-x)] will-change-transform"
        >
          {PROJECTS.map((proj, idx) => (
            <div
              key={proj.title}
              className="flex-shrink-0 w-[30rem] md:w-[60rem] lg:w-[80rem] aspect-[16/10] relative rounded-lg overflow-hidden group border border-brand-dark-blue/5 transition-all duration-700"
              style={{
                opacity: activeIndex === idx ? 1 : 0.4,
                scale: activeIndex === idx ? "1" : "0.95",
              }}
            >
              {/* WebGL Image displacement */}
              <WebGLImage
                src={proj.image}
                alt={proj.title}
                className="w-full h-full object-cover"
              />

              {/* Bottom text overlays inside card */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-[1.2rem] uppercase tracking-widest opacity-60">
                  {proj.desc}
                </span>
                <h4 className="text-[2.2rem] md:text-[3.2rem] font-semibold leading-tight mb-2">
                  {proj.title}
                </h4>
                <div className="flex flex-wrap gap-2 text-[1.1rem] opacity-75">
                  {proj.services.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full border border-white/20 bg-white/5">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row showing active details */}
      <div className="w-full px-[var(--padding-x)] flex flex-col md:flex-row justify-between items-start md:items-end gap-6 z-10">
        <div>
          <span className="text-[1.2rem] uppercase tracking-wider opacity-60 block mb-1">
            {PROJECTS[activeIndex].desc}
          </span>
          <h3 className="text-[2.4rem] md:text-[4rem] font-semibold tracking-tight font-twk uppercase">
            {PROJECTS[activeIndex].title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {PROJECTS[activeIndex].services.map((serv) => (
            <span
              key={serv}
              className="text-[1.2rem] font-medium border border-brand-dark-blue/20 rounded-full px-4 py-1"
            >
              {serv}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
