"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The orbit path, drawn as a trail that burns brightest just behind the
 * spacecraft and fades away around the far side of the ring.
 *
 * A uniformly-dashed circle — what this replaced — describes the geometry but
 * carries no motion: it looks the same whether the craft is moving or parked.
 * Fading the line by angular distance behind the rider turns the same ring
 * into a record of where it has just been, so the orbit reads as a direction
 * of travel even in a still frame.
 *
 * `uHead` is the rider's current angle; the shader measures each vertex's
 * signed angular lag behind it and ramps alpha over `uTrail` radians.
 */
export function OrbitTrail({
  radius,
  headRef,
  opacityRef,
  segments = 320,
  trail = Math.PI * 1.35,
  color = "#1e3c6f",
  hotColor = "#9a7526",
}: {
  radius: number;
  /** Current angle of the rider, radians. */
  headRef: React.RefObject<number>;
  opacityRef: React.RefObject<number>;
  segments?: number;
  /** Arc length of the visible trail, radians. */
  trail?: number;
  color?: string;
  hotColor?: string;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const line = useRef<THREE.Line>(null);

  const geom = useMemo(() => {
    const pos = new Float32Array((segments + 1) * 3);
    const ang = new Float32Array(segments + 1);
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * radius;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = Math.sin(a) * radius;
      ang[i] = a;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aAngle", new THREE.BufferAttribute(ang, 1));
    return g;
  }, [radius, segments]);

  const uniforms = useMemo(
    () => ({
      uHead: { value: 0 },
      uTrail: { value: trail },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uHot: { value: new THREE.Color(hotColor) },
    }),
    [trail, color, hotColor],
  );

  useFrame(() => {
    if (!mat.current) return;
    const o = opacityRef.current ?? 0;
    mat.current.uniforms.uHead.value = headRef.current ?? 0;
    mat.current.uniforms.uOpacity.value = o;
    mat.current.visible = o > 0.02;
    if (line.current) line.current.visible = o > 0.02;
  });

  return (
    // @ts-expect-error — R3F's `line` intrinsic collides with the SVG line type
    <line ref={line} geometry={geom} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={/* glsl */ `
          attribute float aAngle;
          uniform float uHead;
          uniform float uTrail;
          varying float vFade;
          void main() {
            // Signed lag behind the head, wrapped into [0, 2PI).
            float lag = mod(uHead - aAngle, 6.28318530718);
            // 1 at the head, 0 once the trail has run out.
            float t = 1.0 - clamp(lag / uTrail, 0.0, 1.0);
            // Ease so the tail thins out rather than stopping dead.
            vFade = t * t * (3.0 - 2.0 * t);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uOpacity;
          uniform vec3  uColor;
          uniform vec3  uHot;
          varying float vFade;
          void main() {
            if (vFade <= 0.001) discard;
            // The last few degrees behind the craft strike toward brass —
            // the same metal the spacecraft's foil is wrapped in.
            vec3 c = mix(uColor, uHot, smoothstep(0.72, 1.0, vFade));
            gl_FragColor = vec4(c, vFade * uOpacity * 0.85);
          }
        `}
      />
    </line>
  );
}
