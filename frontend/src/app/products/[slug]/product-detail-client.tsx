"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { shopToast } from "@/lib/shop-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ProductDetail } from "@/types/shop";

type ProductDetailClientProps = {
  product: ProductDetail;
};

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];
  const inStock = (product.inventory?.quantity ?? 0) > 0;

  const addToCart = useMutation({
    mutationFn: () =>
      api("/api/cart/items", {
        method: "POST",
        json: { productId: product.id, quantity: 1 },
      }),
    onSuccess: () => {
      shopToast.addedToCart(product.name);
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => shopToast.error(error.message),
  });

  const addToWishlist = useMutation({
    mutationFn: () =>
      api("/api/wishlist", {
        method: "POST",
        json: { productId: product.id },
      }),
    onSuccess: () => {
      shopToast.addedToWishlist(product.name);
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error: Error) => shopToast.error(error.message),
  });

  const submitReview = useMutation({
    mutationFn: () =>
      api("/api/reviews", {
        method: "POST",
        json: {
          productId: product.id,
          rating: reviewRating,
          title: reviewTitle,
          body: reviewBody,
        },
      }),
    onSuccess: () => {
      shopToast.reviewSubmitted();
      setReviewTitle("");
      setReviewBody("");
    },
    onError: (error: Error) => shopToast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt ?? product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              {product.category.name} · {product.brand}
            </p>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span>({product.reviewCount} reviews)</span>
            </div>
          </div>

          <p className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</p>
          <p className="text-muted-foreground">{product.description}</p>

          {product.attributes ? (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 text-sm">
              {Object.entries(product.attributes).map(([key, value]) => (
                <div key={key}>
                  <p className="text-muted-foreground capitalize">{key}</p>
                  <p className="font-medium">{String(value)}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {user ? (
              <>
                <Button
                  size="lg"
                  disabled={!inStock || addToCart.isPending}
                  onClick={() => addToCart.mutate()}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {inStock ? "Add to cart" : "Out of stock"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  disabled={addToWishlist.isPending}
                  onClick={() => addToWishlist.mutate()}
                >
                  <Heart className="h-4 w-4" />
                  Wishlist
                </Button>
              </>
            ) : (
              <Button size="lg" asChild>
                <Link href="/login">Login to purchase</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Customer reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              product.reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{review.user.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-amber-500">{"★".repeat(review.rating)}</p>
                  {review.title ? <p className="mt-1 font-medium">{review.title}</p> : null}
                  <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Write a review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <>
              <select
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} stars
                  </option>
                ))}
              </select>
              <input
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                placeholder="Review title"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
              />
              <Textarea
                placeholder="Share your experience with this product..."
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={submitReview.isPending || reviewBody.length < 10}
                onClick={() => submitReview.mutate()}
              >
                Submit review
              </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Login
                </Link>{" "}
                to write a review.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
