"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CLIENTS = [
  { name: "Louis Vuitton", logo: "https://images.prismic.io/fromanother-2026/aZX9osFoBIGEgiIZ_LV.png?auto=format,compress" },
  { name: "OnePlus", textOnly: true },
  { name: "Chanel", textOnly: true },
  { name: "Glossier", logo: "https://images.prismic.io/fromanother-2026/aZX98cFoBIGEgiIq_Glossier.png?auto=format,compress" },
  { name: "La Mer", textOnly: true },
  { name: "L’Oreal", logo: "https://images.prismic.io/fromanother-2026/aZX9jsFoBIGEgiIY_L%27Oreal.png?auto=format,compress" },
  { name: "Dior", logo: "https://images.prismic.io/fromanother-2026/aZX-PMFoBIGEgiIx_Dior.png?auto=format,compress" },
  { name: "Oppo", logo: "https://images.prismic.io/fromanother-2026/aZX-TsFoBIGEgiI0_Oppo.png?auto=format,compress" },
  { name: "The North Face", logo: "https://images.prismic.io/fromanother-2026/aZX-XMFoBIGEgiI6_TheNorthFace.png?auto=format,compress" },
  { name: "88rising", textOnly: true },
  { name: "Oribe", textOnly: true },
];

export default function Collaborations() {
  const pinRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!pinRef.current) return;

    // Pin Collaborations on desktop for circular scroll wheel animation
    const trigger = ScrollTrigger.create({
      trigger: pinRef.current,
      start: "top top",
      end: "+=300%",
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const prog = self.progress;
        setProgress(prog);

        const activeIdx = Math.min(
          Math.floor(prog * CLIENTS.length),
          CLIENTS.length - 1
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
      id="collaborations"
      className="relative w-full h-screen md:h-[300vh] bg-brand-dark-blue text-brand-yellow select-none"
    >
      {/* Sticky container for desktop scroll wheel */}
      <div className="md:sticky md:top-0 md:left-0 w-full h-screen flex flex-col justify-between p-[var(--padding-x)] py-16 overflow-hidden">
        
        {/* Top Header */}
        <div className="w-full max-w-[120rem] mx-auto flex justify-between items-center z-10">
          <div className="flex items-center gap-4 text-brand-yellow font-herbik italic text-[1.2rem] font-medium opacity-60">
            <span>5</span>
            <div className="w-6 h-[1px] bg-brand-yellow" />
            <span>They Trust Us</span>
          </div>
        </div>

        {/* Desktop Circular Wheel Layout */}
        <div className="hidden md:flex flex-1 items-center justify-between max-w-[120rem] mx-auto w-full relative">
          
          {/* Left Arc Menu: Circular names wheel */}
          <div className="relative w-1/2 h-[50rem] flex items-center">
            <div className="absolute left-[5vw] top-1/2 w-[58rem] h-0 flex items-center justify-start origin-left">
              {CLIENTS.map((client, idx) => (
                <div
                  key={client.name}
                  style={{
                    "--index": idx,
                    "--progress": progress,
                    "--total-items": CLIENTS.length,
                  } as React.CSSProperties}
                  className={`absolute left-0 top-1/2 select-none pointer-events-none transition-all duration-300 will-change-transform font-twk text-[5.5rem] lg:text-[7.2rem] uppercase leading-none tracking-tighter origin-left whitespace-nowrap --rel-index --theta --x --y
                    ${
                      idx === activeIndex
                        ? "text-brand-yellow opacity-100 scale-105"
                        : "text-brand-yellow/20 opacity-30 scale-100"
                    }
                  `}
                  // Renders parametric circular layout coordinates based on CSS variables
                  // --rel-index: calc(var(--index) - var(--progress, 0) * (var(--total-items) - 1))
                  // --radius: 58rem
                  // --theta: calc(var(--rel-index) * 11deg)
                  // --x: calc(var(--radius) * (1 - cos(var(--theta))))
                  // --y: calc(var(--radius) * sin(var(--theta)))
                  // transform: translate(calc(-1 * var(--x)), calc(-50% + var(--y))) rotate(calc(var(--theta)))
                >
                  <span
                    style={{
                      transform: `
                        translate(
                          calc(-58rem * (1.0 - cos(${(idx - progress * (CLIENTS.length - 1)) * 11}deg))),
                          calc(-50% + calc(58rem * sin(${(idx - progress * (CLIENTS.length - 1)) * 11}deg)))
                        )
                        rotate(${(idx - progress * (CLIENTS.length - 1)) * 11}deg)
                      `,
                      transformOrigin: "center left",
                    }}
                    className="inline-block transition-transform duration-300"
                  >
                    {client.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Area: Displays Active Logo / Details */}
          <div className="w-[35rem] h-[35rem] flex items-center justify-center relative border border-brand-yellow/10 rounded-lg p-12 bg-brand-yellow/[0.01]">
            {CLIENTS.map((client, idx) => (
              <div
                key={client.name}
                className={`absolute inset-0 flex items-center justify-center p-12 transition-all duration-700 ease-out-quart ${
                  idx === activeIndex ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
              >
                {client.logo ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={client.logo}
                      alt={`${client.name} logo`}
                      fill
                      className="object-contain filter invert"
                      sizes="300px"
                    />
                  </div>
                ) : (
                  <span className="text-[3.2rem] lg:text-[4rem] font-semibold uppercase tracking-widest font-twk text-center leading-none text-brand-yellow/80">
                    {client.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Graceful Fallback Grid (repeats columns vertically) */}
        <div className="md:hidden flex-1 flex flex-col justify-center items-center gap-12 w-full max-w-[40rem] mx-auto py-12">
          <p className="text-[1.4rem] leading-[1.5em] font-light opacity-70 text-center">
            From multinational companies to independent brands, we have been fortunate to work in a diversity of projects and clients.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full justify-items-center items-center">
            {CLIENTS.map((client) => (
              <div
                key={client.name}
                className="w-full aspect-square flex items-center justify-center border border-brand-yellow/10 rounded p-4 bg-brand-yellow/[0.02]"
              >
                {client.logo ? (
                  <div className="relative w-full h-[60%] opacity-50">
                    <Image
                      src={client.logo}
                      alt={`${client.name} logo`}
                      fill
                      className="object-contain filter invert"
                      sizes="100px"
                    />
                  </div>
                ) : (
                  <span className="text-[1.4rem] font-semibold uppercase tracking-widest opacity-40 font-twk text-center">
                    {client.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Pagination */}
        <div className="w-full max-w-[120rem] mx-auto flex justify-center gap-2 z-10">
          {CLIENTS.map((p, idx) => (
            <div
              key={p.name}
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
