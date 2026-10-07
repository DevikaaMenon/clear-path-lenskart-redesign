/**
 * Synthetic catalogue. Every name, model code, measurement, price and stock count
 * is invented for this academic concept. No data is taken from any real store.
 */
import type { Colour, ProductDTO, SizeDTO } from "../../src/lib/catalogue";

const C: Record<string, Colour> = {
  black: { name: "Matte black", family: "black", rim: "#1b1d20", temple: "#1b1d20" },
  gloss: { name: "Gloss black", family: "black", rim: "#0e0f11", temple: "#0e0f11" },
  tortoise: { name: "Havana tortoise", family: "tortoise", rim: "#6b3a1e", temple: "#4a2612", pattern: "tortoise" },
  honey: { name: "Honey tortoise", family: "brown", rim: "#b0702a", temple: "#8a5420", pattern: "tortoise" },
  crystal: { name: "Crystal clear", family: "clear", rim: "#c9d0d4", temple: "#b9c1c6", pattern: "clear" },
  smoke: { name: "Smoke crystal", family: "clear", rim: "#6f777d", temple: "#5f666b", pattern: "clear" },
  gold: { name: "Brushed gold", family: "gold", rim: "#b8913a", temple: "#a17d2e" },
  rose: { name: "Rose gold", family: "red", rim: "#c08a78", temple: "#a8735f" },
  silver: { name: "Silver", family: "silver", rim: "#9aa1a8", temple: "#868d94" },
  gunmetal: { name: "Gunmetal", family: "silver", rim: "#4b5056", temple: "#3c4045" },
  navy: { name: "Deep navy", family: "blue", rim: "#1f3352", temple: "#1a2b45" },
  cobalt: { name: "Cobalt", family: "blue", rim: "#2c55a8", temple: "#24478d" },
  forest: { name: "Forest green", family: "green", rim: "#2f5a3e", temple: "#264a33" },
  sage: { name: "Sage", family: "green", rim: "#7f9a7c", temple: "#6b8568" },
  wine: { name: "Wine red", family: "red", rim: "#7a1f2e", temple: "#661927" },
  coral: { name: "Coral pink", family: "red", rim: "#e07b6e", temple: "#c9685c" },
  caramel: { name: "Caramel", family: "brown", rim: "#8a5a32", temple: "#744a29" },
};

const SHAPE_CODE: Record<string, string> = {
  round: "RD", oval: "OV", rectangle: "RC", square: "SQ", "cat-eye": "CE", aviator: "AV", wayfarer: "WF", geometric: "GM",
};

const FACES: Record<string, string[]> = {
  round: ["square", "heart", "oval"],
  oval: ["square", "heart", "long"],
  rectangle: ["round", "oval"],
  square: ["round", "oval", "long"],
  "cat-eye": ["round", "square", "heart"],
  aviator: ["oval", "square", "heart"],
  wayfarer: ["round", "oval", "long"],
  geometric: ["round", "oval"],
};

const MATERIAL_WORD: Record<string, string> = {
  acetate: "acetate", metal: "metal", titanium: "titanium", tr90: "flexible TR90",
};

type Row = [
  name: string, shape: string, frameType: string, material: string, weightG: number,
  lens: number, bridge: number, temple: number, brand: string, collection: string,
  colours: (keyof typeof C)[], price: number, needs: string[],
  stock: [s: number | null, m: number | null, l: number | null], popularity: number, line: string,
  audience?: "adult" | "kids",
];

const ROWS: Row[] = [
  ["Arlo Round", "round", "full-rim", "acetate", 18, 49, 21, 145, "Clear Path Studio", "Everyday Edit", ["tortoise", "black", "crystal"], 1499, ["prescription", "computer", "reading"], [3, 12, 0], 95, "A softly rounded keyhole bridge that sits low and comfortably on the nose."],
  ["Mira Cat-eye", "cat-eye", "full-rim", "acetate", 19, 52, 17, 140, "Halden & Rowe", "Monsoon Acetates", ["wine", "tortoise", "gloss"], 2299, ["prescription", "computer"], [5, 2, 4], 88, "A gentle upsweep at the outer corners, cut from layered acetate."],
  ["Kabir Rectangle", "rectangle", "full-rim", "acetate", 21, 54, 18, 145, "Northline Optical", "Everyday Edit", ["black", "navy", "tortoise"], 1299, ["prescription", "computer", "reading"], [8, 15, 9], 92, "A straightforward everyday rectangle with sturdy five-barrel hinges."],
  ["Ishaan Aviator", "aviator", "full-rim", "metal", 16, 56, 16, 145, "Halden & Rowe", "Heritage Metal", ["gold", "gunmetal", "silver"], 2799, ["prescription", "sun"], [null, 7, 6], 80, "A classic double-bridge teardrop with adjustable nose pads."],
  ["Noor Oval", "oval", "full-rim", "titanium", 11, 50, 19, 140, "Featherline", "Featherweight", ["rose", "silver", "gold"], 3999, ["prescription", "computer", "reading"], [4, 9, 3], 70, "Fine titanium wire that weighs about as much as two coins."],
  ["Vihaan Square", "square", "full-rim", "acetate", 24, 53, 19, 145, "Northline Optical", "Monsoon Acetates", ["black", "forest", "honey"], 1899, ["prescription", "computer"], [0, 10, 6], 76, "A bold square with thick, polished rims."],
  ["Tara Geometric", "geometric", "full-rim", "metal", 14, 51, 19, 140, "Clear Path Studio", "Heritage Metal", ["gold", "gunmetal"], 2499, ["prescription", "computer"], [5, 8, 4], 66, "Six flat facets give this metal frame a crisp outline."],
  ["Dev Wayfarer", "wayfarer", "full-rim", "acetate", 23, 52, 20, 145, "Northline Optical", "Everyday Edit", ["gloss", "tortoise", "cobalt"], 1599, ["prescription", "computer", "sun"], [6, 14, 8], 90, "The familiar trapezoid, slightly slimmed for a lighter look."],
  ["Zoya Round", "round", "full-rim", "metal", 13, 47, 21, 140, "Halden & Rowe", "Heritage Metal", ["gold", "silver"], 2199, ["prescription", "reading"], [6, 5, null], 61, "A small, perfectly round metal frame with a high bridge."],
  ["Reyansh Rectangle", "rectangle", "half-rim", "metal", 15, 54, 17, 145, "Northline Optical", "Screen Shift", ["gunmetal", "black"], 1799, ["computer", "prescription"], [5, 11, 7], 72, "A brow-line half rim that keeps the lower view open."],
  ["Anaya Cat-eye Sun", "cat-eye", "full-rim", "acetate", 22, 55, 17, 140, "Studio Sol", "Sun Studio", ["tortoise", "black", "coral"], 2599, ["sun", "prescription"], [null, 6, 5], 74, "An oversized cat-eye sunglass with UV400 lenses."],
  ["Kian Aviator Sun", "aviator", "full-rim", "metal", 18, 58, 15, 140, "Studio Sol", "Sun Studio", ["gold", "gunmetal"], 2999, ["sun"], [null, 1, 3], 83, "A wide pilot shape for strong daylight."],
  ["Leela Oval Reader", "oval", "half-rim", "metal", 12, 50, 18, 135, "Northline Optical", "Reading Room", ["gold", "silver"], 999, ["reading"], [7, 12, null], 58, "A slim reader that tucks into a shirt pocket."],
  ["Om Rectangle Reader", "rectangle", "full-rim", "tr90", 13, 52, 18, 140, "Clear Path Studio", "Reading Room", ["black", "navy", "wine"], 899, ["reading"], [9, 16, 8], 64, "A flexible, nearly unbreakable everyday reader."],
  ["Sana Rimless", "rectangle", "rimless", "titanium", 8, 52, 17, 140, "Featherline", "Featherweight", ["silver", "gold"], 4499, ["prescription", "computer", "reading"], [3, 6, 2], 55, "Lenses held by three small titanium screws and nothing else."],
  ["Rudra Square Titanium", "square", "full-rim", "titanium", 12, 54, 19, 145, "Featherline", "Featherweight", ["gunmetal", "black"], 4999, ["prescription", "computer"], [0, 0, 0], 50, "A square titanium frame. Currently sold out in every size."],
  ["Pari Round Kids", "round", "full-rim", "tr90", 10, 44, 17, 125, "Little Lens", "First Frames", ["coral", "cobalt", "sage"], 999, ["prescription", "computer"], [8, 6, null], 60, "Bendable arms and a soft nose bridge for active kids.", "kids"],
  ["Aarav Rectangle Kids", "rectangle", "full-rim", "tr90", 11, 46, 16, 130, "Little Lens", "First Frames", ["navy", "forest", "black"], 1099, ["prescription", "computer", "sun"], [7, 9, null], 57, "A flexible rectangle with spring hinges.", "kids"],
  ["Myra Cat-eye Kids", "cat-eye", "full-rim", "tr90", 10, 45, 16, 125, "Little Lens", "First Frames", ["coral", "wine", "crystal"], 1099, ["prescription"], [5, 4, null], 49, "A small cat-eye with a little lift at the corners.", "kids"],
  ["Neel Wayfarer Screen", "wayfarer", "full-rim", "tr90", 17, 53, 18, 145, "Clear Path Studio", "Screen Shift", ["black", "smoke", "navy"], 1199, ["computer", "prescription"], [6, 18, 9], 86, "Made for long screen days, light enough to forget about."],
  ["Ira Round Screen", "round", "full-rim", "acetate", 17, 48, 20, 140, "Clear Path Studio", "Screen Shift", ["crystal", "smoke", "sage"], 1299, ["computer", "prescription"], [5, 10, 4], 79, "A transparent round frame that suits blue-light lenses."],
  ["Kaveri Oval", "oval", "full-rim", "acetate", 18, 51, 18, 140, "Halden & Rowe", "Monsoon Acetates", ["honey", "forest", "wine"], 2099, ["prescription", "reading"], [4, 7, 3], 52, "A warm, generous oval in hand-polished acetate."],
  ["Arjun Square Sun", "square", "full-rim", "acetate", 26, 56, 18, 145, "Studio Sol", "Sun Studio", ["black", "tortoise"], 2399, ["sun", "prescription"], [null, 8, 5], 69, "A chunky square sunglass with full UV400 protection."],
  ["Meher Geometric Rimless", "geometric", "rimless", "titanium", 9, 51, 18, 140, "Featherline", "Featherweight", ["rose", "gold"], 4299, ["prescription", "reading"], [1, 5, 2], 44, "Faceted lens edges with no visible frame."],
  ["Yash Rectangle Wide", "rectangle", "full-rim", "acetate", 25, 58, 18, 150, "Northline Optical", "Everyday Edit", ["black", "caramel"], 1699, ["prescription", "computer"], [null, 6, 7], 63, "A rectangle cut wider for broader faces."],
  ["Diya Round Half-rim", "round", "half-rim", "metal", 13, 49, 20, 140, "Halden & Rowe", "Heritage Metal", ["gold", "silver"], 2399, ["prescription", "computer"], [4, 6, 2], 47, "A round brow-line frame with a fine metal underwire."],
  ["Rohit Aviator Clear", "aviator", "full-rim", "tr90", 15, 55, 16, 145, "Northline Optical", "Screen Shift", ["crystal", "black"], 1499, ["computer", "prescription"], [null, 9, 6], 54, "An aviator outline in light, flexible material."],
  ["Advika Cat-eye Metal", "cat-eye", "full-rim", "metal", 14, 53, 16, 140, "Halden & Rowe", "Heritage Metal", ["rose", "gold"], 2699, ["prescription", "computer"], [3, 6, 2], 59, "A fine metal cat-eye with a subtle lift."],
  ["Samar Wayfarer Sun", "wayfarer", "full-rim", "acetate", 25, 54, 19, 145, "Studio Sol", "Sun Studio", ["gloss", "tortoise", "forest"], 1999, ["sun", "prescription"], [null, 11, 7], 81, "A dependable wayfarer sunglass with UV400 lenses."],
  ["Inaya Oval Clear", "oval", "full-rim", "acetate", 16, 49, 19, 140, "Clear Path Studio", "Everyday Edit", ["crystal", "coral", "smoke"], 1399, ["prescription", "computer", "reading"], [6, 9, 3], 68, "A light, transparent oval for everyday wear."],
  ["Vivaan Square Half-rim", "square", "half-rim", "metal", 16, 53, 18, 145, "Northline Optical", "Screen Shift", ["gunmetal", "navy"], 1899, ["computer", "prescription"], [3, 7, 5], 46, "A squared brow-line frame for office days."],
  ["Nila Round Titanium", "round", "full-rim", "titanium", 9, 48, 21, 140, "Featherline", "Featherweight", ["gold", "gunmetal"], 4599, ["prescription", "reading", "computer"], [2, 5, 2], 53, "A featherweight round in pure titanium."],
  ["Krish Rectangle Reader", "rectangle", "half-rim", "tr90", 11, 51, 17, 135, "Clear Path Studio", "Reading Room", ["black", "tortoise"], 799, ["reading"], [8, 13, null], 45, "A slim half-rim reader at an everyday price."],
  ["Aditi Geometric", "geometric", "full-rim", "acetate", 20, 52, 19, 140, "Halden & Rowe", "Monsoon Acetates", ["sage", "caramel", "black"], 2199, ["prescription", "computer"], [3, 5, 2], 42, "An angular acetate frame with softened edges."],
  ["Ved Aviator Titanium", "aviator", "full-rim", "titanium", 11, 57, 15, 145, "Featherline", "Featherweight", ["silver", "gold"], 5299, ["prescription", "sun"], [null, 4, 3], 40, "A titanium aviator that keeps its shape for years."],
  ["Rhea Oval Sun", "oval", "full-rim", "metal", 15, 54, 18, 140, "Studio Sol", "Sun Studio", ["gold", "rose"], 2299, ["sun"], [null, 7, 4], 62, "A soft oval sunglass with a thin metal rim."],
  ["Tanish Square Kids", "square", "full-rim", "tr90", 12, 47, 16, 130, "Little Lens", "First Frames", ["cobalt", "forest", "black"], 1199, ["prescription", "sun"], [6, 5, null], 39, "A sporty square with a rubber-tipped temple.", "kids"],
  ["Esha Round", "round", "full-rim", "acetate", 22, 53, 20, 145, "Halden & Rowe", "Monsoon Acetates", ["tortoise", "wine"], 2499, ["prescription", "computer"], [null, 5, 4], 48, "A larger round with a confident, thick rim."],
  ["Parth Rimless", "rectangle", "rimless", "titanium", 7, 54, 18, 145, "Featherline", "Featherweight", ["silver", "gunmetal"], 4799, ["prescription", "computer", "reading"], [2, 6, 3], 43, "Our lightest frame, at just 7 grams."],
  ["Kiara Wayfarer", "wayfarer", "full-rim", "acetate", 19, 50, 19, 140, "Clear Path Studio", "Everyday Edit", ["crystal", "honey", "black"], 1399, ["prescription", "computer"], [5, 10, 6], 71, "A compact wayfarer for narrower faces."],
];

export const sizeBandOf = (lens: number, bridge: number) => {
  const total = lens * 2 + bridge + 10;
  return total < 132 ? "narrow" : total <= 140 ? "medium" : "wide";
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function buildCatalogue(): ProductDTO[] {
  const base = Date.UTC(2026, 0, 1);
  return ROWS.map((r, i) => {
    const [name, shape, frameType, material, weightG, lens, bridge, temple, brand, collection, colours, price, needs, stock, popularity, line, audience] = r;
    const sizes: SizeDTO[] = [];
    const [s, m, l] = stock;
    if (s !== null) sizes.push({ label: "S", lensWidthMm: lens - 2, bridgeMm: bridge - 1, templeMm: temple - 5, stock: s });
    if (m !== null) sizes.push({ label: "M", lensWidthMm: lens, bridgeMm: bridge, templeMm: temple, stock: m });
    if (l !== null) sizes.push({ label: "L", lensWidthMm: lens + 2, bridgeMm: bridge + 1, templeMm: temple + 5, stock: l });
    const modelCode = `CP-${SHAPE_CODE[shape]}${1001 + i * 7}`;
    const tags = [
      ...(needs.includes("sun") ? ["UV400"] : []),
      ...(weightG < 15 ? ["lightweight"] : []),
      ...(material === "tr90" ? ["flexible"] : []),
    ];
    return {
      id: `p${String(i + 1).padStart(2, "0")}`,
      slug: slugify(name),
      name,
      modelCode,
      shape,
      frameType,
      material,
      weightG,
      lensWidthMm: lens,
      bridgeMm: bridge,
      templeMm: temple,
      sizeBand: sizeBandOf(lens, bridge),
      audience: audience ?? "adult",
      brand,
      collection,
      colours: colours.map((c) => C[c]),
      basePrice: price,
      tags,
      needs,
      faceShapes: FACES[shape],
      description: `${line} A ${weightG} g ${MATERIAL_WORD[material]} ${frameType.replace("-", " ")} frame from the ${collection} collection.`,
      popularity,
      createdAt: new Date(base + i * 86400000 * 5).toISOString(),
      sizes,
    };
  });
}

export const LENS_OPTIONS = [
  { id: "rx-standard", purpose: "prescription", name: "Single vision, standard", description: "Clear vision at one distance. Anti-scratch hard coat included. Best for powers up to ±4.00.", price: 800, needsPrescription: true, sortOrder: 1 },
  { id: "rx-thin", purpose: "prescription", name: "Single vision, thin (1.67)", description: "About 30% thinner and lighter. Recommended for high power (above ±4.00).", price: 2200, needsPrescription: true, sortOrder: 2 },
  { id: "rx-progressive", purpose: "prescription", name: "Progressive (near and far)", description: "One lens for distance, screens and reading, with no visible line. Needs an ADD value.", price: 3900, needsPrescription: true, sortOrder: 3 },
  { id: "pc-zero", purpose: "computer", name: "Blue-light filter, no power", description: "Reduces glare from screens. For people who don't need vision correction.", price: 900, needsPrescription: false, sortOrder: 4 },
  { id: "pc-power", purpose: "computer", name: "Blue-light filter with your power", description: "Your prescription plus screen-glare reduction.", price: 1400, needsPrescription: true, sortOrder: 5 },
  { id: "read-standard", purpose: "reading", name: "Reading lenses", description: "Magnifying lenses from +0.75 to +3.50. You'll choose the power next.", price: 600, needsPrescription: true, sortOrder: 6 },
  { id: "sun-tint", purpose: "sun", name: "Tinted UV400, no power", description: "Grey or brown tint that blocks 100% of UVA and UVB.", price: 0, needsPrescription: false, sortOrder: 7 },
  { id: "sun-polar", purpose: "sun", name: "Polarised UV400, no power", description: "Cuts reflected glare from roads and water.", price: 1200, needsPrescription: false, sortOrder: 8 },
  { id: "sun-power", purpose: "sun", name: "Tinted UV400 with your power", description: "Sunglasses made to your prescription.", price: 1800, needsPrescription: true, sortOrder: 9 },
  { id: "plain", purpose: "zero-power", name: "Clear lenses, no power", description: "Clear lenses for the look, with an anti-scratch coat.", price: 0, needsPrescription: false, sortOrder: 10 },
];

export const COATINGS = [
  { id: "anti-glare", name: "Anti-glare coating", description: "Fewer reflections at night and on video calls.", price: 400, sortOrder: 1 },
  { id: "blue-anti-glare", name: "Blue-light + anti-glare", description: "Extra screen comfort on top of anti-glare.", price: 700, sortOrder: 2 },
  { id: "hydrophobic", name: "Water and smudge repellent", description: "Easier to clean; rain beads off.", price: 300, sortOrder: 3 },
];

export const OFFERS = [
  {
    id: "auto-frame10", code: null, autoApply: true,
    label: "10% off frames",
    explanation: "It applies to every order, up to ₹500.",
    rules: { kind: "percent", percent: 10, target: "frame", maxDiscount: 500 },
  },
  {
    id: "auto-flat600", code: null, autoApply: true,
    label: "₹600 off orders of ₹3,500+",
    explanation: "It applies when your order is ₹3,500 or more.",
    rules: { kind: "flat", amount: 600, minSubtotal: 3500 },
  },
  {
    id: "auto-screen-coat", code: null, autoApply: true,
    label: "Free coating on computer glasses",
    explanation: "It applies when the lenses are for screen use.",
    rules: { kind: "coating-free", purposes: ["computer"] },
  },
  {
    id: "code-student", code: "STUDENT15", autoApply: false,
    label: "Student: 15% off",
    explanation: "It applies to the whole order, up to ₹1,000.",
    rules: { kind: "percent", percent: 15, target: "all", maxDiscount: 1000 },
  },
  {
    id: "code-welcome", code: "WELCOME200", autoApply: false,
    label: "Welcome: ₹200 off",
    explanation: "It applies to first orders.",
    rules: { kind: "flat", amount: 200 },
  },
];

export const STORES = [
  { id: "blr-jayanagar", name: "Clear Path Jayanagar", city: "Bengaluru", area: "Jayanagar 4th Block", address: "Ground floor, 22 Example Road, Jayanagar 4th Block, Bengaluru 560011", hours: "10:00–21:00, all days", eyeTest: true },
  { id: "blr-indiranagar", name: "Clear Path Indiranagar", city: "Bengaluru", area: "Indiranagar", address: "First floor, 8 Sample Main Road, Indiranagar, Bengaluru 560038", hours: "11:00–21:30, all days", eyeTest: true },
  { id: "mum-bandra", name: "Clear Path Bandra West", city: "Mumbai", area: "Bandra West", address: "Shop 4, Placeholder Lane, Bandra West, Mumbai 400050", hours: "10:30–21:00, all days", eyeTest: true },
  { id: "del-saket", name: "Clear Path Saket", city: "New Delhi", area: "Saket", address: "Unit 12, Demo Mall, Saket, New Delhi 110017", hours: "11:00–22:00, all days", eyeTest: true },
  { id: "che-adyar", name: "Clear Path Adyar", city: "Chennai", area: "Adyar", address: "14 Concept Street, Adyar, Chennai 600020", hours: "10:00–20:30, closed Tuesdays", eyeTest: false },
  { id: "pun-kothrud", name: "Clear Path Kothrud", city: "Pune", area: "Kothrud", address: "3 Mock Avenue, Kothrud, Pune 411038", hours: "10:00–21:00, all days", eyeTest: true },
];
