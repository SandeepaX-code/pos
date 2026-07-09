import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const CustomerHistorySchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    orderNumber: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    visitedAt: { type: Date, required: true },
  },
  { _id: false },
);

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    email: { type: String, trim: true, lowercase: true },
    birthday: { type: Date },
    address: { type: String, trim: true },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    favoriteOrders: [{ type: String, trim: true }],
    purchaseHistory: [CustomerHistorySchema],
    notes: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  schemaOptions,
);

CustomerSchema.index({ active: 1, name: 1 });
CustomerSchema.index({ email: 1 }, { sparse: true });

export type CustomerEntity = InferSchemaType<typeof CustomerSchema>;
export type CustomerDocument = HydratedDocument<CustomerEntity>;

export const CustomerModel =
  models.Customer || model("Customer", CustomerSchema);
