/**
 * A tiny module-level store for the celestial scene.
 *
 * Sections on the page declare `data-scene="<key>"`; an IntersectionObserver
 * picks the most-visible one and writes its target here. The R3F render loop
 * reads `target` every frame and eases toward it, so the 3D choreography stays
 * in step with the layout no matter how tall the content grows.
 */

export type SceneKey =
  | "hero"
  | "stats"
  | "about"
  | "moon"
  | "mars"
  | "earth"
  | "timeline"
  | "awards"
  | "gallery"
  | "books"
  | "engagements"
  | "contact";

export type SceneTarget = {
  /** Position in world units. */
  x: number;
  y: number;
  z: number;
  scale: number;
  /** Cross-fade weights — they need not sum to 1 during a transition. */
  moon: number;
  mars: number;
  /** Orbiting spacecraft opacity/visibility. */
  sat: number;
  /** Extra spin multiplier. */
  spin: number;
};

const PRESETS: Record<SceneKey, SceneTarget> = {
  // The showcase sections (hero, each mission) get the body at full presence.
  // Text-heavy sections push it to the edge AND drop it to a faint wash, so a
  // paragraph is never competing with a lunar surface for contrast.
  hero: { x: 2.4, y: -0.05, z: 0, scale: 1.22, moon: 1, mars: 0, sat: 1, spin: 1 },
  stats: { x: 4.1, y: 1.5, z: -2.5, scale: 0.8, moon: 0.3, mars: 0, sat: 0, spin: 1 },
  about: { x: 4.3, y: 0.5, z: -2, scale: 0.95, moon: 0.24, mars: 0, sat: 0, spin: 1 },
  moon: { x: 2.45, y: 0.1, z: -0.6, scale: 1.12, moon: 1, mars: 0, sat: 1, spin: 1.1 },
  mars: { x: 2.45, y: 0.1, z: -0.6, scale: 1.08, moon: 0, mars: 1, sat: 0.85, spin: 1.1 },
  earth: { x: 2.45, y: 0.1, z: -0.8, scale: 1.05, moon: 0, mars: 0, sat: 0.9, spin: 1 },
  timeline: { x: -4.6, y: -1.7, z: -2.5, scale: 0.95, moon: 0.22, mars: 0, sat: 0, spin: 0.9 },
  awards: { x: 4.9, y: -1.2, z: -2.5, scale: 0.9, moon: 0.24, mars: 0, sat: 0, spin: 0.8 },
  gallery: { x: -4.6, y: -1.6, z: -3, scale: 0.9, moon: 0.22, mars: 0, sat: 0, spin: 0.8 },
  books: { x: 4.35, y: 0.7, z: -2.8, scale: 0.85, moon: 0.28, mars: 0, sat: 0, spin: 0.8 },
  engagements: { x: 5.9, y: 1.9, z: -2.6, scale: 0.85, moon: 0.16, mars: 0, sat: 0, spin: 0.8 },
  contact: { x: 0, y: -3.5, z: -1, scale: 1.3, moon: 0.72, mars: 0, sat: 0.4, spin: 1 },
};

/**
 * Narrow screens have almost no horizontal gutter to hide a planet in, so the
 * body either tucks into a corner the copy doesn't reach, or sits behind the
 * text as a deliberate low-contrast wash. It is never parked mid-paragraph at
 * full strength the way the desktop edge placements allow.
 */
const MOBILE_PRESETS: Record<SceneKey, SceneTarget> = {
  hero: { x: 0.62, y: -2.05, z: 0, scale: 0.62, moon: 1, mars: 0, sat: 1, spin: 1 },
  stats: { x: 1.25, y: 1.7, z: -2, scale: 0.5, moon: 0.2, mars: 0, sat: 0, spin: 1 },
  about: { x: 1.3, y: 1.3, z: -2, scale: 0.55, moon: 0.16, mars: 0, sat: 0, spin: 1 },
  moon: { x: 0.35, y: 0, z: -1, scale: 1.0, moon: 0.3, mars: 0, sat: 0.35, spin: 1.1 },
  mars: { x: 0.35, y: 0, z: -1, scale: 1.0, moon: 0, mars: 0.32, sat: 0.35, spin: 1.1 },
  earth: { x: 0.35, y: 0, z: -1, scale: 1.0, moon: 0, mars: 0, sat: 0.35, spin: 1 },
  timeline: { x: -1.3, y: -1.9, z: -2.5, scale: 0.5, moon: 0.16, mars: 0, sat: 0, spin: 0.9 },
  awards: { x: 1.3, y: -1.8, z: -2.5, scale: 0.5, moon: 0.16, mars: 0, sat: 0, spin: 0.8 },
  gallery: { x: -1.3, y: 1.7, z: -3, scale: 0.5, moon: 0.16, mars: 0, sat: 0, spin: 0.8 },
  books: { x: 1.3, y: 1.6, z: -2.8, scale: 0.5, moon: 0.16, mars: 0, sat: 0, spin: 0.8 },
  engagements: { x: 1.35, y: 1.9, z: -2.6, scale: 0.45, moon: 0.14, mars: 0, sat: 0, spin: 0.8 },
  contact: { x: 0, y: -2.5, z: -1, scale: 0.9, moon: 0.7, mars: 0, sat: 0.35, spin: 1 },
};

export const sceneTarget: SceneTarget = { ...PRESETS.hero };

/** Normalised pointer position, used for a gentle parallax tilt. */
export const pointer = { x: 0, y: 0 };

let currentKey: SceneKey = "hero";
let narrow = false;

function apply() {
  const preset = (narrow ? MOBILE_PRESETS : PRESETS)[currentKey];
  if (preset) Object.assign(sceneTarget, preset);
}

export function setScene(key: SceneKey) {
  if (!PRESETS[key]) return;
  currentKey = key;
  apply();
}

/** Called on mount and resize so the layout switch re-targets immediately. */
export function setNarrowViewport(value: boolean) {
  if (narrow === value) return;
  narrow = value;
  apply();
}
