import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/app/products/[slug]/product-detail-client";
import { serverApi } from "@/lib/server-api";
import type { ProductDetail } from "@/types/shop";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  try {
    const data = await serverApi<{ product: ProductDetail }>(`/api/products/${slug}`, {
      cache: "no-store",
    });
    return <ProductDetailClient product={data.product} />;
  } catch {
    notFound();
  }
}
