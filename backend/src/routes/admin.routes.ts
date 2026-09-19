import { Router } from "express";
import { z } from "zod";
import { OrderStatus, Prisma, Role } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import type { AuthenticatedRequest } from "../middleware/auth";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error-handler";
import { pathParam } from "../utils/params";
import { slugify } from "../utils/slug";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/dashboard", async (_req, res, next) => {
  try {
    const [productCount, orderCount, customerCount, revenueAgg, lowStock] =
      await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.user.count({ where: { role: Role.CUSTOMER } }),
        prisma.order.aggregate({ _sum: { total: true } }),
        prisma.inventory.findMany({
          take: 50,
          include: { product: { select: { id: true, name: true, slug: true } } },
        }).then((rows) =>
          rows
            .filter((row) => row.quantity <= row.lowStockThreshold)
            .slice(0, 10),
        ),
      ]);

    res.json({
      stats: {
        productCount,
        orderCount,
        customerCount,
        revenue: revenueAgg._sum.total ?? 0,
      },
      lowStock,
    });
  } catch (error) {
    next(error);
  }
});

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  brand: z.string().optional(),
  categoryId: z.string().min(1),
  featured: z.boolean().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  imageUrl: z.string().url().optional(),
  stock: z.coerce.number().int().min(0).optional().default(0),
});

router.get("/products", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        inventory: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
    });
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    const body = productSchema.parse(req.body);
    const baseSlug = slugify(body.name);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        price: body.price,
        brand: body.brand,
        categoryId: body.categoryId,
        featured: body.featured ?? false,
        attributes: body.attributes as Prisma.InputJsonValue | undefined,
        images: body.imageUrl
          ? {
              create: {
                url: body.imageUrl,
                alt: body.name,
                isPrimary: true,
                sortOrder: 0,
              },
            }
          : undefined,
        inventory: {
          create: { quantity: body.stock },
        },
      },
      include: { category: true, inventory: true, images: true },
    });

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

router.patch("/products/:id", async (req, res, next) => {
  try {
    const body = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id: pathParam(req.params.id, "id") },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        brand: body.brand,
        categoryId: body.categoryId,
        featured: body.featured,
        attributes: body.attributes as Prisma.InputJsonValue | undefined,
      },
      include: { category: true, inventory: true, images: true },
    });

    if (body.stock !== undefined) {
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: { quantity: body.stock },
        create: { productId: product.id, quantity: body.stock },
      });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: pathParam(req.params.id, "id") } });
    res.json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
});

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

router.post("/categories", async (req, res, next) => {
  try {
    const body = categorySchema.parse(req.body);
    const slug = slugify(body.name);
    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        imageUrl: body.imageUrl,
      },
    });
    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
});

router.get("/orders", async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const status = z.nativeEnum(OrderStatus).parse(req.body.status);
    const order = await prisma.order.update({
      where: { id: pathParam(req.params.id, "id") },
      data: { status },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

router.get("/customers", async (_req, res, next) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    res.json({ customers });
  } catch (error) {
    next(error);
  }
});

router.get("/inventory", async (_req, res, next) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { product: { select: { id: true, name: true, slug: true, brand: true } } },
      orderBy: { quantity: "asc" },
    });
    res.json({ inventory });
  } catch (error) {
    next(error);
  }
});

router.patch("/inventory/:productId", async (req, res, next) => {
  try {
    const quantity = z.coerce.number().int().min(0).parse(req.body.quantity);
    const product = await prisma.product.findUnique({
      where: { id: pathParam(req.params.productId, "productId") },
    });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const inventory = await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { quantity },
      create: { productId: product.id, quantity },
    });
    res.json({ inventory });
  } catch (error) {
    next(error);
  }
});

export default router;
