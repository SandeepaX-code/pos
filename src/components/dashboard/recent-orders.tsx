import { Clock3, ChefHat, Truck, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kitchenOrders, notifications, orders } from "@/data/restaurant";
import { PermissionGatedReprint } from "@/components/dashboard/permission-gated-reprint";

const orderStateIcon = {
  pending: Clock3,
  preparing: ChefHat,
  ready: Truck,
  delivered: WalletCards,
  paid: WalletCards,
  void: WalletCards,
} as const;

export function RecentOrders() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Badge>{orders.length} live</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.map((order) => {
            const StateIcon = orderStateIcon[order.status];

            return (
              <div
                key={order.id}
                className="rounded-[24px] border border-orange-100 bg-orange-50/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <StateIcon className="h-4 w-4 text-orange-600" />
                      {order.orderNumber}
                      <span className="ml-2 text-xs font-medium text-slate-500">
                        {order.tableLabel ?? "Take Away"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {order.waiterName} • {order.items.length} items
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold text-slate-950">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "LKR",
                        maximumFractionDigits: 0,
                      }).format(order.grandTotal)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Priority: {order.priority}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <PermissionGatedReprint
                        order={order}
                        paymentMethod="cash"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Live Kitchen Orders</CardTitle>
            <Badge>{kitchenOrders.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {kitchenOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">
                      {order.orderNumber}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Table {order.tableLabel}
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700">
                    {order.status}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {order.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-3"
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-slate-400">
                        {item.notes ?? "No notes"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>System Alerts</CardTitle>
            <Badge>{notifications.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-[18px] border border-orange-100 bg-orange-50/70 p-4 text-sm text-slate-700"
              >
                <div className="font-semibold text-slate-950">
                  {notification.title}
                </div>
                <div className="mt-1">{notification.message}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
