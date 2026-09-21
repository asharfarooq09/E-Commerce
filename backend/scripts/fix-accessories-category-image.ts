import "dotenv/config";
import { categoryCatalogImage } from "../prisma/seed-data";
import { prisma } from "../src/lib/prisma";

async function main() {
  const accessories = await prisma.category.findFirst({
    where: { OR: [{ name: "Accessories" }, { slug: "accessories" }] },
  });
  if (!accessories) {
    throw new Error("Accessories category not found");
  }

  const imageUrl = categoryCatalogImage("Accessories");
  await prisma.category.update({
    where: { id: accessories.id },
    data: { imageUrl },
  });

  console.log(JSON.stringify({ id: accessories.id, imageUrl }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
