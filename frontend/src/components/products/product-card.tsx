import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/shop";

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const image = product.images.find((item) => item.isPrimary) ?? product.images[0];
  const inStock = (product.inventory?.quantity ?? 0) > 0;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <Link href={`/products/${product.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 72vw, (max-width: 1200px) 44vw, 25vw"
            />
          ) : null}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            {product.featured ? <Badge>Featured</Badge> : <span />}
            {!inStock ? (
              <Badge variant="secondary" className="bg-background/90">
                Out of stock
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {product.category.name}
              {product.brand ? ` · ${product.brand}` : ""}
            </p>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{product.name}</h3>
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <div>
              <p className="text-lg font-bold tracking-tight">{formatCurrency(product.price)}</p>
              <p className="text-xs text-muted-foreground">{inStock ? "In stock" : "Unavailable"}</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
              <span>({product.reviewCount})</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
