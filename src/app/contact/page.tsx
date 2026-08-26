import type { Metadata } from "next";
import { ContactClient } from "@/components/pages/ContactClient";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Speaking invitations, advisory roles and press enquiries for Dr. Mylswamy Annadurai.",
};

export default function ContactPage() {
  return <ContactClient />;
}
