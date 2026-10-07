/**
 * "What changed" annotations: every place where this redesign improves the UX of
 * the original lenskart.com website. One entry per marker. Markers are placed with
 * <UxMarker id="..." /> and listed in the "Changes on this page" panel.
 *
 * To annotate another page, add entries with that page's path and place markers.
 */
export interface UxChange {
  id: string;
  /** Pages where this marker is shown: exact pathnames, or a prefix ending in "/*". */
  paths: string[];
  /** Number shown in the marker; order within the page. */
  n: number;
  title: string;
  before: string;
  after: string;
  why: string;
  issues: string[];
  /** Shown in the panel when the marked element isn't on screen right now (another state or screen size). */
  hiddenNote?: string;
}

export const UX_CHANGES: UxChange[] = [
  {
    id: "home-header",
    paths: ["/"],
    n: 1,
    title: "Header shows shopping links only",
    before:
      "A utility bar above the navigation carries nine corporate, partner and international links (Corporate, Store Locator, Singapore, UAE, John Jacobs, Aqualens, Cobrowsing, Engineering Blog, Partner With Us).",
    after:
      "The header holds only shopping navigation plus Stores and Help. Corporate, partner, engineering and international links moved to the footer under “Company”.",
    why: "Aesthetic and minimalist design: remove information that competes with the shopping task.",
    issues: ["U1"],
  },
  {
    id: "home-nav-help",
    paths: ["/"],
    n: 2,
    title: "Help to choose is in the main navigation",
    before: "Size and lens guides sit in the footer, far from the moment a shopper is choosing a frame.",
    after:
      "The main navigation has “Find my frame”, a help-me-choose guide, plus “Help”, next to the shopping links. Size help also appears on each product page.",
    why: "Help at the point of decision: guidance is offered where and when the choice is made.",
    issues: ["X3"],
    hiddenNote: "Not visible at this screen width; it is part of the desktop navigation.",
  },
  {
    id: "home-need-tiles",
    paths: ["/"],
    n: 3,
    title: "Start from what you need",
    before:
      "The page opens with a promotional banner, then image tiles by product category (Eyeglasses, Sunglasses, Special Power).",
    after:
      "The first thing on the page asks what the glasses are for: Prescription, Computer, Reading, Sun, Contact lenses or Kids, each with a one-line explanation. The choice is carried to the listing, product page and bag.",
    why: "Match between system and the real world: shoppers think in needs, not in the store's product categories.",
    issues: ["X2", "U6"],
  },
  {
    id: "home-find-frame",
    paths: ["/"],
    n: 4,
    title: "Guided “Find my frame”",
    before: "There is no guided route for people who don't know which shape or size suits them; they must already know what to filter by.",
    after: "A 3-question Frame Finder (what for, face shape, how glasses usually fit) leads to a pre-filtered list of frames that are in stock.",
    why: "Recognition rather than recall: people pick from described options instead of needing to know frame terminology.",
    issues: ["X3"],
  },
  {
    id: "home-trust",
    paths: ["/"],
    n: 5,
    title: "Promises shown up front",
    before: "Returns, cash on delivery and shipping information is not visible near where shopping starts.",
    after: "A trust bar directly under the hero shows 14-day returns, cash on delivery, free shipping and the free eye test. It repeats next to the buy button and in the bag.",
    why: "Visibility of key information: reassurance is shown at decision points, not hidden in policy pages.",
    issues: ["X8"],
  },
  {
    id: "home-cards",
    paths: ["/"],
    n: 6,
    title: "Simpler product cards",
    before: "Cards are dense, with several price lines and the same offer text repeated on every card.",
    after:
      "Each card has one price line that also states the lens cost (“frame + lenses from ₹…”), at most one short offer tag, one details line, and an “Add to compare” button.",
    why: "Reduce clutter and memory load: less to read per card, and comparing doesn't depend on memory.",
    issues: ["U4", "X4"],
  },
  {
    id: "home-campaign",
    paths: ["/"],
    n: 7,
    title: "One promotion, below the shopping tasks",
    before: "Many equal-weight promotional modules and repeated, identical “Shop Now” buttons compete for attention.",
    after:
      "A single campaign block sits below the shopping tasks, with a descriptive button (“Shop the Featherweight collection”). Offers are explained in one plain sentence wherever a price is shown, and applied automatically.",
    why: "Clear visual hierarchy: one promotion, placed after the task, so it doesn't compete with it.",
    issues: ["X7", "U2"],
  },

  /* ---------------- Listing (/shop) ---------------- */
  {
    id: "listing-need",
    paths: ["/shop"],
    n: 1,
    title: "Your need carries over",
    before: "What the glasses are for is chosen late, on the product page.",
    after: "The need you pick on Home or in the header becomes the listing title and an active filter, and travels on to the product page and bag.",
    why: "Match the user's goal: ask the deciding question first, then remember the answer.",
    issues: ["X2"],
  },
  {
    id: "listing-filters",
    paths: ["/shop"],
    n: 2,
    title: "Filters grouped, in plain words",
    before: "17 filters in one flat list, some duplicated or unexplained (“occasion” twice, “vibe check”, “looks finder”).",
    after: "Four groups (Essentials, Fit & style, Brand & collection, More) with plain labels, one-line helpers and a count next to every option.",
    why: "Recognition rather than recall: chunked, labelled choices are faster to scan.",
    issues: ["X13", "U3"],
    hiddenNote: "On smaller screens the filters open from the Filters button.",
  },
  {
    id: "listing-chips",
    paths: ["/shop"],
    n: 3,
    title: "Active filters you can see and undo",
    before: "Active filters and the number of results aren't shown together while filtering.",
    after: "Each active filter is a removable chip, with “Clear all” and a live frame count that screen readers announce.",
    why: "Visibility of system status and user control.",
    issues: ["X13"],
    hiddenNote: "Shown once at least one filter is active.",
  },
  {
    id: "listing-cards",
    paths: ["/shop"],
    n: 4,
    title: "Simpler cards, one name",
    before: "Dense cards with repeated offer text; the same model code appears under different product-line names.",
    after: "One canonical name, one details line, one price line that states the lens cost, at most one short offer tag, and “Add to compare”.",
    why: "Reduce clutter and keep names consistent, so frames are easy to compare and remember.",
    issues: ["U4", "X4", "U5"],
    hiddenNote: "Shown when at least one frame matches.",
  },
  {
    id: "listing-empty",
    paths: ["/shop"],
    n: 5,
    title: "No results explains itself",
    before: "With 17 ungrouped filters it is easy to narrow down to nothing, with no hint about which filter caused it.",
    after: "A plain message (“Nothing is wrong. This combination is just too narrow.”) and one-click buttons that each remove one filter and say how many frames come back.",
    why: "Help users recover from errors: say what happened and offer the way out.",
    issues: ["X13", "U3"],
    hiddenNote: "Appears when no frames match, for example Size: Narrow with Shape: Aviator.",
  },
  {
    id: "listing-compare",
    paths: ["/shop"],
    n: 6,
    title: "Compare up to three frames",
    before: "No side-by-side comparison; people compare from memory across tabs.",
    after: "“Add to compare” on every card fills a tray at the bottom; open it to see the frames side by side, drawn to scale.",
    why: "Recognition rather than recall: put the options next to each other.",
    issues: ["X4"],
    hiddenNote: "Appears after you add a frame to compare.",
  },

  /* ---------------- Frame Finder (/finder) ---------------- */
  {
    id: "finder-progress",
    paths: ["/finder"],
    n: 1,
    title: "A short, predictable guide",
    before: "Size and fit help sits in the footer; there is no guided route for people who don't know what suits them.",
    after: "Three questions with a progress bar and a running list of your answers. Any question can be skipped.",
    why: "Visibility of system status and user freedom.",
    issues: ["X3"],
  },
  {
    id: "finder-question",
    paths: ["/finder"],
    n: 2,
    title: "Answers in everyday words",
    before: "Choosing a frame means knowing terms like frame width, or face-shape rules.",
    after: "Each answer has a one-line explanation (“They often feel tight”). “Not sure” is always an option, and Back keeps your answers.",
    why: "Match between system and the real world: describe the experience, not the jargon.",
    issues: ["X3", "U3"],
    hiddenNote: "Shown while you answer the questions.",
  },
  {
    id: "finder-result",
    paths: ["/finder"],
    n: 3,
    title: "Honest results",
    before: "Combining size and shape filters can silently return nothing.",
    after: "Only in-stock frames are counted. If nothing matches, one answer is relaxed and the page says which, then opens a pre-filtered listing you can still change.",
    why: "Error prevention and honest feedback.",
    issues: ["X3"],
    hiddenNote: "Appears after the third question.",
  },

  /* ---------------- Compare (/compare) ---------------- */
  {
    id: "compare-overlay",
    paths: ["/compare"],
    n: 1,
    title: "Sizes drawn to scale",
    before: "No side-by-side comparison, and sizes have no measurements.",
    after: "The outlines of all chosen frames are drawn on top of each other at true scale, so size differences are visible at a glance.",
    why: "Show, don't make people calculate.",
    issues: ["X4", "X6"],
    hiddenNote: "Add two frames to compare from the listing first.",
  },
  {
    id: "compare-table",
    paths: ["/compare"],
    n: 2,
    title: "Same rows, same units",
    before: "Comparing means switching between product pages and remembering details.",
    after: "Price, measurements, weight, material, sizes in stock and suggested face shapes in one table, with “Choose this frame” under each.",
    why: "Recognition rather than recall, and consistency.",
    issues: ["X4"],
    hiddenNote: "Add two frames to compare from the listing first.",
  },

  /* ---------------- Product (/frames/…) ---------------- */
  {
    id: "product-image",
    paths: ["/frames/*"],
    n: 1,
    title: "Images that describe the frame",
    before: "Image-only tiles with file-name alt text.",
    after: "Each frame is drawn to scale from its measurements, with descriptive alt text (shape, material, colour). The 3D view loads only if you ask for it.",
    why: "Accessibility: images carry meaning for everyone, including screen-reader users.",
    issues: ["X9"],
  },
  {
    id: "product-size",
    paths: ["/frames/*"],
    n: 2,
    title: "Sizes in millimetres, honest stock",
    before: "Sizes have no measurements, fit help is in the footer, and “Few left” wording is unverified.",
    after: "Each size shows lens width, bridge and temple in mm, “Find my size” is right here, and low stock appears only when a size really has 1–3 left, with no timer.",
    why: "Help at the point of decision, and honest scarcity.",
    issues: ["X6", "X3", "X12"],
  },
  {
    id: "product-purpose",
    paths: ["/frames/*"],
    n: 3,
    title: "“What are the lenses for?”",
    before: "“Product Type” mixes purposes, and the purpose is chosen late.",
    after: "Five plain choices (to see clearly, screen use, reading only, sun protection, style only), pre-selected from the need you picked earlier.",
    why: "Match between system and the real world.",
    issues: ["X6", "X2"],
  },
  {
    id: "product-price",
    paths: ["/frames/*"],
    n: 4,
    title: "The full price, live",
    before: "The final price depends on later lens choices and isn't visible; offers depend on remembering codes.",
    after: "A live breakdown (frame, lenses, coating, offer, total) updates as you choose. The best offer is applied for you, with one sentence saying why.",
    why: "Visibility of system status: no surprises at checkout.",
    issues: ["X5", "X7"],
  },
  {
    id: "product-trust",
    paths: ["/frames/*"],
    n: 5,
    title: "Promises next to the button",
    before: "Returns, cash on delivery and shipping information isn't visible at decision points.",
    after: "Delivery time, free shipping, payment options and returns sit directly under the Add to bag button.",
    why: "Reassurance at the moment of commitment.",
    issues: ["X8"],
  },

  /* ---------------- Prescription (/prescription/…) ---------------- */
  {
    id: "rx-methods",
    paths: ["/prescription/*"],
    n: 1,
    title: "Three ways to add it, including later",
    before: "The prescription step adds friction and can stop people ordering.",
    after: "Type it in, upload a photo or PDF, or send it later or book a free eye test. Ordering is never blocked by a missing prescription.",
    why: "Flexibility and efficiency of use.",
    issues: ["X11"],
    hiddenNote: "Shown on the first step, where you choose how to add it.",
  },
  {
    id: "rx-checks",
    paths: ["/prescription/*"],
    n: 2,
    title: "Values checked as you type",
    before: "Prescription entry is prone to friction and late errors.",
    after: "Each value is checked against real ranges, with examples (“Sphere, e.g. −1.25”), a “Where do I find these numbers?” guide and an error summary that links to each field.",
    why: "Error prevention, then clear recovery.",
    issues: ["X11", "U3"],
    hiddenNote: "Choose “Type it in” and continue to see the form.",
  },
  {
    id: "rx-privacy",
    paths: ["/prescription/*"],
    n: 3,
    title: "Sensitive data, stated plainly",
    before: "Reassurance isn't shown where people make the decision.",
    after: "Who sees the prescription, the optometrist's check and the free remake promise are stated beside the form.",
    why: "Trust at a sensitive step.",
    issues: ["X8"],
  },

  /* ---------------- Bag (/cart) ---------------- */
  {
    id: "cart-items",
    paths: ["/cart"],
    n: 1,
    title: "Every choice visible and editable",
    before: "The final price depends on lens choices that aren't shown together.",
    after: "Each item lists what the lenses are for, lens type, coating, size and prescription status, with “Edit lenses” and Remove (with Undo).",
    why: "Visibility of status, and easy correction.",
    issues: ["X5"],
    hiddenNote: "Add a frame to your bag to see this.",
  },
  {
    id: "cart-offer",
    paths: ["/cart"],
    n: 2,
    title: "The best offer is already applied",
    before: "Offers depend on remembering and typing codes.",
    after: "The best offer is applied and explained in one sentence. The code field is optional and only replaces the offer if it saves you more.",
    why: "Recognition rather than recall.",
    issues: ["X7"],
    hiddenNote: "Add a frame to your bag to see this.",
  },
  {
    id: "cart-checkout",
    paths: ["/cart"],
    n: 3,
    title: "Guest checkout, promises in view",
    before: "Checkout is prone to friction, and trust information isn't visible at decision points.",
    after: "No account needed, the total is on the button, and returns, cash on delivery, shipping and the eye test are listed right below.",
    why: "Reduce friction at the point of commitment.",
    issues: ["X11", "X8"],
    hiddenNote: "Add a frame to your bag to see this.",
  },

  /* ---------------- Checkout (/checkout) ---------------- */
  {
    id: "checkout-guest",
    paths: ["/checkout"],
    n: 1,
    title: "Guest by default",
    before: "Checkout is prone to friction.",
    after: "You check out as a guest; signing in is optional. A clear note says this is a demo with no real payment.",
    why: "Don't force account creation before purchase.",
    issues: ["X11"],
    hiddenNote: "Add a frame to your bag to reach checkout.",
  },
  {
    id: "checkout-steps",
    paths: ["/checkout"],
    n: 2,
    title: "Three steps, checked as you go",
    before: "Errors in long forms are found late.",
    after: "Contact, delivery and payment are three numbered sections on one page, validated inline, with an error summary that links to each problem.",
    why: "Error prevention, then clear recovery.",
    issues: ["X11"],
    hiddenNote: "Add a frame to your bag to reach checkout.",
  },
  {
    id: "checkout-recovery",
    paths: ["/checkout"],
    n: 3,
    title: "Failed payments are recoverable",
    before: "A failed payment leaves people unsure whether they've been charged.",
    after: "A banner explains what happened and offers Retry, Change method or Back to bag. Retrying can't charge you twice, and your details are kept.",
    why: "Help users recognise, diagnose and recover from errors.",
    issues: ["X11"],
    hiddenNote: "Appears if a payment fails. Try card 4000 0000 0000 0002 or UPI fail@demo.",
  },
  {
    id: "checkout-pay",
    paths: ["/checkout"],
    n: 4,
    title: "The total on the button",
    before: "The final price isn't visible until late.",
    after: "The amount is on the Pay button and matches the summary. The server re-checks the price before placing the order and tells you if it changed.",
    why: "Visibility of system status, and consistency.",
    issues: ["X5", "X11"],
    hiddenNote: "Add a frame to your bag to reach checkout.",
  },

  /* ---------------- Confirmation (/order/…) ---------------- */
  {
    id: "order-facts",
    paths: ["/order/*"],
    n: 1,
    title: "Key facts first",
    before: "It isn't clear what happens after ordering.",
    after: "Order number, delivery window and the amount paid come first.",
    why: "Visibility of system status.",
    issues: ["X11"],
  },
  {
    id: "order-next",
    paths: ["/order/*"],
    n: 2,
    title: "What happens next, step by step",
    before: "It isn't clear what happens after ordering.",
    after: "A timeline: prescription check (usually 2–3 days), lenses made and checked, shipped with an SMS tracking link, then delivery.",
    why: "Reduce uncertainty after commitment.",
    issues: ["X11", "X8"],
  },
  {
    id: "order-cancel",
    paths: ["/order/*"],
    n: 3,
    title: "Cancel or return, easy to find",
    before: "Return information isn't visible at decision points.",
    after: "Free cancellation before shipping, and returns, are linked right beside the order details.",
    why: "User control and freedom.",
    issues: ["X8"],
  },
];

/** A path matches exactly, or by prefix when the pattern ends in "/*" (e.g. "/frames/*"). */
export function pathMatches(patterns: string[], pathname: string) {
  return patterns.some((p) => (p.endsWith("/*") ? pathname.startsWith(p.slice(0, -1)) : p === pathname));
}

export const changesForPath = (pathname: string) =>
  UX_CHANGES.filter((c) => pathMatches(c.paths, pathname)).sort((a, b) => a.n - b.n);

export const changeById = (id: string) => UX_CHANGES.find((c) => c.id === id);
