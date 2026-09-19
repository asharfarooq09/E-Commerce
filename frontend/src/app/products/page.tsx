"use client";

import { Suspense, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { useDebounce } from "@/hooks/use-debounce";
import { api } from "@/lib/api";
import type { Category, Product } from "@/types/shop";

type ProductsResponse = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    brands: string[];
  };
};

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setCategory(searchParams.get("category") ?? "");
    setSearch(searchParams.get("search") ?? "");
    setPage(1);
  }, [searchParams]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "12");
    return params.toString();
  }, [debouncedSearch, category, brand, minPrice, maxPrice, sort, page]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<{ categories: Category[] }>("/api/categories"),
    staleTime: 5 * 60_000,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", queryString],
    queryFn: () => api<ProductsResponse>(`/api/products?${queryString}`),
    placeholderData: (previous) => previous,
  });

  const activeCategoryName = categoriesData?.categories.find((item) => item.slug === category)?.name;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        title={activeCategoryName ? `${activeCategoryName}` : "All products"}
        description={
          activeCategoryName
            ? `Browse ${activeCategoryName.toLowerCase()} with search, filters, and sorting.`
            : "Search, filter, and sort the full ShopAI catalog."
        }
      />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-28">
          <div>
            <label className="mb-2 block text-sm font-medium">Search</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Category</label>
            <select
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {categoriesData?.categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Brand</label>
            <select
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All brands</option>
              {data?.filters.brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Min price</label>
              <Input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Max price</label>
              <Input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="200000"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Sort by</label>
            <select
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top rated</option>
              <option value="name">Name</option>
            </select>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              {data ? (
                <>
                  Showing <span className="font-medium text-foreground">{data.products.length}</span> of{" "}
                  <span className="font-medium text-foreground">{data.pagination.total}</span> products
                </>
              ) : (
                "Loading products..."
              )}
            </p>
            {isFetching && !isLoading ? <p className="text-xs">Updating…</p> : null}
          </div>

          <ProductGrid products={data?.products ?? []} loading={isLoading} />

          {data && data.pagination.totalPages > 1 ? (
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10">Loading products...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
