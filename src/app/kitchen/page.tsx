"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { KitchenOrder } from "@/types/domain";

export default function KitchenPage() {
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKitchenOrders() {
      try {
        const res = await fetch("/api/kitchen");
        if (res.ok) {
          const json = await res.json();
          setKitchenOrders(Array.isArray(json.data) ? json.data : []);
        }
      } catch (err) {
        console.error("Failed to load kitchen orders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchKitchenOrders();
  }, []);

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/kitchen/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Ticket status updated to ${nextStatus}`);
        // Reload list
        const updatedRes = await fetch("/api/kitchen");
        if (updatedRes.ok) {
          const json = await updatedRes.json();
          setKitchenOrders(Array.isArray(json.data) ? json.data : []);
        }
      } else {
        const json = await res.json().catch(() => null);
        toast.error(json?.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Kitchen Display"
          title="Live kitchen ticket board"
          description="Track preparation, ready, and delivered statuses with large touch-friendly cards for pass-through kitchen operations."
        />

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-sm text-slate-500">Loading kitchen tickets...</span>
          </div>
        ) : kitchenOrders.length ? (
          <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {kitchenOrders.map((order) => {
              const orderId = order.id || (order as { _id?: string })._id || "";
              const isUpdating = updatingId === orderId;

              return (
                <Card key={orderId} className="overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="bg-slate-950 px-6 py-5 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Order
                          </div>
                          <div className="mt-1 text-2xl font-semibold">
                            {order.orderNumber}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-800 text-slate-200 capitalize">
                            {order.status}
                          </Badge>
                          <Badge className="bg-orange-500/15 text-orange-200">
                            {order.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-300">
                        Table {order.tableLabel ?? "N/A"} · {order.waiterName}
                      </div>
                    </div>
                    <CardContent className="space-y-3 pt-6">
                      {order.items?.map((item) => (
                        <div
                          key={item.productId}
                          className="rounded-[18px] border border-orange-100 bg-orange-50/50 p-4"
                        >
                          <div className="font-semibold text-slate-950">
                            {item.quantity} x {item.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {item.notes ?? "No special notes"}
                          </div>
                        </div>
                      ))}
                      <div className="rounded-[18px] border border-dashed border-orange-200 p-4 text-sm text-slate-500">
                        Ordered at {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : "N/A"}
                      </div>
                    </CardContent>
                  </div>
                  
                  <div className="px-6 pb-6 pt-2">
                    {order.status === "pending" && (
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium h-12 rounded-2xl"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(orderId, "preparing")}
                      >
                        {isUpdating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium h-12 rounded-2xl"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(orderId, "ready")}
                      >
                        {isUpdating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Mark as Ready
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-750 text-white font-medium h-12 rounded-2xl"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(orderId, "delivered")}
                      >
                        {isUpdating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Deliver / Send Out
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            No active orders in the kitchen.
          </div>
        )}
      </main>
    </AppShell>
  );
}
