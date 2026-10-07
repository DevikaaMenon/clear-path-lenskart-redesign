# Clear Path: build plan

## Architecture

One Next.js 15 (App Router) application that serves both the UI and a JSON REST API.

```
Browser (React 19, Tailwind tokens, GSAP, motion, react-three-fiber)
   │  fetch JSON                         ▲ server components read DB directly
   ▼                                     │
Next.js route handlers  /api/*  ── Zod validation ── src/lib/* (pure domain logic)
   │                                         ├─ pricing.ts   (shared by client + server)
   ▼                                         ├─ catalogue.ts (filter, facets, sort)
Prisma ORM ── SQLite (prisma/dev.db)         ├─ prescription.ts (range validation)
                                             └─ finder.ts    (answers → filters)
Uploads → ./storage/uploads (outside /public, git-ignored)
```

Key rule: anything that decides a number the user sees (price, result count, stock) lives in
one pure function in `src/lib`, imported by both the UI and the API.

## Folder structure

```
prisma/            schema.prisma, migrations, seed.ts, catalogue data
src/app/           routes (pages + /api route handlers)
src/components/    UI components, grouped: ui/, layout/, catalogue/, product/, checkout/, motion/, three/
src/lib/           pure domain logic + server helpers (db, session, csrf, rate limit)
src/styles/        tokens.css (design tokens as CSS variables)
tests/unit/        Vitest: pricing, validators, catalogue, finder
tests/e2e/         Playwright: T1–T6, axe, screenshots
docs/              research, design system, traceability, decisions, iteration log
screenshots/       S1–S10 at 1440 and 390, design-system board, before/after crops
```

## Milestones

1. Foundation: tokens, fonts, layout shell, header/footer (U1), /design-system route.
2. Catalogue: schema, seed (~40 synthetic frames), products API with facets, listing + empty state (S3, S4).
3. Entry and guidance: home (S1), Frame Finder (S2), need-named navigation (X1, X2).
4. Decide: compare (S5), product page with live price, sizes, purpose (S6), 3D viewer.
5. Buy: prescription (S7), cart (S8), checkout (S9), confirmation (S10), optional account.
6. Motion pass: every Section 6.3 moment plus its reduced-motion variant.
7. Quality pass: axe, Lighthouse, responsive, tests, three browser passes, screenshots, docs.

## Task list

- [ ] M0 design research + art direction (docs/design-research.md)
- [ ] M1 foundation
- [ ] M2 catalogue
- [ ] M3 entry and guidance
- [ ] M4 decide
- [ ] M5 buy
- [ ] M6 motion
- [ ] M7 quality, screenshots, docs, final report
