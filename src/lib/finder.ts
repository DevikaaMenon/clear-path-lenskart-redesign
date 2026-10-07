/**
 * Frame Finder: three answers → listing filters (X3).
 * If the strict combination has no frames, filters are relaxed one at a time
 * (fit first, then face shape), and we say which one we relaxed.
 */
import { runCatalogue, type CatalogueQuery, type ProductDTO } from "./catalogue";
import { z } from "zod";

export const FIT_ANSWERS = [
  { id: "tight", label: "They often feel tight", helper: "Pressing at the sides of your head or leaving marks.", band: "wide" },
  { id: "fine", label: "Most fit me fine", helper: "Standard sizes usually sit comfortably.", band: "medium" },
  { id: "loose", label: "They often slide down", helper: "Too wide, or slipping down your nose.", band: "narrow" },
  { id: "unsure", label: "I'm not sure", helper: "We won't filter by size.", band: null },
] as const;

export const FACE_ANSWERS = [
  { id: "round", label: "Round", helper: "Soft jaw, face about as wide as it is long." },
  { id: "oval", label: "Oval", helper: "Slightly longer than wide, gently curved jaw." },
  { id: "square", label: "Square", helper: "Strong, angular jaw and broad forehead." },
  { id: "heart", label: "Heart", helper: "Wider forehead, narrower chin." },
  { id: "long", label: "Long", helper: "Noticeably longer than wide." },
  { id: "unsure", label: "Not sure", helper: "Skip it. Face shape is a suggestion, not a rule." },
] as const;

export const finderSchema = z.object({
  need: z.enum(["prescription", "computer", "reading", "sun"]).nullable(),
  face: z.enum(["round", "oval", "square", "heart", "long", "unsure"]).nullable(),
  fit: z.enum(["tight", "fine", "loose", "unsure"]).nullable(),
  audience: z.enum(["adult", "kids"]).optional(),
});
export type FinderAnswers = z.infer<typeof finderSchema>;

export function recommend(products: ProductDTO[], a: FinderAnswers) {
  const q: CatalogueQuery = { inStock: ["1"] };
  if (a.need) q.need = [a.need];
  if (a.face && a.face !== "unsure") q.face = [a.face];
  const band = FIT_ANSWERS.find((f) => f.id === a.fit)?.band;
  if (band) q.size = [band];
  if (a.audience) q.audience = [a.audience];

  const notes: string[] = [];
  let total = runCatalogue(products, q).total;
  if (total === 0 && q.size) {
    delete q.size;
    total = runCatalogue(products, q).total;
    notes.push("No frames matched your fit exactly, so we've included all sizes. Check “Find my size” on each frame.");
  }
  if (total === 0 && q.face) {
    delete q.face;
    total = runCatalogue(products, q).total;
    notes.push("We've also included frames for all face shapes.");
  }
  return { query: q, total, notes };
}
