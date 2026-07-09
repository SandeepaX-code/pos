import bcrypt from "bcryptjs";
import { model, models, Schema, type InferSchemaType } from "mongoose";

import { schemaOptions } from "@/models/_shared";

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    active: { type: Boolean, default: true },
    avatar: { type: String },
    lastLoginAt: { type: Date },
    mustChangePassword: { type: Boolean, default: false },
    previousPasswordHash: { type: String, select: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
  },
  schemaOptions,
);

UserSchema.index({ branchId: 1, active: 1 });
UserSchema.index({ role: 1, active: 1 });
UserSchema.index({ roleId: 1, active: 1 });
UserSchema.index({ deletedAt: 1 }, { sparse: true });
UserSchema.index({ passwordResetToken: 1 }, { sparse: true });

UserSchema.pre("save", async function hashPassword() {
  if (!this.isModified("passwordHash")) {
    return;
  }

  if (this.passwordHash.startsWith("$2")) {
    return;
  }

  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  role: string;
  comparePassword(password: string): Promise<boolean>;
};

UserSchema.methods.comparePassword = function comparePassword(
  password: string,
) {
  return bcrypt.compare(password, this.passwordHash);
};

export const UserModel = models.User || model("User", UserSchema);
