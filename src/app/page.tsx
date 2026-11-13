"use client";

import { useState } from "react";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ScrollProgress";
import BackgroundTransition from "@/components/BackgroundTransition";
import Header from "@/components/Header";
import PageLoader from "@/components/PageLoader";
import Hero from "@/components/Hero";
import About from "@/components/About";
import WhatWeDo from "@/components/WhatWeDo";
import Showcase from "@/components/Showcase";
import Team from "@/components/Team";
import Collaborations from "@/components/Collaborations";
import Awards from "@/components/Awards";
import Presses from "@/components/Presses";
import Footer from "@/components/Footer";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {/* Preloader Screen */}
      {isLoading && <PageLoader onComplete={() => setIsLoading(false)} />}

      {/* Assembled Page layout (renders immediately underneath the preloader curtain) */}
      <SmoothScroll>
        {/* Core Frame UI */}
        <Header />
        <ScrollProgress />
        <BackgroundTransition />

        {/* Scroll Sections Container */}
        <main className="relative z-10 w-full overflow-x-hidden">
          <Hero />
          <About />
          <WhatWeDo />
          <Showcase />
          <Team />
          <Collaborations />
          <Awards />
          <Presses />
          <Footer />
        </main>
      </SmoothScroll>
    </>
  );
}
