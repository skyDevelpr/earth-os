"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Reuse RollingText component for custom luxury hovers
function RollingText({ text }: { text: string }) {
  return (
    <span className="block overflow-hidden relative h-[1.4em] leading-[1.2em]">
      <span className="block transition-transform duration-700 cubic-bezier(0.165, 0.84, 0.44, 1) group-hover:-translate-y-full">
        <span className="block">{text}</span>
      </span>
      <span className="block absolute top-0 left-0 transition-transform duration-700 cubic-bezier(0.165, 0.84, 0.44, 1) translate-y-full group-hover:translate-y-0">
        <span className="block">{text}</span>
      </span>
    </span>
  );
}

const OFFICES = [
  {
    country: "Vietnam",
    address: "Midtown, Phu My Hung, Ho Chi Minh City",
    phone: "+84 91 992 2034",
  },
  {
    country: "China",
    address: "193 Lockhart Road, Hong Kong",
    phone: "+86 186 1622 2144",
  },
  {
    country: "France",
    address: "64-66 Rue des Archives, 75003 Paris, France",
    phone: "+33 56 326 4235",
  },
];

export default function Footer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Stagger slide-up elements inside footer
    const anim = gsap.fromTo(
      containerRef.current.querySelectorAll(".footer-reveal"),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
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
      id="footer"
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col justify-between px-[var(--padding-x)] pt-32 pb-12 bg-brand-dark-blue text-brand-yellow select-none"
    >
      <div className="w-full max-w-[120rem] mx-auto flex flex-col gap-24 flex-1 justify-center">
        {/* Top: Large Call to Action Statement */}
        <div className="flex flex-col gap-8">
          <h2 className="footer-reveal text-[4.5rem] md:text-[8rem] lg:text-[10rem] font-semibold leading-[0.9em] uppercase tracking-tighter font-twk max-w-[100rem]">
            Let’s create <br />
            something <span className="italic font-normal font-herbik lowercase text-brand-yellow/85">impactful</span> <br />
            together.
          </h2>

          <div className="footer-reveal flex flex-col gap-2 mt-4 items-start">
            <span className="text-[1.2rem] font-medium uppercase tracking-widest opacity-50">
              Contact us
            </span>
            <a
              href="mailto:firstcontact@fromanother.love"
              className="group text-[2rem] md:text-[3.2rem] lg:text-[4.5rem] font-semibold tracking-tight border-b border-brand-yellow/20 pb-2"
            >
              <RollingText text="firstcontact@fromanother.love" />
            </a>
          </div>
        </div>

        {/* Middle: Physical Offices Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-brand-yellow/10 pt-16">
          {OFFICES.map((office) => (
            <div key={office.country} className="footer-reveal flex flex-col gap-4">
              <h3 className="text-[1.8rem] font-semibold uppercase tracking-wider font-twk">
                {office.country}
              </h3>
              <p className="text-[1.4rem] leading-[1.5em] font-light opacity-70">
                {office.address}
              </p>
              <a
                href={`tel:${office.phone.replace(/\s+/g, "")}`}
                className="text-[1.3rem] font-medium opacity-50 hover:opacity-100 transition-opacity"
              >
                {office.phone}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Social Follows & Copyright Info */}
      <div className="w-full max-w-[120rem] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-t border-brand-yellow/10 pt-12 mt-16 text-[1.2rem] uppercase tracking-widest opacity-60">
        {/* Social channels */}
        <div className="flex flex-col gap-2 items-start">
          <span className="text-[1rem] font-medium opacity-50 normal-case mb-1">
            Follow us
          </span>
          <div className="flex gap-8">
            <a href="#" className="group hover:opacity-100">
              <RollingText text="Instagram" />
            </a>
            <a href="#" className="group hover:opacity-100">
              <RollingText text="LinkedIn" />
            </a>
            <a href="#" className="group hover:opacity-100">
              <RollingText text="Facebook" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-right">
          <p>© 2026 All rights reserved. fromanother.</p>
        </div>
      </div>
    </section>
  );
}
