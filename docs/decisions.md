# Decisions and deviations

Every assumption or deviation from the brief, with the reason.

## Stack and versions
| Decision | Reason |
|---|---|
| Pinned **Next 15.5, React 19.1, Prisma 6.19, Tailwind 3.4 (LTS), Zod 3.25, Vitest 3.2, motion 12, three 0.180, @react-three/fiber 9.4**. Newer majors exist (Next 16, Prisma 8 RC, Tailwind 4, Zod 4, Vitest 5). | Stable, well-understood APIs. Prisma 7+ changes client generation and SQLite adapters. Recorded so the choice can be revisited. |
| `npm audit` reports advisories in build-time dependencies (postcss inside Next, deepmerge-ts from Prisma tooling). | They don't affect the runtime of a local demo. Not force-upgraded, because that would break the pinned majors. |
| SQLite with JSON stored as text (`colours`, `needs`, `tags`, offer `rules`). | SQLite has no arrays or Json type in Prisma 6. Moving to PostgreSQL means changing these columns to `Json` / `String[]`. |
| Catalogue filtering runs in memory over the 40 products (`src/lib/catalogue.ts`). | Pure, unit-testable, and gives exact disjunctive facet counts. A real catalogue would push filters into SQL. |

## Design
| Decision | Reason |
|---|---|
| **Brand restored (supersedes the original-palette and font rows below).** Lenskart blue `#000042`, Plus Jakarta Sans, white page, square corners and flat buttons. | Client direction: keep Lenskart's brand design rather than restyle it. The requested screenshots were not attached, so values were **measured on lenskart.com** (7 Oct 2026) from computed styles: headings and nav text `rgb(0,0,66)`, headings Plus Jakarta Sans 800, body background white, radii 0 px. Plus Jakarta Sans is SIL OFL and self-hosted. Contrast: brand blue on white 19.5:1. No logos or images were copied; the wordmark stays plain text. |
| "What changed" markers (`UxMarker`, `UxReviewBar`, data in `src/lib/ux-changes.ts`) in annotation magenta `#C2185B`, never the brand blue. On by default; the setting is remembered and applied before first paint. | Lets reviewers trace each UX correction (issue ID, before, after, principle) on the page itself. Turning it off returns the product view. |
| **Three photos of people, Home page only.** Since 7 Oct 2026 they are the three portraits supplied by the project owner (source and licence still to be recorded in `docs/photo-credits.md`). They replaced three Unsplash photos (a professional, an older woman, a student), which stay in the repo for easy rollback. The supplied studio portraits move away from the earlier brief of "natural everyday settings, people who look like the audience in India". | Makes the page feel relatable without competing with the task. **Hero:** the photo sits beside the headline; the eye chart moved down to sit beside the "How it works" steps, which already drive its animation. **Featherweight tile:** the photo replaced the to-scale frame drawing. It shows the person in thin metal frames; the professional's thick acetate frame would contradict "titanium and rimless". Product cards keep drawings so frames stay comparable. |
| Fonts: Fraunces (display), Atkinson Hyperlegible Next (text), JetBrains Mono (numbers). All SIL OFL, self-hosted through `next/font/local` from @fontsource files (copied by `scripts/copy-fonts.mjs` on install). | Character plus legibility for older users. Mono numbers align prices and measurements. |
| Palette evolves the report's navy and teal into ink #0F1D2B, lens teal #0B6B63 and warm paper #F4F1E8, plus vermilion and yellow highlights. Contrast was checked numerically (see design-system.md). | Distinctive, not a generic blue/purple look, and passes AA. |
| **No Lenis / smooth scrolling.** | It can break keyboard scrolling, find-in-page and anchor links. Native scroll was kept. |
| **Rive not used.** The "prescription checked" micro-interaction (ring closes into a check) is SVG plus motion (`CheckedMark`). | No real `.riv` asset was available, and the brief says not to fake Rive. |
| 3D is procedural three.js / react-three-fiber (`FrameModel`), loaded only when "Try in 3D" is opened. | Keeps the product page at 185 kB first load (416 kB before splitting). It uses the same outline geometry as the SVGs. |
| Product imagery is procedural SVG drawn to scale (2.6 px per mm) from each frame's measurements. | Original imagery, with sizes comparable across cards and the compare overlay. |
| Desktop navigation appears from 1280 px. Between 834 and 1279 px the header uses the menu drawer. | Five need-named items, the need selector and five icons don't fit at 1024 px without wrapping. |
| **Breakpoints are in `em`** (30/52.125/64/80/90em = 480/834/1024/1280/1440 px at default text size). | Layouts reflow when people enlarge text in browser settings, not only on zoom (WCAG 1.4.4). Found in testing: with px breakpoints, enlarged text overflowed the header by about 1,000 px. |
| In "Larger text" mode the full desktop nav needs ≥1600 px; below that the header collapses to the menu drawer. | Testing found the Larger text mode itself overflowed the header by 147 px at 1280 and about 20 px at 1440. Now there is 0 overflow at 1440, 1280, 1024, 834 and 390. |
| Button labels may wrap (no `nowrap`; height grows with padding). | At 320 px and with larger text, long descriptive CTAs ("Not sure? Find my frame in 3 questions") overflowed by up to 48 px. |
| Price breakdown rows are `dl > div > dt + dd`, with the highlight sweep drawn inside the `dt`. | axe flagged the earlier extra wrapper as an invalid definition list (screen readers lose the label/value pairing). |
| View transitions resolve on `setTimeout`, not `requestAnimationFrame`, and aborted transitions are caught. | rAF is paused during a view transition's capture, so the old code never resolved and Chrome aborted with a page error. |
| Header shows "Glasses for: …" need selector (X2) from 834px; on mobile it's at the top of the menu drawer and carried via the listing. | Space. |
| Shared-element transitions use the View Transitions API (`useTransitionNavigate`). Unsupported browsers or reduced motion get a normal navigation. | App Router unmounts the old page, so motion's `layoutId` can't span routes. |

## Product and content
| Decision | Reason |
|---|---|
| **Contact lenses** route to an honest "not part of this prototype" page with eye-test booking and an alternative. | A contact-lens catalogue needs a different product model. Out of scope. |
| Kids is a need tile and a menu entry that filters `audience=kids`. | The brief lists Kids under "Shop by need". It is an audience, not a lens purpose. |
| Lens purposes on the product page: To see clearly, Screen use, Reading only, Sun protection, Style only. Sun-only frames offer sun lenses only. | X6 rename ("What are the lenses for?"). |
| Only **one offer per order**. The best automatic offer applies, and a code replaces it only if it saves more. The UI says this in one sentence. | X7, and predictable pricing. |
| No ratings, reviews or testimonials anywhere. "Popular" is labelled as a synthetic score. | The brief forbids fabricated social proof. |
| Low-stock wording appears only when the selected size has 1–3 units in the database, with an explanation. Never a timer or urgency copy. | X12, honest design. |
| Store names and addresses are invented ("Clear Path Jayanagar", "22 Example Road"). | No real locations. |

## Engineering
| Decision | Reason |
|---|---|
| Anonymous visitor id (`cp_sid`, httpOnly) is created in middleware, so guest checkout needs no account. | Guest-first (X11). |
| CSRF: double-submit cookie (`cp_csrf`) plus an `x-csrf-token` header on all unsafe `/api` requests, along with SameSite=Lax cookies. | Simple and stateless. |
| Rate limiting is in memory, per process (auth, orders, prescriptions, eye test). | Fine for a single-instance demo. A real deployment needs a shared store. |
| Passwords hashed with bcryptjs (cost 12). | Pure JS, so no native build on Windows. |
| CSP allows `'unsafe-inline'` scripts. | Next.js inline bootstrap needs it without a nonce setup. A nonce-based CSP is future work. |
| Orders are idempotent (client-generated UUID key). Price is recalculated on the server and a mismatch returns 409 `price_changed`. Stock is decremented in a transaction. | X11 robustness. |
| Simulated payment triggers: card `4000 0000 0000 0002` or UPI `fail@demo` decline (HTTP 402). Cash on delivery is limited to ₹10,000. | Lets testers exercise the Retry / Change method recovery. |
| Uploads: JPEG/PNG/WebP/PDF only, checked by magic number, 5 MB cap, random file names, stored in `UPLOAD_DIR` (default `./storage/uploads`, git-ignored, outside `/public`). Never served back. Prescription values are never logged. | Section 8.6. |
| SVG coordinates are rounded to 2 decimals, and SVG ids are derived from frame data instead of `useId`. | Node and the browser produced slightly different `Math.sin` results, which caused hydration mismatches. |
| E2E tests run against a production build and a separate `prisma/e2e.db`. `scripts/e2e-db.mjs` deletes only that hard-coded fixture file, then runs a plain `prisma db push` and the seed, before the test server starts. | Test orders never touch `dev.db`. History: (1) resetting in Playwright `globalSetup` ran after the web server had started, so the server saw missing tables and timed out; (2) `prisma db push --force-reset` is a destructive command that Prisma guards against in automated runs, so the script no longer uses it. |
| Browsers log intentional 402/409/422 responses as console "errors". The e2e console checks ignore only those statuses. | Real HTTP semantics are kept. |
