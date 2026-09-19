"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Order } from "@/types/shop";

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersContent />
    </RequireAuth>
  );
}

function OrdersContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api<{ orders: Order[] }>("/api/orders"),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Order history</h1>
      {isLoading ? (
        <p>Loading orders...</p>
      ) : !data?.orders.length ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You have not placed any orders yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                  <p className="text-sm">{order.items.length} items</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{order.status}</Badge>
                  <p className="font-semibold">{formatCurrency(order.total)}</p>
                  <Link href={`/orders/${order.id}`} className="text-sm font-medium text-primary hover:underline">
                    View
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
