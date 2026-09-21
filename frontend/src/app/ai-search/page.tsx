"use client";

import { Sparkles } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { shopToast } from "@/lib/shop-toast";
import { api } from "@/lib/api";
import type { Product } from "@/types/shop";

type AiSearchIntent = {
  categorySlug?: string;
  maxPriceInr?: number;
  minPriceInr?: number;
  brand?: string;
  minRamGb?: number;
  minStorageGb?: number;
  semanticQuery: string;
  keywords: string[];
};

type AiSearchResponse = {
  query: string;
  intent: AiSearchIntent;
  summary: string;
  products: Product[];
  meta: {
    sqlCandidateCount: number;
    semanticRanked: boolean;
    resultCount: number;
  };
};

type AiStatusResponse = {
  provider?: string;
  aiConfigured?: boolean;
  openAiConfigured: boolean;
  embeddingsIndexed: number;
  pgvectorEnabled: boolean;
  ready: boolean;
  message: string;
};

const EXAMPLE_QUERIES = [
  "I need a laptop for frontend development under ₹80k with 16GB RAM and good battery.",
  "Wireless noise cancelling headphones for travel under ₹15000",
  "Mid-range smartphone with great camera and 256GB storage",
];

export default function AiSearchPage() {
  const [query, setQuery] = useState("");
  const [lastResult, setLastResult] = useState<AiSearchResponse | null>(null);

  const { data: status } = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => api<AiStatusResponse>("/api/ai/status"),
    staleTime: 30_000,
  });

  const searchMutation = useMutation({
    mutationFn: (searchQuery: string) =>
      api<AiSearchResponse>("/api/ai/search", {
        method: "POST",
        json: { query: searchQuery },
      }),
    onSuccess: (data) => {
      setLastResult(data);
    },
    onError: (error: Error) => {
      shopToast.error(error.message || "AI search failed. Check API keys and embeddings.");
    },
  });

  function runSearch(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      shopToast.error("Describe what you're looking for in at least a few words.");
      return;
    }
    setQuery(trimmed);
    searchMutation.mutate(trimmed);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        title="AI search"
        description="Describe what you need in plain English. We’ll narrow the catalog with filters and rank the best matches."
      />

      <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            runSearch(query);
          }}
        >
          <div className="relative flex-1">
            <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. laptop for React development under 80k with 16GB RAM..."
              className="pl-10"
              disabled={searchMutation.isPending}
            />
          </div>
          <Button type="submit" disabled={searchMutation.isPending || status?.ready === false}>
            {searchMutation.isPending ? "Searching…" : "Search"}
          </Button>
        </form>

        {status && !status.ready ? (
          <p className="mt-3 text-sm text-muted-foreground">{status.message}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              className="rounded-full border border-border bg-background px-3 py-1 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              onClick={() => runSearch(example)}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {lastResult ? (
        <section className="space-y-6">
          <p className="text-sm text-muted-foreground">{lastResult.summary}</p>
          <ProductGrid
            products={lastResult.products}
            loading={false}
            emptyMessage="No products matched this search. Try broader words or fewer constraints."
          />
        </section>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Try an example above, or type what you’re shopping for.
        </p>
      )}
    </div>
  );
}
