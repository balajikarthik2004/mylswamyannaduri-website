import type { Metadata } from "next";
import { MissionsClient } from "@/components/pages/MissionsClient";

export const metadata: Metadata = {
  title: "Missions",
  description:
    "Chandrayaan-1, Chandrayaan-2, Mangalyaan and three decades of INSAT, IRS and GSAT satellites — the programmes Dr. Mylswamy Annadurai directed at ISRO.",
};

export default function MissionsPage() {
  return <MissionsClient />;
}
