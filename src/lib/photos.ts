/**
 * The only three photographs on the site: a product shot in the hero, two portraits (see docs/photo-credits.md).
 * Product cards never use photos: they keep the to-scale frame drawings.
 */
import heroPhoto from "@/assets/photos/hero-crystal-frame-lilac.jpg";
import eyeTestPhoto from "@/assets/photos/portrait-round-gold.jpg";
import featherweightPhoto from "@/assets/photos/portrait-red-rimless.jpg";

export const PHOTOS = {
  hero: {
    src: heroPhoto,
    alt: "Crystal-clear round acetate glasses, folded and leaning against a ribbed glass panel on a lilac background.",
  },
  eyeTest: {
    src: eyeTestPhoto,
    alt: "A smiling young person pushing round gold-wire glasses up onto their forehead, against a blue wall.",
  },
  featherweight: {
    src: featherweightPhoto,
    alt: "A woman with curly hair lowering slim rimless glasses with red-tinted lenses, against a red wall.",
  },
} as const;
