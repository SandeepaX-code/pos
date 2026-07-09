import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { lineItemSchema, schemaOptions } from "@/models/_shared";

const KitchenOrderSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    orderNumber: { type: String, required: true, trim: true, index: true },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    tableId: { type: Schema.Types.ObjectId, ref: "RestaurantTable" },
    tableLabel: { type: String, required: true, trim: true },
    waiterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    waiterName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "delivered"],
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
    notes: { type: String, trim: true },
    printedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  schemaOptions,
);

export type KitchenOrderEntity = InferSchemaType<typeof KitchenOrderSchema>;
export type KitchenOrderDocument = HydratedDocument<KitchenOrderEntity>;

export const KitchenOrderModel =
  models.KitchenOrder || model("KitchenOrder", KitchenOrderSchema);
