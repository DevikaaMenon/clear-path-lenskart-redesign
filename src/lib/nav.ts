import type { IconName } from "@/components/ui/Icon";
import { NEEDS } from "./taxonomy";

export const NEED_ICON: Record<string, IconName> = {
  prescription: "glasses", computer: "screen", reading: "book", sun: "sun", contacts: "contact", kids: "kid",
};

export const needHref = (id: string) =>
  id === "contacts" ? "/contact-lenses" : id === "kids" ? "/shop?audience=kids" : `/shop?need=${id}`;

/** One-line versions of the helpers, for the Home page cards (easier to scan). */
const TAGLINES: Record<string, string> = {
  prescription: "Made to your eye power.",
  computer: "Filter blue light from screens.",
  reading: "For close-up reading.",
  sun: "UV protection, with or without power.",
  contacts: "Daily or monthly lenses.",
  kids: "Light frames for ages 5–12.",
};

/** Shop-by-need entries: the five needs plus Kids (X1: named by need, with helper text). */
export const NEED_MENU = [
  ...NEEDS.map((n) => ({ id: n.id as string, label: n.label, helper: n.helper, tagline: TAGLINES[n.id] })),
  { id: "kids", label: "Kids' glasses", helper: "Flexible, light frames for ages 5–12.", tagline: TAGLINES.kids },
];
