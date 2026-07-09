import crypto from "crypto";

import { getToken } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { AUTH } from "@/constants/auth";
import {
  rolePermissions,
  userHasPermission,
} from "@/lib/permissions";
import { connectToDatabase } from "@/lib/mongoose";
import { ActivityLogModel } from "@/models/activity-log";
import { RefreshTokenModel } from "@/models/refresh-token";
import { RoleModel } from "@/models/role";
import { UserModel } from "@/models/user";
import { jsonError } from "@/utils/http";

import { comparePassword, hashPassword } from "./password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type AuthTokenClaims,
} from "./jwt";

const credentialsSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(8).max(128),
});

export const loginRequestSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(8).max(128),
});

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
});

type UserLean = {
  _id: unknown;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  branchId: unknown;
  active: boolean;
  avatar?: string | null;
  lastLoginAt?: Date | null;
};

export type AuthenticatedUser = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  branchId: string;
  active: boolean;
  avatar?: string;
  lastLoginAt?: string;
  permissions: string[];
};

export type AuthResult = {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
};

export type AuthenticatedRequest = NextRequest & {
  user?: AuthenticatedUser;
};

type AuthHandler<Context = unknown> = (
  req: AuthenticatedRequest,
  context: Context,
) => Promise<Response>;

export const AUTH_ERROR_MESSAGES = {
  unauthorized: "Authentication required.",
  forbidden: "You do not have permission to access this resource.",
} as const;

async function logPermissionDenied(
  user: AuthenticatedUser,
  permission: string,
  req: AuthenticatedRequest,
) {
  await ActivityLogModel.create({
    userId: user.id,
    userName: user.fullName,
    action: "permission_denied",
    entity: "auth",
    entityId: user.id,
    branchId: user.branchId,
    metadata: {
      permission,
      path: req.nextUrl.pathname,
      method: req.method,
    },
  }).catch(() => undefined);
}

export async function resolveRequestUser(
  req: NextRequest,
): Promise<AuthenticatedUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const bearerToken = header.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : null;

  if (bearerToken) {
    try {
      const claims = verifyAccessToken(bearerToken);
      return await getCurrentUser(claims.sub);
    } catch {
      return null;
    }
  }

  const sessionToken = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (sessionToken?.sub) {
    return getCurrentUser(String(sessionToken.sub));
  }

  return null;
}

async function getRolePermissions(role: string) {
  const roleDoc = await RoleModel.findOne({ name: role, active: true })
    .populate("permissions")
    .lean<{ permissions?: Array<{ key?: string }> }>();

  if (!roleDoc) {
    return Array.from(
      rolePermissions[role as keyof typeof rolePermissions] ?? [],
    );
  }

  return (roleDoc.permissions ?? [])
    .map((permission: { key?: string } | null | undefined) => permission?.key)
    .filter(
      (value: string | undefined): value is string => typeof value === "string",
    );
}

function hashRefreshToken(refreshToken: string) {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is required");
  }

  return crypto.createHmac("sha256", secret).update(refreshToken).digest("hex");
}

function serializeUser(
  user: UserLean,
  permissions: string[],
): AuthenticatedUser {
  return {
    id: String(user._id),
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    branchId: String(user.branchId),
    active: user.active,
    avatar: user.avatar ?? undefined,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : undefined,
    permissions,
  };
}

async function issueTokens(user: UserLean): Promise<AuthResult> {
  const permissions = await getRolePermissions(user.role);
  const claims: AuthTokenClaims = {
    sub: String(user._id),
    role: user.role,
    permissions,
    branchId: String(user.branchId),
    jti: crypto.randomUUID(),
  };

  const accessToken = generateAccessToken(claims);
  const refreshToken = generateRefreshToken(claims);
  const tokenHash = hashRefreshToken(refreshToken);

  await RefreshTokenModel.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + AUTH.refreshTokenTtlSeconds * 1000),
    revoked: false,
    replacedByToken: null,
  });

  return {
    user: serializeUser(user, permissions),
    accessToken,
    refreshToken,
  };
}

export async function login(params: { username: string; password: string }) {
  await connectToDatabase();

  const userDoc = await UserModel.findOne({
    username: params.username,
    active: true,
  })
    .select(
      "+passwordHash fullName username email phone role branchId active avatar lastLoginAt",
    )
    .lean();

  if (!userDoc) {
    throw Object.assign(new Error("Invalid credentials"), {
      code: "INVALID_CREDENTIALS" as const,
    });
  }

  const passwordMatches = await comparePassword(
    params.password,
    String((userDoc as { passwordHash: string }).passwordHash),
  );

  if (!passwordMatches) {
    throw Object.assign(new Error("Invalid credentials"), {
      code: "INVALID_CREDENTIALS" as const,
    });
  }

  const result = await issueTokens(userDoc as UserLean);

  await UserModel.updateOne(
    { _id: userDoc._id },
    { $set: { lastLoginAt: new Date() } },
  );

  await ActivityLogModel.create({
    userId: userDoc._id,
    userName: userDoc.fullName,
    action: "login",
    entity: "auth",
    entityId: userDoc._id,
    branchId: userDoc.branchId,
    metadata: { username: userDoc.username },
  });

  return result;
}

export async function refresh(params: { refreshToken: string }) {
  await connectToDatabase();

  const claims = verifyRefreshToken(params.refreshToken);
  const tokenHash = hashRefreshToken(params.refreshToken);
  const activeToken = await RefreshTokenModel.findOne({
    tokenHash,
    revoked: false,
  });

  if (!activeToken) {
    throw Object.assign(new Error("Refresh token revoked or invalid"), {
      code: "REFRESH_INVALID" as const,
    });
  }

  const userDoc = (await UserModel.findById(claims.sub)
    .select(
      "fullName username email phone role branchId active avatar lastLoginAt",
    )
    .lean()) as UserLean | null;

  if (!userDoc || !userDoc.active) {
    throw Object.assign(new Error("User inactive"), {
      code: "USER_INACTIVE" as const,
    });
  }

  const next = await issueTokens(userDoc);

  await RefreshTokenModel.updateOne(
    { _id: activeToken._id },
    {
      $set: {
        revoked: true,
        replacedByToken: hashRefreshToken(next.refreshToken),
      },
    },
  );

  return next;
}

export async function logout(params: { refreshToken: string | null }) {
  await connectToDatabase();

  if (!params.refreshToken) {
    return;
  }

  let claims: AuthTokenClaims | null = null;

  try {
    claims = verifyRefreshToken(params.refreshToken);
  } catch {
    return;
  }

  const tokenHash = hashRefreshToken(params.refreshToken);
  const tokenDoc = await RefreshTokenModel.findOne({ tokenHash });

  if (!tokenDoc) {
    return;
  }

  await RefreshTokenModel.updateOne(
    { _id: tokenDoc._id },
    { $set: { revoked: true } },
  );

  const userDoc = await UserModel.findById(claims.sub)
    .select("fullName branchId")
    .lean();

  if (!userDoc) {
    return;
  }

  await ActivityLogModel.create({
    userId: userDoc._id,
    userName: userDoc.fullName,
    action: "logout",
    entity: "auth",
    entityId: userDoc._id,
    branchId: userDoc.branchId,
    metadata: { tokenId: String(tokenDoc._id) },
  });
}

export async function changePassword(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  await connectToDatabase();

  const user = await UserModel.findById(params.userId).select(
    "+passwordHash active",
  );

  if (!user || !user.active) {
    throw Object.assign(new Error("Unauthorized"), {
      code: "UNAUTHORIZED" as const,
    });
  }

  const matches = await comparePassword(
    params.currentPassword,
    user.passwordHash,
  );

  if (!matches) {
    throw Object.assign(new Error("Current password is incorrect"), {
      code: "INVALID_CURRENT_PASSWORD" as const,
    });
  }

  user.passwordHash = await hashPassword(params.newPassword);
  await user.save();

  await RefreshTokenModel.updateMany(
    { userId: user._id, revoked: false },
    { $set: { revoked: true } },
  );
}

export async function getCurrentUser(userId: string) {
  await connectToDatabase();

  const userDoc = (await UserModel.findById(userId)
    .select(
      "fullName username email phone role branchId active avatar lastLoginAt",
    )
    .lean()) as UserLean | null;

  if (!userDoc || !userDoc.active) {
    return null;
  }

  return serializeUser(userDoc, await getRolePermissions(userDoc.role));
}

export function requireAuth<Context = unknown>(handler: AuthHandler<Context>) {
  return async (req: NextRequest, context: Context) => {
    const user = await resolveRequestUser(req);

    if (!user) {
      return jsonError(
        401,
        AUTH_ERROR_MESSAGES.unauthorized,
        "UNAUTHORIZED",
      );
    }

    (req as AuthenticatedRequest).user = user;
    return handler(req as AuthenticatedRequest, context);
  };
}

export function requireRole(...roles: string[]) {
  return async (req: AuthenticatedRequest) => {
    const user = req.user;
    if (!user) {
      return jsonError(
        401,
        AUTH_ERROR_MESSAGES.unauthorized,
        "UNAUTHORIZED",
      );
    }

    if (!roles.includes(user.role)) {
      await logPermissionDenied(user, `role:${roles.join("|")}`, req);
      return jsonError(
        403,
        AUTH_ERROR_MESSAGES.forbidden,
        "FORBIDDEN",
      );
    }

    return null;
  };
}

export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest) => {
    const user = req.user;
    if (!user) {
      return jsonError(
        401,
        AUTH_ERROR_MESSAGES.unauthorized,
        "UNAUTHORIZED",
      );
    }

    if (!userHasPermission(user.role, user.permissions ?? [], permission)) {
      await logPermissionDenied(user, permission, req);
      return jsonError(
        403,
        AUTH_ERROR_MESSAGES.forbidden,
        "FORBIDDEN",
      );
    }

    return null;
  };
}

export function requireAnyPermission(...permissions: string[]) {
  return async (req: AuthenticatedRequest) => {
    const user = req.user;
    if (!user) {
      return jsonError(
        401,
        AUTH_ERROR_MESSAGES.unauthorized,
        "UNAUTHORIZED",
      );
    }

    const allowed = permissions.some((permission) =>
      userHasPermission(user.role, user.permissions ?? [], permission),
    );

    if (!allowed) {
      await logPermissionDenied(user, permissions.join("|"), req);
      return jsonError(
        403,
        AUTH_ERROR_MESSAGES.forbidden,
        "FORBIDDEN",
      );
    }

    return null;
  };
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: AUTH.refreshTokenTtlSeconds,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials:
          | {
              username?: string;
              password?: string;
            }
          | undefined,
      ) {
        const parsed = credentialsSchema.safeParse({
          username: credentials?.username ?? "",
          password: credentials?.password ?? "",
        });

        if (!parsed.success) {
          return null;
        }

        await connectToDatabase();

        const user = await UserModel.findOne({
          username: parsed.data.username,
          active: true,
        })
          .select(
            "+passwordHash fullName username email phone role branchId avatar",
          )
          .lean();

        if (!user) {
          return null;
        }

        const ok = await comparePassword(
          parsed.data.password,
          String((user as { passwordHash: string }).passwordHash),
        );

        if (!ok) {
          return null;
        }

        const permissions = await getRolePermissions(user.role);

        await ActivityLogModel.create({
          userId: user._id,
          userName: user.fullName,
          action: "login",
          entity: "auth",
          entityId: user._id,
          branchId: user.branchId,
          metadata: { username: user.username, provider: "nextauth" },
        });

        return {
          id: String(user._id),
          name: user.fullName,
          email: user.email,
          image: user.avatar ?? undefined,
          role: user.role,
          branchId: String(user.branchId),
          permissions,
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.role = user.role;
        token.branchId = user.branchId;
        token.permissions = user.permissions;
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = String(token.sub ?? "");
        session.user.role = token.role ?? "cashier";
        session.user.branchId = token.branchId ?? "";
        session.user.permissions = token.permissions ?? [];
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
