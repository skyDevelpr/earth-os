"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// Rolling Text component for premium roll-up/down hover effect
function RollingText({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <span className="block overflow-hidden relative h-[1.4em] leading-[1.2em]">
      <span
        className={`block transition-transform duration-700 cubic-bezier(0.165, 0.84, 0.44, 1) ${
          active ? "-translate-y-full" : "group-hover:-translate-y-full"
        }`}
      >
        <span className="block">{text}</span>
      </span>
      <span
        className={`block absolute top-0 left-0 transition-transform duration-700 cubic-bezier(0.165, 0.84, 0.44, 1) ${
          active ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"
        }`}
      >
        <span className="block">{text}</span>
      </span>
    </span>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle scrolling behavior on body when menu is active
  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add("lenis-stopped");
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.classList.remove("lenis-stopped");
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.classList.remove("lenis-stopped");
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* 1. Global Header Bar */}
      <header className="fixed top-0 left-0 w-full z-[9990] flex items-center justify-between px-[var(--padding-x)] py-8 mix-blend-difference">
        {/* Left Side: Hamburger Menu Button */}
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="group flex items-center gap-4 cursor-pointer focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {/* Hamburger Icon */}
            <span className="relative flex flex-col justify-center gap-[0.4rem] w-8 h-4 overflow-hidden">
              <span
                className={`h-[1px] w-6 bg-brand-yellow transition-transform duration-500 ease-out-quart ${
                  isOpen ? "rotate-45 translate-y-[0.25rem] scale-x-75" : ""
                }`}
              />
              <span
                className={`h-[1px] w-6 bg-brand-yellow transition-transform duration-500 ease-out-quart ${
                  isOpen ? "-rotate-45 -translate-y-[0.25rem] scale-x-75" : ""
                }`}
              />
            </span>

            {/* Menu Sliding Text */}
            <span className="text-[1.2rem] font-medium uppercase tracking-[0.1em] text-brand-yellow font-twk">
              {!isOpen ? <RollingText text="Menu" /> : <RollingText text="Close" />}
            </span>
          </button>
        </div>

        {/* Center: Brand Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/" className="block w-[12rem] h-[2rem] md:w-[15rem] md:h-[2.5rem] relative">
            <Image
              src="/logos/main-logo.svg"
              alt="fromanother logo"
              fill
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* Right Side: Let's Chat Action Link */}
        <div>
          <a
            href="mailto:firstcontact@fromanother.love"
            className="group flex items-center gap-2 cursor-pointer font-twk uppercase text-[1.2rem] font-medium tracking-[0.1em]"
          >
            <RollingText text="Let's chat" />
            <span className="relative w-4 h-4 overflow-hidden">
              {/* Arrow transition */}
              <Image
                src="/icons/arrow_right.svg"
                alt="Arrow"
                width={12}
                height={12}
                className="absolute top-0 left-0 transition-transform duration-500 ease-out-quart group-hover:translate-x-full group-hover:-translate-y-full"
              />
              <Image
                src="/icons/arrow_right.svg"
                alt="Arrow"
                width={12}
                height={12}
                className="absolute top-0 left-0 -translate-x-full translate-y-full transition-transform duration-500 ease-out-quart group-hover:translate-x-0 group-hover:translate-y-0"
              />
            </span>
          </a>
        </div>
      </header>

      {/* 2. Full-Page Menu Overlay */}
      <div
        className={`fixed inset-0 w-full h-screen bg-brand-dark-blue text-brand-yellow z-[9980] flex flex-col justify-between p-[var(--padding-x)] pt-[15vh] pb-[8vh] transition-transform duration-1000 cubic-bezier(0.76, 0, 0.24, 1) ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Navigation Links */}
        <nav className="flex flex-col gap-6 md:gap-10 max-w-[80rem] mx-auto w-full">
          <ul className="flex flex-col gap-4 md:gap-8 font-twk uppercase font-semibold text-[4rem] md:text-[8rem] tracking-tight leading-[0.85em]">
            <li className="overflow-hidden group">
              <Link
                href="#hero"
                onClick={() => setIsOpen(false)}
                className="inline-block transition-transform duration-700 ease-out-quart group-hover:translate-x-4"
              >
                <RollingText text="Home" />
              </Link>
            </li>
            <li className="overflow-hidden group">
              <Link
                href="#showcase"
                onClick={() => setIsOpen(false)}
                className="inline-block transition-transform duration-700 ease-out-quart group-hover:translate-x-4"
              >
                <RollingText text="Work" />
              </Link>
            </li>
            <li className="overflow-hidden group">
              <Link
                href="#about"
                onClick={() => setIsOpen(false)}
                className="inline-block transition-transform duration-700 ease-out-quart group-hover:translate-x-4"
              >
                <RollingText text="About" />
              </Link>
            </li>
            <li className="overflow-hidden group">
              <Link
                href="/earth-os"
                onClick={() => setIsOpen(false)}
                className="inline-block transition-transform duration-700 ease-out-quart group-hover:translate-x-4 text-[#00d4ff]"
              >
                <RollingText text="Earth OS ↗" />
              </Link>
            </li>
          </ul>
        </nav>

        {/* Footer info in Menu */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 max-w-[80rem] mx-auto w-full border-t border-brand-yellow/10 pt-8">
          <div>
            <p className="font-herbik italic text-[1.4rem] md:text-[1.8rem] opacity-60 normal-case mb-2">
              Contact us
            </p>
            <a
              href="mailto:firstcontact@fromanother.love"
              className="text-[1.6rem] md:text-[2.2rem] font-medium tracking-tight common-link-effect"
            >
              firstcontact@fromanother.love
            </a>
          </div>
          <div className="flex gap-8 text-[1.2rem] md:text-[1.4rem] uppercase tracking-wider opacity-60">
            <a href="#" className="hover:opacity-100 transition-opacity">
              Instagram
            </a>
            <a href="#" className="hover:opacity-100 transition-opacity">
              LinkedIn
            </a>
            <a href="#" className="hover:opacity-100 transition-opacity">
              Facebook
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
