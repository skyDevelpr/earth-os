"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hls from "hls.js";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Media layer configuration
const BACKGROUNDS = [
  { id: "hero", type: "video", playbackId: "u00pmsw00Uvr9CJkKgHEEVMrmnTjQzVPTAZ301005S4EjFM", overlay: false },
  { id: "about", type: "video", playbackId: "9WxTFb6OWNtU00jzN9FipwesSwpAuf002rI99qkRxMj1Y", overlay: false },
  { id: "what_we_do", type: "color", color: "var(--brand-dark-blue)", overlay: false },
  { id: "showcase", type: "color", color: "var(--brand-yellow)", overlay: false },
  { id: "team", type: "video", playbackId: "401m2zKPY6dGA00dL7Iihrb00p4LEAHaVYLugAovjAd9wU", overlay: false },
  { id: "collaborations", type: "video", playbackId: "BF02ixx7qhj8tO2b02tmY5qDdygS2nXS5m1zuPJfGmDko", overlay: false },
  { id: "awards", type: "color", color: "#d2e4f4", overlay: false },
  { id: "presses", type: "video", playbackId: "uKkmm51HPsTGQzUqQMxVUV8eI01BykKYUGKvFALbiP7U", overlay: false },
  { id: "footer", type: "video", playbackId: "IKwT5z3LAi601P01OKfmNbH02rHsMhgMbyQmGXJVfJGilk", overlay: true },
];

// Sub-component to handle cross-browser HLS stream rendering
function HLSVideo({ playbackId, className = "" }: { playbackId: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = `https://stream.mux.com/${playbackId}.m3u8`;
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        maxMaxBufferLength: 8, // Keep buffer small for low memory usage
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => console.log("Auto-play blocked:", err));
      });
    } else if (video.canPlayType("application/x-mpegURL")) {
      // Native fallback (Safari desktop/iOS)
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((err) => console.log("Auto-play blocked:", err));
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [playbackId]);

  return (
    <video
      ref={videoRef}
      loop
      muted
      playsInline
      className={className}
    />
  );
}

export default function BackgroundTransition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (!containerRef.current) return;

    // Set initial opacities: hero is 1, all others are 0
    BACKGROUNDS.forEach((bg) => {
      const el = layerRefs.current[bg.id];
      if (el) {
        gsap.set(el, { opacity: bg.id === "hero" ? 1 : 0 });
      }
    });

    const triggers: ScrollTrigger[] = [];

    // Create ScrollTriggers for each section to cross-fade layers
    BACKGROUNDS.forEach((bg) => {
      const sectionId = `#${bg.id}`;
      const targetEl = layerRefs.current[bg.id];

      if (!targetEl) return;

      const trigger = ScrollTrigger.create({
        trigger: sectionId,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => {
          BACKGROUNDS.forEach((otherBg) => {
            const otherEl = layerRefs.current[otherBg.id];
            if (otherEl) {
              gsap.to(otherEl, {
                opacity: otherBg.id === bg.id ? 1 : 0,
                duration: 1.0,
                ease: "power2.out",
              });
            }
          });
        },
        onEnterBack: () => {
          BACKGROUNDS.forEach((otherBg) => {
            const otherEl = layerRefs.current[otherBg.id];
            if (otherEl) {
              gsap.to(otherEl, {
                opacity: otherBg.id === bg.id ? 1 : 0,
                duration: 1.0,
                ease: "power2.out",
              });
            }
          });
        },
      });

      triggers.push(trigger);
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-screen z-[-10] pointer-events-none overflow-hidden select-none bg-brand-dark-blue"
      aria-hidden="true"
    >
      {/* 1. Dynamic Media/Color Layers */}
      {BACKGROUNDS.map((bg) => (
        <div
          key={bg.id}
          ref={(el) => {
            layerRefs.current[bg.id] = el;
          }}
          style={{ backgroundColor: bg.type === "color" ? bg.color : undefined }}
          className="absolute inset-0 w-full h-full transition-opacity will-change-opacity overflow-hidden"
        >
          {bg.type === "video" && bg.playbackId && (
            <HLSVideo
              playbackId={bg.playbackId}
              className="w-full h-full object-cover"
            />
          )}
          {bg.overlay && (
            <div className="absolute inset-0 bg-black/80" />
          )}
        </div>
      ))}

      {/* 2. Premium Noise Texture Grain Overlay */}
      <div className="absolute inset-0 noise-animation opacity-[0.06] bg-repeat bg-[size:60px] md:bg-[size:80px] lg:bg-[size:100px]" style={{ backgroundImage: "url(/images/noise.png)" }} />
    </div>
  );
}
