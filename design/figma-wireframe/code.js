/*
 * Clear Path: low-fidelity clickable wireframe generator for Figma.
 *
 * The blueprint of the Clear Path redesign: same screens, structure and flow as
 * the coded prototype, drawn in a classic wireframe language: thin outlines,
 * X boxes for images, grey bars for text, outlined buttons, basic inputs.
 * Black, white and greys only.
 *
 * Canvas layout: one left-to-right main flow (01 → 09) with branch screens placed
 * directly under the screen they branch from. Every frame is labelled outside the page.
 * UX notes live on a second page ("UX notes"); numbered circles on the screens match them.
 *
 * The previous, more detailed generator is kept in archive/code-v1-detailed.js.
 */

const W = 1440;
const K = {
  black: "#000000",
  ink: "#222222",
  dark: "#555555",
  mid: "#8C8C8C",
  line: "#BDBDBD",
  bar: "#D6D6D6",
  light: "#F0F0F0",
  white: "#FFFFFF",
  footer: "#6E6E6E",
  footerBar: "#9A9A9A",
};
const FONTS = {
  r: { family: "Inter", style: "Regular" },
  m: { family: "Inter", style: "Medium" },
  s: { family: "Inter", style: "Semi Bold" },
};

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
const paint = (h) => ({ type: "SOLID", color: hex(h) });

/* ------------------------------------------------------------------ */
/* Spec builders (a tree, rendered top-down so "fill" sizing works)     */
/* ------------------------------------------------------------------ */

const V = (o, kids) => ({ t: "box", o: Object.assign({ dir: "v" }, o), kids: kids || [] });
const H = (o, kids) => ({ t: "box", o: Object.assign({ dir: "h" }, o), kids: kids || [] });
const T = (text, o) => ({ t: "text", text: text, o: o || {} });
const INST = (comp, o) => ({ t: "inst", comp: comp, o: o || {} });
const GROW = () => V({ h: 1, name: "Spacer" });
const GAP = (h) => V({ h: h, name: "Spacer" });

// Wireframe vocabulary
const txt = (text, size, o) => T(text, Object.assign({ size: size || 14, color: K.ink }, o));
const head = (text, size, o) => T(text, Object.assign({ size: size || 28, weight: "m", color: K.black }, o));
const small = (text, o) => T(text, Object.assign({ size: 12, color: K.dark }, o));
/** Paragraph: n grey bars, the last one shorter (unless a single bar). */
function lines(n, o) {
  o = o || {};
  const bars = [];
  for (let i = 0; i < n; i++) {
    const last = i === n - 1;
    if (!last || (n === 1 && !o.short)) bars.push(V({ h: 8, fill: K.bar, name: "Text line" }));
    else bars.push(H({ name: "Text line" }, [V({ h: 8, fill: K.bar, grow: true }), V({ w: o.w ? Math.round(o.w * 0.35) : 90, h: 8 })]));
  }
  return V(Object.assign({ gap: 9, name: "Text (" + n + " lines)" }, o), bars);
}
/** A single short bar, e.g. a name or a value; strongBar is a title or key value. */
const bar = (w, o) => V(Object.assign({ w: w, h: 8, fill: K.bar, name: "Text line" }, o));
const strongBar = (w, o) => V(Object.assign({ w: w, h: 12, fill: K.mid, name: "Title line" }, o));
/** Image / visual placeholder: box with a large X. */
const ph = (h, o, label) =>
  V(Object.assign({ h: h, stroke: K.dark, fill: K.white, cross: true, align: "center", justify: "center", name: "Image placeholder" }, o), [
    label ? H({ hug: true, pad: [3, 8], fill: K.white }, [small(label)]) : null,
  ]);
function btn(label, go, kind, o) {
  const solid = kind === "solid";
  return H(Object.assign({ hug: true, pad: [10, 20], radius: 3, fill: solid ? K.mid : K.white, stroke: solid ? K.mid : K.ink, align: "center", justify: "center", go: go, name: "Button / " + label }, o), [
    txt(label, 14, { color: solid ? K.white : K.ink, weight: "m" }),
  ]);
}
const link = (label, go, o) => txt(label, 13, Object.assign({ color: K.dark, underline: true, go: go, name: "Link / " + label }, o));
const icon = (s, round, o) => V(Object.assign({ w: s || 20, h: s || 20, radius: round ? (s || 20) / 2 : 0, stroke: K.dark, fill: K.white, name: "Icon" }, o));
const field = (label, o) =>
  V(Object.assign({ gap: 6, name: "Input" }, o), [label ? small(label) : null, H({ h: 36, stroke: K.dark, fill: K.white }, [])]);
const check = (on, label, o) =>
  H(Object.assign({ gap: 8, align: "center", name: "Checkbox" }, o), [V({ w: 14, h: 14, stroke: K.ink, fill: on ? K.mid : K.white }), label ? small(label) : bar(90)]);
const radio = (on, label, o) =>
  H(Object.assign({ gap: 10, align: "center", name: "Radio" }, o), [V({ w: 16, h: 16, radius: 8, stroke: K.ink, sw: on ? 5 : 1, fill: K.white }), label ? txt(label, 13) : bar(140)]);
const box = (kids, o) => V(Object.assign({ pad: 20, gap: 14, stroke: K.dark, fill: K.white, name: "Box" }, o), kids);
const rule = () => V({ h: 1, fill: K.line, name: "Divider" });
const section = (kids, o) => V(Object.assign({ pad: [40, 64], gap: 20, stroke: K.line, sides: "b", name: "Section" }, o), kids);
const kv = () => H({ justify: "space", align: "center", name: "Row" }, [bar(140), bar(60)]);
const chip = () => H({ hug: true, pad: [6, 10], stroke: K.dark }, [small("Filter ×")]);
const grid = (cols, items, gap, o) => {
  const rows = [];
  for (let i = 0; i < items.length; i += cols) {
    const r = items.slice(i, i + cols);
    while (r.length < cols) r.push(V({ name: "Empty cell" }));
    rows.push(H({ gap: gap }, r));
  }
  return V(Object.assign({ gap: gap, name: "Grid" }, o), rows);
};
const browser = (path) =>
  H({ h: 40, pad: [0, 16], gap: 14, fill: K.light, stroke: K.line, sides: "b", align: "center", name: "Browser bar" }, [
    H({ hug: true, gap: 6 }, [icon(10, true), icon(10, true), icon(10, true)]),
    txt("←  →  ⟳", 13, { color: K.mid }),
    H({ w: 560, h: 24, pad: [0, 10], stroke: K.line, fill: K.white, align: "center" }, [small("clearpath.example" + path, { color: K.mid })]),
  ]);

/* ------------------------------------------------------------------ */
/* Renderer                                                            */
/* ------------------------------------------------------------------ */

const LINKS = [];
const COMPONENTS = {};

function pad4(p) {
  if (p === undefined) return [0, 0, 0, 0];
  if (typeof p === "number") return [p, p, p, p];
  if (p.length === 2) return [p[0], p[1], p[0], p[1]];
  return p;
}

function render(spec, parent) {
  if (!spec) return null;
  const o = spec.o || {};
  let node;
  if (spec.t === "text") {
    node = figma.createText();
    node.fontName = FONTS[o.weight || "r"];
    node.characters = spec.text;
    node.fontSize = o.size || 14;
    node.fills = [paint(o.color || K.ink)];
    if (o.underline) node.textDecoration = "UNDERLINE";
    if (o.align) node.textAlignHorizontal = o.align;
    node.name = o.name || spec.text.slice(0, 40);
  } else if (spec.t === "inst") {
    node = COMPONENTS[spec.comp].createInstance();
  } else {
    node = o.component ? figma.createComponent() : figma.createFrame();
    node.name = o.name || (o.dir === "h" ? "Row" : "Stack");
    node.layoutMode = o.dir === "h" ? "HORIZONTAL" : "VERTICAL";
    node.itemSpacing = o.gap || 0;
    const p = pad4(o.pad);
    node.paddingTop = p[0];
    node.paddingRight = p[1];
    node.paddingBottom = p[2];
    node.paddingLeft = p[3];
    node.fills = o.fill ? [paint(o.fill)] : [];
    if (o.stroke) {
      node.strokes = [paint(o.stroke)];
      node.strokeWeight = o.sw || 1;
      node.strokeAlign = "INSIDE";
      if (o.dash) node.dashPattern = [6, 4];
      if (o.sides !== undefined) {
        const w = o.sw || 1;
        node.strokeTopWeight = o.sides.indexOf("t") >= 0 ? w : 0;
        node.strokeRightWeight = o.sides.indexOf("r") >= 0 ? w : 0;
        node.strokeBottomWeight = o.sides.indexOf("b") >= 0 ? w : 0;
        node.strokeLeftWeight = o.sides.indexOf("l") >= 0 ? w : 0;
      }
    }
    if (o.radius) node.cornerRadius = o.radius;
    node.counterAxisAlignItems = { start: "MIN", center: "CENTER", end: "MAX", baseline: "BASELINE" }[o.align || "start"];
    node.primaryAxisAlignItems = { start: "MIN", center: "CENTER", end: "MAX", space: "SPACE_BETWEEN" }[o.justify || "start"];
    node.clipsContent = false;
    if (o.w || o.h) node.resize(o.w || 100, o.h || 100);
  }

  parent.appendChild(node);

  // Boxes fill their parent's width unless fixed (w) or hug.
  const parentIsAuto = parent.type !== "PAGE" && parent.layoutMode && parent.layoutMode !== "NONE";
  const parentHugsW = parentIsAuto && parent.layoutSizingHorizontal === "HUG";
  if (spec.t === "box") {
    if (o.w) node.layoutSizingHorizontal = "FIXED";
    else if (!o.hug && parentIsAuto && !parentHugsW) node.layoutSizingHorizontal = "FILL";
    else node.layoutSizingHorizontal = "HUG";
    node.layoutSizingVertical = o.h ? "FIXED" : "HUG";
  } else if (spec.t === "inst") {
    if (parentIsAuto && !parentHugsW && !o.hug) node.layoutSizingHorizontal = "FILL";
  } else if (spec.t === "text" && o.fill && parentIsAuto && !parentHugsW) {
    node.layoutSizingHorizontal = "FILL";
    node.textAutoResize = "HEIGHT";
  }
  if (o.grow && parentIsAuto) node.layoutGrow = 1;

  if (spec.t === "box") for (const k of spec.kids) render(k, node);
  if (o.cross) addCross(node);
  if (o.mark) addMarker(node, o.mark, o.markLeft);
  if (o.go) LINKS.push([node, o.go]);
  return node;
}

function addCross(node) {
  const w = node.width;
  const h = node.height;
  const v = figma.createVector();
  v.name = "X";
  v.vectorPaths = [{ windingRule: "NONE", data: "M 0 0 L " + w + " " + h + " M " + w + " 0 L 0 " + h }];
  v.fills = [];
  v.strokes = [paint(K.line)];
  v.strokeWeight = 1;
  node.insertChild(0, v);
  v.layoutPositioning = "ABSOLUTE";
  v.x = 0;
  v.y = 0;
  v.constraints = { horizontal: "SCALE", vertical: "SCALE" };
}

// Numbered annotation circle (black), matching the notes on the "UX notes" page.
function addMarker(node, n, left) {
  const m = figma.createFrame();
  m.name = "UX marker " + n;
  m.layoutMode = "HORIZONTAL";
  m.primaryAxisAlignItems = "CENTER";
  m.counterAxisAlignItems = "CENTER";
  m.resize(24, 24);
  m.layoutSizingHorizontal = "FIXED";
  m.layoutSizingVertical = "FIXED";
  m.cornerRadius = 12;
  m.fills = [paint(K.black)];
  m.strokes = [paint(K.white)];
  m.strokeWeight = 2;
  m.strokeAlign = "OUTSIDE";
  const t = figma.createText();
  t.fontName = FONTS.s;
  t.characters = String(n);
  t.fontSize = 11;
  t.fills = [paint(K.white)];
  m.appendChild(t);
  node.appendChild(m);
  node.clipsContent = false;
  m.layoutPositioning = "ABSOLUTE";
  m.constraints = { horizontal: left ? "MIN" : "MAX", vertical: "MIN" };
  const full = node.width >= W - 1;
  m.x = left ? (full ? 8 : -12) : full ? node.width - 32 : node.width - 12;
  m.y = full ? 8 : -12;
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

function buildComponents(page) {
  const specs = {
    header: H({ component: true, name: "Header", w: W, h: 72, pad: [0, 48], gap: 28, align: "center", fill: K.white, stroke: K.dark, sides: "b" }, [
      H({ w: 120, h: 40, stroke: K.dark, cross: true, go: "01", name: "Logo", align: "center", justify: "center" }, [H({ hug: true, pad: [2, 6], fill: K.white }, [small("LOGO")])]),
      H({ hug: true, gap: 24, align: "center", name: "Navigation" }, [
        txt("Shop by need ▾", 14, { go: "04" }),
        txt("Frames by shape ▾", 14, { go: "04" }),
        txt("Find my frame", 14, { go: "02" }),
        txt("Eye test & stores", 14),
        txt("Help", 14),
      ]),
      GROW(),
      H({ hug: true, h: 36, pad: [0, 12], stroke: K.dark, align: "center", name: "Need selector" }, [small("Glasses for ▾")]),
      H({ w: 220, h: 36, pad: [0, 10], stroke: K.dark, align: "center", justify: "end", name: "Search" }, [icon(14)]),
      H({ hug: true, gap: 12, align: "center", name: "Icons" }, [icon(22, false, { name: "Wishlist" }), icon(22, false, { name: "Bag", go: "07" }), icon(22, false, { name: "Account" })]),
    ]),
    footer: V({ component: true, name: "Footer", w: W, pad: [40, 64, 24, 64], gap: 28, fill: K.footer }, [
      H({ gap: 56 }, [0, 1, 2, 3].map(() =>
        V({ gap: 12 }, [V({ w: 80, h: 10, fill: K.white }), V({ w: 160, h: 7, fill: K.footerBar }), V({ w: 130, h: 7, fill: K.footerBar }), V({ w: 150, h: 7, fill: K.footerBar }), V({ w: 110, h: 7, fill: K.footerBar })])
      )),
      V({ h: 1, fill: K.footerBar }),
      small("Academic redesign concept. Not affiliated with or endorsed by Lenskart.", { color: K.white }),
    ]),
    card: V({ component: true, name: "Product card", w: 300, stroke: K.dark, fill: K.white, go: "05" }, [
      ph(150, { stroke: K.line, sides: "b" }),
      V({ pad: 14, gap: 10 }, [
        strongBar(120),
        bar(170),
        H({ justify: "space", align: "center" }, [btn("VIEW", "05"), check(false, "Compare")]),
      ]),
    ]),
  };
  const kit = render(V({ w: 1560, pad: 48, gap: 32, fill: K.light, name: "Components (wireframe kit)" }, [
    head("Components", 32),
    txt("Edit a main component and every screen updates. Links set here apply to every instance: logo → 01, Find my frame → 02, Shop by need / Frames by shape → 04, bag → 07, card and VIEW → 05.", 14, { fill: true, color: K.dark }),
  ]), page);
  for (const key of ["header", "footer", "card"]) COMPONENTS[key] = render(specs[key], kit);
  return kit;
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

const card = () => INST("card");
const centred = (w, kids) => V({ pad: [48, 64], align: "center", name: "Content" }, [V({ w: w, gap: 22 }, kids)]);
const summaryBox = (o) =>
  box([head("Order summary", 18), kv(), kv(), kv(), kv(), rule(), H({ justify: "space", align: "center" }, [txt("Total", 16, { weight: "m" }), strongBar(80)])], Object.assign({ w: 380, name: "Order summary" }, o));
const payment = (o) => box([head("3. Payment", 18), radio(true, "UPI"), radio(false, "Card"), radio(false, "Net banking"), radio(false, "Cash on delivery"), field("UPI ID")], o);

function filtersPanel(empty) {
  return V({ w: 280, pad: 20, gap: 14, stroke: K.dark, fill: K.white, mark: 1, name: "Filters" }, [
    H({ justify: "space", align: "center" }, [txt("FILTERS", 14, { weight: "s" }), link("Clear all", "04")]),
    rule(),
    small("For"), check(true), check(false), check(false),
    small("Price"), check(false), check(false),
    small("Size"), check(empty), check(false),
    small("Shape"), check(empty, null, { go: empty ? "04" : "04A", name: "Checkbox (no-match combination)" }), check(false),
    small("+ More filters", { color: K.mid }),
  ]);
}

function screens() {
  return {
    "01": {
      title: "HOME",
      sub: "Start with what the glasses are for",
      path: "/",
      notes: [
        [1, "Header: shopping links only", "U1", "Corporate and partner links moved to the footer."],
        [2, "Start from the need", "X2, U6", "Six need tiles open a pre-filtered listing."],
        [3, "Guided “Find my frame”", "X3", "A 3-question route for people who don't know their size or shape."],
        [4, "Promises up front", "X8", "Returns, cash on delivery, shipping, free eye test."],
        [5, "Simple product cards", "U4, X4", "One price line, one action, compare."],
        [6, "One promotion, after the task", "X7, U2", "A single campaign block with a descriptive button."],
      ],
      body: [
        V({ mark: 1 }, [INST("header")]),
        section([
          H({ gap: 56 }, [
            V({ gap: 20 }, [
              bar(180),
              head("What are your glasses for?", 40),
              lines(2, { w: 520 }),
              V({ mark: 2, name: "Need tiles" }, [grid(3, ["Prescription", "Computer", "Reading", "Sunglasses", "Contact lenses", "Kids"].map((n) =>
                H({ pad: 16, gap: 12, stroke: K.dark, align: "center", go: "04", name: "Need tile / " + n }, [icon(36, true), V({ gap: 6 }, [txt(n, 14, { weight: "m" }), bar(110)])])
              ), 0)]),
              H({ gap: 20, align: "center" }, [V({ hug: true, mark: 3 }, [btn("Find my frame in 3 questions", "02", "solid")]), link("Book a free eye test")]),
            ]),
            V({ w: 440 }, [ph(550, {}, "PHOTO")]),
          ]),
        ]),
        section([
          H({ gap: 56 }, [
            V({ gap: 0 }, [head("How it works", 20)].concat([1, 2, 3, 4].map((i) =>
              H({ pad: [18, 0], gap: 20, stroke: K.line, sides: "b" }, [small("0" + i), V({ gap: 10 }, [strongBar(220), lines(2, { w: 520 })])])
            ))),
            V({ w: 440 }, [ph(380, {}, "EYE CHART")]),
          ]),
        ]),
        section([
          H({ stroke: K.dark, mark: 4, name: "Trust strip" }, [0, 1, 2, 3].map((i) =>
            H({ pad: 18, gap: 12, align: "center", stroke: K.line, sides: i < 3 ? "r" : "" }, [icon(28), V({ gap: 8 }, [strongBar(110), bar(160)])])
          )),
        ]),
        section([
          H({ justify: "space", align: "center" }, [head("Frames by shape", 24), link("See all", "04")]),
          H({ gap: 12 }, [0, 1, 2, 3, 4, 5, 6, 7].map(() => V({ pad: 12, gap: 10, stroke: K.dark, align: "center", go: "04", name: "Shape" }, [ph(44), bar(70)]))),
        ]),
        section([
          H({ justify: "space", align: "center" }, [head("Popular frames", 24), link("See all", "04")]),
          H({ gap: 24, mark: 5, markLeft: true, name: "Cards" }, [card(), card(), card(), card()]),
        ]),
        section([
          H({ pad: 32, gap: 40, stroke: K.dark, align: "center", mark: 6, name: "Campaign" }, [
            V({ gap: 16 }, [bar(140), head("Featherweight collection", 28), lines(2, { w: 480 }), btn("Shop the collection", "04")]),
            V({ w: 280 }, [ph(350, {}, "PHOTO")]),
          ]),
        ]),
        V({ pad: [48, 64], fill: K.light, name: "Eye test" }, [
          H({ gap: 56, align: "center" }, [
            V({ w: 320 }, [ph(400, {}, "PHOTO")]),
            V({ gap: 18 }, [bar(200), head("Get your eyes checked free", 36), lines(2, { w: 520 }), btn("Book a free eye test", null, "solid")]),
          ]),
        ]),
        INST("footer"),
      ],
    },

    "02": {
      title: "FRAME FINDER",
      sub: "3 questions: purpose → face shape → fit (same layout for each)",
      path: "/finder",
      notes: [
        [1, "Progress shown", "X3", "Question 1 of 3; Back and Skip always available."],
        [2, "Described options", "X3, U3", "Each answer has a one-line explanation; “Not sure” is an option."],
      ],
      body: [
        INST("header"),
        centred(760, [
          small("FRAME FINDER · QUESTION 1 OF 3"),
          H({ gap: 8, mark: 1, name: "Progress" }, [V({ h: 6, fill: K.mid }), V({ h: 6, fill: K.bar }), V({ h: 6, fill: K.bar })]),
          head("What are the glasses for?", 32),
          lines(1, { w: 500, short: true }),
          V({ mark: 2, name: "Options" }, [grid(2, [0, 1, 2, 3].map((i) => H({ pad: 18, gap: 12, stroke: i === 0 ? K.black : K.dark, sw: i === 0 ? 2 : 1 }, [V({ w: 16, h: 16, radius: 8, stroke: K.ink, sw: i === 0 ? 5 : 1 }), V({ gap: 8 }, [strongBar(130), bar(200)])])), 12)]),
          H({ justify: "space", align: "center" }, [btn("Back", "01"), H({ hug: true, gap: 20, align: "center" }, [link("Skip", "03"), btn("Next", "03", "solid")])]),
        ]),
        GAP(200),
        INST("footer"),
      ],
    },

    "03": {
      title: "FINDER RESULTS",
      sub: "Answers summarised, matches counted",
      path: "/finder",
      notes: [
        [1, "Answers are editable", "X3", "“Change my answers” returns to question 1."],
        [2, "Only in-stock matches", "X3", "If nothing matches, one filter is relaxed and the page says which."],
      ],
      body: [
        INST("header"),
        centred(760, [
          small("FRAME FINDER · RESULTS"),
          head("Your matches", 32),
          box([kv(), kv(), kv(), link("Change my answers", "02")], { fill: K.light, stroke: K.line, mark: 1, name: "Answers" }),
          box([head("N frames found", 28), lines(1, { w: 500, short: true }), H({ gap: 16, align: "center" }, [btn("See my frames", "04", "solid"), btn("See all frames", "04")])], { mark: 2, name: "Result" }),
        ]),
        GAP(200),
        INST("footer"),
      ],
    },

    "04": {
      title: "LISTING",
      sub: "Filters · sort · results · compare",
      path: "/shop?need=prescription",
      notes: [
        [1, "Grouped plain-language filters", "X13, U3", "A few groups with helpers; exact counts per option."],
        [2, "Sort + removable filter chips", "X13", "The need from Home arrives as a chip."],
        [3, "Simple cards, one action", "U4, X4, U5", "Image, name, price line, VIEW, Compare."],
        [4, "Compare tray", "U4, X4", "Up to 3 frames side by side (04B)."],
      ],
      body: [
        INST("header"),
        V({ pad: [32, 64, 8, 64], gap: 12 }, [head("Prescription glasses", 32), lines(1, { w: 400, short: true })]),
        H({ pad: [24, 64], gap: 32, name: "Listing body" }, [
          filtersPanel(false),
          V({ gap: 20, name: "Results" }, [
            H({ justify: "space", align: "center", mark: 2, name: "Toolbar" }, [
              H({ hug: true, gap: 10, align: "center" }, [bar(80), chip()]),
              H({ w: 200, h: 36, pad: [0, 12], stroke: K.dark, align: "center", justify: "space", name: "Sort" }, [small("SORT"), small("▾")]),
            ]),
            V({ mark: 3, markLeft: true }, [grid(3, [card(), card(), card(), card(), card(), card()], 24)]),
            H({ justify: "center" }, [btn("Load more", null)]),
            H({ pad: [14, 20], gap: 16, align: "center", stroke: K.dark, fill: K.light, mark: 4, name: "Compare tray" }, [
              txt("Compare", 14, { weight: "s" }),
              H({ hug: true, gap: 8 }, [ph(32, { w: 56 }), ph(32, { w: 56 }), V({ w: 56, h: 32, stroke: K.mid, dash: true })]),
              GROW(),
              btn("Compare frames", "04B", "solid"),
            ]),
          ]),
        ]),
        GAP(48),
        INST("footer"),
      ],
    },

    "04A": {
      title: "EMPTY STATE",
      sub: "No frames match the chosen filters",
      path: "/shop?…",
      notes: [
        [1, "Filters stay visible", "X13", "The cause is on screen."],
        [2, "Plain explanation", "U3", "Nothing is wrong; the combination is too narrow."],
        [3, "One-click recovery", "X13", "Each suggestion removes one filter and shows how many frames return."],
      ],
      body: [
        INST("header"),
        V({ pad: [32, 64, 8, 64], gap: 12 }, [head("Prescription glasses", 32)]),
        H({ pad: [24, 64], gap: 32 }, [
          filtersPanel(true),
          V({ gap: 20 }, [
            H({ gap: 10, align: "center" }, [chip(), chip(), chip(), link("Clear all", "04")]),
            V({ pad: 56, gap: 18, stroke: K.dark, dash: true, align: "center", mark: 2, name: "Empty state" }, [
              icon(48, true),
              head("No frames match all of these filters", 24),
              lines(2, { w: 460 }),
              small("Try removing one filter:"),
              H({ hug: true, gap: 12, mark: 3 }, [btn("Remove filter A · N frames", "04"), btn("Remove filter B · N frames", "04")]),
              link("Clear all filters", "04"),
            ]),
          ]),
        ]),
        GAP(48),
        INST("footer"),
      ],
    },

    "04B": {
      title: "COMPARE",
      sub: "Opened from the 04 compare tray",
      path: "/compare",
      notes: [
        [1, "Sizes drawn to scale", "U4, X4", "Outlines overlaid from real measurements."],
        [2, "Same rows, same units", "U4", "Differences visible without memory."],
        [3, "One next step per frame", "X3", "Choose → product page (05)."],
      ],
      body: [
        INST("header"),
        V({ pad: [32, 64], gap: 20 }, [
          small("STEP 2 · CHOOSE BETWEEN FRAMES"),
          head("Compare frames", 32),
          V({ mark: 1 }, [ph(200, {}, "SIZE OVERLAY")]),
          V({ stroke: K.dark, mark: 2, name: "Table" }, [
            H({ stroke: K.line, sides: "b" }, [V({ w: 240, pad: 16 }, [])].concat([0, 1, 2].map(() => V({ pad: 16, gap: 10, stroke: K.line, sides: "l" }, [ph(90), strongBar(120)])))),
          ].concat([0, 1, 2, 3, 4, 5].map(() =>
            H({ stroke: K.line, sides: "b" }, [V({ w: 240, pad: [14, 16] }, [bar(120)])].concat([0, 1, 2].map(() => V({ pad: [14, 16], stroke: K.line, sides: "l" }, [bar(90)]))))
          )).concat([
            H({}, [V({ w: 240, pad: 16 }, [])].concat([0, 1, 2].map((i) => V({ pad: 16, stroke: K.line, sides: "l", mark: i === 0 ? 3 : 0 }, [btn("Choose", "05", i === 0 ? "solid" : "outline")])))),
          ])),
        ]),
        GAP(48),
        INST("footer"),
      ],
    },

    "05": {
      title: "PRODUCT DETAILS",
      sub: "Size · lens purpose · live price",
      path: "/frames/…",
      notes: [
        [1, "Drawn to scale, 3D on request", "X9", "Illustration from measurements; descriptive alt text."],
        [2, "Sizes in mm, honest stock", "X12, X3", "Low stock only when true; “Find my size” helps."],
        [3, "“What are the lenses for?”", "X6", "Lens options named by purpose."],
        [4, "Live price breakdown", "X5, X7", "Frame + lenses + coating − one offer, explained in one sentence."],
        [5, "Promises by the button", "X8", ""],
      ],
      body: [
        INST("header"),
        H({ pad: [40, 64], gap: 56, name: "Product" }, [
          V({ gap: 14 }, [
            V({ mark: 1 }, [ph(460, {}, "FRAME")]),
            H({ gap: 12 }, [ph(80), ph(80), ph(80), ph(80)]),
            btn("Try in 3D", null),
          ]),
          V({ w: 560, gap: 22, name: "Configure" }, [
            bar(160),
            head("Frame name", 36),
            strongBar(90),
            V({ gap: 10 }, [small("Colour"), H({ gap: 10 }, [icon(28, true), icon(28, true), icon(28, true)])]),
            V({ gap: 10, mark: 2, name: "Size" }, [H({ justify: "space" }, [small("Size"), link("Find my size")]), H({ gap: 10 }, ["S", "M", "L"].map((s, i) => V({ pad: 12, gap: 8, stroke: i === 1 ? K.black : K.dark, sw: i === 1 ? 2 : 1 }, [txt(s, 14, { weight: "m" }), bar(70)])))]),
            V({ gap: 10, mark: 3, name: "Lens purpose" }, [small("What are the lenses for?"), radio(true), radio(false), radio(false), radio(false), radio(false)]),
            V({ gap: 10, name: "Lens type" }, [small("Lens type"), radio(true), radio(false), radio(false)]),
            V({ gap: 10, name: "Coating" }, [small("Coating (optional)"), H({ gap: 8 }, [0, 1, 2, 3].map(() => H({ pad: [8, 12], stroke: K.dark }, [bar(60)])))]),
            box([kv(), kv(), kv(), kv(), rule(), H({ justify: "space", align: "center" }, [txt("Total", 16, { weight: "m" }), strongBar(90)]), lines(2)], { mark: 4, name: "Price breakdown" }),
            V({ gap: 12, mark: 5 }, [btn("Continue: add your prescription", "06", "solid", { hug: false }), btn("Add to compare", "04B", "outline", { hug: false }), lines(1, { short: true })]),
          ]),
        ]),
        INST("footer"),
      ],
    },

    "06": {
      title: "PRESCRIPTION",
      sub: "Type it, upload it, or send it later",
      path: "/prescription/…",
      notes: [
        [1, "Three ways, including later", "X11", "Ordering is never blocked by a missing prescription."],
        [2, "Sensitive data, stated plainly", "—", "Demo note; who sees it; optometrist check."],
        [3, "Inline checking with hints", "U3", "Each value is checked as it's typed."],
      ],
      body: [
        INST("header"),
        centred(860, [
          head("Add your prescription", 32),
          H({ pad: [10, 14], fill: K.light, stroke: K.line, mark: 2 }, [small("Demo only. Do not upload a real prescription.")]),
          small("How would you like to add it?"),
          H({ gap: 12, mark: 1 }, [0, 1, 2].map((i) => H({ pad: 16, gap: 12, stroke: i === 0 ? K.black : K.dark, sw: i === 0 ? 2 : 1, go: i === 2 ? "07" : null }, [V({ w: 16, h: 16, radius: 8, stroke: K.ink, sw: i === 0 ? 5 : 1 }), V({ gap: 8 }, [strongBar(120), lines(2)])]))),
          box([
            H({ gap: 12 }, [V({ w: 120 }, []), small("SPH", { fill: true }), small("CYL", { fill: true }), small("AXIS", { fill: true })]),
            H({ gap: 12, align: "center" }, [V({ w: 120 }, [small("Right eye")]), field(), field(), field()]),
            H({ gap: 12, align: "center" }, [V({ w: 120 }, [small("Left eye")]), field(), field(), field()]),
            V({ w: 260 }, [field("PD")]),
          ], { mark: 3, name: "Values" }),
          V({ gap: 8 }, [check(true), check(true), check(true)]),
          H({ justify: "space", align: "center" }, [btn("Back", "05"), H({ hug: true, gap: 20, align: "center" }, [link("Skip for now", "07"), btn("Save and go to bag", "07", "solid")])]),
        ]),
        GAP(80),
        INST("footer"),
      ],
    },

    "07": {
      title: "BAG",
      sub: "Review every choice before paying",
      path: "/cart",
      notes: [
        [1, "Every choice visible and editable", "X5", "Lens, coating, size, prescription status; Edit lenses → 05."],
        [2, "One offer, applied automatically", "X7", "A code replaces it only if it saves more."],
        [3, "Guest checkout", "X11", "No account needed."],
      ],
      body: [
        INST("header"),
        V({ pad: [32, 64, 8, 64], gap: 10 }, [small("STEP 3 · REVIEW"), head("Your bag", 32)]),
        H({ pad: [16, 64], gap: 40 }, [
          V({ gap: 20 }, [
            H({ pad: 20, gap: 20, stroke: K.dark, mark: 1, name: "Bag item" }, [
              V({ w: 180 }, [ph(120)]),
              V({ gap: 12 }, [H({ justify: "space" }, [strongBar(140), strongBar(60)]), kv(), kv(), kv(), kv(), H({ gap: 20 }, [link("Edit lenses", "05"), link("Edit prescription", "06"), link("Remove")])]),
            ]),
            H({ stroke: K.dark }, [0, 1, 2, 3].map((i) => H({ pad: 14, gap: 10, align: "center", stroke: K.line, sides: i < 3 ? "r" : "" }, [icon(22), bar(100)]))),
          ]),
          V({ w: 400, gap: 14 }, [
            summaryBox({ w: undefined, mark: 2 }),
            H({ gap: 8, align: "end" }, [field("Offer code"), btn("Apply", null)]),
            V({ gap: 8, mark: 3 }, [btn("Checkout", "08", "solid", { hug: false }), lines(1, { short: true })]),
          ]),
        ]),
        GAP(80),
        INST("footer"),
      ],
    },

    "08": {
      title: "CHECKOUT",
      sub: "Contact · delivery · payment, as a guest",
      path: "/checkout",
      notes: [
        [1, "Guest checkout, sign-in optional", "X11", "Three numbered sections on one page."],
        [2, "Simulated payment, stated plainly", "—", "Demo note; test values in hints."],
        [3, "Total on the pay button", "X5", ""],
      ],
      body: [
        INST("header"),
        V({ pad: [32, 64, 8, 64], gap: 12 }, [small("STEP 4 · PAY"), head("Checkout", 32), H({ hug: true, pad: [10, 14], fill: K.light, stroke: K.line, mark: 2 }, [small("Demo checkout, no real payment.")])]),
        H({ pad: [16, 64], gap: 40 }, [
          V({ gap: 20 }, [
            H({ gap: 8, mark: 1 }, [bar(160), link("Sign in instead (optional)")]),
            box([head("1. Contact", 18), field("Email"), H({ gap: 16 }, [field("Name"), field("Mobile")])]),
            box([head("2. Delivery address", 18), field("Address"), field("Area"), H({ gap: 16 }, [field("City"), field("State"), field("PIN")])]),
            payment(),
            H({ justify: "space", align: "center" }, [btn("Back to bag", "07"), H({ hug: true, gap: 16, align: "center" }, [link("Simulate a decline", "08A"), V({ hug: true, mark: 3 }, [btn("Pay · ₹ total", "09", "solid")])])]),
          ]),
          summaryBox(),
        ]),
        GAP(80),
        INST("footer"),
      ],
    },

    "08A": {
      title: "PAYMENT DECLINED",
      sub: "Error with Retry and Change method",
      path: "/checkout",
      notes: [
        [1, "Says what happened and what to do", "U3", "Retry, or choose another method."],
        [2, "Retry is safe", "X11", "Orders are idempotent; details are kept."],
      ],
      body: [
        INST("header"),
        V({ pad: [32, 64, 8, 64], gap: 12 }, [small("STEP 4 · PAY"), head("Checkout", 32)]),
        V({ pad: [16, 64], gap: 20 }, [
          V({ pad: 24, gap: 14, stroke: K.black, sw: 3, mark: 1, name: "Error alert" }, [
            H({ gap: 12, align: "center" }, [icon(28, true), head("Payment didn't go through", 22)]),
            lines(2, { w: 560 }),
            H({ gap: 12, mark: 2 }, [btn("Retry", "09", "solid"), btn("Change method", "08")]),
          ]),
          payment({ stroke: K.line }),
        ]),
        GAP(80),
        INST("footer"),
      ],
    },

    "09": {
      title: "CONFIRMATION",
      sub: "What happens next",
      path: "/order/…",
      notes: [
        [1, "Key facts first", "—", "Order number, arrival window, payment."],
        [2, "What happens next, step by step", "X8", "Prescription check → lenses made → shipped → arrives."],
        [3, "Cancel or return easy to find", "X8", ""],
      ],
      body: [
        INST("header"),
        centred(860, [
          small("STEP 5 · DONE"),
          head("Order confirmed", 36),
          H({ gap: 12, mark: 1 }, [0, 1, 2].map(() => V({ pad: 16, gap: 10, fill: K.light, stroke: K.line }, [bar(80), strongBar(140)]))),
          V({ stroke: K.dark, mark: 2, name: "Timeline" }, [V({ pad: [16, 20] }, [head("What happens next", 18)])].concat([0, 1, 2, 3, 4].map((i) =>
            H({ pad: [14, 20], gap: 14, align: "center", stroke: K.line, sides: "t" }, [V({ w: 18, h: 18, radius: 9, stroke: K.ink, fill: i === 0 ? K.mid : K.white }), V({ gap: 8 }, [strongBar(160), bar(300)])])
          ))),
          box([head("Order details", 18), kv(), kv(), kv(), rule(), kv()]),
          H({ gap: 20, align: "center" }, [btn("Track order", null, "solid"), V({ hug: true, mark: 3 }, [link("Cancel or return")]), link("Back to home", "01")]),
        ]),
        GAP(80),
        INST("footer"),
      ],
    },
  };
}

/* ------------------------------------------------------------------ */
/* Canvas: main flow left → right, branches underneath                  */
/* ------------------------------------------------------------------ */

const MAIN = ["01", "02", "03", "04", "05", "06", "07", "08", "09"];
// Branch screens sit under a main screen. dir "down": main → branch; "up": branch → main.
const BRANCHES = [
  { under: "04", id: "04A", label: "No frames match", dir: "down" },
  { under: "05", id: "04B", label: "Choose a frame  ·  opened from 04 via the compare tray", dir: "up" },
  { under: "08", id: "08A", label: "Payment declined  ·  Retry → 09", dir: "down" },
];
const FLOW_LABELS = {
  "01": "Find my frame",
  "02": "Next (× 3)",
  "03": "See my frames",
  "04": "VIEW",
  "05": "Continue",
  "06": "Save",
  "07": "Checkout",
  "08": "Pay",
};
const GAP_X = 260;
const GAP_Y = 420;

function arrowRight(len, label) {
  return V({ hug: true, gap: 8, align: "center", name: "Arrow → " + label }, [
    txt(label, 18, { color: K.dark, weight: "m" }),
    H({ hug: true, align: "center" }, [V({ w: len - 14, h: 2, fill: K.ink }), txt("▶", 16, { color: K.ink })]),
  ]);
}
function arrowVertical(len, label, up) {
  return H({ hug: true, gap: 12, align: "center", name: "Arrow " + (up ? "↑ " : "↓ ") + label }, [
    V({ hug: true, align: "center" }, [up ? txt("▲", 16, { color: K.ink }) : null, V({ w: 2, h: Math.max(40, len - 18), fill: K.ink }), up ? null : txt("▼", 16, { color: K.ink })]),
    txt(label, 18, { color: K.dark, weight: "m" }),
  ]);
}
function frameLabel(id, s) {
  return V({ hug: true, gap: 6, name: "Label · " + id }, [txt(id + " — " + s.title, 44, { weight: "s", color: K.black }), txt(s.sub, 20, { color: K.dark })]);
}

function cover() {
  return V({ w: 1000, pad: 56, gap: 22, fill: K.white, stroke: K.ink, name: "Cover" }, [
    small("MCA263D4 · UX CASE STUDY · LOW-FIDELITY WIREFRAMES"),
    head("Clear Path", 56),
    txt("Blueprint of the Clear Path redesign of lenskart.com: the same screens, structure and flow as the coded prototype, without visual design or real content.", 18, { fill: true, color: K.dark }),
    H({ gap: 24 }, [
      box([
        head("Legend", 18),
        H({ gap: 12, align: "center" }, [ph(40, { w: 60 }), txt("Image or visual", 14)]),
        H({ gap: 12, align: "center" }, [V({ w: 60, gap: 6 }, [V({ h: 8, fill: K.bar }), V({ h: 8, fill: K.bar })]), txt("Text · darker bar = title or value", 14)]),
        H({ gap: 12, align: "center" }, [btn("Primary", null, "solid"), btn("Secondary", null)]),
        H({ gap: 12, align: "center" }, [V({ w: 24, h: 24, radius: 12, fill: K.black }), txt("UX note (see “UX notes” page)", 14)]),
      ], { stroke: K.line }),
      box([
        head("Flow", 18),
        txt("Main: 01 Home → 02 Frame Finder → 03 Results → 04 Listing → 05 Product → 06 Prescription → 07 Bag → 08 Checkout → 09 Confirmation", 14, { fill: true }),
        txt("Branches, under their screen: 04A Empty state, 04B Compare, 08A Payment declined", 14, { fill: true }),
        txt("Shortcut: the need tiles on 01 open 04 directly.", 14, { fill: true, color: K.dark }),
      ], { stroke: K.line }),
    ]),
    txt("Present (▶) from “01 — HOME”, or open the flow “Purchase journey”. Buttons, cards, the logo and the header links are clickable.", 14, { fill: true, color: K.dark }),
    small("Academic redesign concept. Not affiliated with or endorsed by Lenskart."),
  ]);
}

function notesCard(id, s) {
  return V({ w: 440, pad: 24, gap: 14, stroke: K.dark, fill: K.white, name: "Notes · " + id }, [
    txt(id + " — " + s.title, 20, { weight: "s", color: K.black }),
  ].concat(s.notes.map((n) =>
    H({ gap: 10 }, [
      H({ w: 22, h: 22, radius: 11, fill: K.black, justify: "center", align: "center" }, [txt(String(n[0]), 11, { weight: "s", color: K.white })]),
      V({ gap: 3 }, [txt(n[1], 14, { weight: "s", fill: true }), small("Issue: " + n[2]), n[3] ? txt(n[3], 13, { fill: true, color: K.dark }) : null]),
    ])
  )));
}

function screenFrame(id, s, page) {
  const frame = render(V({ w: W, fill: K.white, stroke: K.dark, name: id + " — " + s.title }, [browser(s.path)].concat(s.body)), page);
  frame.clipsContent = true;
  return frame;
}

async function main() {
  await Promise.all(Object.keys(FONTS).map((k) => figma.loadFontAsync(FONTS[k])));

  const pg = figma.createPage();
  pg.name = "Clear Path · Lo-fi wireframes";
  await figma.setCurrentPageAsync(pg);

  const S = screens();
  const kit = buildComponents(pg);
  const coverNode = render(cover(), pg);

  // Main row, left to right
  const nodes = {};
  let x = 0;
  let mainBottom = 0;
  for (const id of MAIN) {
    const frame = screenFrame(id, S[id], pg);
    frame.x = x;
    frame.y = 0;
    const lab = render(frameLabel(id, S[id]), pg);
    lab.x = x;
    lab.y = -lab.height - 32;
    nodes[id] = frame;
    mainBottom = Math.max(mainBottom, frame.height);
    x += W + GAP_X;
  }

  // Arrows between neighbouring main screens, all at the same height
  for (let i = 0; i < MAIN.length - 1; i++) {
    const arrow = render(arrowRight(GAP_X - 60, FLOW_LABELS[MAIN[i]]), pg);
    arrow.x = nodes[MAIN[i]].x + W + 30;
    arrow.y = 260;
  }

  // Branches directly under their screen, connected by a short vertical arrow
  const branchTop = mainBottom + GAP_Y;
  for (const b of BRANCHES) {
    const parent = nodes[b.under];
    const frame = screenFrame(b.id, S[b.id], pg);
    frame.x = parent.x;
    frame.y = branchTop;
    const lab = render(frameLabel(b.id, S[b.id]), pg);
    lab.x = parent.x;
    lab.y = branchTop - lab.height - 32;
    const arrow = render(arrowVertical(lab.y - parent.height - 48, b.label, b.dir === "up"), pg);
    arrow.x = parent.x + W / 2 + 40;
    arrow.y = parent.height + 24;
    nodes[b.id] = frame;
  }

  // Cover, then the component kit, to the left of 01
  coverNode.x = -coverNode.width - 400;
  coverNode.y = -200;
  kit.x = -kit.width - 400;
  kit.y = coverNode.y + coverNode.height + 160;

  // Prototype links
  for (const pair of LINKS) {
    const target = nodes[pair[1]];
    if (!target) continue;
    await pair[0].setReactionsAsync([
      {
        trigger: { type: "ON_CLICK" },
        actions: [{ type: "NODE", destinationId: target.id, navigation: "NAVIGATE", transition: { type: "DISSOLVE", easing: { type: "EASE_OUT" }, duration: 0.2 } }],
      },
    ]);
  }
  pg.flowStartingPoints = [{ nodeId: nodes["01"].id, name: "Purchase journey" }];

  // UX notes on their own page, in flow order
  const notesPage = figma.createPage();
  notesPage.name = "Clear Path · UX notes";
  const order = ["01", "02", "03", "04", "04A", "04B", "05", "06", "07", "08", "08A", "09"];
  let nx = 0;
  let ny = 0;
  let rowH = 0;
  order.forEach((id, i) => {
    if (i > 0 && i % 4 === 0) {
      nx = 0;
      ny += rowH + 40;
      rowH = 0;
    }
    const c = render(notesCard(id, S[id]), notesPage);
    c.x = nx;
    c.y = ny;
    nx += c.width + 40;
    rowH = Math.max(rowH, c.height);
  });

  figma.viewport.scrollAndZoomIntoView([nodes["01"], nodes["02"], nodes["03"]]);
  figma.notify("Clear Path lo-fi wireframes: " + Object.keys(nodes).length + " screens, " + LINKS.length + " links.");
}

main()
  .then(() => figma.closePlugin())
  .catch((e) => {
    console.error(e);
    figma.closePlugin("Couldn't build the wireframes: " + (e && e.message ? e.message : e));
  });
