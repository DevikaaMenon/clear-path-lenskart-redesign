import { PrismaClient } from "@prisma/client";
import { buildCatalogue, COATINGS, LENS_OPTIONS, OFFERS, STORES } from "./data/catalogue";

const prisma = new PrismaClient();

async function main() {
  // Idempotent: clear dependent tables first, then reinsert reference data.
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.eyeTestBooking.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.product.deleteMany();
  await prisma.lensOption.deleteMany();
  await prisma.coating.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.storeLocation.deleteMany();

  const products = buildCatalogue();
  for (const p of products) {
    await prisma.product.create({
      data: {
        id: p.id,
        canonicalName: p.name,
        slug: p.slug,
        modelCode: p.modelCode,
        shape: p.shape,
        frameType: p.frameType,
        material: p.material,
        weightG: p.weightG,
        lensWidthMm: p.lensWidthMm,
        bridgeMm: p.bridgeMm,
        templeMm: p.templeMm,
        sizeBand: p.sizeBand,
        audience: p.audience,
        brand: p.brand,
        collection: p.collection,
        colours: JSON.stringify(p.colours),
        basePrice: p.basePrice,
        tags: JSON.stringify(p.tags),
        needs: JSON.stringify(p.needs),
        faceShapes: JSON.stringify(p.faceShapes),
        description: p.description,
        popularity: p.popularity,
        createdAt: new Date(p.createdAt),
        sizes: { create: p.sizes },
      },
    });
  }
  for (const l of LENS_OPTIONS) await prisma.lensOption.create({ data: l });
  for (const c of COATINGS) await prisma.coating.create({ data: c });
  for (const o of OFFERS) await prisma.offer.create({ data: { ...o, rules: JSON.stringify(o.rules) } });
  for (const s of STORES) await prisma.storeLocation.create({ data: s });

  console.log(`Seeded ${products.length} products, ${LENS_OPTIONS.length} lens options, ${COATINGS.length} coatings, ${OFFERS.length} offers, ${STORES.length} stores.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
