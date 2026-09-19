"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types/shop";

export default function AdminProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api<{ products: Product[] }>("/api/admin/products"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">Manage catalog items and stock levels.</p>
      </div>
      {isLoading ? (
        <p>Loading products...</p>
      ) : (
        <div className="space-y-3">
          {data?.products.map((product) => (
            <Card key={product.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{product.name}</p>
                    {product.featured ? <Badge>Featured</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.category.name} · Stock {product.inventory?.quantity ?? 0}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold">{formatCurrency(product.price)}</p>
                  <Link href={`/products/${product.slug}`} className="text-sm text-primary hover:underline">
                    View
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
