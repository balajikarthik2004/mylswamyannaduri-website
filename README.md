# Dr. Mylswamy Annadurai — portfolio

A 3D portfolio and engagements site for Padma Shri **Dr. Mylswamy Annadurai**, the
"Moon Man of India" — Project Director of Chandrayaan-1, Programme Director of
Mangalyaan, and Director of the ISRO Satellite Centre (2015–18).

Content is drawn from his official site, [mylswamyannadurai.in](https://www.mylswamyannadurai.in/),
and cross-checked against his Wikipedia record.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16.3 (App Router, Turbopack) · React 19 |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| 3D | three.js · @react-three/fiber · @react-three/drei |
| Motion | GSAP + ScrollTrigger · Lenis smooth scroll |
| Language | TypeScript (strict) |

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the build
npx tsc --noEmit # typecheck
npx eslint .     # lint
```

## Design system

A light theme throughout — "observatory paper": warm ivory surfaces, deep
midnight-navy ink, and a brass secondary accent that echoes both spacecraft
foil and an award plaque. All tokens live in `src/app/globals.css` under
`@theme`; nothing hardcodes a hex value.

- **Display** — Fraunces (variable, with `opsz`/`SOFT`/`WONK` axes)
- **Body** — Instrument Sans
- **Data & labels** — JetBrains Mono
- **Tamil** — Anek Tamil

## The 3D scene

One fixed, full-viewport WebGL canvas sits behind all content
(`src/components/three/`). It holds a photoreal Moon and Mars (nested, never
coincident, so they cannot z-fight), a procedurally modelled Chandrayaan-1 on a
dashed orbit, and a field of dust motes.

Sections declare `data-scene="<key>"` via the `<SceneAnchor>` primitive. An
IntersectionObserver picks the most-visible one and writes a target into
`scene-store.ts`; the render loop eases toward it every frame. That keeps the
choreography in step with the layout no matter how tall the content grows, and
it survives client-side route changes.

Text-heavy sections push the body to the edge of frame **and** drop it to a
faint wash, so a paragraph never competes with a lunar surface for contrast.
Narrow screens get their own preset table — there is no gutter to hide a planet
in at 390px.

## Engagements — availability & booking

`/engagements` is a working scheduling surface:

- **Availability calendar** — month grid with per-day status (open, committed,
  held, inside the notice period), free-slot pips, full keyboard navigation
  (arrow keys with roving focus) and ARIA labelling.
- **Public diary** — his real engagements board, split upcoming/past, each with
  an `.ics` download.
- **Booking flow** — slot picker → engagement type and mode → contact details,
  with a boarding-pass confirmation carrying a reference and a calendar invite.
- **Rules** — 14 days' notice, a 6-month horizon, IST throughout.

Requests `POST` to `/api/engagements`, which **re-validates everything
server-side** (the client's view of what's free can be stale), rejects
honeypot submissions, and throttles per IP. `GET` returns the taken slots so
the grid reflects real state.

`src/lib/server/booking-store.ts` is a deliberately small persistence seam —
it appends to `.data/bookings.json` and degrades to in-memory on a read-only
filesystem. Point `readAll`/`append` at a database, CRM or email provider and
nothing else in the app changes.

## Notes for future work

- **Dates never use `toLocaleDateString`.** Node and the browser ship different
  ICU builds, so the same call can return `12 Sep` on the server and `12 Sept`
  in Chrome — a hydration mismatch when it lands in an attribute. Formatting
  goes through the fixed tables in `src/lib/engagements.ts`.
- **Anything read off the visitor's clock is gated behind `useMounted()`.** The
  server runs in UTC while the visitor is in IST; a bare `new Date()` can put
  the two on different calendar days.
- **Tamil is never split per character.** Its vowel signs are combining marks —
  slicing them off the base consonant breaks shaping and renders orphaned
  dotted circles. The hero animates Tamil a line at a time.
- The lint config enforces the React Compiler rules (no `setState` in an effect
  body, no impure calls during render). External state is read through
  `useSyncExternalStore` — see `src/lib/use-media-query.ts` and `use-mounted.ts`.

## Credits

- Photographs and biography: mylswamyannadurai.in
- Lunar and Martian textures: NASA / Solar System Scope (CC BY 4.0)
