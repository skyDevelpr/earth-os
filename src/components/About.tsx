"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function About() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scroll-linked slide up reveal for split words
    const anim = gsap.fromTo(
      containerRef.current.querySelectorAll(".about-word"),
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.0,
        ease: "power3.out",
        stagger: 0.02,
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

  const headingText = "We craft work that defines the now and shapes what is next.";
  const descriptionText =
    "Driven by curiosity, not formula. We explore where creativity and technology collide — across brand, film, immersive spaces, and whatever medium the work demands next.";

  return (
    <section
      id="about"
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col justify-center px-[var(--padding-x)] py-32"
    >
      {/* Container spacing */}
      <div className="w-full max-w-[90rem] mx-auto flex flex-col gap-12 text-center items-center justify-center">
        {/* Section indicator index */}
        <div className="flex items-center gap-4 text-brand-yellow font-herbik italic text-[1.2rem] font-medium opacity-60">
          <span>1</span>
          <div className="w-6 h-[1px] bg-brand-yellow" />
          <span>About</span>
        </div>

        {/* Big H2 headline */}
        <h2 className="text-[3.2rem] md:text-[5rem] lg:text-[8.8rem] font-semibold leading-[1.0em] uppercase tracking-tighter font-twk">
          <span className="flex flex-wrap justify-center gap-x-[0.25em] overflow-hidden py-2">
            {headingText.split(" ").map((word, i) => (
              <span key={i} className="overflow-hidden inline-block py-[0.1em] -my-[0.1em]">
                <span className="about-word inline-block transform translate-y-[110%] opacity-0">
                  {word}
                </span>
              </span>
            ))}
          </span>
        </h2>

        {/* Description body paragraph */}
        <p className="text-[1.4rem] md:text-[1.8rem] lg:text-[2.2rem] leading-[1.4em] font-light max-w-[34rem] md:max-w-[70rem] opacity-70">
          <span className="flex flex-wrap justify-center gap-x-[0.25em] overflow-hidden">
            {descriptionText.split(" ").map((word, i) => (
              <span key={i} className="overflow-hidden inline-block py-[0.1em] -my-[0.1em]">
                <span className="about-word inline-block transform translate-y-[110%] opacity-0 font-normal">
                  {word}
                </span>
              </span>
            ))}
          </span>
        </p>
      </div>
    </section>
  );
}
