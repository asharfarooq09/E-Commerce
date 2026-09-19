import type { Prisma } from "../../generated/prisma/client";

export const productListInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
  inventory: { select: { quantity: true } },
} satisfies Prisma.ProductInclude;

export const productListOrder = [
  { featured: "desc" as const },
  { rating: "desc" as const },
  { createdAt: "desc" as const },
];
