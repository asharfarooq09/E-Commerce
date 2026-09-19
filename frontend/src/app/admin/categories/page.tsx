"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Category } from "@/types/shop";

export default function AdminCategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api<{ categories: Category[] }>("/api/admin/categories"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground">Organize products into browsable categories.</p>
      </div>
      {isLoading ? (
        <p>Loading categories...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-4">
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-muted-foreground">{category._count?.products ?? 0} products</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
