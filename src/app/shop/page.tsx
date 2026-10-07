import type { Metadata } from "next";
import { ListingView } from "@/components/catalogue/ListingView";
import { searchCatalogue } from "@/lib/server/catalogue-service";
import { activeOffers, lensCatalogue } from "@/lib/server/repo";
import { NEEDS, needById } from "@/lib/taxonomy";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const need = needById(typeof sp.need === "string" ? sp.need : undefined);
  return { title: need ? need.label : "All frames" };
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [initial, offers, { lenses }] = await Promise.all([searchCatalogue(sp), activeOffers(), lensCatalogue()]);

  // One short offer tag for cards (U4): the automatic frame offer, if there is one.
  const frameOffer = offers.find((o) => o.autoApply && !o.code && o.rules.kind === "percent" && o.rules.target === "frame");
  const offerTag = frameOffer ? `${frameOffer.rules.percent}% off frame` : null;

  // Cheapest lens per need so cards never under-state the cost.
  const lensFromByNeed: Record<string, number> = {};
  for (const n of NEEDS) {
    if (!n.lensPurpose) continue;
    const prices = lenses.filter((l) => l.purpose === n.lensPurpose).map((l) => l.price);
    if (prices.length) lensFromByNeed[n.id] = Math.min(...prices);
  }

  return <ListingView initial={initial} offerTag={offerTag} lensFromByNeed={lensFromByNeed} />;
}
