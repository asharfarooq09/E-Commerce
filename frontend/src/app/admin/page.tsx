"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

type DashboardResponse = {
  stats: {
    productCount: number;
    orderCount: number;
    customerCount: number;
    revenue: string | number;
  };
  lowStock: Array<{
    id: string;
    quantity: number;
    lowStockThreshold: number;
    product: { id: string; name: string; slug: string };
  }>;
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api<DashboardResponse>("/api/admin/dashboard"),
  });

  if (isLoading) return <p>Loading dashboard...</p>;

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of store performance and inventory health.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Products" value={String(stats?.productCount ?? 0)} />
        <StatCard title="Orders" value={String(stats?.orderCount ?? 0)} />
        <StatCard title="Customers" value={String(stats?.customerCount ?? 0)} />
        <StatCard title="Revenue" value={formatCurrency(Number(stats?.revenue ?? 0))} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low stock alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!data?.lowStock.length ? (
            <p className="text-muted-foreground">No low stock items right now.</p>
          ) : (
            data.lowStock.map((item) => (
              <div key={item.id} className="flex justify-between border-b border-border py-2 last:border-0">
                <span>{item.product.name}</span>
                <span className="text-muted-foreground">
                  {item.quantity} left (threshold {item.lowStockThreshold})
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
