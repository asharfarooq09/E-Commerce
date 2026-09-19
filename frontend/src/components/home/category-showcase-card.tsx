import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/shop";

type CategoryShowcaseCardProps = {
  category: Category & { productCount?: number };
  className?: string;
};

export function CategoryShowcaseCard({ category, className }: CategoryShowcaseCardProps) {
  const count = category.productCount ?? category._count?.products;

  return (
    <Link
      href={`/products?category=${category.slug}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-lg font-semibold">{category.name}</p>
          {count !== undefined ? (
            <p className="text-xs text-white/80">{count} products</p>
          ) : null}
        </div>
      </div>
      {category.description ? (
        <p className="line-clamp-2 px-4 py-3 text-sm text-muted-foreground">{category.description}</p>
      ) : null}
    </Link>
  );
}
