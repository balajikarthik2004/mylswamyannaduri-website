import type { Metadata } from "next";
import { GalleryClient } from "@/components/pages/GalleryClient";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs and talks from the life of Dr. Mylswamy Annadurai — launchpads, control rooms, classrooms and family.",
};

export default function GalleryPage() {
  return <GalleryClient />;
}
