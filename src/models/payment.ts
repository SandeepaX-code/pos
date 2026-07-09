import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const PaymentSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    billId: { type: Schema.Types.ObjectId, ref: "Bill", index: true },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    cashierId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["cash", "card", "qr", "mixed"],
      required: true,
      index: true,
    },
    reference: { type: String, trim: true },
    receivedAmount: { type: Number, min: 0 },
    changeAmount: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
      index: true,
    },
    paidAt: { type: Date, default: Date.now },
  },
  schemaOptions,
);

export type PaymentEntity = InferSchemaType<typeof PaymentSchema>;
export type PaymentDocument = HydratedDocument<PaymentEntity>;

export const PaymentModel = models.Payment || model("Payment", PaymentSchema);
