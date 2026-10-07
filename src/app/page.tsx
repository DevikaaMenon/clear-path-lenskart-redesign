import Link from "next/link";
import { cookies } from "next/headers";
import { HomeHero } from "@/components/home/HomeHero";
import { ShapeStrip } from "@/components/home/ShapeStrip";
import { PopularFrames } from "@/components/home/PopularFrames";
import { TrustStrip } from "@/components/ui/TrustStrip";
import { ButtonLink } from "@/components/ui/Button";
import { FrameIllustration } from "@/components/frames/FrameIllustration";
import { allProducts, activeOffers, lensCatalogue } from "@/lib/server/repo";
import { toCard } from "@/lib/server/catalogue-service";
import { sortProducts } from "@/lib/catalogue";
import { NEED_IDS, needToPurpose } from "@/lib/taxonomy";

export default async function Home() {
  const jar = await cookies();
  const c = jar.get("cp_need")?.value ?? null;
  const need = c && (NEED_IDS as string[]).includes(c) && c !== "contacts" ? c : null;

  const [products, offers, { lenses }] = await Promise.all([allProducts(), activeOffers(), lensCatalogue()]);
  const pool = need ? products.filter((p) => p.needs.includes(need)) : products;
  const popular = sortProducts(pool.filter((p) => p.sizes.some((s) => s.stock > 0)), "popular").slice(0, 4).map(toCard);
  const shapeCounts: Record<string, number> = {};
  for (const p of pool) shapeCounts[p.shape] = (shapeCounts[p.shape] ?? 0) + 1;

  const frameOffer = offers.find((o) => o.autoApply && !o.code && o.rules.kind === "percent" && o.rules.target === "frame");
  const offerTag = frameOffer ? `${frameOffer.rules.percent}% off frame` : null;
  const purpose = needToPurpose(need);
  const lensFrom = purpose ? Math.min(...lenses.filter((l) => l.purpose === purpose).map((l) => l.price)) : null;

  const feather = products.filter((p) => p.collection === "Featherweight").sort((a, b) => a.weightG - b.weightG);
  const hero = feather[0];

  return (
    <>
      <HomeHero />

      <section aria-label="Our promises" className="page mt-16">
        <TrustStrip />
      </section>

      <ShapeStrip counts={shapeCounts} need={need} />

      <PopularFrames items={popular} need={need} total={pool.length} offerTag={offerTag} lensFrom={lensFrom} />

      {/* One campaign slot only (U2), with a descriptive call to action */}
      {hero ? (
        <section aria-labelledby="campaign-title" className="page mt-24">
          <div className="grid-page items-center gap-y-8 border border-ink bg-surface p-6 md:p-10">
            <div className="col-span-4 md:col-span-4 xl:col-span-5">
              <p className="eyebrow">Collection · Featherweight</p>
              <h2 id="campaign-title" className="mt-3 font-display text-4xl">
                Frames that weigh less than <span className="num whitespace-nowrap text-accent">12 g</span>
              </h2>
              <p className="mt-4 max-w-[46ch] text-muted">
                Titanium and rimless frames for long days. The lightest, {hero.name}, weighs {hero.weightG} grams, about the same as three coins.
              </p>
              <ButtonLink href="/shop?collection=Featherweight" variant="secondary" iconRight="arrow-right" className="mt-6">
                Shop the Featherweight collection
              </ButtonLink>
            </div>
            <div className="col-span-4 md:col-span-4 xl:col-span-7">
              <div className="relative border-t border-line pt-6">
                <FrameIllustration frame={hero} colour={hero.colours[0]} title={`Front view of ${hero.name}, a ${hero.colours[0].name.toLowerCase()} rimless titanium frame`} className="w-full" />
                <div className="mt-2 flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-ink" />
                  <span className="num text-sm">{hero.lensWidthMm}□{hero.bridgeMm} · {hero.templeMm} · {hero.weightG} g</span>
                  <span className="h-px flex-1 bg-ink" />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Eye test module */}
      <section aria-labelledby="eyetest-title" className="theme-ink mt-24">
        <div className="page grid-page items-end gap-y-8 py-16 md:py-24">
          <div className="col-span-4 md:col-span-5 xl:col-span-7">
            <p className="eyebrow">Free at every store with an optometrist</p>
            <h2 id="eyetest-title" className="mt-3 font-display text-5xl">
              Don&apos;t know your power? <em className="text-accent">Get it checked free.</em>
            </h2>
          </div>
          <div className="col-span-4 md:col-span-3 xl:col-span-4 xl:col-start-9">
            <p className="text-muted">A 20-minute eye test by a qualified optometrist. No purchase needed. You can also order now and add your prescription later.</p>
            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href="/stores" variant="accent" iconRight="arrow-right">Book a free eye test</ButtonLink>
              <Link href="/stores#store-list" className="link inline-flex min-h-[44px] items-center">Find a store near you</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
