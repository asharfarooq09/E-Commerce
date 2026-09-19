import { Router } from "express";
import { z } from "zod";
import { OrderStatus } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import type { AuthenticatedRequest } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error-handler";
import { pathParam } from "../utils/params";

const router = Router();

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().min(2),
});

const checkoutSchema = z.object({
  shippingAddress: addressSchema,
});

function generateOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `SA-${stamp}-${random}`;
}

router.get("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: pathParam(req.params.id, "id"), userId: req.user!.id },
      include: { items: true },
    });
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

router.post("/checkout", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = checkoutSchema.parse(req.body);
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: {
            product: { include: { inventory: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError("Your cart is empty", 400);
    }

    for (const item of cart.items) {
      if (!item.product.inventory || item.product.inventory.quantity < item.quantity) {
        throw new AppError(`Insufficient stock for ${item.product.name}`, 400);
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );
    const shipping = subtotal >= 50000 ? 0 : 99;
    const total = subtotal + shipping;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: req.user!.id,
          status: OrderStatus.PENDING,
          subtotal,
          shipping,
          total,
          shippingAddress: body.shippingAddress,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
              name: item.product.name,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of cart.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
});

export default router;
