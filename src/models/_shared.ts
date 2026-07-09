import { Schema } from "mongoose";

export const schemaOptions = {
  timestamps: true,
  versionKey: false,
} as const;

export const lineItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    modifiers: [{ type: String, trim: true }],
  },
  { _id: false },
);

export const recipeIngredientSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    cost: { type: Number, required: true, min: 0 },
    wastageRate: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

export const purchaseLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    quantityOrdered: { type: Number, required: true, min: 1 },
    quantityReceived: { type: Number, default: 0, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "partial", "received", "cancelled"],
      default: "pending",
    },
  },
  { _id: false },
);
