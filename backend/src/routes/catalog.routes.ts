import { Router } from "express";
import { prisma } from "../lib/prisma";
import { productListInclude, productListOrder } from "../lib/product-select";

const router = Router();

const PRODUCTS_PER_CATEGORY = 8;

router.get("/home", async (_req, res, next) => {
  try {
    const [featured, categories] = await Promise.all([
      prisma.product.findMany({
        where: { featured: true },
        include: productListInclude,
        orderBy: productListOrder,
        take: 8,
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: { select: { products: true } },
          products: {
            include: productListInclude,
            orderBy: productListOrder,
            take: PRODUCTS_PER_CATEGORY,
          },
        },
      }),
    ]);

    res.json({
      featured,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        productCount: category._count.products,
        products: category.products,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
