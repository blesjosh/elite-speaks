"use client";

import { StarsBackground } from "@/components/animate-ui/backgrounds/stars";
import Features from "@/components/features-12";
import HeroSection from "@/components/hero-section";
import WhyEliteSpeaks from "@/components/why-elite-speaks";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      {/* Background with grid and radial gradient */}
      <StarsBackground className="relative min-h-screen w-full">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
              radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
              radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
            `,
            backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
          }}
        />
        {/* Hero section content */}
        <HeroSection />
      </StarsBackground>

      {/* Other sections */}
      <section className="py-20 px-4 md:px-12 lg:px-24">
        <Features />
      </section>

      <section className="py-20 px-4 md:px-12 lg:px-24 bg-gray-50">
        <WhyEliteSpeaks />
      </section>

      <Footer />
    </>
  );
}
