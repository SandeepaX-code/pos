import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import type { RoleName } from "@/lib/permissions";

export const adminRoles: RoleName[] = ["superAdmin", "admin"];

export async function getAuthToken(request: NextRequest) {
  return getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
}

export async function requireAdminToken(request: NextRequest) {
  const token = await getAuthToken(request);

  if (!token || !token.role || !adminRoles.includes(token.role as RoleName)) {
    return null;
  }

  return token;
}
