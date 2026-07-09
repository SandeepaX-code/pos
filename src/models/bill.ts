import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { lineItemSchema, schemaOptions } from "@/models/_shared";

const BillSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    tableId: { type: Schema.Types.ObjectId, ref: "RestaurantTable" },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    cashierId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cashierName: { type: String, required: true, trim: true },
    tableLabel: { type: String, trim: true },
    customerName: { type: String, trim: true },
    items: [lineItemSchema],
    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    serviceCharge: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "qr", "mixed"],
      required: true,
    },
    qrReference: { type: String, trim: true },
    notes: { type: String, trim: true },
    printedAt: { type: Date },
  },
  schemaOptions,
);

export type BillEntity = InferSchemaType<typeof BillSchema>;
export type BillDocument = HydratedDocument<BillEntity>;

export const BillModel = models.Bill || model("Bill", BillSchema);
