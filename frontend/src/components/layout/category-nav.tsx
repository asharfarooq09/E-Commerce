"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Category } from "@/types/shop";

export function CategoryNav() {
  return (
    <Suspense fallback={null}>
      <CategoryNavContent />
    </Suspense>
  );
}

function CategoryNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const showNav = pathname === "/" || pathname.startsWith("/products");

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<{ categories: Category[] }>("/api/categories"),
    staleTime: 5 * 60_000,
    enabled: showNav,
  });

  if (!showNav || !data?.categories.length) {
    return null;
  }

  return (
    <div className="border-b border-border/70 bg-background/90">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavPill href="/products" active={pathname === "/products" && !activeCategory}>
          All
        </NavPill>
        {data.categories.map((category) => (
          <NavPill
            key={category.id}
            href={`/products?category=${category.slug}`}
            active={activeCategory === category.slug}
          >
            {category.name}
          </NavPill>
        ))}
      </div>
    </div>
  );
}

function NavPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-foreground hover:bg-muted/80",
      )}
    >
      {children}
    </Link>
  );
}
