import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const StockMovementSchema = new Schema(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["in", "out", "waste", "adjustment"],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    referenceType: { type: String, trim: true },
    referenceId: { type: Schema.Types.ObjectId },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  },
  schemaOptions,
);

StockMovementSchema.index({ branchId: 1, createdAt: -1 });
StockMovementSchema.index({ inventoryId: 1, createdAt: -1 });
StockMovementSchema.index({ productId: 1, type: 1, createdAt: -1 });

export type StockMovementEntity = InferSchemaType<typeof StockMovementSchema>;
export type StockMovementDocument = HydratedDocument<StockMovementEntity>;

export const StockMovementModel =
  models.StockMovement || model("StockMovement", StockMovementSchema);
