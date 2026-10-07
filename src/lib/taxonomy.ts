/**
 * Plain-language taxonomy. One source for navigation labels, filter labels,
 * finder answers and product-page options (X1, X2, U3, X6, X13).
 */

export const NEEDS = [
  {
    id: "prescription",
    label: "Prescription glasses",
    short: "Prescription",
    helper: "To see clearly, made to your eye power.",
    lensPurpose: "prescription",
  },
  {
    id: "computer",
    label: "Computer glasses",
    short: "Computer",
    helper: "Filter blue light from screens. With or without power.",
    lensPurpose: "computer",
  },
  {
    id: "reading",
    label: "Reading glasses",
    short: "Reading",
    helper: "For close-up reading. Choose a reading power from +0.75 to +3.50.",
    lensPurpose: "reading",
  },
  {
    id: "sun",
    label: "Sunglasses",
    short: "Sun",
    helper: "UV protection. Available with or without your power.",
    lensPurpose: "sun",
  },
  {
    id: "contacts",
    label: "Contact lenses",
    short: "Contacts",
    helper: "Daily or monthly lenses. Needs a contact lens prescription.",
    lensPurpose: null,
  },
] as const;

export type NeedId = (typeof NEEDS)[number]["id"];
export const NEED_IDS = NEEDS.map((n) => n.id) as NeedId[];
export const needById = (id: string | null | undefined) => NEEDS.find((n) => n.id === id);

/** Lens purposes on the product page: "What are the lenses for?" (X6) */
export const PURPOSES = [
  { id: "prescription", label: "To see clearly", helper: "Single vision or progressive lenses made to your prescription." },
  { id: "computer", label: "Screen use", helper: "Blue-light filtering lenses, with or without power." },
  { id: "reading", label: "Reading only", helper: "Magnifying lenses for close-up work. Pick a reading power." },
  { id: "sun", label: "Sun protection", helper: "Tinted UV400 lenses, with or without power." },
  { id: "zero-power", label: "Style only (no power)", helper: "Clear lenses with no power, for the look." },
] as const;
export type PurposeIdT = (typeof PURPOSES)[number]["id"];

/** Map a shopping need to the default lens purpose carried to the product page. */
export const needToPurpose = (need: string | null | undefined): PurposeIdT | null => {
  const n = needById(need);
  return (n?.lensPurpose as PurposeIdT | null) ?? null;
};

export const SHAPES = [
  { id: "round", label: "Round", helper: "Circular lenses. Softens angular faces." },
  { id: "oval", label: "Oval", helper: "Gently rounded and wider than tall." },
  { id: "rectangle", label: "Rectangle", helper: "Wider than tall with defined corners." },
  { id: "square", label: "Square", helper: "Equal height and width, bold corners." },
  { id: "cat-eye", label: "Cat-eye", helper: "Upswept outer corners." },
  { id: "aviator", label: "Aviator", helper: "Teardrop lenses, usually metal." },
  { id: "wayfarer", label: "Wayfarer", helper: "Trapezoid shape, wider at the top." },
  { id: "geometric", label: "Geometric", helper: "Hexagonal and angular lens shapes." },
] as const;
export type ShapeId = (typeof SHAPES)[number]["id"];

export const FRAME_TYPES = [
  { id: "full-rim", label: "Full rim", helper: "The frame goes all the way round the lens." },
  { id: "half-rim", label: "Half rim", helper: "Frame on top only; lighter look." },
  { id: "rimless", label: "Rimless", helper: "No frame around the lens; lightest look." },
] as const;

export const MATERIALS = [
  { id: "acetate", label: "Acetate", helper: "Plant-based plastic. Rich colours, slightly heavier." },
  { id: "metal", label: "Metal", helper: "Thin and adjustable, with nose pads." },
  { id: "titanium", label: "Titanium", helper: "Very light and strong. Good for all-day wear." },
  { id: "tr90", label: "Flexible plastic (TR90)", helper: "Bends without breaking. Good for kids and sport." },
] as const;

export const SIZE_BANDS = [
  { id: "narrow", label: "Narrow", helper: "Total width under 132 mm. Often suits smaller faces." },
  { id: "medium", label: "Medium", helper: "Total width 132–140 mm. Fits most adults." },
  { id: "wide", label: "Wide", helper: "Total width over 140 mm. Often suits broader faces." },
] as const;

export const FACE_SHAPES = [
  { id: "round", label: "Round face" },
  { id: "oval", label: "Oval face" },
  { id: "square", label: "Square face" },
  { id: "heart", label: "Heart-shaped face" },
  { id: "long", label: "Long face" },
] as const;

export const PRICE_BANDS = [
  { id: "under-1500", label: "Under ₹1,500", min: 0, max: 1499 },
  { id: "1500-2500", label: "₹1,500 – ₹2,499", min: 1500, max: 2499 },
  { id: "2500-4000", label: "₹2,500 – ₹3,999", min: 2500, max: 3999 },
  { id: "4000-plus", label: "₹4,000 and above", min: 4000, max: Infinity },
] as const;

export const COLOUR_FAMILIES = [
  { id: "black", label: "Black" },
  { id: "tortoise", label: "Tortoise" },
  { id: "clear", label: "Clear / crystal" },
  { id: "gold", label: "Gold" },
  { id: "silver", label: "Silver / gunmetal" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "red", label: "Red / pink" },
  { id: "brown", label: "Brown / honey" },
] as const;

export const AUDIENCES = [
  { id: "adult", label: "Adults" },
  { id: "kids", label: "Kids (5–12 years)" },
] as const;

export const SORTS = [
  { id: "popular", label: "Most popular" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "lightest", label: "Lightest first" },
  { id: "newest", label: "Newest" },
] as const;
export type SortId = (typeof SORTS)[number]["id"];

/**
 * Filters, grouped (X13) with plain-language labels and helpers (U3).
 * Keys are URL query parameter names.
 */
export type FilterKey =
  | "need" | "price" | "size" | "shape"
  | "frameType" | "material" | "colour" | "face" | "light"
  | "brand" | "collection"
  | "audience" | "inStock";

export interface FilterDef {
  key: FilterKey;
  label: string;
  /** Short label used on active-filter chips ("Shape: Round"). */
  chip: string;
  helper?: string;
  kind: "multi" | "toggle";
  options?: readonly { id: string; label: string; helper?: string }[];
}

export interface FilterGroup {
  id: "essentials" | "fit-style" | "brand-collection" | "more";
  label: string;
  filters: FilterDef[];
}

export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "essentials",
    label: "Essentials",
    filters: [
      { key: "need", chip: "For", label: "What are they for?", kind: "multi", options: NEEDS.filter((n) => n.id !== "contacts").map((n) => ({ id: n.id, label: n.short, helper: n.helper })) },
      { key: "price", chip: "Price", label: "Frame price", helper: "Frame only. Lenses are priced on the product page.", kind: "multi", options: PRICE_BANDS },
      { key: "size", chip: "Size", label: "Frame size", helper: "Not sure? Use “Find my size” on any product.", kind: "multi", options: SIZE_BANDS },
      { key: "shape", chip: "Shape", label: "Frame shape", kind: "multi", options: SHAPES },
    ],
  },
  {
    id: "fit-style",
    label: "Fit & style",
    filters: [
      { key: "frameType", chip: "Rim", label: "Rim style", kind: "multi", options: FRAME_TYPES },
      { key: "material", chip: "Material", label: "Material", kind: "multi", options: MATERIALS },
      { key: "colour", chip: "Colour", label: "Colour", kind: "multi", options: COLOUR_FAMILIES },
      { key: "face", chip: "Suits", label: "Suits face shape", helper: "A styling suggestion, not a rule.", kind: "multi", options: FACE_SHAPES },
      { key: "light", chip: "Weight", label: "Lightweight (under 15 g)", helper: "Comfortable for all-day wear.", kind: "toggle" },
    ],
  },
  {
    id: "brand-collection",
    label: "Brand & collection",
    filters: [
      { key: "brand", chip: "Brand", label: "Brand", kind: "multi", options: [] },
      { key: "collection", chip: "Collection", label: "Collection", kind: "multi", options: [] },
    ],
  },
  {
    id: "more",
    label: "More",
    filters: [
      { key: "audience", chip: "Who", label: "Who is it for?", kind: "multi", options: AUDIENCES },
      { key: "inStock", chip: "Stock", label: "In stock only", helper: "Hide frames where no size is available today.", kind: "toggle" },
    ],
  },
];

export const ALL_FILTERS: FilterDef[] = FILTER_GROUPS.flatMap((g) => g.filters);
export const filterByKey = (key: string) => ALL_FILTERS.find((f) => f.key === key);
export const MULTI_KEYS = ALL_FILTERS.filter((f) => f.kind === "multi").map((f) => f.key);
export const TOGGLE_KEYS = ALL_FILTERS.filter((f) => f.kind === "toggle").map((f) => f.key);
