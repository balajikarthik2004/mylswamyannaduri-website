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

### Where requests are stored

`src/lib/server/booking-store.ts` picks its backing store by probing what the
environment can actually do, most durable first:

| Driver | Chosen when | Survives a restart |
| --- | --- | --- |
| `mongodb` | `MONGODB_URI` (MongoDB Atlas cluster) | yes |
| `file` | `BOOKINGS_DATA_DIR`, else `./.data`, else the OS temp directory | yes, except from the temp directory |
| `memory` | nothing above is available | no |

**A serverless deployment needs MongoDB.** The deployment directory is read-only
on Vercel and its equivalents, so the file driver lands in the temp directory:
records then live in one instance's disk, vanish when it recycles, and are
invisible to the instance that serves `/office`. That is what "the deployed
site shows no requests" is — the requests were accepted and then dropped.

Whichever driver is live is reported by `describeStore()` and shown in the
console, as a chip in the bar and a banner when it is not durable. "No requests
yet" and "requests are being discarded" render identically otherwise, which is
what made this failure invisible for as long as it was.

The file driver writes to a temp file and `rename`s it into place, so an
interrupted write cannot leave a half-written JSON document behind, and all of
its read-modify-write cycles queue behind one promise chain, so two requests
arriving together cannot overwrite each other. A file that fails to parse
anyway is moved aside as `bookings.json.corrupt-<timestamp>` rather than
overwritten.

### Being told a request came in

Every accepted request also emails the office — `OFFICE_EMAIL`, falling back to
`MAIL_FROM`'s own address — with `Reply-To` set to the requester. It carries
every field needed to act on the request, so the queue is never the only copy.
The send runs in `after()`, so a slow mail server cannot delay or fail a
booking that has already been stored.

## Deploying

Set, in the host's environment:

| Variable | Why |
| --- | --- |
| `ADMIN_USER`, `ADMIN_PASSWORD`, `ADMIN_SECRET` | the office console refuses every sign-in without the first two, and re-signs cookies on each restart without the third |
| `MAIL_FROM` + (`RESEND_API_KEY` \| `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`) | decisions and new-request alerts |
| `MONGODB_URI` | **required on serverless** — see *Where requests are stored* |
| `OFFICE_EMAIL`, `SITE_URL` | who gets the new-request alert, and a working link back to the console inside it |

Open `/office` after the first deploy and read the two chips in the bar. They
say which mail provider and which store are live; anything ephemeral is called
out in a banner under the heading rather than left to be discovered when a
request goes missing.

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
