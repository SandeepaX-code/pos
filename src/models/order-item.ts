import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const OrderItemSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    modifiers: [{ type: String, trim: true }],
    kitchenStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "delivered", "void"],
      default: "pending",
      index: true,
    },
  },
  schemaOptions,
);

export type OrderItemEntity = InferSchemaType<typeof OrderItemSchema>;
export type OrderItemDocument = HydratedDocument<OrderItemEntity>;

export const OrderItemModel =
  models.OrderItem || model("OrderItem", OrderItemSchema);
