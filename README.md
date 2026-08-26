# Dr. Mylswamy Annadurai — portfolio

A 3D portfolio site for Padma Shri **Dr. Mylswamy Annadurai**, the "Moon Man of
India" — Project Director of Chandrayaan-1, Programme Director of Mangalyaan,
and Director of the ISRO Satellite Centre (2015–18).

Light theme throughout, built around a single WebGL scene: a photoreal Moon
with the Chandrayaan-1 orbiter circling it, which travels, resizes and
cross-fades to Mars as you scroll.

## Stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16.3 (App Router, Turbopack) + React 19.2 |
| Language       | TypeScript (strict)                               |
| Styling        | Tailwind CSS v4 (`@theme` tokens in `globals.css`)|
| 3D             | three.js + React Three Fiber + drei               |
| Scroll         | Lenis, wired to the GSAP ticker                   |
| Scroll effects | GSAP ScrollTrigger (pinned horizontal gallery)    |
| Fonts          | Instrument Serif · Geist · Geist Mono · Anek Tamil|

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npx tsc --noEmit # typecheck
npx eslint .     # lint
```

## Routes

| Route           | What it is                                                        |
| --------------- | ----------------------------------------------------------------- |
| `/`             | Cinematic scroll: hero → stats → profile → missions → chronicle → awards → gallery → books → contact |
| `/missions`     | Chandrayaan-1, Mangalyaan, Chandrayaan-2, INSAT/IRS/GSAT in detail |
| `/awards`       | All 78 published awards, filterable by category and searchable    |
| `/gallery`      | 46 photographs with a lightbox, plus talks from his YouTube channel |
| `/engagements`  | Availability calendar, slot booking, and the public engagement diary |
| `/contact`      | Enquiry routes and public channels                                |
| `/api/engagements` | `GET` booked slots · `POST` a booking request                  |

## The 3D scene

One fixed, full-viewport `<Canvas>` sits behind all content
(`components/three/CelestialScene.tsx`). Sections declare where the celestial
body should go via `<SceneAnchor scene="…">`; an IntersectionObserver picks the
most-visible one and writes a target into a module-level store
(`three/scene-store.ts`). The render loop eases toward that target every frame,
so the choreography stays in step with the layout no matter how tall content
grows.

Two rules keep it from fighting the text:

- **Showcase sections** (hero, each mission panel) get the body at full
  presence, positioned in empty space.
- **Text-heavy sections** push it to the frame edge *and* drop it to a faint
  wash, so a paragraph never competes with a lunar surface for contrast.

There is a separate `MOBILE_PRESETS` table — narrow screens have no horizontal
gutter to hide a planet in, so the body tucks into a corner instead.

The Moon and Mars are nested spheres (Mars at r=0.985) rather than coincident
ones, which makes z-fighting during the cross-fade structurally impossible.
Chandrayaan-1 is modelled from primitives in `three/Spacecraft.tsx`.

## Engagements & booking

`/engagements` is a working booking flow, not a mockup:

- **Availability** is derived from rules in `lib/data/engagements.ts` —
  per-weekday slots, a 14-day notice period, a 6-month horizon, and blackout
  dates. All times are IST.
- **The calendar** marks each day open / committed / held / inside-notice, is
  keyboard navigable (arrow keys with roving focus), and greys out slots that
  already have requests against them.
- **Requests** are validated client-side *and* re-validated server-side against
  live state, because the client's copy of what's free goes stale.
- **Anti-abuse**: a honeypot field and a per-IP throttle.
- **Confirmation** returns a reference (`MA-YYMMDD-XXXX`) and offers an `.ics`
  download built to RFC 5545 with an explicit `VTIMEZONE`, so the invite lands
  at the right hour anywhere.
- **The public diary** lists his engagements, split upcoming/past, each with its
  own "+ Cal" export.

### Swapping the store

Requests are appended to `.data/bookings.json` (gitignored) through
`lib/server/booking-store.ts`. That file is a deliberate seam — point `readAll`
and `append` at a database, CRM or email provider and nothing else changes. On
a read-only filesystem it degrades to in-memory rather than 500-ing at the
visitor.

## Bilingual

An EN / தமிழ் switch in the nav. Copy is authored as `{ en, ta }` pairs and
rendered through `<T v={…} />`, falling back to English where no Tamil exists.
The preference is read through `useSyncExternalStore` so hydration stays
correct.

Tamil is **never** split per character for the hero animation — its vowel signs
are combining marks, and slicing them off the base consonant breaks shaping and
renders orphaned dotted circles. Tamil animates a line at a time instead, and
the wide letter-spacing used on Latin eyebrow labels is relaxed for it.

## Content & credits

Biography, career chronicle, awards, photographs and the engagements board come
from his official site, **mylswamyannadurai.in**, cross-checked against
Wikipedia for dates and mission details.

Lunar and Martian textures: NASA imagery via
[Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0).

## Accessibility & motion

- `prefers-reduced-motion` disables the WebGL scene, Lenis, the pinned
  horizontal gallery, and every reveal.
- The calendar grid uses `role="grid"` with arrow-key navigation and descriptive
  `aria-label`s.
- The gallery lightbox is portalled to `<body>` (so it escapes `main`'s stacking
  context), traps Escape, and supports arrow-key paging.
