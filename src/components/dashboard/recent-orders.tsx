"use client";

import { useEffect, useState } from "react";
import { Clock3, ChefHat, Truck, WalletCards, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGatedReprint } from "@/components/dashboard/permission-gated-reprint";
import type { Order, KitchenOrder } from "@/types/domain";

const orderStateIcon = {
  pending: Clock3,
  preparing: ChefHat,
  ready: Truck,
  delivered: WalletCards,
  paid: WalletCards,
  void: WalletCards,
} as const;

type ApiNotification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
};

export function RecentOrders() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "superAdmin";

  const [orders, setOrders] = useState<Order[]>([]);
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editPriority, setEditPriority] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, kitchenRes, notifRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/kitchen"),
        fetch("/api/notifications"),
      ]);

      const [ordersJson, kitchenJson, notifJson] = await Promise.all([
        ordersRes.ok ? ordersRes.json() : { data: [] },
        kitchenRes.ok ? kitchenRes.json() : { data: [] },
        notifRes.ok ? notifRes.json() : { data: [] },
      ]);

      const activeOrders = Array.isArray(ordersJson.data) ? ordersJson.data : [];
      setOrders(activeOrders.slice(0, 10));

      setKitchenOrders(Array.isArray(kitchenJson.data) ? kitchenJson.data : []);
      setNotifications(Array.isArray(notifJson.data) ? notifJson.data : []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData().finally(() => setLoading(false));
  }, []);

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    const orderId = editingOrder.id || (editingOrder as { _id?: string })._id || "";
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          priority: editPriority,
          notes: editNotes,
          discount: editDiscount,
        }),
      });
      if (res.ok) {
        toast.success("Order updated successfully!");
        setEditingOrder(null);
        await fetchDashboardData();
      } else {
        const json = await res.json().catch(() => null);
        toast.error(json?.message || "Failed to update order");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel/delete this order?")) {
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Order deleted successfully!");
        await fetchDashboardData();
      } else {
        const json = await res.json().catch(() => null);
        toast.error(json?.message || "Failed to delete order");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete order");
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        <span className="ml-2 text-sm text-slate-500">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="grid gap-4 2xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="border border-orange-100/50 bg-white/95 shadow-[0_10px_30px_rgba(148,163,184,0.05)]">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Badge className="bg-orange-500/10 text-orange-600 border border-orange-200/50 font-bold">{orders.length} live</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.length ? (
            orders.map((order) => {
              const orderId = order.id || (order as { _id?: string })._id || "";
              const StateIcon = orderStateIcon[order.status as keyof typeof orderStateIcon] || Clock3;

              // Color classes based on status
              const statusColor = 
                order.status === "paid" ? "emerald" :
                order.status === "ready" ? "teal" :
                order.status === "preparing" ? "amber" :
                order.status === "pending" ? "orange" : "rose";

              return (
                <div
                  key={orderId}
                  className="rounded-[24px] border border-orange-100/60 bg-gradient-to-br from-white to-orange-50/20 p-4 shadow-[0_10px_20px_rgba(148,163,184,0.02)] hover:border-orange-300/40 hover:shadow-md transition-all duration-300 ease-out group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 text-sm font-bold text-slate-950">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-${statusColor}-50 text-${statusColor}-600 border border-${statusColor}-100/30 transition-transform duration-300 group-hover:scale-105`}>
                          <StateIcon className="h-4 w-4" />
                        </div>
                        <span className="tracking-tight">{order.orderNumber}</span>
                        <span className="ml-1 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {order.tableLabel ?? "Take Away"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-400 pl-10">
                        {order.waiterName} • {order.items?.length ?? 0} items
                      </div>
                      {isSuperAdmin && (
                        <div className="mt-3.5 flex gap-2 pl-10">
                          <button
                            onClick={() => {
                              setEditingOrder(order);
                              setEditStatus(order.status);
                              setEditPriority(order.priority || "normal");
                              setEditNotes(order.notes || "");
                              setEditDiscount(order.discount || 0);
                            }}
                            className="px-3 py-1.5 bg-slate-950 text-white hover:bg-slate-800 text-[10px] font-bold rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(orderId)}
                            className="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 text-[10px] font-bold rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-slate-950">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "LKR",
                          maximumFractionDigits: 0,
                        }).format(order.grandTotal)}
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className={`h-1.5 w-1.5 rounded-full ${order.priority === "high" ? "bg-rose-500 animate-pulse" : order.priority === "normal" ? "bg-amber-500" : "bg-slate-300"}`} />
                        Priority: {order.priority}
                      </div>
                      <div className="mt-3.5 flex justify-end">
                        <PermissionGatedReprint
                          order={order}
                          paymentMethod="cash"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs font-semibold text-slate-400">
              No recent orders found.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="border border-orange-100/50 bg-white/95 shadow-[0_10px_30px_rgba(148,163,184,0.05)]">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Live Kitchen Orders</CardTitle>
            <Badge className="bg-orange-500/10 text-orange-600 border border-orange-200/50 font-bold">{kitchenOrders.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {kitchenOrders.length ? (
              kitchenOrders.map((order) => (
                <div
                  key={order.id || (order as { _id?: string })._id}
                  className="rounded-[20px] border border-orange-100/40 bg-gradient-to-br from-white to-orange-50/10 p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-950">
                        {order.orderNumber}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        Table {order.tableLabel ?? "N/A"}
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100/50 font-bold">
                      {order.status}
                    </Badge>
                  </div>
                  <div className="mt-3.5 space-y-2 border-t border-dashed border-orange-100/60 pt-3 text-xs text-slate-600">
                    {order.items?.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="font-semibold text-slate-800">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 italic">
                          {item.notes ?? "No notes"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs font-semibold text-slate-400">
                No active kitchen orders.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-orange-100/50 bg-white/95 shadow-[0_10px_30px_rgba(148,163,184,0.05)]">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>System Alerts</CardTitle>
            <Badge className="bg-rose-500/10 text-rose-600 border border-rose-200/50 font-bold">{notifications.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="rounded-[18px] border border-orange-100/50 bg-gradient-to-br from-white to-orange-50/20 p-4 text-xs font-semibold text-slate-700 shadow-xs hover:border-orange-200 hover:shadow-xs transition-all duration-300"
                >
                  <div className="font-bold text-slate-950">
                    {notification.title}
                  </div>
                  <div className="mt-1 font-medium text-slate-500">{notification.message}</div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs font-semibold text-slate-400">
                No system alerts.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[28px] border border-orange-100 p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-orange-50 pb-3">
              <h3 className="text-lg font-bold text-slate-950">
                Edit Order {editingOrder.orderNumber}
              </h3>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none focus:border-orange-500"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="paid">Paid</option>
                  <option value="void">Void</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none focus:border-orange-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Discount (LKR)
                </label>
                <input
                  type="number"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(Number(e.target.value))}
                  className="w-full h-11 rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none focus:border-orange-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Special Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-2xl border border-orange-200 bg-white p-4 text-sm outline-none focus:border-orange-500 min-h-[80px]"
                  placeholder="No special notes"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                disabled={saving}
                onClick={handleSaveEdit}
                className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
              <button
                onClick={() => setEditingOrder(null)}
                className="h-12 px-6 border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
