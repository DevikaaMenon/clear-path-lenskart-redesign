# Design research and art direction

Date of study: 7 October 2026.

## Method

All six reference sites were opened in a real Chromium browser through Playwright (HTTP 200 for every site).
For each one I captured:

- desktop 1440 × 900 screenshots at the top, at 25% and at 50% of the page height
- a mobile 390 × 844 touch-emulated screenshot of the first screen
- computed styles: heading and body fonts, background colour, link and button transition timings, common border radii
- counts of running Web Animations, `<canvas>` and `<video>` elements, the header's CSS `position`, and whether the stylesheets have any `prefers-reduced-motion` rules

The screenshots are kept out of the repository (they are other people's work). Everything below is what I observed. Nothing here is copied into the build.
**Limits of this study:** I did not test hover states by moving a pointer. Hover notes come from measured CSS transition values, not from watching them play. I also did not record video, so motion notes are inferred from comparing screenshots at different scroll positions plus the animation and canvas counts.

---

## Observations by reference

### Godly (godly.design)
- **Typography:** the page title is set in Georgia at 48 px / 52.8 px line height. The UI uses the system sans at 16 px. A classic serif against a neutral sans gives the page an editorial voice at almost no cost.
- **Composition and grid:** a fixed left rail (about 280 px) with icon and label navigation, plus a three-column masonry gallery of video tiles. The content is the decoration.
- **Spacing:** generous gutters (about 24 px) and 12 px radius cards with a hairline border, each sitting on a slightly larger padded frame (a double-frame effect).
- **Hierarchy:** one serif headline, one muted sentence, then the content. No competing banners.
- **Navigation:** the left rail on desktop becomes a floating bottom pill on mobile ("Trending, Websites, Posts … Menu"). It stays reachable by thumb without covering content.
- **Interaction and hover:** buttons and links use 150 ms transitions with `cubic-bezier(0.4, 0, 0.2, 1)`. Some larger elements use 300 ms. The page has reduced-motion rules.
- **Motion:** almost all motion comes from muted autoplaying video previews (10 `<video>` elements). The chrome itself barely moves.
- **Responsive:** the mobile layout is a real recomposition (bottom navigation, single column), not a squashed desktop.
- **Takeaway for us:** restraint in the chrome makes the content feel premium. A serif display face over a plain sans works for a curated feel.

### Awwwards (awwwards.com)
- **Typography:** Inter Tight throughout. The "Site of the Day" title is set at about 127 px, weight 600, line height 1.0, uppercase, two lines filling the measure. Body text is 14 px.
- **Composition:** a centred hero of type only, then a full-bleed dark panel containing the featured site. Below that, a two-column grid of large preview cards with the title and author underneath.
- **Hierarchy:** extreme scale contrast (127 px against 14 px) does all the work. A small metadata row ("Site of the Day · Oct 6, 2026 · Score 7.68 of 10") sits above the title like a caption.
- **Navigation:** a regular top bar plus a floating, dark, segmented pill bar at the bottom of the viewport (Nominees, Courses, Collections …). It is helpful, but on scroll it overlaps content, and the cookie banner overlapped it too.
- **Interaction:** a general `all 0.3s ease` on links and buttons; radii mostly 8 px. No reduced-motion rules were found.
- **Takeaway for us:** huge type with a tiny caption row is an efficient way to look editorial. A floating bottom bar that overlaps content is a pattern to use carefully (our compare tray has to leave room).

### Framer (framer.com)
- **Typography:** GT Walsheim Medium, 54 px headline, line height 1.0, tracking −2.16 px (−0.04 em). Tight negative tracking at display sizes reads as "designed".
- **Composition:** a left-aligned headline with two buttons (primary white, secondary dark), and a large rounded product demo panel underneath that shows the product working, not a static picture.
- **Colour:** pure black with white type and a single electric-blue glow to highlight the active element.
- **Motion and storytelling:** 25 running Web Animations on load. The demo panel plays a scripted sequence (prompt → "Created a design plan" → "Thinking" → "Building navigation…"). The motion explains what the product does.
- **Interactive graphics:** a draggable rotating ring of images ("ImageWheel") sits next to the code that makes it.
- **Radii:** 8 px dominant, plus 15 and 20 px for large panels. Radius grows with element size, which is consistent and intentional.
- **Takeaway for us:** motion as a demonstration of cause and effect (do X, see Y), not decoration. This is directly relevant to the live price breakdown and Frame Finder.

### Spline (spline.design)
- **Typography:** Spline Sans, 38 px headline, centred, weight 500.
- **3D:** 3 `<canvas>` elements in the hero. Floating, glossy, softly lit 3D primitives (cubes, cylinders, a pixel rabbit) on a perspective grid, with a prompt box in the middle.
- **Navigation:** the header becomes a sticky floating pill bar once you scroll, with a strong blue primary button ("Get Started").
- **Hover:** mostly `color 0.2s ease`. 16 px radius dominant. Reduced-motion rules are present.
- **Storytelling:** below the hero, a quiet single centred testimonial in large type with muted and bright words mixed for emphasis.
- **Takeaway for us:** 3D works when it *is* the product (Spline sells 3D). Floating decorative 3D shapes are exactly the "blob" aesthetic we must avoid. For eyewear, 3D earns its place only as a frame you can turn.

### Rive (rive.app)
- **Typography:** Orbitron at weight 900, uppercase, wide (a game-UI voice). Small uppercase labels, monospace for code.
- **Composition:** a left column of labelled live demo tiles (Product UI, Game UI, Mobile Apps), with the headline and calls to action in the right column. Further down, a dark editor screenshot and a row of platform icons.
- **Interactive graphics:** 2 `<canvas>` elements for live Rive animations plus 10 videos. The demos are interactive state machines, not loops.
- **Interaction:** very little CSS transition (`opacity 0.2s` only). The motion lives inside the canvases.
- **Takeaway for us:** micro-interactions with a state machine (idle → hover → pressed → success) feel alive. We have no real `.riv` asset, so we build the same idea in SVG with motion and say so in decisions.md.

### CRED (cred.club), polish benchmark
- **Typography:** a high-contrast serif display (lowercase, tight, very large: "crafted for the creditworthy"), plus Gilroy for body text, and spaced-out uppercase micro labels (Overpass SemiBold at 36 px with 3.5 px tracking).
- **Composition:** full-bleed cinematic sections, one idea per screen. The hero is a dark 3D-rendered corridor (video). The next section is a single phone centred on black with a giant serif line ("all that you deserve.") rising from below.
- **Navigation:** minimal. A wordmark, an outlined box containing a card promo plus a hamburger, and a persistent outlined "download CRED" QR box fixed bottom-right. On mobile the logo sits in a bordered box with a "+" button and a hamburger.
- **Borders:** hairline 1 px outlined boxes, no radius, no shadow. This is a very distinctive choice; most of the "premium" feel comes from sharp hairline rectangles on black.
- **Motion:** scroll-driven, cinematic (4 videos; the content changes completely between the 0%, 25% and 50% screenshots). No CSS transitions were measured on links. No reduced-motion rules were found.
- **Responsive:** the mobile version keeps the same art direction recomposed vertically: the headline wraps to two lines, with the call to action at the bottom.
- **Takeaway for us:** confidence comes from fewer elements, larger type, sharp hairline geometry and long pauses. But CRED's black, cinematic, scroll-heavy approach would hurt a shopping task (and Suresh). We borrow the hairline geometry and type scale, not the darkness or scroll length.

### Patterns across the set
| Topic | What the best references share |
|---|---|
| Type | One expressive display face (serif or tight grotesk) plus one plain text face. Display sizes have tight line height (1.0–1.1) and negative tracking. |
| Scale | Very large contrast between display and body text (up to 9:1). |
| Chrome | Quiet navigation. Content and demonstrations carry the visual interest. |
| Hover | 150–300 ms, standard ease-out curves. Small changes (colour, underline, background). |
| Radii | One small radius family that grows with element size, or none at all (CRED). |
| Motion | It demonstrates the product (Framer, Rive) or tells a story along the scroll (CRED). Only 2 of 6 sites shipped reduced-motion rules, so that is a gap we will not copy. |
| Mobile | Recomposed, often with bottom-anchored navigation for the thumb. |

---

## Art direction statement: "Measured clarity"

**The visual idea.** Every pair of glasses already carries a tiny piece of design language: the marking on the inside of the temple, `52 □ 18 145` (lens width, bridge, temple length). Opticians speak in charts, measured rings, prescription grids and the moment a lens drops in and the world comes into focus. Clear Path takes that vocabulary seriously and makes it the visual system:

- **Type that reads like an eye chart.** Fraunces (a soft, high-contrast optical-size serif) is set large with tight leading for headlines, sometimes in descending sizes like a Snellen chart. Atkinson Hyperlegible Next is the text face, designed by the Braille Institute for low-vision readers, so it is chosen for Suresh, not for fashion. JetBrains Mono is used for every number that is a measurement or a price (`52 □ 18 · 145`, `₹2,499`), so numbers line up and feel exact.
- **Hairlines and dimension lines, not shadows.** Components are drawn like a technical drawing: 1 px rules, dimension ticks and measured rings. Elevation is shown with an offset hairline, not a blur.
- **Focus as the core metaphor.** Things become sharp when they become relevant. This is used sparingly, only where it carries meaning (the hero and the chosen need).
- **Colour from the optician's room.** Warm paper (#F4F1E8), deep navy ink, a deep "lens teal" accent (evolved from the report's navy and teal starting palette), a vermilion signal used only for small active marks, and a pale "lensmeter yellow" for highlights. No gradients.
- **Shape.** Mostly rectilinear with hairlines. Radius is reserved for things that are lens-like (pills, rings, need tiles with a circular lens). Rounded is a signal, not a default.

**Moments of surprise (each one does a job):**
1. **Focus pull (home hero, scroll-linked).** The headline "What are your glasses for?" sits above five need words that start out of focus. A measured lens ring moves across them as you scroll, and each word snaps sharp as the ring passes, ending with all five needs in focus as tappable tiles. It tells the "need first" story in about one screen of scroll. With reduced motion on, everything is simply sharp. It never blocks clicking: the tiles work at every point of the sequence.
2. **The lens carries your choice (need tile → listing).** The circular lens on the tile you pick expands into the listing header (a shared-element and clip transition), so the listing visibly continues from your choice.
3. **Dimension drawing (size selector).** Choosing S, M or L redraws the frame's dimension lines (`50 □ 18 · 140` to `53 □ 19 · 145`) with an animated SVG measurement. Size becomes something you can see.
4. **Lensmeter readout (live price).** Prices are monospaced digits that roll to the new value. The line that changed gets a brief yellow highlighter sweep, so cause and effect is obvious.
5. **Trial frame tray (compare).** The compare tray has three lens-shaped slots. A frame you add drops into its slot, and the tray says how many slots are left.

**What we are deliberately NOT doing, and why:**
- **No dark, cinematic, long-scroll home page** (CRED-style). It looks premium but slows a shopping task and lowers contrast for older users.
- **No smooth-scroll library (Lenis).** It changes scroll physics and can break keyboard scrolling, find-in-page and anchor links. Native scroll is kept.
- **No decorative 3D, blobs, gradients or glass.** 3D appears only in "Try in 3D", where the object is the product.
- **No fade-in-on-scroll for every section.** The only scroll-linked sequence is the focus pull. Elsewhere, motion responds to user actions.
- **No autoplay video, cursor followers, countdowns, pop-ups or fake urgency.**
- **No uppercase-only body text or ultra-light weights.** Readability over style.

**How this serves each persona:**
- **Meera (cautious first-timer):** dimension drawings and the measured fit hint make size concrete. The price readout always shows the full total, with the offer explained in one sentence. Hairline trust strips sit next to the buy button.
- **Rohan (style-led browser):** a large editorial type scale and the shape-led "frames by shape" strip make browsing quick and enjoyable. Compare and wishlist are one tap from every card. The focus pull and "Try in 3D" give him something to play with.
- **Suresh (returning, specific lenses):** Atkinson Hyperlegible text, a 16 px minimum and an 18 px "Larger text" mode, plain-language labels ("High-power lenses", not "SPECIAL POWER"), large targets, a calm prescription form with an error summary, and no motion he has to wait for.
