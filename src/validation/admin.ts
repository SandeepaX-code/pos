import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid object id");

export const adminUserSchema = z.object({
  fullName: z.string().min(1).max(160),
  username: z.string().min(3).max(64),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  role: z.enum([
    "superAdmin",
    "admin",
    "cashier",
    "waiter",
    "kitchenStaff",
    "inventoryManager",
    "accountant",
  ]),
  branchId: objectIdSchema,
  password: z.string().min(8).max(128),
  active: z.boolean().default(true),
  avatar: z.string().url().optional(),
});

export const adminUserUpdateSchema = adminUserSchema.partial().extend({
  password: z.string().min(8).max(128).optional(),
});

export const adminUserFormSchema = z.object({
  fullName: z.string().min(1).max(160),
  username: z.string().min(3).max(64),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  role: z.enum([
    "superAdmin",
    "admin",
    "cashier",
    "waiter",
    "kitchenStaff",
    "inventoryManager",
    "accountant",
  ]),
  branchId: objectIdSchema,
  password: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(8).max(128).optional(),
  ),
  active: z.boolean().default(true),
  avatar: z.string().url().optional(),
});

export const branchUpsertSchema = z.object({
  name: z.string().min(1).max(160),
  code: z.string().min(2).max(20),
  city: z.string().min(1).max(120),
  address: z.string().min(1).max(500),
  phone: z.string().min(6).max(40),
  email: z.string().email(),
  active: z.boolean().default(true),
  taxRate: z.number().min(0).max(1).default(0.08),
  serviceChargeRate: z.number().min(0).max(1).default(0.05),
  currencyCode: z.string().min(3).max(8).default("LKR"),
});

export const categoryUpsertSchema = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(160),
  icon: z.string().min(1).max(80),
  image: z.string().min(1).max(255),
  color: z.string().min(1).max(32),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const productUpsertSchema = z.object({
  name: z.string().min(1).max(160),
  sku: z.string().min(1).max(80),
  categoryId: objectIdSchema,
  image: z.string().min(1).max(255),
  price: z.number().min(0),
  cost: z.number().min(0),
  available: z.boolean().default(true),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(0),
  branchId: objectIdSchema.optional(),
  description: z.string().max(2000).optional(),
});

export const recipeIngredientSchema = z.object({
  productId: objectIdSchema,
  name: z.string().min(1).max(160),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(32),
  cost: z.number().min(0).optional(),
  wastageRate: z.number().min(0).max(100).optional(),
});

export const recipeUpsertSchema = z.object({
  productId: objectIdSchema,
  name: z.string().min(1).max(160),
  yieldCount: z.number().int().min(1),
  ingredients: z.array(recipeIngredientSchema).min(1),
  instructions: z.array(z.string().max(2000)).optional(),
  active: z.boolean().optional(),
}).refine((data) => {
  // prevent duplicate ingredients
  const ids = data.ingredients.map((i) => i.productId);
  return new Set(ids).size === ids.length;
}, {
  message: "Duplicate ingredient productId",
  path: ["ingredients"],
});

export const inventoryItemUpsertSchema = z.object({
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

export const adminInventoryAdjustmentSchema = z.object({
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

export type AdminUserInput = z.infer<typeof adminUserSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type AdminUserFormInput = z.infer<typeof adminUserFormSchema>;
export type BranchUpsertInput = z.infer<typeof branchUpsertSchema>;
export type CategoryUpsertInput = z.infer<typeof categoryUpsertSchema>;
export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;
export type InventoryItemUpsertInput = z.infer<
  typeof inventoryItemUpsertSchema
>;
export type AdminInventoryAdjustmentInput = z.infer<
  typeof adminInventoryAdjustmentSchema
>;
