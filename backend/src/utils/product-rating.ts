import { prisma } from "../lib/prisma";

export async function refreshProductRating(productId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count.rating,
    },
  });
}
