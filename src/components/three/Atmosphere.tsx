"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A fresnel shell that darkens where the surface turns away from the camera.
 *
 * The instinct with a celestial body is to reach for an additive glow, but
 * this theme is ivory paper: additive blending can only add light, and there
 * is almost no headroom above #fdfcf9 to add it into. A bright rim over this
 * ground is invisible at best, and at worst — once the shell is pushed far
 * enough out to be seen at all — it reads as a glass marble.
 *
 * What does read on paper is ink. So the shell subtracts instead: a tight,
 * cool limb darkening drawn back-side with normal blending, so the body gets
 * a soft halo the way an engraved plate holds ink at a curve. Earth is the
 * one body that also takes a light term, because it genuinely has an
 * atmosphere to catch the sun.
 */
export function Atmosphere({
  radius,
  color,
  opacityRef,
  strength = 0.3,
  power = 4.2,
  thickness = 1.045,
  /** Optional lit-side scatter, for bodies with real air. */
  scatter,
}: {
  radius: number;
  /** The colour the limb bleeds toward. */
  color: string;
  opacityRef: React.RefObject<number>;
  /** Peak alpha at the limb. */
  strength?: number;
  /** Falloff exponent — higher pins the darkening to the very edge. */
  power?: number;
  /** Shell radius as a multiple of the body radius. */
  thickness?: number;
  scatter?: { color: string; strength: number };
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uScatter: { value: new THREE.Color(scatter?.color ?? color) },
      uScatterAmt: { value: scatter?.strength ?? 0 },
      uStrength: { value: strength },
      uPower: { value: power },
      uOpacity: { value: 0 },
      // Matches the key light's rest position, so the scatter sits on the
      // same side of the body the sun is lighting.
      uLight: { value: new THREE.Vector3(4.5, 2.4, 4).normalize() },
    }),
    [color, strength, power, scatter?.color, scatter?.strength],
  );

  useFrame(() => {
    if (mat.current) {
      const o = opacityRef.current ?? 0;
      mat.current.uniforms.uOpacity.value = o;
      mat.current.visible = o > 0.01;
    }
  });

  return (
    <mesh scale={thickness}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        vertexShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          varying vec3 vWorldNormal;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3  uColor;
          uniform vec3  uScatter;
          uniform float uScatterAmt;
          uniform float uStrength;
          uniform float uPower;
          uniform float uOpacity;
          uniform vec3  uLight;
          varying vec3 vNormal;
          varying vec3 vView;
          varying vec3 vWorldNormal;
          void main() {
            // Back-side rendering flips the normal, so negate it before
            // taking the view-facing term.
            vec3  n   = normalize(-vNormal);
            float f   = 1.0 - max(dot(n, normalize(vView)), 0.0);
            float rim = pow(f, uPower);

            // How much of this bit of limb is in sunlight.
            float lit = max(dot(normalize(-vWorldNormal), uLight), 0.0);

            vec3  c = mix(uColor, uScatter, uScatterAmt * lit);
            float a = rim * uStrength * uOpacity;
            // The lit limb of a body with air is brighter, not darker, so
            // ease its alpha back down where the sun catches it.
            a *= mix(1.0, 0.55, uScatterAmt * lit);

            gl_FragColor = vec4(c, a);
          }
        `}
      />
    </mesh>
  );
}
