"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A star chart, engraved rather than lit.
 *
 * Stars are bright objects on a dark sky, and the reflex is to draw them
 * additively — but this page is ivory, and additive blending over #fdfcf9 has
 * no headroom to work in. So the field inverts: each star is a fine *dark*
 * speck, the way it would be struck on a printed plate or an observatory
 * chart. That matches the paper the rest of the theme is built on, and it is
 * the only version of this that is visible at all.
 *
 * The previous dust field used a single `pointsMaterial` — every mote the
 * same size, the same value, the same colour, which reads as noise rather
 * than as sky. Three per-vertex attributes fix that while keeping the whole
 * field one draw call:
 *
 *   · size varies, and attenuates with distance, so the field has depth
 *   · colour varies along a warm→cool axis, the way star temperature does
 *   · each star carries a phase, so they scintillate out of step
 */
/**
 * Deterministic per-index noise in [0, 1).
 *
 * Pure by construction: the sky is identical on every render and every visit,
 * without a running seed being mutated across a render the way a classic LCG
 * would need. Each star draws from its own reserved band of indices.
 */
function noise(n: number): number {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function Starfield({
  count = 1400,
  radius = 26,
  opacity = 0.55,
}: {
  count?: number;
  radius?: number;
  opacity?: number;
}) {
  const pts = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);

  const geom = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const mag = new Float32Array(count);
    const phase = new Float32Array(count);

    // Ink, not light: a warm sepia and a cool slate, both dark enough to
    // register against ivory.
    const warm = new THREE.Color("#6b5a3e");
    const cool = new THREE.Color("#3d4a63");
    const c = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const k = i * 8;
      // Distributed through a shell rather than a solid ball, so the near
      // field stays clear of the bodies and the camera.
      const u = noise(k) * 2 - 1;
      const theta = noise(k + 1) * Math.PI * 2;
      const r = radius * (0.55 + noise(k + 2) * 0.45);
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(theta);
      pos[i * 3 + 1] = r * s * Math.sin(theta) * 0.72;
      pos[i * 3 + 2] = r * u;

      // A few bright anchors among many faint ones — a uniform distribution
      // of magnitude is exactly what makes a starfield look procedural.
      const t = noise(k + 3);
      const bright = t > 0.965 ? 1 : t > 0.82 ? 0.55 : 0.26;
      size[i] = (0.55 + noise(k + 4) * 0.9) * (bright > 0.5 ? 2.1 : 1);

      c.copy(warm).lerp(cool, noise(k + 5));
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      mag[i] = bright;
      phase[i] = noise(k + 6) * Math.PI * 2;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aMag", new THREE.BufferAttribute(mag, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    return g;
  }, [count, radius]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uScale: { value: 60 },
    }),
    [opacity],
  );

  useFrame((state, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (pts.current) {
      pts.current.rotation.y += dt * 0.006;
      pts.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.04) * 0.03;
    }
  });

  return (
    <points ref={pts} geometry={geom} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={/* glsl */ `
          attribute vec3  aColor;
          attribute float aSize;
          attribute float aMag;
          attribute float aPhase;
          uniform float uTime;
          uniform float uScale;
          varying vec3  vColor;
          varying float vTwinkle;
          varying float vMag;
          void main() {
            vColor = aColor;
            vMag = aMag;
            // Two detuned sines so the scintillation never falls into an
            // obvious repeating beat.
            float a = sin(uTime * 1.7 + aPhase);
            float b = sin(uTime * 0.9 + aPhase * 2.3);
            vTwinkle = 0.72 + 0.28 * (a * 0.6 + b * 0.4);

            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * uScale * vTwinkle / max(-mv.z, 0.001);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uOpacity;
          varying vec3  vColor;
          varying float vTwinkle;
          varying float vMag;
          void main() {
            // Soft round falloff with a dense core, instead of a hard square.
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            if (d > 0.5) discard;
            float core = smoothstep(0.5, 0.0, d);
            float ink = pow(core, 2.2);
            gl_FragColor = vec4(vColor, ink * uOpacity * vMag * vTwinkle);
          }
        `}
      />
    </points>
  );
}
