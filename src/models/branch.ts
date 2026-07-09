import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const BranchSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    active: { type: Boolean, default: true },
    taxRate: { type: Number, default: 0.08, min: 0 },
    serviceChargeRate: { type: Number, default: 0.05, min: 0 },
    currencyCode: { type: String, default: "LKR", trim: true },
  },
  schemaOptions,
);

export type BranchEntity = InferSchemaType<typeof BranchSchema>;
export type BranchDocument = HydratedDocument<BranchEntity>;

export const BranchModel = models.Branch || model("Branch", BranchSchema);
