import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import type { AuthenticatedRequest } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error-handler";
import { pathParam } from "../utils/params";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            category: { select: { name: true, slug: true } },
            images: { where: { isPrimary: true }, take: 1 },
            inventory: { select: { quantity: true } },
          },
        },
      },
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const productId = z.string().min(1).parse(req.body.productId);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    await prisma.wishlistItem.upsert({
      where: {
        userId_productId: { userId: req.user!.id, productId },
      },
      update: {},
      create: { userId: req.user!.id, productId },
    });

    res.status(201).json({ message: "Added to wishlist" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:productId", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.wishlistItem.deleteMany({
      where: {
        userId: req.user!.id,
        productId: pathParam(req.params.productId, "productId"),
      },
    });
    res.json({ message: "Removed from wishlist" });
  } catch (error) {
    next(error);
  }
});

export default router;
