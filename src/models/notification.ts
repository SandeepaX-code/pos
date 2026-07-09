import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const NotificationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "low-stock",
        "new-order",
        "kitchen-ready",
        "payment-completed",
        "printer-offline",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    recipientId: { type: Schema.Types.ObjectId, ref: "User" },
    readAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  schemaOptions,
);

export type NotificationEntity = InferSchemaType<typeof NotificationSchema>;
export type NotificationDocument = HydratedDocument<NotificationEntity>;

export const NotificationModel =
  models.Notification || model("Notification", NotificationSchema);
