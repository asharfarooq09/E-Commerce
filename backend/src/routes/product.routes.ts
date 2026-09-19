import { Prisma } from "../generated/prisma/client";
import { Router } from "express";
import { z } from "zod";
import { productListInclude } from "../lib/product-select";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error-handler";
import { pathParam } from "../utils/params";

const router = Router();

const listQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sort: z
    .enum(["price_asc", "price_desc", "rating", "newest", "name"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(48).optional().default(12),
});

function buildOrderBy(
  sort: string,
): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "rating":
      return [{ rating: "desc" }, { reviewCount: "desc" }];
    case "name":
      return { name: "asc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

router.get("/", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const where: Prisma.ProductWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { brand: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.brand) {
      where.brand = { equals: query.brand, mode: "insensitive" };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }

    if (query.minRating !== undefined) {
      where.rating = { gte: query.minRating };
    }

    if (query.featured !== undefined) {
      where.featured = query.featured;
    }

    const skip = (query.page - 1) * query.limit;

    const [products, total, brands] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productListInclude,
        orderBy: buildOrderBy(query.sort),
        skip,
        take: query.limit,
      }),
      prisma.product.count({ where }),
      prisma.product.findMany({
        where: query.category ? { category: { slug: query.category } } : undefined,
        distinct: ["brand"],
        select: { brand: true },
        orderBy: { brand: "asc" },
      }),
    ]);

    res.json({
      products,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      filters: {
        brands: brands.map((b) => b.brand).filter(Boolean),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/brands", async (_req, res, next) => {
  try {
    const brands = await prisma.product.findMany({
      distinct: ["brand"],
      select: { brand: true },
      where: { brand: { not: null } },
      orderBy: { brand: "asc" },
    });
    res.json({
      brands: brands.map((b) => b.brand).filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: pathParam(req.params.slug, "slug") },
      include: {
        ...productListInclude,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

export default router;
