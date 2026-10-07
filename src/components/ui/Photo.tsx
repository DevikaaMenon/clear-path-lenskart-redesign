import Image, { type StaticImageData } from "next/image";

/**
 * Photograph of people, used sparingly (hero, eye test, one collection tile).
 * One crop (4:5) and the same square corners and border as product cards.
 * Never used as a background: text and buttons always sit beside it.
 * Sources and licences: docs/photo-credits.md.
 */
export function Photo({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  src: StaticImageData;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[4/5] overflow-hidden border border-line bg-sunk ${className}`}>
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        quality={70}
        className="h-full w-full object-cover"
        fill
      />
    </div>
  );
}
