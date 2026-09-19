import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import type { AuthenticatedRequest } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error-handler";

const router = Router();

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
});

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              inventory: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                inventory: true,
              },
            },
          },
        },
      },
    });
  }

  return cart;
}

router.get("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user!.id);
    res.json({ cart });
  } catch (error) {
    next(error);
  }
});

router.post("/items", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = cartItemSchema.parse(req.body);
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      include: { inventory: true },
    });
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    if (!product.inventory || product.inventory.quantity < body.quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    const cart = await getOrCreateCart(req.user!.id);
    const existing = cart.items.find((item) => item.productId === body.productId);
    const nextQty = (existing?.quantity ?? 0) + body.quantity;
    if (product.inventory.quantity < nextQty) {
      throw new AppError("Insufficient stock", 400);
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: body.productId,
          quantity: body.quantity,
        },
      });
    }

    const updated = await getOrCreateCart(req.user!.id);
    res.status(201).json({ cart: updated });
  } catch (error) {
    next(error);
  }
});

router.patch("/items/:itemId", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const quantity = z.coerce.number().int().min(1).max(99).parse(req.body.quantity);
    const cart = await getOrCreateCart(req.user!.id);
    const item = cart.items.find((i) => i.id === req.params.itemId);
    if (!item) {
      throw new AppError("Cart item not found", 404);
    }
    if (!item.product.inventory || item.product.inventory.quantity < quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    const updated = await getOrCreateCart(req.user!.id);
    res.json({ cart: updated });
  } catch (error) {
    next(error);
  }
});

router.delete("/items/:itemId", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user!.id);
    const item = cart.items.find((i) => i.id === req.params.itemId);
    if (!item) {
      throw new AppError("Cart item not found", 404);
    }

    await prisma.cartItem.delete({ where: { id: item.id } });
    const updated = await getOrCreateCart(req.user!.id);
    res.json({ cart: updated });
  } catch (error) {
    next(error);
  }
});

router.delete("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user!.id);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    const updated = await getOrCreateCart(req.user!.id);
    res.json({ cart: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
