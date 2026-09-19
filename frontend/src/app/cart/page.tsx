"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { shopToast } from "@/lib/shop-toast";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Cart } from "@/types/shop";

export default function CartPage() {
  return (
    <RequireAuth>
      <CartContent />
    </RequireAuth>
  );
}

function CartContent() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api<{ cart: Cart }>("/api/cart"),
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api(`/api/cart/items/${itemId}`, { method: "PATCH", json: { quantity } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (error: Error) => shopToast.error(error.message),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => api(`/api/cart/items/${itemId}`, { method: "DELETE" }),
    onSuccess: () => {
      shopToast.removedFromCart();
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => shopToast.error(error.message),
  });

  const cart = data?.cart;
  const subtotal =
    cart?.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    ) ?? 0;
  const shipping = subtotal >= 50000 || subtotal === 0 ? 0 : 99;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Shopping cart</h1>
      {isLoading ? (
        <p>Loading cart...</p>
      ) : !cart || cart.items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Your cart is empty.{" "}
            <Link href="/products" className="font-medium text-primary hover:underline">
              Continue shopping
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {cart.items.map((item) => {
              const image =
                item.product.images.find((img) => img.isPrimary) ?? item.product.images[0];
              return (
                <Card key={item.id}>
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="relative h-24 w-full overflow-hidden rounded-lg bg-muted sm:h-20 sm:w-20">
                      {image ? (
                        <Image
                          src={image.url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <Link href={`/products/${item.product.slug}`} className="font-medium hover:underline">
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.product.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateItem.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })
                        }
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                      >
                        +
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeItem.mutate(item.id)}>
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(subtotal + shipping)}</span>
              </div>
              <Button className="w-full" asChild>
                <Link href="/checkout">Proceed to checkout</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
