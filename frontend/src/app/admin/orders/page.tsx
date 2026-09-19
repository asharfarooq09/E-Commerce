"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shopToast } from "@/lib/shop-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/shop";

type AdminOrder = Order & {
  user: { id: string; name: string; email: string };
};

const statuses: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api<{ orders: AdminOrder[] }>("/api/admin/orders"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api(`/api/admin/orders/${id}/status`, { method: "PATCH", json: { status } }),
    onSuccess: () => {
      shopToast.saved("Order status updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (error: Error) => shopToast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Track and update customer orders.</p>
      </div>
      {isLoading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="space-y-3">
          {data?.orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.user.name} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{order.status}</Badge>
                    <p className="font-semibold">{formatCurrency(order.total)}</p>
                  </div>
                </div>
                <select
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  value={order.status}
                  onChange={(e) =>
                    updateStatus.mutate({ id: order.id, status: e.target.value as OrderStatus })
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
