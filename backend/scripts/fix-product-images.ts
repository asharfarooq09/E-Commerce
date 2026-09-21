import "dotenv/config";
import {
  categoryCatalogImage,
  productCatalogImage,
  seedProducts,
} from "../prisma/seed-data";
import { prisma } from "../src/lib/prisma";
import { slugify } from "../src/utils/slug";

async function main() {
  const urlBySlug = new Map<string, string>();
  const categoryIndex = new Map<string, number>();
  for (const item of seedProducts) {
    const index = categoryIndex.get(item.category) ?? 0;
    categoryIndex.set(item.category, index + 1);
    urlBySlug.set(slugify(item.name), productCatalogImage(item.category, index));
  }

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { name: true } },
      images: { select: { id: true } },
    },
  });

  let updated = 0;
  for (const product of products) {
    const url =
      urlBySlug.get(product.slug) ??
      productCatalogImage(product.category.name, updated % 8);

    if (product.images.length === 0) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url,
          alt: product.name,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    } else {
      await prisma.productImage.updateMany({
        where: { productId: product.id },
        data: { url, alt: product.name },
      });
    }
    updated += 1;
  }

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  for (const category of categories) {
    await prisma.category.update({
      where: { id: category.id },
      data: { imageUrl: categoryCatalogImage(category.name) },
    });
  }

  const imgs = await prisma.productImage.findMany({ select: { url: true } });
  const unsplash = imgs.filter((i) => i.url.includes("unsplash"));
  const local = imgs.filter((i) => i.url.startsWith("/"));
  console.log(
    JSON.stringify(
      {
        productsUpdated: updated,
        categoriesUpdated: categories.length,
        imageRows: imgs.length,
        unsplash: unsplash.length,
        local: local.length,
        sampleUrls: imgs.slice(0, 5).map((i) => i.url),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
