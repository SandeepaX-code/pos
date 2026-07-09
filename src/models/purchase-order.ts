import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { purchaseLineSchema, schemaOptions } from "@/models/_shared";

const PurchaseOrderSchema = new Schema(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    purchaseOrderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "ordered", "partial", "received", "cancelled"],
      default: "draft",
      index: true,
    },
    orderDate: { type: Date, required: true },
    expectedDate: { type: Date },
    receivedDate: { type: Date },
    notes: { type: String, trim: true },
    items: [purchaseLineSchema],
    subtotal: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  schemaOptions,
);

PurchaseOrderSchema.index({ branchId: 1, status: 1, orderDate: -1 });
PurchaseOrderSchema.index({ supplierId: 1, status: 1, orderDate: -1 });

export type PurchaseOrderEntity = InferSchemaType<typeof PurchaseOrderSchema>;
export type PurchaseOrderDocument = HydratedDocument<PurchaseOrderEntity>;

export const PurchaseOrderModel =
  models.PurchaseOrder || model("PurchaseOrder", PurchaseOrderSchema);
