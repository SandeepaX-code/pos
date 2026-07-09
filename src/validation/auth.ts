import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3, "Username is required").max(64),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  rememberMe: z.boolean().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginFormValues = z.input<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
