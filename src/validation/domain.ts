import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid object id");

export const orderItemSchema = z.object({
  productId: objectIdSchema,
  name: z.string().min(1).max(160),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  notes: z.string().max(500).optional(),
  modifiers: z.array(z.string().max(80)).optional(),
});

export const checkoutOrderSchema = z.object({
  branchId: objectIdSchema,
  tableId: objectIdSchema.optional(),
  customerId: objectIdSchema.optional(),
  waiterId: objectIdSchema,
  cashierId: objectIdSchema.optional(),
  customerName: z.string().max(160).optional(),
  waiterName: z.string().min(1).max(160),
  tableLabel: z.string().max(80).optional(),
  paymentMethod: z.enum(["cash", "card", "qr", "mixed"]),
  items: z.array(orderItemSchema).min(1),
  discount: z.number().min(0).default(0),
  notes: z.string().max(1000).optional(),
  source: z
    .enum(["pos", "online", "reservation", "walkin", "dine-in", "takeaway"])
    .default("pos"),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  printCustomerReceipt: z.boolean().default(true),
  printKitchenTicket: z.boolean().default(true),
});

export const inventoryAdjustmentSchema = z.object({
  inventoryId: objectIdSchema,
  branchId: objectIdSchema,
  productId: objectIdSchema,
  createdBy: objectIdSchema,
  type: z.enum(["in", "out", "waste", "adjustment"]),
  quantity: z.number().int().positive(),
  reason: z.string().min(1).max(500),
  referenceType: z.string().max(80).optional(),
  referenceId: objectIdSchema.optional(),
});

export const inventoryUpsertSchema = z.object({
  productId: objectIdSchema,
  branchId: objectIdSchema,
  name: z.string().min(1).max(160),
  unit: z.string().min(1).max(40),
  stockOnHand: z.number().int().min(0).default(0),
  stockReserved: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(0),
  expiryDate: z.coerce.date().optional(),
  barcode: z.string().max(80).optional(),
  lastCountedAt: z.coerce.date().optional(),
  autoDeduct: z.boolean().default(true),
});

export const customerUpsertSchema = z.object({
  name: z.string().min(1).max(160),
  phone: z.string().min(6).max(40),
  email: z.string().email().optional(),
  birthday: z.coerce.date().optional(),
  address: z.string().max(500).optional(),
  loyaltyPoints: z.number().int().min(0).default(0),
  favoriteOrders: z.array(z.string().max(160)).default([]),
  notes: z.string().max(1000).optional(),
  active: z.boolean().default(true),
});

export const supplierUpsertSchema = z.object({
  company: z.string().min(1).max(160),
  contactName: z.string().min(1).max(160),
  phone: z.string().min(6).max(40),
  email: z.string().email(),
  address: z.string().min(1).max(500),
  active: z.boolean().default(true),
});

export const tableUpsertSchema = z.object({
  label: z.string().min(1).max(80),
  seats: z.number().int().positive(),
  zone: z.string().min(1).max(80),
  status: z.enum([
    "available",
    "occupied",
    "reserved",
    "cleaning",
    "merged",
    "split",
  ]),
  branchId: objectIdSchema,
  billId: objectIdSchema.optional(),
  reservationId: objectIdSchema.optional(),
  mergedIntoTableId: objectIdSchema.optional(),
});

export const orderStatusSchema = z.enum([
  "pending",
  "preparing",
  "ready",
  "delivered",
  "paid",
  "void",
]);

export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>;
export type InventoryAdjustmentInput = z.infer<
  typeof inventoryAdjustmentSchema
>;
export type InventoryUpsertInput = z.infer<typeof inventoryUpsertSchema>;
export type CustomerUpsertInput = z.infer<typeof customerUpsertSchema>;
export type SupplierUpsertInput = z.infer<typeof supplierUpsertSchema>;
export type TableUpsertInput = z.infer<typeof tableUpsertSchema>;
