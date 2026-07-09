import { z } from "zod";

import { passwordComplexitySchema } from "@/lib/auth/password";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid object id");

const avatarSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/"),
    "Avatar must be a valid URL or path",
  )
  .optional();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const sortFieldSchema = z.enum([
  "fullName",
  "username",
  "email",
  "role",
  "createdAt",
  "lastLoginAt",
  "active",
]);

export const userListQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(160).optional(),
  roleId: objectIdSchema.optional(),
  role: z.string().trim().min(2).max(80).optional(),
  branchId: objectIdSchema.optional(),
  active: z.coerce.boolean().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  sortBy: sortFieldSchema.default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const userCreateSchema = z
  .object({
    fullName: z.string().trim().min(1).max(160),
    username: z.string().trim().min(3).max(64),
    email: z.string().trim().email(),
    phone: z.string().trim().min(6).max(40),
    password: passwordComplexitySchema,
    confirmPassword: z.string().min(8).max(128),
    roleId: objectIdSchema,
    branchId: objectIdSchema,
    active: z.boolean().default(true),
    avatar: avatarSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const userUpdateSchema = z.object({
  fullName: z.string().trim().min(1).max(160).optional(),
  username: z.string().trim().min(3).max(64).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(6).max(40).optional(),
  roleId: objectIdSchema.optional(),
  branchId: objectIdSchema.optional(),
  active: z.boolean().optional(),
  avatar: avatarSchema,
});

export const userStatusSchema = z.object({
  active: z.boolean(),
});

export const userResetPasswordSchema = z.object({
  newPassword: passwordComplexitySchema.optional(),
});

export const userChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(128),
    newPassword: passwordComplexitySchema,
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const userProfileUpdateSchema = z.object({
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(6).max(40).optional(),
  avatar: avatarSchema,
});

export const roleListQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(160).optional(),
  active: z.coerce.boolean().optional(),
});

export const roleCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  label: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional(),
  permissions: z.array(objectIdSchema).default([]),
  active: z.boolean().default(true),
});

export const roleUpdateSchema = z.object({
  label: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(500).optional(),
  permissions: z.array(objectIdSchema).optional(),
  active: z.boolean().optional(),
});

export type UserListQueryInput = z.infer<typeof userListQuerySchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserResetPasswordInput = z.infer<typeof userResetPasswordSchema>;
export type UserChangePasswordInput = z.infer<typeof userChangePasswordSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type RoleListQueryInput = z.infer<typeof roleListQuerySchema>;
export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;

export const permissionListQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(160).optional(),
  group: z.string().trim().max(80).optional(),
});

export type PermissionListQueryInput = z.infer<typeof permissionListQuerySchema>;

