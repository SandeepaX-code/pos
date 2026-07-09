import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const SupplierSchema = new Schema(
  {
    company: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    contactName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    purchaseHistory: [
      {
        purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder" },
        referenceNumber: { type: String, trim: true },
        amount: { type: Number, min: 0 },
        purchasedAt: { type: Date },
      },
    ],
    active: { type: Boolean, default: true },
  },
  schemaOptions,
);

SupplierSchema.index({ active: 1, company: 1 });
SupplierSchema.index({ email: 1 });

export type SupplierEntity = InferSchemaType<typeof SupplierSchema>;
export type SupplierDocument = HydratedDocument<SupplierEntity>;

export const SupplierModel =
  models.Supplier || model("Supplier", SupplierSchema);
