import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const InventorySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    stockOnHand: { type: Number, default: 0, min: 0 },
    stockReserved: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date },
    barcode: { type: String, trim: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    lastCountedAt: { type: Date },
    autoDeduct: { type: Boolean, default: true },
  },
  schemaOptions,
);

InventorySchema.index({ branchId: 1, productId: 1 }, { unique: true });
InventorySchema.index({ branchId: 1, stockOnHand: 1, reorderLevel: 1 });
InventorySchema.index({ barcode: 1 }, { sparse: true });

export type InventoryEntity = InferSchemaType<typeof InventorySchema>;
export type InventoryDocument = HydratedDocument<InventoryEntity>;

export const InventoryModel =
  models.Inventory || model("Inventory", InventorySchema);
