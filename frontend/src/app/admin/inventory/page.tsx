"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { shopToast } from "@/lib/shop-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type InventoryRow = {
  id: string;
  quantity: number;
  lowStockThreshold: number;
  product: { id: string; name: string; slug: string; brand?: string | null };
};

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: () => api<{ inventory: InventoryRow[] }>("/api/admin/inventory"),
  });

  const updateInventory = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api(`/api/admin/inventory/${productId}`, { method: "PATCH", json: { quantity } }),
    onSuccess: () => {
      shopToast.saved("Inventory updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
    },
    onError: (error: Error) => shopToast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Monitor and adjust product stock levels.</p>
      </div>
      {isLoading ? (
        <p>Loading inventory...</p>
      ) : (
        <div className="space-y-3">
          {data?.inventory.map((row) => (
            <InventoryRowEditor key={row.id} row={row} onSave={updateInventory.mutate} />
          ))}
        </div>
      )}
    </div>
  );
}

function InventoryRowEditor({
  row,
  onSave,
}: {
  row: InventoryRow;
  onSave: (payload: { productId: string; quantity: number }) => void;
}) {
  const [quantity, setQuantity] = useState(String(row.quantity));

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">{row.product.name}</p>
          <p className="text-sm text-muted-foreground">
            Threshold {row.lowStockThreshold}
            {row.quantity <= row.lowStockThreshold ? " · Low stock" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            className="w-28"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => onSave({ productId: row.product.id, quantity: Number(quantity) })}
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
