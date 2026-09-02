"use client";

import { Suspense, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, AdaptiveDpr, Preload } from "@react-three/drei";
import * as THREE from "three";

import { Spacecraft } from "./Spacecraft";
import { Atmosphere } from "./Atmosphere";
import { Starfield } from "./Starfield";
import { OrbitTrail } from "./OrbitTrail";
import { sceneTarget, pointer, setNarrowViewport } from "./scene-store";
import { useMediaQuery } from "@/lib/use-media-query";

/* ── A textured celestial body ─────────────────────────────── */

function Body({
  url,
  bump,
  opacityRef,
  spinSpeed = 0.035,
  radius = 1,
  glow,
}: {
  url: string;
  bump: number;
  opacityRef: React.RefObject<number>;
  spinSpeed?: number;
  /** Bodies are nested, never coincident, so they can't z-fight. */
  radius?: number;
  /** Limb-darkening shell for this body. */
  glow: {
    color: string;
    strength: number;
    power?: number;
    thickness?: number;
    scatter?: { color: string; strength: number };
  };
}) {
  const map = useTexture(url);
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, dt) => {
    if (mesh.current) mesh.current.rotation.y += dt * spinSpeed * sceneTarget.spin;
    if (mat.current) {
      const o = opacityRef.current ?? 1;
      mat.current.opacity = o;
      mesh.current!.visible = o > 0.01;
    }
  });

  return (
    <group rotation={[0.22, 0, 0.06]}>
      <mesh ref={mesh}>
        <sphereGeometry args={[radius, 128, 128]} />
        {/* Pierced props keep the texture configured declaratively — no
            mutating a hook's return value during render or in an effect. */}
        <meshStandardMaterial
          ref={mat}
          map={map}
          map-colorSpace={THREE.SRGBColorSpace}
          map-anisotropy={8}
          bumpMap={map}
          bumpScale={bump}
          roughness={0.92}
          metalness={0}
          transparent
        />
      </mesh>
      <Atmosphere
        radius={radius}
        color={glow.color}
        strength={glow.strength}
        power={glow.power}
        thickness={glow.thickness}
        scatter={glow.scatter}
        opacityRef={opacityRef}
      />
    </group>
  );
}

/* ── Orbit trail + spacecraft riding it ────────────────────── */

const ORBIT_RADIUS = 1.5;

function Orbit({ satRef }: { satRef: React.RefObject<number> }) {
  const ring = useRef<THREE.Group>(null);
  const rider = useRef<THREE.Group>(null);
  /** Shared with the trail shader so the fade tracks the craft exactly. */
  const head = useRef(0);

  useFrame((state, dt) => {
    const o = satRef.current ?? 0;
    const t = state.clock.elapsedTime * 0.36;
    head.current = t;

    if (rider.current) {
      rider.current.position.set(
        Math.cos(t) * ORBIT_RADIUS,
        0,
        Math.sin(t) * ORBIT_RADIUS,
      );
      // Keep the bus broadside to its direction of travel.
      rider.current.rotation.y = -t + Math.PI / 2;
      rider.current.visible = o > 0.02;
    }
    if (ring.current) ring.current.rotation.y += dt * 0.02;
  });

  return (
    <group ref={ring} rotation={[0.38, 0, 0.19]}>
      <OrbitTrail radius={ORBIT_RADIUS} headRef={head} opacityRef={satRef} />
      <group ref={rider}>
        <Spacecraft opacityRef={satRef} />
      </group>
    </group>
  );
}

/* ── Fine dust motes in the near field ─────────────────────── */

function Dust() {
  const pts = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    // Seeded so the mote field is identical on every render and every visit —
    // Math.random() during render is both impure and needlessly unstable.
    let seed = 0x9e3779b9;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    const N = 260;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (rand() - 0.5) * 22;
      pos[i * 3 + 1] = (rand() - 0.5) * 14;
      pos[i * 3 + 2] = (rand() - 0.5) * 12 - 4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((state) => {
    if (pts.current) {
      pts.current.rotation.y = state.clock.elapsedTime * 0.008;
      pts.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.04;
    }
  });

  return (
    <points ref={pts} geometry={geom}>
      <pointsMaterial
        size={0.026}
        color="#7a8290"
        transparent
        opacity={0.26}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ── The rig: eases the whole system toward the active target ─ */

function Rig() {
  const group = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const moonO = useRef(1);
  const marsO = useRef(0);
  const earthO = useRef(0);
  const satO = useRef(1);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const g = group.current;
    if (!g) return;

    g.position.x = THREE.MathUtils.damp(g.position.x, sceneTarget.x, 2.6, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, sceneTarget.y, 2.6, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, sceneTarget.z, 2.6, dt);

    const s = THREE.MathUtils.damp(g.scale.x, sceneTarget.scale, 2.6, dt);
    g.scale.setScalar(s);

    moonO.current = THREE.MathUtils.damp(moonO.current, sceneTarget.moon, 5.5, dt);
    marsO.current = THREE.MathUtils.damp(marsO.current, sceneTarget.mars, 5.5, dt);
    earthO.current = THREE.MathUtils.damp(earthO.current, sceneTarget.earth, 5.5, dt);
    satO.current = THREE.MathUtils.damp(satO.current, sceneTarget.sat, 4, dt);

    // The key light drifts on a long, slow arc. The terminator is the single
    // most legible thing on a sphere, so moving it — even barely — is what
    // keeps the body from reading as a static bitmap during a long scroll.
    if (key.current) {
      const t = state.clock.elapsedTime * 0.045;
      key.current.position.set(
        4.5 + Math.sin(t) * 1.4,
        2.4 + Math.sin(t * 0.7) * 0.7,
        4 + Math.cos(t) * 1.1,
      );
    }

    // Gentle parallax toward the cursor.
    if (tilt.current) {
      tilt.current.rotation.y = THREE.MathUtils.damp(
        tilt.current.rotation.y,
        pointer.x * 0.16,
        3,
        dt,
      );
      tilt.current.rotation.x = THREE.MathUtils.damp(
        tilt.current.rotation.x,
        -pointer.y * 0.12,
        3,
        dt,
      );
    }
  });

  return (
    <>
      {/* Key light — gives the terminator its edge */}
      <directionalLight
        ref={key}
        position={[4.5, 2.4, 4]}
        intensity={2.6}
        color="#fff4e2"
      />
      {/* Cool bounce so the dark limb reads as paper, not void */}
      <directionalLight position={[-5, -1.4, -2]} intensity={0.6} color="#c3d2ea" />
      {/* Brass kicker from behind: separates the body's silhouette from the
          ivory ground without lifting the whole shaded side. */}
      <directionalLight position={[-3.2, 1.8, -4.5]} intensity={0.85} color="#e0bd76" />
      <ambientLight intensity={0.46} />
      <hemisphereLight args={["#ffffff", "#cfd6e2", 0.32]} />

      <group ref={tilt}>
        <group ref={group}>
          <Suspense fallback={null}>
            <Body
              url="/tex/moon.jpg"
              bump={0.032}
              opacityRef={moonO}
              spinSpeed={0.035}
              /* Airless: the limb gets a whisper of cool ink, nothing more. */
              glow={{ color: "#2c3a52", strength: 0.26, power: 5, thickness: 1.03 }}
            />
            <Body
              url="/tex/mars.jpg"
              bump={0.022}
              opacityRef={marsO}
              spinSpeed={0.045}
              radius={0.985}
              /* A thin dusty atmosphere — warm, and barely there. */
              glow={{
                color: "#5c3b26",
                strength: 0.3,
                power: 4.4,
                thickness: 1.038,
                scatter: { color: "#c97a45", strength: 0.5 },
              }}
            />
            {/* Earth was never mounted, though the texture and an `earth`
                scene preset both existed — the INSAT/IRS panel was showing a
                spacecraft orbiting nothing. */}
            <Body
              url="/tex/earth.jpg"
              bump={0.018}
              opacityRef={earthO}
              spinSpeed={0.04}
              radius={0.97}
              /* The one body here with real air, so it is the one that gets
                 a genuine lit-side scatter as well as a darkened limb. */
              glow={{
                color: "#1f3c66",
                strength: 0.42,
                power: 3.2,
                thickness: 1.07,
                scatter: { color: "#7fb2ef", strength: 0.85 },
              }}
            />
          </Suspense>
          <Orbit satRef={satO} />
        </group>
      </group>
    </>
  );
}

/* ── Canvas ─────────────────────────────────────────────────── */

export default function CelestialScene() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  /* The scene's narrow/wide switch has to be the *layout's* breakpoint, not
     one below it. Every column in the app splits at `lg` (1024px), but this
     read 767px — so between 768 and 1023 the bodies were placed with the
     desktop table, whose x offsets of ±4.6 to ±5.9 assume a gutter that only
     exists on a wide screen. In that band the Moon landed on the copy at
     full strength: over the hero's centred column, and across the missions
     lede. The narrow table is the one written for viewports with nowhere to
     hide a planet, which is exactly what those widths are. */
  const narrow = useMediaQuery("(max-width: 1023px)");

  // Effects here only push into external systems (the scene store, listeners).
  useEffect(() => {
    setNarrowViewport(narrow);
  }, [narrow]);

  useEffect(() => {
    if (narrow) return;
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [narrow]);

  if (reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ contain: "strict" }}
    >
      <Canvas
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 7], fov: 42 }}
        frameloop="always"
      >
        <Rig />
        {/* The far field sits outside the rig so it never inherits the
            per-section pan — the sky stays put while the bodies move. */}
        <Starfield />
        <Dust />

        {/* No bloom or vignette pass here on purpose. Both trade on adding
            light, and over ivory there is no headroom to add it into — they
            cost a full-screen pass and an alpha round-trip to produce an
            effect that is invisible on this ground. Depth on paper comes
            from the ink in the limb shells instead. */}

        <AdaptiveDpr pixelated={false} />
        <Preload all />
      </Canvas>
    </div>
  );
}
