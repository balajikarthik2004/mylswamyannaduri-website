"use client";

import dynamic from "next/dynamic";

/** WebGL never renders on the server — mount it purely on the client. */
const CelestialScene = dynamic(() => import("./CelestialScene"), {
  ssr: false,
  loading: () => null,
});

export function SceneMount() {
  return <CelestialScene />;
}
