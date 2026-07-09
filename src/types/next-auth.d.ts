import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      branchId: string;
      permissions: string[];
    };
  }

  interface User {
    role: string;
    branchId: string;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    branchId?: string;
    permissions?: string[];
  }
}

declare module "next/server" {
  interface NextRequest {
    user?: import("@/lib/auth/auth").AuthenticatedUser;
  }
}
