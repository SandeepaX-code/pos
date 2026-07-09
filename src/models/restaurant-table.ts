import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const RestaurantTableSchema = new Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      min: 1,
    },
    label: { type: String, required: true, trim: true },
    seats: { type: Number, required: true, min: 1 },
    zone: { type: String, required: true, trim: true },
    floor: { type: Number, required: true, index: true, min: 0 },
    section: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning", "out_of_service"],
      default: "available",
      index: true,
    },
    currentOrderId: { type: Schema.Types.ObjectId, ref: "Order" },
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation" },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },

    // Backward-compatible fields used by existing POS/order flow
    billId: { type: Schema.Types.ObjectId, ref: "Bill" },
    mergedIntoTableId: { type: Schema.Types.ObjectId, ref: "RestaurantTable" },
  },
  schemaOptions,
);

export type RestaurantTableEntity = InferSchemaType<
  typeof RestaurantTableSchema
>;
export type RestaurantTableDocument = HydratedDocument<RestaurantTableEntity>;

export const RestaurantTableModel =
  models.RestaurantTable || model("RestaurantTable", RestaurantTableSchema);
