import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { lineItemSchema, schemaOptions } from "@/models/_shared";

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantTable",
      index: true,
    },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    waiterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cashierId: { type: Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, trim: true },
    waiterName: { type: String, required: true, trim: true },
    tableLabel: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "delivered", "paid", "void"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
      index: true,
    },
    items: [lineItemSchema],
    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    serviceCharge: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
    source: {
      type: String,
      enum: ["pos", "online", "reservation", "walkin", "dine-in", "takeaway"],
      default: "pos",
    },
    holds: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    mergedFromTableIds: [
      { type: Schema.Types.ObjectId, ref: "RestaurantTable" },
    ],
    inventoryDeductedAt: { type: Date, default: null, index: true },
  },
  schemaOptions,
);

export type OrderEntity = InferSchemaType<typeof OrderSchema>;
export type OrderDocument = HydratedDocument<OrderEntity>;

export const OrderModel = models.Order || model("Order", OrderSchema);
