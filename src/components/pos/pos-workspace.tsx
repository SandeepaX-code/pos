"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { toast } from "sonner";
import {
  Barcode,
  Check,
  CirclePlus,
  CircleMinus,
  Download,
  Filter,
  HandCoins,
  Merge,
  Printer,
  Search,
  Split,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { categories, customers, products, tables } from "@/data/restaurant";
import type {
  Customer,
  Order,
  OrderItem,
  PaymentMethod,
  Product,
  RestaurantTable,
} from "@/types/domain";

type HeldOrder = {
  id: string;
  items: OrderItem[];
  table?: RestaurantTable;
  customer?: Customer;
};

const taxRate = 0.08;
const serviceRate = 0.05;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function cloneItems(items: OrderItem[]) {
  return items.map((item) => ({
    ...item,
    modifiers: item.modifiers ? [...item.modifiers] : undefined,
  }));
}

export function PosWorkspace({ mode }: { mode: "dine-in" | "takeaway" }) {
  const { data: session } = useSession();
  const [activeCategory, setActiveCategory] = useState(
    categories[0]?.id ?? "rice",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTable, setSelectedTable] = useState<
    RestaurantTable | undefined
  >(tables.find((table) => table.status === "available") ?? tables[0]);
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | undefined
  >(customers[0]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = product.categoryId === activeCategory;
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = Math.round(subtotal * taxRate);
  const serviceCharge = Math.round(subtotal * serviceRate);
  const grandTotal = Math.max(subtotal - discount + tax + serviceCharge, 0);

  const addItem = (product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
        },
      ];
    });

    toast.success(`${product.name} added to order.`);
  };

  const increaseQuantity = (productId: string) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  };

  const decreaseQuantity = (productId: string) => {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (productId: string) => {
    setItems((current) =>
      current.filter((item) => item.productId !== productId),
    );
    toast.message("Item removed from order.");
  };

  const holdOrder = () => {
    if (!items.length) {
      toast.error("Add items before holding the order.");
      return;
    }

    setHeldOrders((current) => [
      ...current,
      {
        id: `held-${Date.now()}`,
        items: cloneItems(items),
        table: selectedTable,
        customer: selectedCustomer,
      },
    ]);
    setItems([]);
    setDiscount(0);
    setNotes("");
    toast.success("Order placed on hold.");
  };

  const resumeOrder = () => {
    const held = heldOrders.at(-1);
    if (!held) {
      toast.error("No held order available.");
      return;
    }

    setItems(held.items);
    if (held.table) setSelectedTable(held.table);
    if (held.customer) setSelectedCustomer(held.customer);
    setHeldOrders((current) => current.slice(0, -1));
    toast.success("Held order restored.");
  };

  const splitBill = () => {
    if (items.length < 2) {
      toast.error("Add at least two items to split the bill.");
      return;
    }

    const splitItems: OrderItem[] = [];
    const remainingItems: OrderItem[] = [];

    items.forEach((item, index) => {
      const splitQuantity =
        index % 2 === 0
          ? Math.ceil(item.quantity / 2)
          : Math.floor(item.quantity / 2);
      const remainingQuantity = item.quantity - splitQuantity;

      if (splitQuantity > 0) {
        splitItems.push({ ...item, quantity: splitQuantity });
      }

      if (remainingQuantity > 0) {
        remainingItems.push({ ...item, quantity: remainingQuantity });
      }
    });

    setItems(remainingItems);
    setHeldOrders((current) => [
      ...current,
      {
        id: `split-${Date.now()}`,
        items: splitItems,
        table: selectedTable,
        customer: selectedCustomer,
      },
    ]);
    toast.success("Bill split and moved to a held split order.");
  };

  const mergeBill = () => {
    const held = heldOrders.at(-1);
    if (!held) {
      toast.error("No held split order to merge.");
      return;
    }

    setItems((current) => {
      const merged = [...current];

      held.items.forEach((heldItem) => {
        const existing = merged.find(
          (item) => item.productId === heldItem.productId,
        );
        if (existing) {
          existing.quantity += heldItem.quantity;
        } else {
          merged.push({ ...heldItem });
        }
      });

      return merged;
    });
    setHeldOrders((current) => current.slice(0, -1));
    toast.success("Held bill merged back into the current order.");
  };

  const clearOrder = () => {
    setItems([]);
    setDiscount(0);
    setNotes("");
    toast.message("Current order cleared.");
  };

  const checkout = async (method: PaymentMethod) => {
    if (!session?.user?.branchId || !session.user.id || !session.user.name) {
      toast.error("Please login to checkout.");
      return;
    }

    if (!items.length) {
      toast.error("Add items before checkout.");
      return;
    }

    const source = mode;

    if (source === "dine-in" && !selectedTable) {
      toast.error("Select a table for dine-in.");
      return;
    }

    const payload = {
      branchId: session.user.branchId,
      tableId: source === "dine-in" ? selectedTable?.id : undefined,
      tableLabel: source === "dine-in" ? selectedTable?.label : undefined,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      waiterId: session.user.id,
      waiterName: session.user.name,
      cashierId: undefined,
      paymentMethod: method,
      items,
      discount,
      notes: notes || undefined,
      source,
      priority: "normal",
      printCustomerReceipt: true,
      printKitchenTicket: true,
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      toast.error("Checkout failed on server.");
      return;
    }

    const result = (await res.json()) as {
      data?: {
        order?: unknown;
        customerReceipt?: ArrayBuffer | null;
        kitchenTicket?: ArrayBuffer | null;
      };
    };

    // Persisted receipt generation is done server-side, but /api/orders returns
    // buffers. If your frontend can’t handle it directly, we fall back to printer bridge.
    // (Keeps this feature resilient.)
    const orderForPrinting = result.data?.order as Order | undefined;

    if (orderForPrinting) {
      const [customerReceipt, kitchenReceipt] = await Promise.all([
        fetch("/api/printer/receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "customer",
            paymentMethod: method,
            order: orderForPrinting,
          }),
        }),
        fetch("/api/printer/receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "kitchen", order: orderForPrinting }),
        }),
      ]);

      if (!customerReceipt.ok || !kitchenReceipt.ok) {
        toast.error("Printer bridge returned an error.");
        return;
      }

      const blob = await customerReceipt.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${orderForPrinting.orderNumber}-customer-receipt.bin`;
      anchor.click();
      URL.revokeObjectURL(url);
    }

    setItems([]);
    setDiscount(0);
    setNotes("");
    toast.success(
      `Checkout completed (${source}) with ${method.toUpperCase()} payment.`,
    );
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_390px]">
      <Card className="overflow-hidden">
        <CardHeader className="space-y-4">
          <CardTitle>Categories</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-11"
              placeholder="Search menu items"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("")}
            >
              <Filter className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition ${activeCategory === category.id ? "border-orange-300 bg-orange-50 text-orange-700" : "border-orange-100 bg-white hover:bg-orange-50/60"}`}
            >
              <span className="font-medium">{category.name}</span>
              <Badge>
                {
                  products.filter(
                    (product) => product.categoryId === category.id,
                  ).length
                }
              </Badge>
            </button>
          ))}

          <div className="rounded-[22px] border border-orange-100 bg-slate-950 p-4 text-white">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Connected devices
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-200">
              <Barcode className="h-4 w-4 text-orange-400" /> Barcode scanner
              ready
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-200">
              <Printer className="h-4 w-4 text-orange-400" /> Printer bridge
              active
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Menu Grid</CardTitle>
          <div className="text-sm text-slate-500">
            {filteredProducts.length} items
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addItem(product)}
                className={`group overflow-hidden rounded-[24px] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(249,115,22,0.15)] ${product.available ? "border-orange-100" : "border-slate-200 opacity-70"}`}
              >
                <div className="flex h-40 items-center justify-center rounded-[18px] bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 text-6xl text-orange-500">
                  🍽️
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">
                      {product.name}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {product.sku}
                    </div>
                  </div>
                  <Badge>{product.available ? "Available" : "Out"}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-lg font-semibold text-slate-950">
                    {formatCurrency(product.price)}
                  </div>
                  <div className="text-sm text-slate-500">
                    Stock {product.stock}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-4">
          <CardTitle>Current Order</CardTitle>
          <div className="space-y-3">
            <select
              className="h-11 w-full rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
              value={selectedTable?.id ?? ""}
              onChange={(event) =>
                setSelectedTable(
                  tables.find((table) => table.id === event.target.value),
                )
              }
            >
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.label} - {table.status}
                </option>
              ))}
            </select>
            <select
              className="h-11 w-full rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
              value={selectedCustomer?.id ?? ""}
              onChange={(event) =>
                setSelectedCustomer(
                  customers.find(
                    (customer) => customer.id === event.target.value,
                  ),
                )
              }
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {items.length ? (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-[20px] border border-orange-100 bg-orange-50/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-950">
                        {item.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-slate-400 transition hover:text-rose-600"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => decreaseQuantity(item.productId)}
                    >
                      <CircleMinus className="h-4 w-4" />
                    </Button>
                    <div className="min-w-14 rounded-2xl bg-white px-4 py-2 text-center font-semibold text-slate-950">
                      {item.quantity}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => increaseQuantity(item.productId)}
                    >
                      <CirclePlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => removeItem(item.productId)}
                    >
                      <X className="h-4 w-4" /> Void
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-orange-200 p-6 text-center text-sm text-slate-500">
                No items added yet. Use the menu grid to build the bill.
              </div>
            )}
          </div>

          <div className="grid gap-3 rounded-[24px] bg-slate-950 p-4 text-white">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Service charge</span>
              <span>{formatCurrency(serviceCharge)}</span>
            </div>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Discount</span>
              <Input
                type="number"
                min={0}
                value={discount}
                onChange={(event) =>
                  setDiscount(Number(event.target.value) || 0)
                }
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Special notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none placeholder:text-slate-500"
                placeholder="Allergy, seating, and kitchen notes"
              />
            </label>
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-lg font-semibold text-white">
              <span>Grand total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={holdOrder}>
              <HandCoins className="h-4 w-4" /> Hold Order
            </Button>
            <Button variant="outline" onClick={resumeOrder}>
              <Check className="h-4 w-4" /> Resume Order
            </Button>
            <Button variant="outline" onClick={splitBill}>
              <Split className="h-4 w-4" /> Split Bill
            </Button>
            <Button variant="outline" onClick={mergeBill}>
              <Merge className="h-4 w-4" /> Merge Bill
            </Button>
            <Button variant="secondary" onClick={clearOrder}>
              <Trash2 className="h-4 w-4" /> Clear Order
            </Button>
            <Button onClick={() => void checkout(paymentMethod)}>
              <Download className="h-4 w-4" /> Checkout
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={paymentMethod === "cash" ? "default" : "outline"}
              onClick={() => setPaymentMethod("cash")}
            >
              Cash Payment
            </Button>
            <Button
              variant={paymentMethod === "card" ? "default" : "outline"}
              onClick={() => setPaymentMethod("card")}
            >
              Card Payment
            </Button>
            <Button
              variant={paymentMethod === "qr" ? "default" : "outline"}
              onClick={() => setPaymentMethod("qr")}
            >
              QR Payment
            </Button>
            <Button
              variant={paymentMethod === "mixed" ? "default" : "outline"}
              onClick={() => setPaymentMethod("mixed")}
            >
              Mixed Payment
            </Button>
          </div>

          <Button
            className="w-full"
            variant="default"
            onClick={() => void checkout(paymentMethod)}
          >
            <Printer className="h-4 w-4" /> Print Bill
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
