/**
 * "What changed" annotations: every place where this redesign improves the UX of
 * the original lenskart.com website. One entry per marker. Markers are placed with
 * <UxMarker id="..." /> and listed in the "Changes on this page" panel.
 *
 * To annotate another page, add entries with that page's path and place markers.
 */
export interface UxChange {
  id: string;
  /** Pages (pathnames) where this marker is shown. */
  paths: string[];
  /** Number shown in the marker; order within the page. */
  n: number;
  title: string;
  before: string;
  after: string;
  why: string;
  issues: string[];
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
];

export const changesForPath = (pathname: string) =>
  UX_CHANGES.filter((c) => c.paths.includes(pathname)).sort((a, b) => a.n - b.n);

export const changeById = (id: string) => UX_CHANGES.find((c) => c.id === id);
