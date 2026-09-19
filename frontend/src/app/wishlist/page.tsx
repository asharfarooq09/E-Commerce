"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shopToast } from "@/lib/shop-toast";
import { RequireAuth } from "@/components/auth/require-auth";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Product } from "@/types/shop";

type WishlistResponse = {
  items: Array<{ id: string; product: Product }>;
};

export default function WishlistPage() {
  return (
    <RequireAuth>
      <WishlistContent />
    </RequireAuth>
  );
}

function WishlistContent() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api<WishlistResponse>("/api/wishlist"),
  });

  const removeItem = useMutation({
    mutationFn: (productId: string) => api(`/api/wishlist/${productId}`, { method: "DELETE" }),
    onSuccess: () => {
      shopToast.removedFromWishlist();
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const products = data?.items.map((item) => item.product) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wishlist</h1>
          <p className="text-muted-foreground">Products you saved for later.</p>
        </div>
      </div>
      <ProductGrid products={products} loading={isLoading} />
      {products.length > 0 ? (
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => {
              products.forEach((product) => removeItem.mutate(product.id));
            }}
          >
            Clear wishlist
          </Button>
        </div>
      ) : null}
    </div>
  );
}
