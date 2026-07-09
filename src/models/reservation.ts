import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const ReservationSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    guestCount: { type: Number, required: true, min: 1 },

    reservationDate: { type: String, required: true, trim: true, index: true },
    reservationTime: { type: String, required: true, trim: true, index: true },

    assignedTable: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantTable",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "checked_in", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },

    // Backward compatible fields used by earlier code paths
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantTable",
      index: true,
    },
    tableLabel: { type: String, required: true, trim: true },
    partySize: { type: Number, required: true, min: 1 },
    time: { type: Date, required: true, index: true },

    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
  },
  schemaOptions,
);

export type ReservationEntity = InferSchemaType<typeof ReservationSchema>;
export type ReservationDocument = HydratedDocument<ReservationEntity>;

export const ReservationModel =
  models.Reservation || model("Reservation", ReservationSchema);
