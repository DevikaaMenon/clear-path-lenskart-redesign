/*
 * Clear Path: low/mid-fidelity clickable wireframe generator for Figma.
 *
 * Builds a new page "Clear Path wireframes" with a cover, the 10 screens of the
 * purchase journey (S1 Home to S10 Confirmation, with the Frame Finder's steps and
 * a declined-payment state), a UX-notes panel beside each screen, shared components
 * (header, footer, product card, trust strip), and prototype click-links between
 * screens. Content (labels, counts, prices) mirrors the coded prototype.
 *
 * Grey = structure and placeholders, dark grey = actions and links,
 * magenta numbered circles = "what changed" notes (layer name "UX marker").
 *
 * LOFI (default) draws a low-fidelity wireframe: greyscale only, body copy shown as
 * grey text lines, images as crossed boxes, a LOGO box instead of the wordmark.
 * Set it to false for the earlier mid-fidelity version with full copy and navy accents.
 */

const LOFI = true;

const W = 1440;
const NOTES_W = 400;
const C = {
  brand: "#000042",
  ink: "#000042",
  body: "#33334D",
  muted: "#6B6B85",
  line: "#D9D9E0",
  lineStrong: "#9A9AB0",
  fill: "#F2F2F5",
  fill2: "#E4E4EB",
  white: "#FFFFFF",
  note: "#C2185B",
  noteSoft: "#FCE4EC",
  noteInk: "#5C0A2C",
  warnSoft: "#FFF4D6",
};
if (LOFI)
  Object.assign(C, {
    brand: "#3A3A3A",
    ink: "#222222",
    body: "#555555",
    muted: "#8A8A8A",
    line: "#D6D6D6",
    lineStrong: "#A0A0A0",
    fill: "#F2F2F2",
    fill2: "#E2E2E2",
    warnSoft: "#EDEDED",
  });
C.textBar = "#CFCFCF";
// Annotation colours stay magenta in LOFI; every other colour is turned to grey.
const KEEP_COLOUR = new Set([C.note, C.noteSoft, C.noteInk, C.white]);
let GREEK = false; // true while drawing screens and kit: body copy becomes text lines
const FONTS = {
  r: { family: "Inter", style: "Regular" },
  m: { family: "Inter", style: "Medium" },
  s: { family: "Inter", style: "Semi Bold" },
  b: { family: "Inter", style: "Bold" },
};

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function grey(h) {
  if (!LOFI || KEEP_COLOUR.has(h)) return h;
  const c = hex(h);
  const l = Math.round((0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) * 255).toString(16).padStart(2, "0");
  return "#" + l + l + l;
}
function paint(h, opacity) {
  h = grey(h);
  return { type: "SOLID", color: hex(h), opacity: opacity === undefined ? 1 : opacity };
}

/* ------------------------------------------------------------------ */
/* Spec builders: screens are described as a tree, then rendered       */
/* top-down so "fill container" sizing always has a sized parent.      */
/* ------------------------------------------------------------------ */

const V = (o, kids) => ({ t: "box", o: Object.assign({ dir: "v" }, o), kids: kids || [] });
const H = (o, kids) => ({ t: "box", o: Object.assign({ dir: "h" }, o), kids: kids || [] });
const T = (text, o) => ({ t: "text", text: text, o: o || {} });
const P = (text, o) => T(text, Object.assign({ fill: true, color: C.body, lh: 150, para: true }, o));
const INST = (comp, set, o) => ({ t: "inst", comp: comp, set: set || {}, o: o || {} });
const GAP = (h) => V({ h: h, name: "Spacer" });
const GROW = () => V({ h: 1, name: "Spacer" });

const eyebrow = (text, o) => T(text.toUpperCase(), Object.assign({ size: 12, weight: "s", color: C.muted, ls: 6 }, o));
const h1 = (text, o) => T(text, Object.assign({ size: 48, weight: "b", color: C.ink, fill: true, lh: 115 }, o));
const h2 = (text, o) => T(text, Object.assign({ size: 30, weight: "b", color: C.ink, fill: true, lh: 120 }, o));
const h3 = (text, o) => T(text, Object.assign({ size: 20, weight: "b", color: C.ink, fill: true, lh: 125 }, o));

function IMG(label, h, o) {
  if (LOFI) {
    // Classic crossed box with a short label ("PHOTO (4:5): woman…" → "PHOTO").
    const short = label.split(/[:\n]/)[0].replace(/\s*\(.*?\)/g, "").trim();
    return V(Object.assign({ h: h, fill: C.fill, stroke: C.lineStrong, cross: true, align: "center", justify: "center", name: "Placeholder" }, o), [
      h >= 40 ? H({ hug: true, pad: [3, 8], fill: C.fill }, [T(short, { size: 12, color: C.muted })]) : null,
    ]);
  }
  return V(Object.assign({ h: h, fill: C.fill, stroke: C.lineStrong, dash: true, align: "center", justify: "center", pad: 12, name: "Placeholder" }, o), [
    T(label, { size: 13, color: C.muted, align: "CENTER", fill: true }),
  ]);
}
function BTN(label, go, variant, o) {
  variant = variant || "primary";
  const s = {
    primary: { fill: C.brand, text: C.white, stroke: C.brand },
    secondary: { fill: C.white, text: C.brand, stroke: C.brand },
    inverse: { fill: C.white, text: C.brand, stroke: C.white },
  }[variant];
  return H(Object.assign({ hug: true, pad: [14, 22], fill: s.fill, stroke: s.stroke, justify: "center", align: "center", go: go, name: "Button / " + variant }, o), [
    T(label, { size: 16, weight: "s", color: s.text }),
  ]);
}
const LNK = (label, go, o) => T(label, Object.assign({ size: 15, weight: "s", color: C.brand, underline: true, go: go, name: "Link" }, o));
const CHIP = (label, o) =>
  H(Object.assign({ hug: true, pad: [8, 12], stroke: C.lineStrong, align: "center", gap: 8, name: "Chip" }, o), [T(label, { size: 14, weight: "m", color: C.ink })]);
const ICON = (size, o) => V(Object.assign({ w: size, h: size, radius: size / 2, fill: C.fill2, name: "Icon" }, o));
const RULE = () => V({ h: 1, fill: C.line, name: "Divider" });

function FIELD(label, value, hint, o) {
  return V(Object.assign({ gap: 6, name: "Field / " + label }, o), [
    T(label, { size: 14, weight: "s", color: C.ink }),
    H({ h: 48, pad: [0, 14], stroke: C.lineStrong, align: "center", fill: C.white }, [T(value || "", { size: 15, color: value ? C.ink : C.muted })]),
    hint ? T(hint, { size: 13, color: C.muted, fill: true }) : null,
  ]);
}
function CHECK(label, count, checked, o) {
  return H(Object.assign({ gap: 10, align: "center", name: "Checkbox" }, o), [
    V({ w: 18, h: 18, stroke: C.ink, sw: 1.5, fill: checked ? C.brand : C.white }),
    T(label, { size: 14, color: C.ink, fill: true }),
    count === null || count === undefined ? null : T(String(count), { size: 13, color: C.muted }),
  ]);
}
function OPTION(title, helper, selected, o) {
  return H(Object.assign({ pad: 16, gap: 12, stroke: selected ? C.brand : C.line, sw: selected ? 2 : 1, fill: selected ? "#F4F4FA" : C.white, name: "Option" }, o), [
    V({ w: 20, h: 20, radius: 10, stroke: C.ink, sw: selected ? 6 : 1.5, fill: C.white }),
    V({ gap: 4 }, [T(title, { size: 16, weight: "s", color: C.ink, fill: true }), helper ? T(helper, { size: 13, color: C.muted, fill: true, lh: 140 }) : null]),
  ]);
}
const ROW = (label, value, o) =>
  H(Object.assign({ justify: "space", align: "center", name: "Row" }, o), [
    T(label, { size: 15, color: (o && o.labelColor) || C.body }),
    T(value, { size: 15, weight: (o && o.bold) || "s", color: C.ink }),
  ]);
const grid = (cols, items, gap, o) => {
  const rows = [];
  for (let i = 0; i < items.length; i += cols) {
    const r = items.slice(i, i + cols);
    while (r.length < cols) r.push(V({ name: "Empty cell" }));
    rows.push(H({ gap: gap }, r));
  }
  return V(Object.assign({ gap: gap, name: "Grid" }, o), rows);
};
const page = (kids, o) => V(Object.assign({ pad: [0, 48], gap: 16, name: "Section" }, o), kids);

/* ------------------------------------------------------------------ */
/* Renderer                                                            */
/* ------------------------------------------------------------------ */

const LINKS = []; // [node, target screen id | "BACK"]
const COMPONENTS = {};

function pad4(p) {
  if (p === undefined) return [0, 0, 0, 0];
  if (typeof p === "number") return [p, p, p, p];
  if (p.length === 2) return [p[0], p[1], p[0], p[1]];
  return p;
}

// Body copy (paragraphs, and long small descriptive lines) in LOFI screens.
function isBodyCopy(spec) {
  const o = spec.o;
  const size = o.size || 16;
  return size <= 18 && (o.para || (o.fill && size <= 14 && spec.text.length > 30));
}

// Replaces body copy with grey bars: about as many lines as the text would wrap to (max 4).
function textLines(spec, parent) {
  const o = spec.o;
  const size = o.size || 16;
  const parentHugsW = parent.layoutSizingHorizontal === "HUG";
  const avail = o.w || (parentHugsW ? 240 : parent.layoutMode === "HORIZONTAL" ? 320 : parent.width - parent.paddingLeft - parent.paddingRight);
  const textW = spec.text.length * size * 0.5;
  const lines = Math.max(1, Math.min(4, Math.ceil(textW / Math.max(avail, 120))));
  const barH = Math.max(6, Math.round(size * 0.55));
  const pitch = Math.round(size * 1.45);
  const bars = [];
  for (let i = 0; i < lines; i++) {
    if (lines === 1) bars.push(V({ w: Math.round(Math.min(avail, textW)), h: barH, fill: C.textBar, name: "Line" }));
    else if (i === lines - 1) bars.push(H({ name: "Line" }, [V({ h: barH, fill: C.textBar, grow: true }), V({ w: Math.round(avail * 0.35), h: barH, name: "Spacer" })]));
    else bars.push(V({ h: barH, fill: C.textBar, name: "Line" }));
  }
  return V({ w: o.w || (parentHugsW ? 240 : undefined), gap: pitch - barH, pad: [Math.round((pitch - barH) / 2), 0], name: "Text lines", go: o.go, mark: o.mark, markLeft: o.markLeft }, bars);
}

function addCross(node) {
  const w = node.width;
  const h = node.height;
  const v = figma.createVector();
  v.name = "Placeholder cross";
  v.vectorPaths = [{ windingRule: "NONE", data: "M 0 0 L " + w + " " + h + " M " + w + " 0 L 0 " + h }];
  v.fills = [];
  v.strokes = [paint(C.line)];
  v.strokeWeight = 1;
  node.insertChild(0, v);
  v.layoutPositioning = "ABSOLUTE";
  v.x = 0;
  v.y = 0;
  // Scales with the box if a later sibling changes its width.
  v.constraints = { horizontal: "SCALE", vertical: "SCALE" };
}

function render(spec, parent) {
  if (!spec) return null;
  const o = spec.o || {};
  if (spec.t === "text" && LOFI && GREEK && parent.type !== "PAGE" && isBodyCopy(spec)) return render(textLines(spec, parent), parent);
  let node;

  if (spec.t === "text") {
    node = figma.createText();
    node.fontName = FONTS[o.weight || "r"];
    node.characters = spec.text;
    node.fontSize = o.size || 16;
    node.fills = [paint(o.color || C.body)];
    if (o.lh) node.lineHeight = { unit: "PERCENT", value: o.lh };
    if (o.ls) node.letterSpacing = { unit: "PERCENT", value: o.ls };
    if (o.underline) node.textDecoration = "UNDERLINE";
    if (o.align) node.textAlignHorizontal = o.align;
    node.name = o.name || spec.text.slice(0, 40);
  } else if (spec.t === "inst") {
    node = COMPONENTS[spec.comp].createInstance();
    if (o.name) node.name = o.name;
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
    node.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
    if (o.stroke) {
      node.strokes = [paint(o.stroke)];
      node.strokeWeight = o.sw || 1;
      node.strokeAlign = "INSIDE";
      if (o.dash) node.dashPattern = [6, 4];
      if (o.sides) {
        node.strokeTopWeight = o.sides.indexOf("t") >= 0 ? o.sw || 1 : 0;
        node.strokeRightWeight = o.sides.indexOf("r") >= 0 ? o.sw || 1 : 0;
        node.strokeBottomWeight = o.sides.indexOf("b") >= 0 ? o.sw || 1 : 0;
        node.strokeLeftWeight = o.sides.indexOf("l") >= 0 ? o.sw || 1 : 0;
      }
    }
    if (o.radius) node.cornerRadius = o.radius;
    node.counterAxisAlignItems = { start: "MIN", center: "CENTER", end: "MAX", baseline: "BASELINE" }[o.align || "start"];
    node.primaryAxisAlignItems = { start: "MIN", center: "CENTER", end: "MAX", space: "SPACE_BETWEEN" }[o.justify || "start"];
    if (o.wrap) {
      node.layoutWrap = "WRAP";
      node.counterAxisSpacing = o.rowGap !== undefined ? o.rowGap : o.gap || 0;
    }
    node.clipsContent = false;
    if (o.w || o.h) node.resize(o.w || 100, o.h || 100);
  }

  parent.appendChild(node);

  // Sizing. Boxes fill their parent's width unless they are fixed (w) or hug.
  const parentIsAuto = parent.type !== "PAGE" && parent.layoutMode && parent.layoutMode !== "NONE";
  const parentHugsW = parentIsAuto && parent.layoutSizingHorizontal === "HUG";
  if (spec.t === "box") {
    if (o.w) node.layoutSizingHorizontal = "FIXED";
    else if (!o.hug && parentIsAuto && !parentHugsW) node.layoutSizingHorizontal = "FILL";
    else node.layoutSizingHorizontal = "HUG";
    node.layoutSizingVertical = o.h ? "FIXED" : "HUG";
  } else if (spec.t === "inst") {
    if (parentIsAuto && !parentHugsW && !o.hug) node.layoutSizingHorizontal = "FILL";
  } else if (spec.t === "text") {
    if (o.w) {
      node.resize(o.w, node.height);
      node.textAutoResize = "HEIGHT";
    } else if (o.fill && parentIsAuto && !parentHugsW) {
      node.layoutSizingHorizontal = "FILL";
      node.textAutoResize = "HEIGHT";
    }
  }
  if (o.grow && parentIsAuto) node.layoutGrow = 1;

  if (spec.t === "box") for (const k of spec.kids) render(k, node);
  if (o.cross) addCross(node);

  if (spec.t === "inst") {
    for (const key of Object.keys(spec.set)) {
      const target = node.findOne((n) => n.type === "TEXT" && n.name === key);
      if (target) target.characters = spec.set[key];
    }
  }

  if (o.mark) addMarker(node, o.mark, o.markLeft, o.markMono);
  if (o.markAt) for (const m of o.markAt) addMarkerAt(node, m[0], m[1]);
  if (o.go) LINKS.push([node, o.go]);
  return node;
}

// mono: black circle (for the sketch-level screens, which use black, white and greys only).
function addMarker(node, n, left, mono) {
  const m = figma.createFrame();
  m.name = "UX marker " + n;
  m.layoutMode = "HORIZONTAL";
  m.primaryAxisAlignItems = "CENTER";
  m.counterAxisAlignItems = "CENTER";
  m.resize(26, 26);
  m.layoutSizingHorizontal = "FIXED";
  m.layoutSizingVertical = "FIXED";
  m.cornerRadius = 13;
  m.fills = [paint(mono ? SK.black : C.note)];
  m.strokes = [paint(C.white)];
  m.strokeWeight = 2;
  m.strokeAlign = "OUTSIDE";
  const t = figma.createText();
  t.fontName = FONTS.b;
  t.characters = String(n);
  t.fontSize = 12;
  t.fills = [paint(C.white)];
  m.appendChild(t);
  node.appendChild(m);
  node.clipsContent = false;
  m.layoutPositioning = "ABSOLUTE";
  m.constraints = { horizontal: left ? "MIN" : "MAX", vertical: "MIN" };
  // Full-width elements get the marker just inside the corner so the screen edge doesn't clip it.
  const full = node.width >= W - 1;
  m.x = left ? (full ? 8 : -12) : full ? node.width - 34 : node.width - 14;
  m.y = full ? 8 : -12;
}

// Marker on a layer inside an instance (instances can't take new children):
// positioned on the wrapper, at the right edge of the named descendant.
function addMarkerAt(wrapper, n, childName) {
  const child = wrapper.findOne((c) => c.name === childName);
  addMarker(wrapper, n, false);
  if (!child) return;
  const m = wrapper.findOne((c) => c.name === "UX marker " + n);
  const wb = wrapper.absoluteBoundingBox;
  const cb = child.absoluteBoundingBox;
  m.constraints = { horizontal: "MIN", vertical: "MIN" };
  m.x = cb.x - wb.x + cb.width - 6;
  m.y = cb.y - wb.y - 14;
}

/* ------------------------------------------------------------------ */
/* Shared components                                                   */
/* ------------------------------------------------------------------ */

const CARD_DATA = {
  arlo: { Name: "Arlo Round", Meta: "Clear Path Studio · 49□21 · 145 mm · 18 g", Price: "₹1,499", From: "frame + lenses from ₹2,299" },
  kabir: { Name: "Kabir Rectangle", Meta: "Northline Optical · 54□18 · 145 mm · 21 g", Price: "₹1,299", From: "frame + lenses from ₹2,099" },
  dev: { Name: "Dev Wayfarer", Meta: "Northline Optical · 52□20 · 145 mm · 23 g", Price: "₹1,599", From: "frame + lenses from ₹2,399" },
  mira: { Name: "Mira Cat-eye", Meta: "Halden & Rowe · 52□17 · 140 mm · 19 g", Price: "₹2,299", From: "frame + lenses from ₹3,099" },
  noor: { Name: "Noor Oval", Meta: "Featherline · 50□19 · 140 mm · 11 g", Price: "₹3,999", From: "frame + lenses from ₹4,799" },
  tara: { Name: "Tara Geometric", Meta: "Clear Path Studio · 51□19 · 140 mm · 14 g", Price: "₹2,499", From: "frame + lenses from ₹3,299" },
  ishaan: { Name: "Ishaan Aviator", Meta: "Halden & Rowe · 56□16 · 145 mm · 16 g", Price: "₹2,799", From: "frame + lenses from ₹3,599" },
  vihaan: { Name: "Vihaan Square", Meta: "Northline Optical · 53□19 · 145 mm · 24 g", Price: "₹1,899", From: "frame + lenses from ₹2,699" },
};
const card = (key, o) => INST("card", CARD_DATA[key], o);

function buildComponents(x0, y0) {
  const specs = {
    header: H({ component: true, name: "Header", w: W, h: 72, pad: [0, 48], gap: 28, align: "center", fill: C.white, stroke: C.line, sides: "b" }, [
      LOFI
        ? H({ w: 120, h: 40, stroke: C.lineStrong, justify: "center", align: "center", go: "S1", name: "Wordmark" }, [T("LOGO", { size: 13, weight: "s", color: C.muted })])
        : H({ hug: true, gap: 8, align: "baseline", go: "S1", name: "Wordmark" }, [
            T("Lenskart", { size: 24, weight: "b", color: C.brand }),
            T("redesign concept", { size: 12, color: C.muted }),
          ]),
      H({ hug: true, gap: 26, align: "center", name: "Main navigation" }, [
        T("Shop by need ▾", { size: 15, weight: "s", color: C.ink, go: "S3" }),
        T("Frames by shape ▾", { size: 15, weight: "s", color: C.ink, go: "S3" }),
        T("Find my frame", { size: 15, weight: "s", color: C.ink, go: "S2a", name: "Nav / Find my frame" }),
        T("Eye test & stores", { size: 15, weight: "s", color: C.ink }),
        T("Help", { size: 15, weight: "s", color: C.ink }),
      ]),
      GROW(),
      V({ hug: true, gap: 0, pad: [4, 12], stroke: C.line, name: "Need selector" }, [
        T("Glasses for", { size: 11, color: C.muted }),
        T("Prescription ▾", { size: 14, weight: "s", color: C.ink }),
      ]),
      H({ w: 220, h: 40, pad: [0, 12], stroke: C.lineStrong, align: "center", name: "Search" }, [T("Search frames", { size: 14, color: C.muted })]),
      H({ hug: true, gap: 18, align: "center", name: "Icons" }, [
        T("Wishlist", { size: 14, weight: "m", color: C.ink }),
        T("Bag (1)", { size: 14, weight: "s", color: C.ink, go: "S8" }),
        T("Account", { size: 14, weight: "m", color: C.ink }),
      ]),
    ]),

    trust: H({ component: true, name: "Trust strip", w: W - 96, stroke: C.ink }, [
      ["14-day returns", "Free pickup. Full refund, lenses included."],
      ["Cash on delivery", "Pay when it arrives, up to ₹10,000."],
      ["Free shipping", "Delivered in 4–7 days. No minimum order."],
      ["Free eye test", "At any of our stores. No purchase needed."],
    ].map((t, i) =>
      H({ pad: 20, gap: 12, stroke: C.line, sides: i < 3 ? "r" : "", name: "Promise" }, [
        ICON(28),
        V({ gap: 4 }, [T(t[0], { size: 16, weight: "b", color: C.ink }), T(t[1], { size: 13, color: C.muted, fill: true })]),
      ])
    )),

    card: V({ component: true, name: "Product card", w: 330, pad: 16, gap: 10, stroke: C.line, fill: C.white, go: "S6" }, [
      V({ gap: 0 }, [
        IMG("Frame illustration, drawn to scale", 150),
        H({ hug: true, pad: [4, 8], fill: C.white, stroke: C.ink, name: "Offer tag" }, [T("10% off frame", { size: 12, weight: "s", color: C.ink, name: "Tag" })]),
      ]),
      H({ justify: "space", align: "center" }, [
        T("Arlo Round", { size: 18, weight: "b", color: C.ink, name: "Name" }),
        T("♡ Save", { size: 13, weight: "m", color: C.muted }),
      ]),
      T("Clear Path Studio · 49□21 · 145 mm · 18 g", { size: 13, color: C.muted, fill: true, name: "Meta" }),
      H({ gap: 8, align: "baseline" }, [
        T("₹1,499", { size: 18, weight: "b", color: C.ink, name: "Price" }),
        T("frame + lenses from ₹2,299", { size: 13, color: C.body, name: "From" }),
      ]),
      H({ gap: 8, align: "center" }, [
        H({ hug: true, gap: 6 }, [V({ w: 16, h: 16, radius: 8, fill: "#6B3A1E" }), V({ w: 16, h: 16, radius: 8, fill: "#1B1D20" }), V({ w: 16, h: 16, radius: 8, fill: "#C9D0D4", stroke: C.line })]),
        GROW(),
        H({ hug: true, pad: [8, 10], stroke: C.lineStrong, name: "Compare button" }, [T("+ Add to compare", { size: 13, weight: "s", color: C.ink })]),
      ]),
    ]),

    footer: V({ component: true, name: "Footer", w: W, pad: [56, 48, 32, 48], gap: 40, fill: C.fill }, [
      H({ gap: 48 }, [
        ["Shop", ["Prescription glasses", "Computer glasses", "Reading glasses", "Sunglasses", "Contact lenses", "Kids' glasses"]],
        ["Help", ["Delivery and tracking", "Returns and refunds", "Payment and offers", "Size guide", "Lens guide"]],
        ["Stores", ["Book a free eye test", "Find a store"]],
        ["Company", ["About this concept", "Corporate", "Partner with us", "Engineering blog", "International sites"]],
      ].map((col) => V({ gap: 10 }, [T(col[0], { size: 15, weight: "b", color: C.ink })].concat(col[1].map((l) => T(l, { size: 14, color: C.body })))))),
      RULE(),
      T("Academic redesign concept. Not affiliated with or endorsed by Lenskart.", { size: 14, weight: "s", color: C.ink }),
    ]),
  };

  let x = x0;
  const container = figma.createFrame();
  container.name = "Components (wireframe kit)";
  container.fills = [paint(C.fill)];
  container.layoutMode = "VERTICAL";
  container.itemSpacing = 48;
  container.paddingTop = container.paddingBottom = container.paddingLeft = container.paddingRight = 48;
  container.layoutSizingHorizontal = "HUG";
  container.layoutSizingVertical = "HUG";
  container.x = x;
  container.y = y0;
  figma.currentPage.appendChild(container);
  render(T("Components", { size: 32, weight: "b", color: C.ink }), container);
  render(P("Edit these main components and every screen updates. Links set here (logo → Home, Find my frame → Finder, Bag → Bag, card → Product) apply to every instance.", { color: C.muted }), container);
  GREEK = true;
  for (const key of ["header", "trust", "card", "footer"]) COMPONENTS[key] = render(specs[key], container);
  GREEK = false;
  return container;
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

const uxbar = (n) =>
  H({ pad: [8, 48], gap: 24, align: "center", fill: C.noteSoft, stroke: C.note, sides: "b", name: "UX review bar" }, [
    T("UX review", { size: 13, weight: "b", color: C.noteInk }),
    H({ hug: true, gap: 8, align: "center", name: "Show UX changes switch" }, [
      H({ w: 36, h: 20, radius: 10, fill: C.note, pad: [0, 3], align: "center", justify: "end" }, [V({ w: 14, h: 14, radius: 7, fill: C.white })]),
      T("Show UX changes", { size: 13, weight: "s", color: C.noteInk }),
    ]),
    T("Changes on this page (" + n + ")", { size: 13, weight: "s", color: C.noteInk, underline: true }),
  ]);

const chrome = (n, body) => [uxbar(n), INST("header")].concat(body).concat([GAP(64), INST("footer")]);
const crumb = (parts) => T(parts.join("  /  "), { size: 13, color: C.muted });

const priceLines = (o) =>
  V(Object.assign({ gap: 10, pad: 20, stroke: C.ink, name: "Price breakdown" }, o), [
    ROW("Frame (size M)", "₹1,499"),
    ROW("Single vision, standard", "₹800"),
    ROW("Anti-glare coating", "₹400"),
    ROW("Offer: 10% off frames", "−₹150", { labelColor: C.brand }),
    RULE(),
    H({ justify: "space", align: "baseline" }, [T("Total", { size: 18, weight: "b", color: C.ink }), T("₹2,549", { size: 28, weight: "b", color: C.ink })]),
    P("We applied “10% off frames”. It applies to every order, up to ₹500. It saves you ₹150. Only one offer applies per order, and we always pick the one that saves you the most.", { size: 13, color: C.muted }),
  ]);

const filterGroup = (title, kids, open) =>
  V({ gap: 10, pad: [14, 0], stroke: C.line, sides: "t", name: "Filter group / " + title }, [
    H({ justify: "space" }, [T(title, { size: 15, weight: "b", color: C.ink }), T(open ? "−" : "+", { size: 16, weight: "b", color: C.ink })]),
  ].concat(open ? kids : []));

function listingFilters(emptyCase) {
  return V({ w: 300, gap: 4, name: "Filters panel", mark: 1 }, [
    H({ justify: "space", pad: [0, 0, 8, 0] }, [T("Filters", { size: 20, weight: "b", color: C.ink }), LNK("Clear all", "S3", { size: 14 })]),
    T("ESSENTIALS", { size: 12, weight: "s", color: C.muted, ls: 6 }),
    filterGroup("What are they for?", [CHECK("Prescription", 35, true), CHECK("Computer", 18, false), CHECK("Reading", 12, false), CHECK("Sun", 9, false)], true),
    filterGroup("Frame price", [P("Frame only. Lenses are priced on the product page.", { size: 13, color: C.muted }), CHECK("Under ₹1,500", 9, false), CHECK("₹1,500 – ₹2,499", 14, false), CHECK("₹2,500 – ₹3,999", 9, false), CHECK("₹4,000 and above", 3, false)], true),
    filterGroup("Frame size", [P("Not sure? Use “Find my size” on any product.", { size: 13, color: C.muted }), CHECK("Narrow · under 132 mm", 17, emptyCase), CHECK("Medium · 132–140 mm", 12, false), CHECK("Wide · over 140 mm", 6, false)], true),
    filterGroup("Frame shape", [CHECK("Round", 6, false), CHECK("Rectangle", 6, false), CHECK("Aviator", 3, emptyCase, { go: emptyCase ? "S3" : "S4" }), T("+ 5 more shapes", { size: 13, weight: "s", color: C.brand })], true),
    T("MORE", { size: 12, weight: "s", color: C.muted, ls: 6, name: "Group label" }),
    filterGroup("Fit & style", [], false),
    filterGroup("Brand & collection", [], false),
    filterGroup("More (who it's for, in stock only)", [], false),
  ]);
}

const compareTray = () =>
  H({ pad: [16, 24], gap: 16, align: "center", fill: C.brand, name: "Compare tray", mark: 4 }, [
    T("Compare tray", { size: 15, weight: "b", color: C.white }),
    H({ hug: true, gap: 8 }, [
      H({ hug: true, pad: [6, 10], fill: C.white }, [T("Arlo Round ×", { size: 13, weight: "s", color: C.ink })]),
      H({ hug: true, pad: [6, 10], fill: C.white }, [T("Kabir Rectangle ×", { size: 13, weight: "s", color: C.ink })]),
      H({ hug: true, pad: [6, 10], stroke: C.white, dash: true }, [T("1 slot left", { size: 13, color: C.white })]),
    ]),
    GROW(),
    T("Clear tray", { size: 14, weight: "s", color: C.white, underline: true }),
    BTN("Compare frames →", "S5", "inverse"),
  ]);

/* Sketch-level (structure / ideation) screens: black, white, light grey, dark grey only.
 * They show information architecture and interactions, not content: placeholder labels,
 * plain rectangles, no real names, prices, icons or branded styling. */
const SK = { black: "#000000", white: "#FFFFFF", light: "#E6E6E6", dark: "#595959" };
const skLabel = (text, o) => T(text, Object.assign({ size: 14, color: SK.dark }, o));
const skBox = (label, o) =>
  H(Object.assign({ h: 40, pad: [0, 16], stroke: SK.black, fill: SK.white, align: "center", justify: "center", name: "Box / " + label }, o), [skLabel(label, { weight: "s" })]);
const skButton = (label, go, o) =>
  H(Object.assign({ hug: true, pad: [8, 16], stroke: SK.black, fill: SK.white, align: "center", go: go, name: "Button / " + label }, o), [skLabel("[ " + label + " ]", { weight: "s", color: SK.black })]);
const skCheck = (label, o) =>
  H(Object.assign({ gap: 10, align: "center", name: "Option" }, o), [V({ w: 16, h: 16, stroke: SK.black, fill: SK.white }), skLabel(label)]);
const skHeader = () =>
  H({ h: 72, pad: [0, 40], gap: 24, align: "center", stroke: SK.black, sides: "b", fill: SK.white, name: "Header (placeholder)" }, [
    skBox("LOGO", { w: 140, go: "S1" }),
    skBox("NAVIGATION"),
    skBox("SEARCH", { w: 260 }),
  ]);
const skFooter = () => H({ h: 96, fill: SK.light, align: "center", justify: "center", name: "Footer (placeholder)" }, [skLabel("FOOTER", { weight: "s" })]);
const skCard = () =>
  V({ stroke: SK.black, fill: SK.white, name: "Product card" }, [
    V({ h: 180, fill: SK.light, align: "center", justify: "center", name: "Image placeholder" }, [skLabel("IMAGE PLACEHOLDER")]),
    V({ pad: 14, gap: 10, stroke: SK.black, sides: "t" }, [
      skLabel("Product", { weight: "b", color: SK.black, size: 15 }),
      H({ justify: "space", align: "center" }, [skButton("VIEW", "S6"), skCheck("Compare")]),
    ]),
  ]);
const skFilterGroup = (title, items) =>
  V({ gap: 10, name: "Filter group / " + title }, [skLabel(title, { weight: "b", color: SK.black, size: 13 })].concat(items));

function finderShell(step, question, helper, options, cols, next, nextLabel) {
  return chrome(2, [
    V({ pad: [56, 48], align: "center" }, [
      V({ w: 880, gap: 20, name: "Frame Finder" }, [
        eyebrow("Frame Finder · Question " + step + " of 3"),
        h1("Find my frame"),
        P("Three quick questions. Skip any you're unsure about. You'll see matching frames you can still filter.", { size: 17 }),
        H({ gap: 8, name: "Progress", mark: 1 }, [1, 2, 3].map((i) => V({ h: 6, fill: i <= step ? C.brand : C.fill2 }))),
        GAP(8),
        h2(question),
        helper ? P(helper, { color: C.muted }) : null,
        V({ mark: 2 }, [grid(cols, options, 12)]),
        GAP(8),
        H({ justify: "space", align: "center" }, [
          step > 1 ? LNK("← Back", "BACK") : LNK("← Back to home", "S1"),
          H({ hug: true, gap: 20, align: "center" }, [LNK("Skip this question", next, { color: C.muted }), BTN(nextLabel, next)]),
        ]),
      ]),
    ]),
  ]);
}

function screens() {
  return [
    {
      id: "S1",
      title: "Home",
      notes: [
        [1, "Header shows shopping links only", "U1", "Corporate, partner and international links moved to the footer under “Company”."],
        [2, "Help to choose is in the main navigation", "X3", "“Find my frame” sits next to the shopping links."],
        [3, "Start from what you need", "X2, U6", "The page opens by asking what the glasses are for, each with a one-line explanation. The choice is remembered."],
        [4, "Guided “Find my frame”", "X3", "A 3-question route for people who don't know their shape or size."],
        [5, "Promises shown up front", "X8", "Returns, cash on delivery, shipping and the free eye test, right under the hero."],
        [6, "Simpler product cards", "U4, X4", "One price line that includes lenses, one short tag, one details line, “Add to compare”."],
        [7, "One promotion, below the shopping tasks", "X7, U2", "A single campaign with a descriptive button, after the task."],
        [8, "Photos of people, used sparingly", "—", "Three free-licence photos only: hero, eye test, and this tile. Never behind text. Product cards stay as frame drawings."],
      ],
      body: [
        uxbar(7),
        V({ name: "Header (marked)", gap: 0, markAt: [[1, "Wordmark"], [2, "Nav / Find my frame"]] }, [INST("header")]),
        H({ pad: [56, 48, 32, 48], gap: 48, name: "Hero" }, [
          V({ gap: 20, name: "Task" }, [
            eyebrow("● Step 1 · Start with what you need"),
            h1("What are your glasses for?", { size: 56 }),
            P("Pick one. We'll show frames that suit it, add up the full price as you choose, and tell you exactly what happens after you order.", { size: 18 }),
            V({ stroke: C.ink, mark: 3, name: "Need tiles" }, [
              grid(3, [
                ["Prescription glasses", "To see clearly, made to your eye power.", "S3"],
                ["Computer glasses", "Filter blue light from screens. With or without power.", "S3"],
                ["Reading glasses", "For close-up reading. Choose a reading power from +0.75 to +3.50.", "S3"],
                ["Sunglasses", "UV protection. Available with or without your power.", "S3"],
                ["Contact lenses", "Daily or monthly lenses. Needs a contact lens prescription.", null],
                ["Kids' glasses", "Flexible, light frames for ages 5–12.", "S3"],
              ].map((n) => H({ pad: 16, gap: 14, stroke: C.line, go: n[2], name: "Need tile / " + n[0] }, [ICON(52), V({ gap: 4 }, [T(n[0], { size: 18, weight: "b", color: C.ink, fill: true }), T(n[1], { size: 13, color: C.muted, fill: true, lh: 140 })])])), 0),
            ]),
            H({ gap: 20, align: "center" }, [
              H({ hug: true, mark: 4, name: "Find my frame CTA" }, [BTN("Not sure? Find my frame in 3 questions →", "S2a")]),
              LNK("Book a free eye test first"),
            ]),
          ]),
          V({ w: 520, name: "Hero photo" }, [IMG("PHOTO (4:5): working professional in glasses at a laptop.\nBeside the headline, never behind text.", 650)]),
        ]),
        H({ pad: [24, 48], gap: 48, name: "How it works + eye chart" }, [V({ gap: 16 }, [
          eyebrow("How Clear Path works", { color: C.ink }),
          V({ stroke: C.ink, sides: "t" }, [
            ["What are they for?", "Start with your need: to see clearly, for screens, for reading, for the sun, or contact lenses. Every page after this remembers it.", "Choose what your glasses are for"],
            ["Which frame fits you?", "Answer three short questions in Frame Finder, or filter by size. Every frame shows its real measurements in millimetres.", "Find my frame in 3 questions"],
            ["What will it cost?", "Frame, lenses, coating and offer, added up live as you choose. The best offer is applied for you, with one line saying why.", "How pricing and offers work"],
            ["What happens next?", "Free delivery in 4–7 days, cash on delivery, 14-day returns, and a free eye test at any store if you need one.", "Read the returns promise"],
          ].map((s, i) =>
            H({ pad: [24, 0], gap: 24, stroke: C.line, sides: "b", name: "Step 0" + (i + 1) }, [
              T("0" + (i + 1), { size: 14, color: C.muted }),
              V({ gap: 8 }, [h3(s[0], { size: 26 }), P(s[1], { color: C.muted }), LNK(s[2] + " →", i === 1 ? "S2a" : null)]),
            ])
          )),
        ]),
          V({ w: 520, gap: 8, name: "Eye chart (sticky)" }, [IMG("Eye chart illustration (sticky).\nA lens moves down the chart, one line per step, as you scroll.", 480), T("Line 1: What are they for?", { size: 13, color: C.muted })]),
        ]),
        page([V({ mark: 5, name: "Trust strip (marked)" }, [INST("trust")])], { pad: [32, 48] }),
        page([
          H({ justify: "space", align: "end" }, [h2("Frames by shape", { fill: false }), LNK("See all frames →", "S3")]),
          H({ gap: 12 }, [["Round", 6], ["Oval", 5], ["Rectangle", 6], ["Square", 5], ["Cat-eye", 5], ["Aviator", 4], ["Wayfarer", 5], ["Geometric", 4]].map((s) =>
            V({ pad: 12, gap: 6, stroke: C.line, align: "center", go: "S3", name: "Shape / " + s[0] }, [IMG("shape", 48), T(s[0], { size: 14, weight: "s", color: C.ink }), T(s[1] + " frames", { size: 12, color: C.muted })])
          )),
        ], { pad: [40, 48] }),
        page([
          H({ justify: "space", align: "end" }, [h2("Popular frames", { fill: false }), LNK("See all 40 frames →", "S3")]),
          T("“Popular” is a synthetic score in this concept. There are no ratings or reviews.", { size: 13, color: C.muted }),
          H({ gap: 24, mark: 6, markLeft: true, name: "Cards" }, [card("arlo"), card("kabir"), card("dev"), card("mira")]),
        ], { pad: [40, 48] }),
        page([
          H({ pad: 40, gap: 40, stroke: C.ink, fill: "#F7F7FA", align: "center", mark: 7, name: "Campaign (one slot)" }, [
            V({ gap: 14 }, [
              eyebrow("Collection · Featherweight"),
              h2("Frames that weigh less than 12 g", { size: 36 }),
              P("Titanium and rimless frames for long days. The lightest, Parth Rimless, weighs 7 grams.", { color: C.muted }),
              GAP(4),
              BTN("Shop the Featherweight collection →", "S3", "secondary"),
            ]),
            V({ w: 340, mark: 8 }, [IMG("PHOTO (4:5): student in thin round metal frames", 425)]),
          ]),
        ], { pad: [40, 48] }),
        GAP(40),
        H({ pad: [72, 48], gap: 64, fill: C.brand, align: "center", name: "Eye test band" }, [
          V({ w: 380 }, [IMG("PHOTO (4:5): older woman in glasses, smiling", 475, { fill: "#1A1A5E" })]),
          V({ gap: 16 }, [
            eyebrow("Free at every store with an optometrist", { color: "#B9B9DA" }),
            T("Don't know your power? Get it checked free.", { size: 44, weight: "b", color: C.white, fill: true, lh: 115 }),
            P("A 20-minute eye test by a qualified optometrist. No purchase needed. You can also order now and add your prescription later.", { color: "#D9D9EE" }),
            BTN("Book a free eye test →", null, "inverse"),
            T("Find a store near you", { size: 15, weight: "s", color: C.white, underline: true }),
          ]),
        ]),
        INST("footer"),
      ],
    },
    {
      id: "S2a",
      title: "Frame Finder · Q1",
      notes: [
        [1, "Three short questions, progress shown", "X3", "People see how long it takes and can go back."],
        [2, "Described options, any can be skipped", "X3, U3", "Recognition over recall: each answer has a one-line explanation."],
      ],
      body: finderShell(1, "What are the glasses for?", null, [
        OPTION("Prescription glasses", "To see clearly, made to your eye power.", true),
        OPTION("Computer glasses", "Filter blue light from screens. With or without power.", false),
        OPTION("Reading glasses", "For close-up reading. Choose a reading power from +0.75 to +3.50.", false),
        OPTION("Sunglasses", "UV protection. Available with or without your power.", false),
      ], 2, "S2b", "Next question"),
    },
    {
      id: "S2b",
      title: "Frame Finder · Q2",
      notes: [
        [1, "Progress", "X3", "Question 2 of 3."],
        [2, "Face shape is a suggestion, not a rule", "X3, U3", "“Not sure” is always an answer."],
      ],
      body: finderShell(2, "What shape is your face?", "Look straight into a mirror or your front camera. Pick the closest; it only guides suggestions.", [
        OPTION("Round", "Soft jaw, face about as wide as it is long.", false),
        OPTION("Oval", "Slightly longer than wide, gently curved jaw.", true),
        OPTION("Square", "Strong, angular jaw and broad forehead.", false),
        OPTION("Heart", "Wider forehead, narrower chin.", false),
        OPTION("Long", "Noticeably longer than wide.", false),
        OPTION("Not sure", "Skip it. Face shape is a suggestion, not a rule.", false),
      ], 3, "S2c", "Next question"),
    },
    {
      id: "S2c",
      title: "Frame Finder · Q3",
      notes: [
        [1, "Progress", "X3", "Question 3 of 3."],
        [2, "Fit in everyday words, not millimetres", "X3, U3", "Answers map to frame size bands behind the scenes."],
      ],
      body: finderShell(3, "How do glasses usually fit you?", null, [
        OPTION("They often feel tight", "Pressing at the sides of your head or leaving marks.", false),
        OPTION("Most fit me fine", "Standard sizes usually sit comfortably.", true),
        OPTION("They often slide down", "Too wide, or slipping down your nose.", false),
        OPTION("I'm not sure", "We won't filter by size.", false),
      ], 2, "S2d", "Find my frame"),
    },
    {
      id: "S2d",
      title: "Frame Finder · Results",
      notes: [
        [1, "Answers summarised and editable", "X3", "“Change my answers” goes back to question 1."],
        [2, "Results only include frames in stock", "X3", "If nothing matches, filters are relaxed one at a time and the page says which."],
      ],
      body: chrome(2, [
        V({ pad: [56, 48], align: "center" }, [
          V({ w: 880, gap: 20 }, [
            eyebrow("Frame Finder · Results ready"),
            h1("Your matches"),
            V({ gap: 10, pad: 20, fill: C.fill, mark: 1, name: "Answer summary" }, [
              ROW("What are the glasses for?", "Prescription glasses"),
              ROW("What shape is your face?", "Oval"),
              ROW("How do glasses usually fit you?", "Most fit me fine"),
              LNK("Change my answers", "S2a", { size: 14 }),
            ]),
            V({ gap: 12, pad: 28, stroke: C.ink, mark: 2, name: "Result" }, [
              T("We found 14 frames", { size: 32, weight: "b", color: C.ink }),
              P("They're all in stock. You can change or remove any filter on the next page."),
              H({ gap: 20, align: "center" }, [BTN("See my frames →", "S3"), LNK("See all frames", "S3")]),
            ]),
          ]),
        ]),
      ]),
    },
    {
      id: "S3",
      title: "Listing",
      sketch: true,
      notes: [
        [1, "Filters on the left, grouped", "X13, U3", "A few plain-language groups instead of a long list. Choosing an option that leaves no results leads to the empty state (S4)."],
        [2, "Sort and active filters above results", "X13", "Sort is one control; each active filter is a removable chip."],
        [3, "Simple cards, one action", "U4, X4", "Image, name and one VIEW action that opens the product (S6)."],
        [4, "Compare from the listing", "U4, X4", "Tick “Compare” on up to 3 cards, then open the side-by-side view (S5)."],
      ],
      body: [
        skHeader(),
        V({ pad: [40, 40, 24, 40], name: "Page title" }, [T("Listing / Search Results", { size: 32, weight: "b", color: SK.black })]),
        H({ pad: [0, 40], gap: 32, name: "Listing body" }, [
          V({ w: 280, pad: 20, gap: 20, stroke: SK.black, fill: SK.white, mark: 1, markMono: true, name: "Filters" }, [
            skLabel("FILTERS", { weight: "b", color: SK.black, size: 15 }),
            V({ h: 1, fill: SK.black, name: "Divider" }),
            skFilterGroup("FOR", [skCheck("Option"), skCheck("Option"), skCheck("Option")]),
            skFilterGroup("PRICE", [skCheck("Option"), skCheck("Option")]),
            skFilterGroup("SHAPE", [skCheck("Option", { go: "S4", name: "Option (leads to empty state)" }), skCheck("Option")]),
          ]),
          V({ gap: 20, name: "Results" }, [
            H({ justify: "space", align: "center", mark: 2, markMono: true, name: "Results toolbar" }, [
              H({ hug: true, pad: [6, 12], stroke: SK.dark, fill: SK.light, name: "Active filter chip" }, [skLabel("Filter: Option  ×")]),
              skBox("SORT  ▾", { w: 200 }),
            ]),
            V({ mark: 3, markMono: true, markLeft: true, name: "Product grid" }, [grid(3, [skCard(), skCard(), skCard(), skCard(), skCard(), skCard()], 24)]),
            H({ pad: [14, 20], gap: 16, align: "center", stroke: SK.black, fill: SK.light, mark: 4, markMono: true, name: "Compare tray" }, [
              skLabel("COMPARE TRAY", { weight: "b", color: SK.black }),
              H({ hug: true, gap: 8 }, [V({ w: 56, h: 32, stroke: SK.dark, fill: SK.white }), V({ w: 56, h: 32, stroke: SK.dark, fill: SK.white }), V({ w: 56, h: 32, stroke: SK.dark, dash: true })]),
              GROW(),
              H({ hug: true, pad: [8, 16], fill: SK.black, align: "center", go: "S5", name: "Button / COMPARE" }, [skLabel("[ COMPARE ]", { weight: "s", color: SK.white })]),
            ]),
          ]),
        ]),
        GAP(64),
        skFooter(),
      ],
    },
    {
      id: "S4",
      title: "Listing · Empty state",
      notes: [
        [1, "Filters stay visible", "X13", "The cause is on screen; nothing is hidden."],
        [2, "Plain explanation, no blame", "U3", "“Nothing is wrong. This combination is just too narrow.”"],
        [3, "One-click recovery with real counts", "X13", "Each suggestion removes one filter and says how many frames it brings back."],
      ],
      body: chrome(3, [
        page([crumb(["Home", "Prescription glasses"]), h1("Prescription glasses", { size: 40 })], { pad: [32, 48, 8, 48] }),
        H({ pad: [24, 48], gap: 40 }, [
          listingFilters(true),
          V({ gap: 16 }, [
            T("0 frames", { size: 18, weight: "b", color: C.ink }),
            H({ gap: 10, align: "center", name: "Active filters" }, [CHIP("For: Prescription  ×"), CHIP("Size: Narrow  ×"), CHIP("Shape: Aviator  ×"), LNK("Clear all", "S3", { size: 14 })]),
            V({ pad: 48, gap: 16, stroke: C.lineStrong, dash: true, align: "center", mark: 2, name: "Empty state" }, [
              ICON(56),
              T("No frames match all of these filters", { size: 26, weight: "b", color: C.ink, align: "CENTER" }),
              T("Nothing is wrong. This combination is just too narrow. Remove one filter to see more frames.", { size: 16, color: C.body, align: "CENTER", w: 560 }),
              GAP(4),
              T("Try removing one filter:", { size: 15, weight: "s", color: C.ink }),
              H({ hug: true, gap: 12, mark: 3, name: "Suggestions" }, [
                BTN("Remove Size: Narrow · 3 frames", "S3", "secondary"),
                BTN("Remove Shape: Aviator · 17 frames", "S3", "secondary"),
              ]),
              LNK("Clear all filters", "S3"),
            ]),
          ]),
        ]),
      ]),
    },
    {
      id: "S5",
      title: "Compare",
      notes: [
        [1, "Sizes drawn to scale, overlaid", "U4, X4", "Outlines come from each frame's real measurements."],
        [2, "Same units, same rows", "U4", "Differences are visible without remembering earlier pages."],
        [3, "One clear next step per frame", "X3", "Choose a frame to see lenses and the full price."],
      ],
      body: chrome(3, [
        page([
          eyebrow("Step 2 · Choose between frames"),
          h1("Compare frames", { size: 40 }),
          P("Side by side, in the same units. Choose one to see lenses and the full price.", { color: C.muted }),
          GAP(8),
          V({ gap: 8, mark: 1, name: "Size, to scale" }, [h3("Size, to scale"), IMG("Three frame outlines overlaid at true scale (2.6 px per mm)", 220), T("Each outline is drawn from the frame's real lens and bridge measurements.", { size: 13, color: C.muted })]),
          GAP(16),
          V({ stroke: C.ink, mark: 2, name: "Comparison table" }, [
            H({ name: "Frames row", stroke: C.line, sides: "b" }, [V({ w: 260, pad: 16 }, [T("", { size: 14 })])].concat(
              ["Arlo Round", "Kabir Rectangle", "Dev Wayfarer"].map((n) => V({ pad: 16, gap: 8, stroke: C.line, sides: "l" }, [IMG("Frame", 90), T(n, { size: 18, weight: "b", color: C.ink }), T("Remove", { size: 13, weight: "s", color: C.brand, underline: true })]))
            )),
          ].concat([
            ["Frame price", "₹1,499", "₹1,299", "₹1,599"],
            ["Lens width (M)", "49 mm", "54 mm", "52 mm"],
            ["Bridge (M)", "21 mm", "18 mm", "20 mm"],
            ["Temple length (M)", "145 mm", "145 mm", "145 mm"],
            ["Total width (M)", "129 mm", "136 mm", "134 mm"],
            ["Weight", "18 g", "21 g", "23 g"],
            ["Material", "Acetate", "Acetate", "Acetate"],
            ["Rim style", "Full rim", "Full rim", "Full rim"],
            ["Sizes in stock", "S, M", "S, M, L", "S, M, L"],
            ["Often suits", "Square, heart, oval faces", "Round, oval faces", "Round, oval, long faces"],
          ].map((r, i) =>
            H({ stroke: C.line, sides: "b", fill: i % 2 ? C.white : "#FAFAFC", name: "Row / " + r[0] }, [V({ w: 260, pad: [12, 16] }, [T(r[0], { size: 14, weight: "s", color: C.ink })])].concat(
              r.slice(1).map((v) => V({ pad: [12, 16], stroke: C.line, sides: "l" }, [T(v, { size: 14, color: C.body, fill: true })]))
            ))
          )).concat([
            H({ name: "Actions row" }, [V({ w: 260, pad: 16 }, [T("", { size: 14 })])].concat(
              ["Arlo Round", "Kabir Rectangle", "Dev Wayfarer"].map((n, i) => V({ pad: 16, stroke: C.line, sides: "l", mark: i === 0 ? 3 : 0 }, [BTN("Choose " + n, "S6", i === 0 ? "primary" : "secondary")]))
            )),
          ])),
          H({ gap: 16, pad: [12, 0] }, [LNK("+ Add another frame", "S3")]),
        ], { pad: [32, 48] }),
      ]),
    },
    {
      id: "S6",
      title: "Product",
      notes: [
        [1, "Drawn to scale, with descriptive alt text", "X9", "The illustration is generated from measurements; “Try in 3D” loads only on request."],
        [2, "Sizes in millimetres, honest stock", "X12, X3", "Low stock appears only when a size really has 1–3 left, with no timer. “Find my size” helps choose."],
        [3, "“What are the lenses for?”", "X6", "Lens options are named by purpose with one-line helpers, not technical codes."],
        [4, "Live price breakdown, one offer explained", "X5, X7", "Frame, lenses, coating and offer add up as you choose. One sentence says why the offer applied."],
        [5, "Promises next to the button", "X8", "Delivery, shipping, payment and prescription options sit by the call to action."],
      ],
      body: chrome(5, [
        page([crumb(["Home", "Prescription glasses", "Arlo Round"])], { pad: [24, 48, 8, 48] }),
        H({ pad: [16, 48], gap: 56, name: "Product" }, [
          V({ gap: 12, name: "Media" }, [
            V({ mark: 1 }, [IMG("Arlo Round, Havana tortoise, front view drawn to scale from 49□21·145", 420)]),
            H({ gap: 12 }, [IMG("Front", 84), IMG("Side", 84), IMG("Angle", 84), IMG("On scale ruler", 84)]),
            H({ gap: 16, align: "center" }, [BTN("Try in 3D", null, "secondary"), T("Illustration drawn to scale from the frame's measurements", { size: 13, color: C.muted, fill: true })]),
          ]),
          V({ w: 600, gap: 22, name: "Configure" }, [
            V({ gap: 6 }, [T("Clear Path Studio · Everyday Edit", { size: 14, color: C.muted }), h1("Arlo Round", { size: 40 }), H({ gap: 8, align: "baseline" }, [T("₹1,499", { size: 24, weight: "b", color: C.ink }), T("frame price", { size: 14, color: C.muted })])]),
            V({ gap: 10 }, [
              T("Colour: Havana tortoise", { size: 15, weight: "s", color: C.ink }),
              H({ gap: 10 }, [V({ w: 32, h: 32, radius: 16, fill: "#6B3A1E", stroke: C.ink, sw: 2 }), V({ w: 32, h: 32, radius: 16, fill: "#1B1D20" }), V({ w: 32, h: 32, radius: 16, fill: "#C9D0D4", stroke: C.line })]),
            ]),
            V({ gap: 10, mark: 2, name: "Size" }, [
              H({ justify: "space" }, [T("Size", { size: 15, weight: "s", color: C.ink }), LNK("Find my size", null, { size: 14 })]),
              H({ gap: 10 }, [
                V({ pad: 12, gap: 2, stroke: C.line }, [T("S", { size: 16, weight: "b", color: C.ink }), T("47□20 · 140", { size: 13, color: C.muted }), T("3 left in this size", { size: 12, weight: "s", color: C.body })]),
                V({ pad: 12, gap: 2, stroke: C.brand, sw: 2, fill: "#F4F4FA" }, [T("M", { size: 16, weight: "b", color: C.ink }), T("49□21 · 145", { size: 13, color: C.muted }), T("In stock", { size: 12, color: C.body })]),
                V({ pad: 12, gap: 2, stroke: C.line, fill: C.fill }, [T("L", { size: 16, weight: "b", color: C.muted }), T("51□22 · 150", { size: 13, color: C.muted }), T("Sold out", { size: 12, color: C.muted })]),
              ]),
            ]),
            V({ gap: 10, mark: 3, name: "Lens purpose" }, [
              T("What are the lenses for?", { size: 15, weight: "s", color: C.ink }),
              grid(2, [
                OPTION("To see clearly", "Single vision or progressive lenses made to your prescription.", true),
                OPTION("Screen use", "Blue-light filtering lenses, with or without power.", false),
                OPTION("Reading only", "Magnifying lenses for close-up work.", false),
                OPTION("Sun protection", "Tinted UV400 lenses, with or without power.", false),
                OPTION("Style only (no power)", "Clear lenses with no power, for the look.", false),
              ], 10),
            ]),
            V({ gap: 8, name: "Lens type" }, [
              T("Lens type", { size: 15, weight: "s", color: C.ink }),
              OPTION("Single vision, standard · ₹800", null, true),
              OPTION("Single vision, thin (1.67) · ₹2,200", null, false),
              OPTION("Progressive (near and far) · ₹3,900", null, false),
              T("Lenses explained", { size: 14, weight: "s", color: C.brand, underline: true }),
            ]),
            V({ gap: 8, name: "Coating" }, [
              H({ gap: 6 }, [T("Coating", { size: 15, weight: "s", color: C.ink }), T("(optional)", { size: 14, color: C.muted })]),
              H({ gap: 8, wrap: true }, [CHIP("No extra coating"), CHIP("Anti-glare coating · ₹400", { stroke: C.brand, sw: 2 }), CHIP("Blue-light + anti-glare · ₹700"), CHIP("Water and smudge repellent · ₹300")]),
            ]),
            V({ mark: 4 }, [priceLines()]),
            T("Have a code? You can add it in your bag. We'll only use it if it saves you more.", { size: 13, color: C.muted, fill: true }),
            V({ gap: 12, mark: 5, name: "Call to action" }, [
              BTN("Continue: add your prescription →", "S7", "primary", { hug: false }),
              H({ gap: 12 }, [BTN("+ Add to compare", "S5", "secondary", { hug: false }), BTN("♡ Save", null, "secondary")]),
              P("Needs your prescription: upload, type it in, or send it later", { size: 14 }),
              P("Delivered in 4–7 days. Free shipping. Pay online or cash on delivery.", { size: 14, color: C.muted }),
            ]),
          ]),
        ]),
        page([
          h2("All sizes, in millimetres", { size: 24 }),
          V({ stroke: C.line }, [
            ["Size", "Lens width", "Bridge", "Temple", "Total width", "Stock"],
            ["S", "47", "20", "140", "—", "3 left"],
            ["M", "49", "21", "145", "129", "In stock"],
            ["L", "51", "22", "150", "—", "Sold out"],
          ].map((r, i) => H({ stroke: C.line, sides: "b", fill: i === 0 ? C.fill : C.white }, r.map((c) => V({ pad: [10, 14] }, [T(c, { size: 14, weight: i === 0 ? "s" : "r", color: C.ink })]))))),
          T("Total width for S and L: shown in the coded prototype; “—” is a wireframe placeholder.", { size: 12, color: C.muted }),
        ], { pad: [40, 48] }),
      ]),
    },
    {
      id: "S7",
      title: "Prescription",
      notes: [
        [1, "Three ways, including “later”", "X11", "Nobody is blocked from ordering by a missing prescription."],
        [2, "Sensitive data handled visibly", "—", "Demo note, who sees it, and an optometrist check are stated up front."],
        [3, "Inline checking with examples", "U3", "Each field has a hint (“Sphere, e.g. −1.25”) and is checked as you go."],
      ],
      body: chrome(3, [
        V({ pad: [48, 48], align: "center" }, [
          V({ w: 900, gap: 20 }, [
            eyebrow("Arlo Round · Single vision, standard"),
            h1("Add your prescription", { size: 40 }),
            H({ pad: [12, 16], fill: C.warnSoft, gap: 10, align: "center", name: "Demo note", mark: 2 }, [T("Demo only. Do not upload a real prescription.", { size: 14, weight: "s", color: C.ink })]),
            h3("How would you like to add it?"),
            H({ gap: 12, mark: 1, name: "Methods" }, [
              OPTION("Type it in", "Copy the numbers from your prescription. We check each value as you go.", true),
              OPTION("Upload a photo or PDF", "Our optometrist checks it before your lenses are made. JPG, PNG, WebP or PDF, up to 5 MB.", false),
              OPTION("Send it later, or book an eye test", "Place your order now. We'll email you to add it, or book a free eye test at a store.", false, { go: "S8" }),
            ]),
            V({ gap: 14, pad: 24, stroke: C.line, mark: 3, name: "Prescription values for each eye" }, [
              H({ justify: "space" }, [h3("Prescription values for each eye", { fill: false }), LNK("Where do I find these numbers?", null, { size: 14 })]),
              H({ gap: 12 }, [V({ w: 140 }, [T("", { size: 13 })]), T("SPH", { size: 13, weight: "s", color: C.ink, fill: true }), T("CYL", { size: 13, weight: "s", color: C.ink, fill: true }), T("AXIS", { size: 13, weight: "s", color: C.ink, fill: true })]),
              H({ gap: 12, align: "center" }, [V({ w: 140 }, [T("Right eye (OD)", { size: 14, weight: "s", color: C.ink })]), FIELD("", "−1.25"), FIELD("", "−0.50"), FIELD("", "90")]),
              H({ gap: 12, align: "center" }, [V({ w: 140 }, [T("Left eye (OS)", { size: 14, weight: "s", color: C.ink })]), FIELD("", "−1.00"), FIELD("", ""), FIELD("", "")]),
              T("SPH: sphere, e.g. −1.25  ·  CYL: cylinder; blank if none  ·  AXIS: 1–180; only if CYL", { size: 13, color: C.muted, fill: true }),
              V({ w: 300 }, [FIELD("Pupillary distance (PD)", "62", "Distance between pupils in mm, e.g. 62. Often written as PD.")]),
            ]),
            V({ gap: 6 }, [
              T("✓ A qualified optometrist checks every prescription.", { size: 14, color: C.body }),
              T("✓ If the lenses don't feel right, we remake them free within 14 days.", { size: 14, color: C.body }),
              T("✓ Only our optometrists see it, to make your lenses.", { size: 14, color: C.body }),
            ]),
            H({ justify: "space", align: "center" }, [LNK("← Back", "BACK"), H({ hug: true, gap: 20, align: "center" }, [LNK("Skip for now, go to bag", "S8", { color: C.muted }), BTN("Check and save →", "S8")])]),
          ]),
        ]),
      ]),
    },
    {
      id: "S8",
      title: "Bag",
      notes: [
        [1, "Every choice visible and editable", "X5", "Lenses, coating, size and prescription status per item, with “Edit lenses”."],
        [2, "One offer, applied automatically", "X7", "A code replaces it only if it saves more; the rule is one sentence."],
        [3, "Guest checkout", "X11", "No account needed; three short steps."],
        [4, "Promises repeated in the bag", "X8", ""],
      ],
      body: chrome(4, [
        page([eyebrow("Step 3 · Review"), h1("Your bag", { size: 40 })], { pad: [32, 48, 16, 48] }),
        H({ pad: [8, 48], gap: 40, name: "Bag" }, [
          V({ gap: 20 }, [
            H({ pad: 20, gap: 20, stroke: C.line, mark: 1, name: "Bag item" }, [
              V({ w: 200 }, [IMG("Arlo Round", 130)]),
              V({ gap: 8 }, [
                H({ justify: "space" }, [T("Arlo Round", { size: 20, weight: "b", color: C.ink }), T("₹2,699", { size: 18, weight: "b", color: C.ink })]),
                T("Havana tortoise · Size M · 49□21 · 145", { size: 14, color: C.muted }),
                ROW("Lenses for", "To see clearly"),
                ROW("Lens", "Single vision, standard"),
                ROW("Coating", "Anti-glare coating"),
                ROW("Prescription", "✓ Entered and checked"),
                H({ gap: 20 }, [LNK("Edit lenses", "S6", { size: 14 }), LNK("Edit prescription", "S7", { size: 14 }), LNK("Remove", null, { size: 14, color: C.muted })]),
              ]),
            ]),
            V({ mark: 4 }, [INST("trust")]),
          ]),
          V({ w: 420, gap: 14, pad: 24, stroke: C.ink, name: "Order summary" }, [
            h3("Order summary"),
            ROW("Frame", "₹1,499"),
            ROW("Lenses", "₹800"),
            ROW("Coating", "₹400"),
            V({ mark: 2 }, [ROW("Offer: 10% off frames", "−₹150", { labelColor: C.brand })]),
            ROW("Shipping", "Free"),
            RULE(),
            H({ justify: "space", align: "baseline" }, [T("Total to pay", { size: 18, weight: "b", color: C.ink }), T("₹2,549", { size: 28, weight: "b", color: C.ink })]),
            H({ gap: 8, align: "end" }, [FIELD("Offer code", "", null), BTN("Apply", null, "secondary")]),
            P("We apply the best offer automatically. A code only replaces it if it saves you more.", { size: 13, color: C.muted }),
            V({ gap: 8, mark: 3 }, [BTN("Checkout →", "S9", "primary"), P("No account needed. Guest checkout in three short steps.", { size: 13, color: C.muted })]),
          ]),
        ]),
      ]),
    },
    checkout("S9", false),
    checkout("S9b", true),
    {
      id: "S10",
      title: "Confirmation",
      notes: [
        [1, "What happens next, step by step", "X8", "Prescription check, lens making, shipping and arrival, each with timing."],
        [2, "Key facts first", "—", "Order number, arrival window and payment at the top."],
        [3, "Cancel or return is easy to find", "X8", "Free cancellation until it ships."],
      ],
      body: chrome(3, [
        V({ pad: [48, 48], align: "center" }, [
          V({ w: 900, gap: 24 }, [
            eyebrow("Step 5 · Done"),
            h1("Order confirmed", { size: 44 }),
            H({ gap: 12, mark: 2, name: "Key facts" }, [
              V({ pad: 16, gap: 4, fill: C.fill }, [eyebrow("Order number"), T("CP-XXXXXX", { size: 22, weight: "b", color: C.ink })]),
              V({ pad: 16, gap: 4, fill: C.fill }, [eyebrow("Arrives"), T("In 4–7 days", { size: 22, weight: "b", color: C.ink })]),
              V({ pad: 16, gap: 4, fill: C.fill }, [eyebrow("Paid"), T("₹2,549 · UPI", { size: 22, weight: "b", color: C.ink })]),
            ]),
            V({ gap: 0, stroke: C.line, mark: 1, name: "What happens next" }, [
              V({ pad: [16, 20] }, [h3("What happens next")]),
            ].concat([
              ["Order placed", "(done)"],
              ["Prescription check", "An optometrist checks your prescription before lenses are cut. Usually 2–3 days."],
              ["Lenses made and checked", ""],
              ["Shipping", "You'll get an SMS with a tracking link."],
              ["Arrives", "Delivering to the address you gave."],
            ].map((s, i) => H({ pad: [14, 20], gap: 14, stroke: C.line, sides: "t" }, [V({ w: 24, h: 24, radius: 12, fill: i === 0 ? C.brand : C.white, stroke: C.brand }), V({ gap: 4 }, [T(s[0], { size: 16, weight: "s", color: C.ink }), s[1] ? T(s[1], { size: 14, color: C.muted, fill: true }) : null])])))),
            V({ gap: 10, pad: 20, stroke: C.line, name: "Order details" }, [h3("Order details"), ROW("Arlo Round · M · Single vision, standard · Anti-glare", "₹2,699"), ROW("Offer: 10% off frames", "−₹150"), ROW("Shipping", "Free"), RULE(), ROW("Total", "₹2,549", { bold: "b" })]),
            H({ gap: 20, align: "center" }, [BTN("Track order", null), V({ hug: true, mark: 3 }, [LNK("Cancel or return")]), LNK("Back to home", "S1")]),
          ]),
        ]),
      ]),
    },
  ];
}

function checkout(id, declined) {
  const methods = [
    ["UPI", "Pay from any UPI app."],
    ["Debit or credit card", "Visa, Mastercard, RuPay."],
    ["Net banking", "All major banks."],
    ["Cash on delivery", "Pay when it arrives. Up to ₹10,000."],
  ];
  return {
    id: id,
    title: declined ? "Checkout · Payment declined" : "Checkout",
    notes: declined
      ? [
          [1, "Error says what happened and what to do", "U3", "“Payment didn't go through”, with Retry and Change method."],
          [2, "Retrying is safe", "X11", "Orders are idempotent, so a retry can't charge twice. Entered details are kept."],
        ]
      : [
          [1, "Guest checkout, sign-in optional", "X11", "Three numbered sections on one page."],
          [2, "Simulated payment, stated plainly", "—", "“Demo checkout, no real payment.” Test values are shown in hints."],
          [3, "Total on the button", "X5", "The amount is repeated on the pay button and in the summary."],
        ],
    body: chrome(declined ? 2 : 3, [
      page([eyebrow("Step 4 · Pay"), h1("Checkout", { size: 40 })], { pad: [32, 48, 8, 48] }),
      page([
        H({ pad: [12, 16], fill: C.warnSoft, gap: 10, align: "center", mark: declined ? 0 : 2, name: "Demo note" }, [T("Demo checkout, no real payment. Don't enter real card details.", { size: 14, weight: "s", color: C.ink })]),
        declined
          ? V({ pad: 20, gap: 10, stroke: "#B3261E", sw: 2, fill: "#FDECEA", mark: 1, name: "Payment error (alert)" }, [
              T("Payment didn't go through", { size: 20, weight: "b", color: "#8C1D18" }),
              P("Your order has not been placed. Try again, or choose a different way to pay. Your details are kept.", { color: C.ink }),
              H({ gap: 12, mark: 2 }, [BTN("Retry", "S10"), BTN("Change method", "S9", "secondary")]),
            ])
          : null,
      ], { pad: [8, 48] }),
      H({ pad: [16, 48], gap: 40 }, [
        V({ gap: 24 }, [
          H({ gap: 6, mark: declined ? 0 : 1, name: "Guest note" }, [T("Checking out as a guest.", { size: 14, color: C.body }), T("Sign in instead (optional)", { size: 14, weight: "s", color: C.brand, underline: true })]),
          V({ gap: 14, pad: 24, stroke: C.line, name: "1. Contact" }, [h3("1. Contact"), FIELD("Email", "asha@example.com", "For your receipt and tracking link."), H({ gap: 16 }, [FIELD("Full name", "Asha Rao"), FIELD("Mobile number", "98765 43210", "For delivery updates only.")])]),
          V({ gap: 14, pad: 24, stroke: C.line, name: "2. Delivery address" }, [h3("2. Delivery address"), P("Where should we deliver?", { color: C.muted }), FIELD("Address line 1", "22 Example Road"), FIELD("Area or landmark", ""), H({ gap: 16 }, [FIELD("City", "Bengaluru"), FIELD("State", "Choose a state ▾"), FIELD("PIN code", "560011")])]),
          V({ gap: 12, pad: 24, stroke: C.line, name: "3. Payment" }, [
            h3("3. Payment"),
            P("How would you like to pay?", { color: C.muted }),
            grid(2, methods.map((m, i) => OPTION(m[0], m[1], i === 0)), 10),
            FIELD("UPI ID", declined ? "fail@demo" : "name@okbank", "Demo: any ID like name@okbank works. fail@demo simulates a decline."),
          ]),
          P("By placing the order you agree to the demo terms. You can cancel free of charge until it ships.", { size: 13, color: C.muted }),
          H({ justify: "space", align: "center" }, [
            LNK("← Back to bag", "S8"),
            H({ hug: true, gap: 16, align: "center" }, [declined ? null : LNK("Prototype: simulate a decline", "S9b", { size: 13, color: C.muted }), V({ hug: true, mark: declined ? 0 : 3 }, [BTN("Pay · ₹2,549", declined ? "S9b" : "S10")])]),
          ]),
        ]),
        V({ w: 400, gap: 12, pad: 24, stroke: C.ink, name: "Summary" }, [
          h3("Order summary"),
          T("Arlo Round · M · Single vision, standard · Anti-glare", { size: 14, color: C.body, fill: true }),
          ROW("Subtotal", "₹2,699"),
          ROW("Offer: 10% off frames", "−₹150", { labelColor: C.brand }),
          ROW("Shipping", "Free"),
          RULE(),
          H({ justify: "space", align: "baseline" }, [T("Total", { size: 18, weight: "b", color: C.ink }), T("₹2,549", { size: 26, weight: "b", color: C.ink })]),
        ]),
      ]),
    ]),
  };
}

function notesPanel(s) {
  return V({ w: NOTES_W, pad: 24, gap: 16, fill: C.noteSoft, stroke: C.note, name: "UX notes · " + s.id }, [
    T("UX notes · " + s.id + " " + s.title, { size: 18, weight: "b", color: C.noteInk, fill: true }),
    T((s.sketch ? "Numbered circles" : "Magenta circles") + " on the screen match these numbers. Hide all “UX marker” layers for a clean view.", { size: 12, color: C.noteInk, fill: true, lh: 140 }),
  ].concat(s.notes.map((n) =>
    H({ gap: 10, name: "Note " + n[0] }, [
      H({ w: 24, h: 24, radius: 12, fill: s.sketch ? SK.black : C.note, justify: "center", align: "center" }, [T(String(n[0]), { size: 12, weight: "b", color: C.white })]),
      V({ gap: 4 }, [
        T(n[1], { size: 14, weight: "b", color: C.ink, fill: true }),
        T("Issue: " + n[2], { size: 12, weight: "s", color: C.note }),
        n[3] ? T(n[3], { size: 13, color: C.body, fill: true, lh: 140 }) : null,
      ]),
    ])
  )));
}

function cover() {
  const flow = [
    ["S1", "Home"], ["S2a–d", "Frame Finder (3 questions + results)"], ["S3", "Listing"], ["S4", "Empty state"], ["S5", "Compare"],
    ["S6", "Product"], ["S7", "Prescription"], ["S8", "Bag"], ["S9", "Checkout (+ S9b payment declined)"], ["S10", "Confirmation"],
  ];
  return V({ w: 1200, pad: 64, gap: 24, fill: C.white, stroke: C.ink, name: "Cover" }, [
    eyebrow("MCA263D4 · UX case study · Wireframes"),
    T("Clear Path", { size: 64, weight: "b", color: C.ink }),
    P((LOFI ? "A low" : "A low-to-mid") + " fidelity, clickable wireframe of the Clear Path redesign of lenskart.com. Content, counts and prices mirror the coded prototype; frames, brands and stores are invented.", { size: 18 }),
    H({ gap: 24 }, [
      V({ gap: 10, pad: 20, fill: C.fill }, [h3("Legend"),
        H({ gap: 10, align: "center" }, [LOFI ? IMG("", 24, { w: 40 }) : V({ w: 40, h: 24, fill: C.fill, stroke: C.lineStrong, dash: true }), T("Placeholder (illustration, image)", { size: 14, color: C.body })]),
        LOFI ? H({ gap: 10, align: "center" }, [V({ w: 40, gap: 4 }, [V({ h: 6, fill: C.textBar }), V({ h: 6, fill: C.textBar })]), T("Body copy (text lines)", { size: 14, color: C.body })]) : null,
        H({ gap: 10, align: "center" }, [V({ w: 40, h: 24, fill: C.brand }), T(LOFI ? "Primary action / link (dark grey)" : "Primary action / link (navy)", { size: 14, color: C.body })]),
        H({ gap: 10, align: "center" }, [V({ w: 24, h: 24, radius: 12, fill: C.note }), T("UX change marker, explained in the notes panel", { size: 14, color: C.body })]),
      ]),
      V({ gap: 8, pad: 20, fill: C.fill }, [h3("Clickable flow")].concat(flow.map((f) => T(f[0] + "  ·  " + f[1], { size: 14, color: C.body })))),
    ]),
    P("Press Present (▶) with “S1 · Home” selected, or use the flow “Purchase journey”. Click the " + (LOFI ? "dark grey" : "navy") + " buttons and links; the logo returns home.", { size: 14, color: C.muted }),
    T("Academic redesign concept. Not affiliated with or endorsed by Lenskart.", { size: 14, weight: "s", color: C.ink }),
  ]);
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  await Promise.all(Object.keys(FONTS).map((k) => figma.loadFontAsync(FONTS[k])));

  const pg = figma.createPage();
  pg.name = "Clear Path wireframes";
  await figma.setCurrentPageAsync(pg);

  const coverNode = render(cover(), pg);
  coverNode.x = 0;
  coverNode.y = 0;

  const list = screens();
  const kit = buildComponents(0, 0);
  kit.y = -kit.height - 200;

  const nodes = {};
  let x = 0;
  const y = coverNode.height + 200;
  for (const s of list) {
    GREEK = true;
    const frame = render(V({ w: W, fill: C.white, name: s.id + " · " + s.title }, s.body), pg);
    GREEK = false;
    frame.clipsContent = true;
    frame.x = x;
    frame.y = y;
    const notes = render(notesPanel(s), pg);
    notes.x = x + W + 40;
    notes.y = y;
    nodes[s.id] = frame;
    x += W + 40 + NOTES_W + 200;
  }

  for (const pair of LINKS) {
    const node = pair[0];
    const target = pair[1];
    let action;
    if (target === "BACK") action = { type: "BACK" };
    else if (nodes[target]) {
      action = {
        type: "NODE",
        destinationId: nodes[target].id,
        navigation: "NAVIGATE",
        transition: { type: "DISSOLVE", easing: { type: "EASE_OUT" }, duration: 0.2 },
      };
    } else continue;
    await node.setReactionsAsync([{ trigger: { type: "ON_CLICK" }, actions: [action] }]);
  }

  pg.flowStartingPoints = [{ nodeId: nodes.S1.id, name: "Purchase journey" }];
  figma.viewport.scrollAndZoomIntoView([coverNode, nodes.S1]);
  figma.notify("Clear Path wireframes created: " + list.length + " screens, " + LINKS.length + " links.");
}

main()
  .then(() => figma.closePlugin())
  .catch((e) => {
    console.error(e);
    figma.closePlugin("Couldn't build the wireframes: " + (e && e.message ? e.message : e));
  });
