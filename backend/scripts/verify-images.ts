import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const imgs = await prisma.productImage.findMany({
    select: { url: true, product: { select: { name: true, slug: true } } },
  });
  const unsplash = imgs.filter((i) => i.url.includes("unsplash"));
  const picsum = imgs.filter((i) => i.url.includes("picsum"));
  const local = imgs.filter((i) => i.url.startsWith("/"));
  console.log(
    JSON.stringify(
      {
        total: imgs.length,
        unsplash: unsplash.length,
        picsum: picsum.length,
        local: local.length,
        sample: imgs.slice(0, 3),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
