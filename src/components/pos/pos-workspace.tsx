"use client";

import { useEffect, useMemo, useState } from "react";
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
  Loader2,
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

type ApiCategory = { _id: string; id?: string; name: string; slug: string; icon?: string; image?: string; color?: string };
type ApiProduct = {
  _id: string; id?: string; name: string; sku: string; categoryId: string | { _id: string };
  image?: string; price: number; cost?: number; available: boolean; stock?: number;
  variants?: unknown[]; addons?: unknown[]; lowStockThreshold?: number;
};
type ApiTable = { _id: string; id?: string; label: string; seats?: number; zone?: string; status: string; billId?: string };
type ApiCustomer = { _id: string; id?: string; name: string; phone?: string; email?: string; loyaltyPoints?: number };

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

function resolveId(obj: { _id?: string; id?: string }): string {
  return obj._id ?? obj.id ?? "";
}

function resolveCategoryId(raw: string | { _id: string }): string {
  if (typeof raw === "object" && raw !== null) return raw._id;
  return raw;
}

export function PosWorkspace({ mode }: { mode: "dine-in" | "takeaway" }) {
  const { data: session } = useSession();

  // --- Remote data ---
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, prodRes, tableRes, custRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products"),
          fetch("/api/tables"),
          fetch("/api/customers"),
        ]);

        const [catJson, prodJson, tableJson, custJson] = await Promise.all([
          catRes.ok ? catRes.json() : { data: [] },
          prodRes.ok ? prodRes.json() : { data: { items: [] } },
          tableRes.ok ? tableRes.json() : { data: [] },
          custRes.ok ? custRes.json() : { data: [] },
        ]);

        setCategories(Array.isArray(catJson.data) ? catJson.data : []);
        const prodItems = prodJson.data?.items ?? (Array.isArray(prodJson.data) ? prodJson.data : []);
        setProducts(prodItems);
        const tableItems = tableJson.data?.items ?? (Array.isArray(tableJson.data) ? tableJson.data : []);
        setTables(tableItems);
        setCustomers(Array.isArray(custJson.data) ? custJson.data : []);
      } catch {
        toast.error("Failed to load POS data from server.");
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
  }, []);

  const [activeCategory, setActiveCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTable, setSelectedTable] = useState<ApiTable | undefined>(undefined);
  const [selectedCustomer, setSelectedCustomer] = useState<ApiCustomer | undefined>(undefined);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);

  // Set defaults once data loads
  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(resolveId(categories[0]));
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (tables.length && !selectedTable) {
      const available = tables.find((t) => t.status === "available");
      setSelectedTable(available ?? tables[0]);
    }
  }, [tables, selectedTable]);

  useEffect(() => {
    if (customers.length && !selectedCustomer) {
      setSelectedCustomer(customers[0]);
    }
  }, [customers, selectedCustomer]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const catId = resolveCategoryId(product.categoryId);
      const matchesCategory = catId === activeCategory;
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm, products]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = Math.round(subtotal * taxRate);
  const serviceCharge = Math.round(subtotal * serviceRate);
  const grandTotal = Math.max(subtotal - discount + tax + serviceCharge, 0);

  const addItem = (product: ApiProduct) => {
    const pid = resolveId(product);
    setItems((current) => {
      const existing = current.find((item) => item.productId === pid);
      if (existing) {
        return current.map((item) =>
          item.productId === pid
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
          productId: pid,
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
        table: selectedTable as RestaurantTable | undefined,
        customer: selectedCustomer as Customer | undefined,
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
    if (held.table) setSelectedTable(held.table as unknown as ApiTable);
    if (held.customer) setSelectedCustomer(held.customer as unknown as ApiCustomer);
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
        table: selectedTable as RestaurantTable | undefined,
        customer: selectedCustomer as Customer | undefined,
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
    if (checkingOut) return;

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

    setCheckingOut(true);

    try {
      const tableId = source === "dine-in" && selectedTable ? resolveId(selectedTable) : undefined;
      const customerId = selectedCustomer ? resolveId(selectedCustomer) : undefined;

      const payload = {
        branchId: session.user.branchId,
        tableId,
        tableLabel: source === "dine-in" && selectedTable ? selectedTable.label : undefined,
        customerId,
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
        const errorData = await res.json().catch(() => null);
        const msg = errorData?.message || "Checkout failed on server.";
        toast.error(msg);
        return;
      }

      const result = (await res.json()) as {
        data?: {
          order?: unknown;
          customerReceipt?: ArrayBuffer | null;
          kitchenTicket?: ArrayBuffer | null;
        };
      };

      // Order is confirmed at this point! Clear the cart first.
      setItems([]);
      setDiscount(0);
      setNotes("");
      toast.success(
        `Checkout completed (${source}) with ${method.toUpperCase()} payment.`,
      );

      // Now try printing receipts (non-blocking â€” order is already confirmed)
      const orderForPrinting = result.data?.order as Order | undefined;

      if (orderForPrinting) {
        try {
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

          if (customerReceipt.ok) {
            const blob = await customerReceipt.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${orderForPrinting.orderNumber}-customer-receipt.bin`;
            anchor.click();
            URL.revokeObjectURL(url);
          } else {
            toast.warning("Customer receipt printing failed, but order is saved.");
          }

          if (!kitchenReceipt.ok) {
            toast.warning("Kitchen ticket printing failed, but order is saved.");
          }
        } catch {
          toast.warning("Printer bridge unreachable, but order is saved.");
        }
      }
    } catch (err) {
      toast.error("Checkout failed. Please try again.");
      console.error("Checkout error:", err);
    } finally {
      setCheckingOut(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-lg text-slate-500">Loading POS data...</span>
      </div>
    );
  }

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
          {categories.map((category) => {
            const catId = resolveId(category);
            return (
              <button
                key={catId}
                type="button"
                onClick={() => setActiveCategory(catId)}
                className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition ${activeCategory === catId ? "border-orange-300 bg-orange-50 text-orange-700" : "border-orange-100 bg-white hover:bg-orange-50/60"}`}
              >
                <span className="font-medium">{category.name}</span>
                <Badge>
                  {
                    products.filter(
                      (product) => resolveCategoryId(product.categoryId) === catId,
                    ).length
                  }
                </Badge>
              </button>
            );
          })}

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
                key={resolveId(product)}
                type="button"
                onClick={() => addItem(product)}
                className={`group overflow-hidden rounded-[24px] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(249,115,22,0.15)] ${product.available ? "border-orange-100" : "border-slate-200 opacity-70"}`}
              >
                <div className="flex h-40 items-center justify-center rounded-[18px] bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 text-6xl text-orange-500">
                  ðŸ½ï¸
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
                    Stock {product.stock ?? 0}
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
            {mode === "dine-in" && (
              <select
                className="h-11 w-full rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
                value={selectedTable ? resolveId(selectedTable) : ""}
                onChange={(event) =>
                  setSelectedTable(
                    tables.find((table) => resolveId(table) === event.target.value),
                  )
                }
              >
                <option value="">-- Select Table --</option>
                {tables.map((table) => (
                  <option key={resolveId(table)} value={resolveId(table)}>
                    {table.label} - {table.status}
                  </option>
                ))}
              </select>
            )}
            <select
              className="h-11 w-full rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
              value={selectedCustomer ? resolveId(selectedCustomer) : ""}
              onChange={(event) =>
                setSelectedCustomer(
                  customers.find(
                    (customer) => resolveId(customer) === event.target.value,
                  ),
                )
              }
            >
              <option value="">-- Walk-in Customer --</option>
              {customers.map((customer) => (
                <option key={resolveId(customer)} value={resolveId(customer)}>
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
            <Button variant="outline" onClick={holdOrder} disabled={checkingOut}>
              <HandCoins className="h-4 w-4" /> Hold Order
            </Button>
            <Button variant="outline" onClick={resumeOrder} disabled={checkingOut}>
              <Check className="h-4 w-4" /> Resume Order
            </Button>
            <Button variant="outline" onClick={splitBill} disabled={checkingOut}>
              <Split className="h-4 w-4" /> Split Bill
            </Button>
            <Button variant="outline" onClick={mergeBill} disabled={checkingOut}>
              <Merge className="h-4 w-4" /> Merge Bill
            </Button>
            <Button variant="secondary" onClick={clearOrder} disabled={checkingOut}>
              <Trash2 className="h-4 w-4" /> Clear Order
            </Button>
            <Button onClick={() => void checkout(paymentMethod)} disabled={checkingOut}>
              {checkingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {checkingOut ? "Processing..." : "Checkout"}
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
            disabled={checkingOut}
          >
            {checkingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {checkingOut ? "Processing..." : "Print Bill & Confirm"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
