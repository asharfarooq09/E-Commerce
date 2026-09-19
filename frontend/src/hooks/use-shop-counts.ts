"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Cart } from "@/types/shop";

type WishlistResponse = {
  items: Array<{ id: string }>;
};

export function useShopCounts(enabled: boolean) {
  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => api<{ cart: Cart }>("/api/cart"),
    enabled,
    staleTime: 30_000,
  });

  const wishlistQuery = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api<WishlistResponse>("/api/wishlist"),
    enabled,
    staleTime: 30_000,
  });

  const cartCount =
    cartQuery.data?.cart.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const wishlistCount = wishlistQuery.data?.items.length ?? 0;

  return {
    cartCount,
    wishlistCount,
    isLoading: cartQuery.isLoading || wishlistQuery.isLoading,
  };
}
