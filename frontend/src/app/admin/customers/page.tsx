"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

type Customer = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  _count: { orders: number };
};

export default function AdminCustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => api<{ customers: Customer[] }>("/api/admin/customers"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-muted-foreground">Registered customer accounts and order activity.</p>
      </div>
      {isLoading ? (
        <p>Loading customers...</p>
      ) : (
        <div className="space-y-3">
          {data?.customers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {customer._count.orders} orders · Joined {formatDate(customer.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
