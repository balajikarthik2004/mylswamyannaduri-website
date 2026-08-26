import type { Metadata } from "next";
import { EngagementsClient } from "@/components/pages/EngagementsClient";

export const metadata: Metadata = {
  title: "Engagements & Availability",
  description:
    "Dr. Mylswamy Annadurai's public engagement diary and live availability. See open dates, pick a slot, and send a request to his office.",
};

export default function EngagementsPage() {
  return <EngagementsClient />;
}
