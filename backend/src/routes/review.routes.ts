import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import type { AuthenticatedRequest } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error-handler";
import { refreshProductRating } from "../utils/product-rating";
import { pathParam } from "../utils/params";

const router = Router();

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
});

router.get("/product/:productId", async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: pathParam(req.params.productId, "productId") },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = reviewSchema.parse(req.body);
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
    });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: req.user!.id,
          productId: body.productId,
        },
      },
      update: {
        rating: body.rating,
        title: body.title,
        body: body.body,
      },
      create: {
        userId: req.user!.id,
        productId: body.productId,
        rating: body.rating,
        title: body.title,
        body: body.body,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    await refreshProductRating(body.productId);
    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
});

export default router;
