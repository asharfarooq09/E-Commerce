import "dotenv/config";
import bcrypt from "bcryptjs";
import { Role } from "../generated/prisma/client";
import { seedCategories, seedProducts } from "./seed-data";
import { prisma } from "../src/lib/prisma";
import { slugify } from "../src/utils/slug";

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("Admin123!@#", 12);
  const customerPassword = await bcrypt.hash("Customer123!", 12);

  const admin = await prisma.user.create({
    data: {
      name: "ShopAI Admin",
      email: "admin@shopai.local",
      password: adminPassword,
      role: Role.ADMIN,
      cart: { create: {} },
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: "Demo Customer",
      email: "customer@shopai.local",
      password: customerPassword,
      role: Role.CUSTOMER,
      cart: { create: {} },
    },
  });

  const categoryMap = new Map<string, string>();
  for (const category of seedCategories) {
    const created = await prisma.category.create({
      data: {
        name: category.name,
        slug: slugify(category.name),
        description: category.description,
        imageUrl: category.imageUrl,
      },
    });
    categoryMap.set(category.name, created.id);
  }

  for (const item of seedProducts) {
    const categoryId = categoryMap.get(item.category);
    if (!categoryId) continue;

    await prisma.product.create({
      data: {
        name: item.name,
        slug: slugify(item.name),
        description: item.description,
        price: item.price,
        brand: item.brand,
        categoryId,
        featured: item.featured ?? false,
        rating: item.rating ?? 0,
        reviewCount: item.reviewCount ?? 0,
        attributes: item.attributes,
        images: {
          create: {
            url: item.imageUrl,
            alt: item.name,
            isPrimary: true,
            sortOrder: 0,
          },
        },
        inventory: {
          create: {
            quantity: item.stock,
            lowStockThreshold: 5,
          },
        },
      },
    });
  }

  const sampleProduct = await prisma.product.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (sampleProduct) {
    await prisma.review.create({
      data: {
        userId: customer.id,
        productId: sampleProduct.id,
        rating: 5,
        title: "Excellent for daily development",
        body: "Battery life is strong, the keyboard is comfortable, and performance has been smooth for React, Node, and Docker workloads.",
      },
    });
  }

  console.log(`Seed complete: ${seedProducts.length} products across ${seedCategories.length} categories.`);
  console.log(`Admin login: ${admin.email} / Admin123!@#`);
  console.log(`Customer login: ${customer.email} / Customer123!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
