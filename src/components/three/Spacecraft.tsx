"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Chandrayaan-1, modelled from primitives: a gold multi-layer-insulation
 * cuboid bus, a single solar array on a yoke, a high-gain dish and a
 * star-sensor boom. Cheap enough to render every frame at 60fps, and it
 * reads correctly at the sizes we use it.
 */
export function Spacecraft({ opacityRef }: { opacityRef: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const panel = useRef<THREE.Group>(null);

  const materials = useMemo(() => {
    const foil = new THREE.MeshStandardMaterial({
      color: "#c8a02e",
      metalness: 0.95,
      roughness: 0.28,
      transparent: true,
    });
    const panelMat = new THREE.MeshStandardMaterial({
      color: "#16294d",
      metalness: 0.65,
      roughness: 0.32,
      transparent: true,
    });
    const dish = new THREE.MeshStandardMaterial({
      color: "#e8e6e0",
      metalness: 0.35,
      roughness: 0.45,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const strut = new THREE.MeshStandardMaterial({
      color: "#6a6f78",
      metalness: 0.85,
      roughness: 0.4,
      transparent: true,
    });
    return { foil, panelMat, dish, strut };
  }, []);

  // Keep the shared materials' opacity in sync with the scene cross-fade.
  useFrame((_, dt) => {
    const target = opacityRef.current ?? 0;
    for (const m of Object.values(materials)) {
      m.opacity = target;
      m.visible = target > 0.02;
    }
    if (group.current) group.current.visible = target > 0.02;
    if (panel.current) panel.current.rotation.z += dt * 0.12;
  });

  return (
    <group ref={group} scale={0.17}>
      {/* Bus */}
      <mesh material={materials.foil} castShadow>
        <boxGeometry args={[0.62, 0.66, 0.62]} />
      </mesh>
      {/* Bus edge trim, reads as panel seams */}
      <mesh material={materials.strut}>
        <boxGeometry args={[0.65, 0.06, 0.65]} />
      </mesh>

      {/* Solar array on a yoke */}
      <group ref={panel}>
        <mesh material={materials.strut} position={[0.52, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.42, 8]} />
        </mesh>
        <mesh material={materials.strut} position={[0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.026, 0.026, 0.45, 8]} />
        </mesh>
        <mesh material={materials.panelMat} position={[1.32, 0, 0]}>
          <boxGeometry args={[1.32, 0.5, 0.022]} />
        </mesh>
        {/* Cell striping */}
        {[-0.34, 0, 0.34].map((x) => (
          <mesh key={x} material={materials.strut} position={[1.32 + x, 0, 0.014]}>
            <boxGeometry args={[0.012, 0.5, 0.006]} />
          </mesh>
        ))}
      </group>

      {/* High-gain dish */}
      <group position={[0, -0.52, 0]} rotation={[Math.PI, 0, 0]}>
        <mesh material={materials.strut} position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
        </mesh>
        <mesh material={materials.dish} position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3.1]} />
        </mesh>
        <mesh material={materials.strut} position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.26, 6]} />
        </mesh>
      </group>

      {/* Star-sensor boom */}
      <mesh material={materials.strut} position={[-0.46, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.016, 0.34, 6]} />
      </mesh>
      <mesh material={materials.foil} position={[-0.66, 0.1, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>

      {/* Thruster nozzle */}
      <mesh material={materials.strut} position={[0, 0.4, 0]}>
        <coneGeometry args={[0.06, 0.14, 10, 1, true]} />
      </mesh>
    </group>
  );
}
