import bcrypt from "bcryptjs";
import { z } from "zod";

export const PASSWORD_COMPLEXITY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";

export const passwordComplexitySchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function generateTemporaryPassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;

  const pick = (source: string) =>
    source[Math.floor(Math.random() * source.length)];

  const required = [pick(upper), pick(lower), pick(digits), pick(special)];
  const remaining = Array.from({ length: length - required.length }, () =>
    pick(all),
  );

  const chars = [...required, ...remaining];
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

export async function isPasswordReused(
  newPassword: string,
  previousPasswordHash?: string | null,
) {
  if (!previousPasswordHash) {
    return false;
  }

  return comparePassword(newPassword, previousPasswordHash);
}
