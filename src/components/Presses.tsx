"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import WebGLImage from "./WebGLImage";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const PRESS_ITEMS = [
  { name: "L’officiel", image: "https://images.prismic.io/fromanother-2026/aUEJM3NYClf9oPbv_press-1.jpg?auto=format,compress" },
  { name: "TED Talk", image: "https://images.prismic.io/fromanother-2026/aUEJN3NYClf9oPb1_press-5.jpg?auto=format,compress" },
  { name: "Biti’s", image: "https://images.prismic.io/fromanother-2026/aUEJM3NYClf9oPbv_press-1.jpg?auto=format,compress" },
  { name: "Nowness", image: "https://images.prismic.io/fromanother-2026/aUEJN3NYClf9oPb1_press-5.jpg?auto=format,compress" },
  { name: "MixMag", image: "https://images.prismic.io/fromanother-2026/aUEJM3NYClf9oPbv_press-1.jpg?auto=format,compress" },
  { name: "3D for Designers", image: "https://images.prismic.io/fromanother-2026/aUEJN3NYClf9oPb1_press-5.jpg?auto=format,compress" },
  { name: "Girlsclub Asia", image: "https://images.prismic.io/fromanother-2026/aUEJM3NYClf9oPbv_press-1.jpg?auto=format,compress" },
  { name: "TEDX Salon", image: "https://images.prismic.io/fromanother-2026/aUEJN3NYClf9oPb1_press-5.jpg?auto=format,compress" },
];

export default function Presses() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const floatingRef = useRef<HTMLDivElement>(null);

  // Track mouse coordinates for cursor-following thumbnail
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Smooth spring movement using GSAP on the floating div
    if (floatingRef.current) {
      gsap.to(floatingRef.current, {
        x: x - 100, // Center offset
        y: y - 80,
        duration: 0.6,
        ease: "power3.out",
      });
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Stagger fade-in links
    const anim = gsap.fromTo(
      containerRef.current.querySelectorAll(".press-item-row"),
      { opacity: 0, filter: "blur(10px)" },
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.0,
        ease: "power3.out",
        stagger: 0.08,
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
      id="presses"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full flex flex-col justify-center px-[var(--padding-x)] py-32 bg-brand-dark-blue text-brand-yellow overflow-hidden"
    >
      <div className="w-full max-w-[120rem] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 relative">
        {/* Left: Index & Header */}
        <div className="lg:col-span-5 flex flex-col gap-6 items-start">
          <div className="flex items-center gap-4 text-brand-yellow font-herbik italic text-[1.2rem] font-medium opacity-60">
            <span>7</span>
            <div className="w-6 h-[1px] bg-brand-yellow" />
            <span>We are on</span>
          </div>

          <h2 className="text-[3.6rem] md:text-[5.6rem] lg:text-[7.2rem] font-semibold leading-[0.95em] uppercase tracking-tighter font-twk">
            Press & <br />
            <span className="italic font-normal font-herbik text-brand-yellow/85 lowercase">
              features
            </span>
          </h2>
        </div>

        {/* Right: Interactive List */}
        <div className="lg:col-span-7 flex flex-col gap-4 presses-list-container relative">
          {PRESS_ITEMS.map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => {
                setActiveImage(item.image);
                setIsHovered(true);
              }}
              onMouseLeave={() => {
                setIsHovered(false);
              }}
              className="press-item-row group flex items-end justify-between py-6 border-b border-brand-yellow/10 transition-all duration-700 ease-out-quart cursor-pointer select-none"
            >
              {/* Heading */}
              <h4 className="text-[2.4rem] md:text-[4rem] lg:text-[5.6rem] font-semibold uppercase tracking-tight font-twk leading-none">
                {item.name}
              </h4>

              {/* Detail indicator */}
              <span className="text-[1.2rem] font-medium uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                Read article
              </span>
            </div>
          ))}
        </div>

        {/* Floating Cursor Follower WebGL Thumbnail */}
        <div
          ref={floatingRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 50,
          }}
          className={`hidden lg:block w-[20rem] h-[15rem] rounded-lg overflow-hidden border border-brand-yellow/30 shadow-2xl transition-all duration-500 will-change-transform ${
            isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          {activeImage && (
            <WebGLImage
              src={activeImage}
              alt="Press feature thumbnail"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

      {/* CSS overrides for Dim and Blur hover effect of list items */}
      <style jsx global>{`
        .presses-list-container:hover .press-item-row:not(:hover) {
          opacity: 0.2;
          filter: blur(4px);
        }
      `}</style>
    </section>
  );
}
