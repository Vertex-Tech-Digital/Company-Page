import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Projects } from "@/components/sections/Projects";
import { Methodology } from "@/components/sections/Methodology";
import { WhyUs } from "@/components/sections/WhyUs";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { ParticleNetwork } from "@/components/sections/ParticleNetwork";

export default function Home() {
  return (
    <main className="min-h-screen text-foreground font-sans">
      <ParticleNetwork />
      <Navbar />
      <Hero />
      <Services />
      <Projects />
      <Methodology />
      <WhyUs />
      <Contact />
      <Footer />
    </main>
  );
}
