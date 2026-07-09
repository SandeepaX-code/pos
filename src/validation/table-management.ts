import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid object id");

export const tableStatusEnum = z.enum([
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
  "OUT_OF_SERVICE",
]);

export const tableStatusTransitionEnum = z.enum([
  "open",
  "occupy",
  "reserve",
  "clean",
  "close",
]);

export const tableListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  floor: z.coerce.number().int().optional(),
  section: z.string().trim().optional(),
  status: tableStatusEnum.optional(),
  sortBy: z
    .enum([
      "tableNumber",
      "tableName",
      "capacity",
      "floor",
      "section",
      "createdAt",
      "updatedAt",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const tableCreateSchema = z.object({
  tableNumber: z.number().int().positive(),
  tableName: z.string().min(1).max(80),
  capacity: z.number().int().positive(),
  section: z.string().min(1).max(80),
  floor: z.number().int().min(0),
  status: z
    .enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "OUT_OF_SERVICE"])
    .default("AVAILABLE"),
  isActive: z.boolean().default(true),
});

export const tableUpdateSchema = z.object({
  tableNumber: z.number().int().positive().optional(),
  tableName: z.string().min(1).max(80).optional(),
  capacity: z.number().int().positive().optional(),
  section: z.string().min(1).max(80).optional(),
  floor: z.number().int().min(0).optional(),
  status: z
    .enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "OUT_OF_SERVICE"])
    .optional(),
  isActive: z.boolean().optional(),
});

export const tableIdParamSchema = z.object({
  id: objectIdSchema,
});

export const tableStatusPatchSchema = z.object({
  id: objectIdSchema,
  action: tableStatusTransitionEnum,
});

export const transferTablesSchema = z.object({
  fromTableId: objectIdSchema,
  toTableId: objectIdSchema,
});

export const mergeTablesSchema = z.object({
  primaryTableId: objectIdSchema,
  secondaryTableIds: z.array(objectIdSchema).min(1),
});

export const splitTablesSchema = z.object({
  fromTableId: objectIdSchema,
  // The split request is intentionally flexible; the implementation will
  // map these item ids to Order items on the bill.
  splitOrderItemIds: z.array(objectIdSchema).min(1).optional(),

  toTableId: objectIdSchema.optional(),
  keepCustomer: z.boolean().default(true),
});

export const reservationIdParamSchema = z.object({
  id: objectIdSchema,
});

export const reservationCreateSchema = z.object({
  customer: z.string().min(1).max(160),
  phone: z.string().trim().min(6).max(40).optional(),
  guestCount: z.number().int().min(1),
  reservationDate: z.string().min(1).max(20),
  reservationTime: z.string().min(1).max(10),
  // assignedTable is optional; if not provided we auto-assign.
  assignedTable: objectIdSchema.optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CANCELLED", "COMPLETED"])
    .default("PENDING"),
  notes: z.string().max(1000).optional(),
});

export const reservationUpdateSchema = z.object({
  customer: z.string().min(1).max(160).optional(),
  phone: z.string().trim().min(6).max(40).optional(),
  guestCount: z.number().int().min(1).optional(),
  reservationDate: z.string().min(1).max(20).optional(),
  reservationTime: z.string().min(1).max(10).optional(),
  assignedTable: objectIdSchema.optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CANCELLED", "COMPLETED"])
    .optional(),
  notes: z.string().max(1000).optional(),
});

export const reservationActionSchema = z.enum([
  "checkin",
  "cancel",
  "complete",
]);
