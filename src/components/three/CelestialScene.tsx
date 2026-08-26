"use client";

import { Suspense, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, useTexture, AdaptiveDpr, Preload } from "@react-three/drei";
import * as THREE from "three";

import { Spacecraft } from "./Spacecraft";
import { sceneTarget, pointer, setNarrowViewport } from "./scene-store";
import { useMediaQuery } from "@/lib/use-media-query";

/* ── A textured celestial body ─────────────────────────────── */

function Body({
  url,
  bump,
  opacityRef,
  spinSpeed = 0.035,
  radius = 1,
}: {
  url: string;
  bump: number;
  opacityRef: React.RefObject<number>;
  spinSpeed?: number;
  /** Bodies are nested, never coincident, so they can't z-fight. */
  radius?: number;
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
    <mesh ref={mesh} rotation={[0.22, 0, 0.06]}>
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
        roughness={0.95}
        metalness={0}
        transparent
      />
    </mesh>
  );
}

/* ── Orbit ring + spacecraft riding it ─────────────────────── */

function Orbit({ satRef }: { satRef: React.RefObject<number> }) {
  const ring = useRef<THREE.Group>(null);
  const rider = useRef<THREE.Group>(null);
  const line = useRef<THREE.Object3D & { material: THREE.Material & { opacity: number } }>(null);

  const RADIUS = 1.5;
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      pts.push([Math.cos(a) * RADIUS, 0, Math.sin(a) * RADIUS]);
    }
    return pts;
  }, []);

  useFrame((state, dt) => {
    const o = satRef.current ?? 0;
    if (rider.current) {
      const t = state.clock.elapsedTime * 0.36;
      rider.current.position.set(Math.cos(t) * RADIUS, 0, Math.sin(t) * RADIUS);
      // Keep the bus broadside to its direction of travel.
      rider.current.rotation.y = -t + Math.PI / 2;
      rider.current.visible = o > 0.02;
    }
    if (line.current) {
      line.current.material.opacity = o * 0.55;
      line.current.visible = o > 0.02;
    }
    if (ring.current) ring.current.rotation.y += dt * 0.02;
  });

  return (
    <group ref={ring} rotation={[0.38, 0, 0.19]}>
      <Line
        ref={line as never}
        points={points}
        color="#1b3a6b"
        lineWidth={1}
        transparent
        opacity={0}
        dashed
        dashSize={0.085}
        gapSize={0.055}
      />
      <group ref={rider}>
        <Spacecraft opacityRef={satRef} />
      </group>
    </group>
  );
}

/* ── Fine dust motes so the paper never looks empty ────────── */

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
    const N = 420;
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
        size={0.028}
        color="#5c6470"
        transparent
        opacity={0.34}
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
  const moonO = useRef(1);
  const marsO = useRef(0);
  const satO = useRef(1);

  useFrame((_, delta) => {
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
    satO.current = THREE.MathUtils.damp(satO.current, sceneTarget.sat, 4, dt);

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
    <group ref={tilt}>
      <group ref={group}>
        <Suspense fallback={null}>
          <Body url="/tex/moon.jpg" bump={0.028} opacityRef={moonO} spinSpeed={0.035} />
          <Body
            url="/tex/mars.jpg"
            bump={0.02}
            opacityRef={marsO}
            spinSpeed={0.045}
            radius={0.985}
          />
        </Suspense>
        <Orbit satRef={satO} />
      </group>
    </group>
  );
}

/* ── Canvas ─────────────────────────────────────────────────── */

export default function CelestialScene() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const narrow = useMediaQuery("(max-width: 767px)");

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
        {/* Key light — gives the terminator its edge */}
        <directionalLight position={[4.5, 2.4, 4]} intensity={2.5} color="#fff6e8" />
        {/* Cool bounce so the dark limb reads as paper, not void */}
        <directionalLight position={[-5, -1.4, -2]} intensity={0.62} color="#c3d2ea" />
        <ambientLight intensity={0.52} />
        <hemisphereLight args={["#ffffff", "#cfd6e2", 0.35]} />

        <Rig />
        <Dust />

        <AdaptiveDpr pixelated={false} />
        <Preload all />
      </Canvas>
    </div>
  );
}
