import type { Metadata } from "next";
import { DesignSystemBoard } from "@/components/design-system/Board";
import { activeOffers, productBySlug } from "@/lib/server/repo";
import { toCard } from "@/lib/server/catalogue-service";

export const metadata: Metadata = { title: "Design system" };

export default async function DesignSystemPage() {
  const [p, offers] = await Promise.all([productBySlug("mira-cat-eye"), activeOffers()]);
  return <DesignSystemBoard sample={toCard(p!)} offers={offers} />;
}
