# Clear Path

An academic UX redesign concept of an eyewear store website, built as a working
full-stack prototype: browse frames, get help choosing, compare, enter a prescription
and check out as a guest.

> **Not affiliated with or endorsed by Lenskart.** This is a student project. The
> catalogue, prices, stores, offers and orders are all synthetic, payments are simulated,
> and no logos or product images were copied from lenskart.com.

## What it is

Clear Path takes the usability issues found in a review of lenskart.com (tracked as
issue IDs U1–U6 and X1–X13) and answers each one with a concrete change in a running
site. Every change is annotated on the page itself, so a reviewer can see what was
wrong, what replaced it and which design principle it rests on.

| Area | What the redesign does |
|---|---|
| Finding a frame | Navigation named by need (prescription, screen use, reading, sun, kids), grouped filters with live counts, and an empty state that helps you recover |
| Help choosing | **Frame Finder**, a three-question guide that lands on a pre-filtered listing and keeps your answers when you go back |
| Deciding | Side-by-side **compare** for 2–3 frames, frames drawn to scale from their real measurements, size help, and an optional 3D viewer |
| Pricing | A live price breakdown on the product page that matches the bag and checkout; one offer per order, explained in one sentence |
| Buying | Prescription entry with range validation and error recovery, guest checkout, and a clear path back from a declined payment |
| Accessibility | WCAG 2.2 A/AA checked with axe, a "Larger text" mode, reduced-motion variants, and reflow down to 320 px and at 200% zoom |

## Tech stack

- **Next.js 15** (App Router) and **React 19**: one app serves both the UI and a JSON REST API under `/api`
- **Prisma 6** with **SQLite**: no database server to install
- **Tailwind CSS 3** with design tokens as CSS variables
- **Zod** for request validation
- **GSAP**, **motion** and the View Transitions API for animation
- **three.js** / **react-three-fiber** for the 3D frame viewer, loaded only when opened
- **Vitest** for unit tests; **Playwright** with **axe-core** for end-to-end and accessibility tests

## Getting started

You need **Node.js 20 or newer** and npm.

```bash
git clone https://github.com/DevikaaMenon/clear-path-lenskart-redesign.git
cd clear-path-lenskart-redesign

npm install                  # also generates the Prisma client and copies the fonts
cp .env.example .env         # PowerShell: copy .env.example .env
npx prisma migrate deploy    # creates prisma/dev.db
npx prisma db seed           # loads 40 synthetic frames, lenses, offers and stores
npm run dev
```

Then open <http://localhost:3000>.

To wipe the database and reseed it at any time, run `npm run db:reset`.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite database file, relative to `prisma/` |
| `SESSION_SECRET` | placeholder | Signs session and CSRF tokens. Change it for anything beyond a local demo |
| `UPLOAD_DIR` | `./storage/uploads` | Where prescription uploads are stored. Must be outside `public/` |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build on port 3000 |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm test` | Run the unit tests (pricing, catalogue, checkout, prescription) |
| `npm run test:watch` | Run the unit tests in watch mode |
| `npm run test:e2e` | Build, then run the Playwright tests at desktop, tablet and mobile sizes |
| `npm run db:reset` | Drop, recreate and reseed the development database |

The end-to-end tests need Playwright's browser once: `npx playwright install chromium`.
They run against a production build on port 3100 with their own database
(`prisma/e2e.db`), so test orders never touch your development data.

## Things to try

- **"What changed" markers.** Numbered magenta markers are on by default. Open one to
  see the issue ID, the before, the after and the principle behind the change. Turn them
  off from the review bar to see the plain product view.
- **A declined payment.** At checkout, pay with card `4000 0000 0000 0002` or UPI
  `fail@demo` to see the Retry / Change method recovery. Cash on delivery is limited to
  ₹10,000.
- **Usability-test mode.** Add `?test=1` to any URL to show a small panel that times
  tasks T1–T6 and counts errors. Results stay in your browser's local storage; `?test=0`
  turns it off.
- **Design system.** The tokens, type and components are laid out at `/design-system`.

## Project structure

```
prisma/            schema, migrations, seed script and the synthetic catalogue
src/app/           pages and the /api route handlers
src/components/    UI components, grouped by feature (catalogue, product, checkout, ...)
src/lib/           pure domain logic (pricing, catalogue, prescription, finder)
src/lib/server/    database access, sessions, rate limiting
src/lib/ux-changes.ts   the data behind every "What changed" marker
tests/unit/        Vitest
tests/e2e/         Playwright task flows (T1–T6) and accessibility checks
design/            Figma plugin that draws the lo-fi wireframes
docs/              research, decisions and credits
```

One rule shapes the code: anything that decides a number the user sees (price, result
count, stock) lives in one pure function in `src/lib`, imported by both the UI and the
API, so the two can never disagree.

## Documentation

- [docs/design-research.md](docs/design-research.md): the reference-site study and art direction
- [docs/decisions.md](docs/decisions.md): every assumption and deviation, with its reason
- [docs/plan.md](docs/plan.md): architecture and build milestones
- [docs/photo-credits.md](docs/photo-credits.md): sources and licences for the Home page photos
- [design/figma-wireframe/README.md](design/figma-wireframe/README.md): how to generate the clickable lo-fi wireframes in Figma

## Scope and limits

This is a concept prototype, not a production store:

- Payments are simulated and no real orders are placed.
- Contact lenses are out of scope; that route explains this and offers an alternative.
- Rate limiting is in memory and SQLite is a single file, so it suits one local instance.
- There are no ratings, reviews or testimonials, because none would be real.

## Credits

Designed and built by [Devika Menon](https://github.com/DevikaaMenon). Fonts are
self-hosted under the SIL Open Font License. Photo sources are listed in
[docs/photo-credits.md](docs/photo-credits.md).
