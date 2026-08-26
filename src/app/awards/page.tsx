import { Suspense } from "react";
import type { Metadata } from "next";
import { AwardsClient } from "@/components/pages/AwardsClient";

export const metadata: Metadata = {
  title: "Awards & Honours",
  description:
    "The complete record of Dr. Mylswamy Annadurai's awards — Padma Shri, four honorary doctorates, fellowships, and more than eighty national and international honours.",
};

export default function AwardsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60svh]" />}>
      <AwardsClient />
    </Suspense>
  );
}
