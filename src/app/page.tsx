import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { About } from "@/components/sections/About";
import { Missions } from "@/components/sections/Missions";
import { Chronicle } from "@/components/sections/Chronicle";
import { AwardsPreview } from "@/components/sections/AwardsPreview";
import { GalleryStrip } from "@/components/sections/GalleryStrip";
import { Books } from "@/components/sections/Books";
import { ContactCTA } from "@/components/sections/ContactCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <About />
      <Missions />
      <Chronicle />
      <AwardsPreview />
      <GalleryStrip />
      <Books />
      <ContactCTA />
    </>
  );
}
