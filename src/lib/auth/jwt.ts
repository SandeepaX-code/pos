import crypto from "crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";

export type AuthTokenClaims = {
  sub: string;
  role: string;
  permissions: string[];
  branchId?: string;
  jti: string;
};

type TokenKind = "access" | "refresh";

type StoredClaims = AuthTokenClaims & {
  tokenType: TokenKind;
};

function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is required");
  }

  return secret;
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is required");
  }

  return secret;
}

function signToken(
  claims: AuthTokenClaims,
  kind: TokenKind,
  secret: string,
  expiresIn: jwt.SignOptions["expiresIn"],
) {
  return jwt.sign(
    {
      ...claims,
      tokenType: kind,
    },
    secret,
    {
      expiresIn,
      issuer: "restaurant-pos-auth",
      audience: "restaurant-pos-api",
    },
  );
}

function assertTokenKind(token: JwtPayload | string, kind: TokenKind) {
  if (!token || typeof token === "string" || token.tokenType !== kind) {
    throw new Error("Invalid token type");
  }

  const { sub, role, permissions, branchId, jti } = token as StoredClaims;

  if (
    typeof sub !== "string" ||
    typeof role !== "string" ||
    !Array.isArray(permissions) ||
    !permissions.every((permission) => typeof permission === "string") ||
    typeof jti !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  if (branchId !== undefined && typeof branchId !== "string") {
    throw new Error("Invalid token payload");
  }

  return {
    sub,
    role,
    permissions,
    branchId,
    jti,
  } satisfies AuthTokenClaims;
}

export function generateAccessToken(claims: AuthTokenClaims) {
  const nextClaims = {
    ...claims,
    jti: claims.jti || crypto.randomUUID(),
  };

  return signToken(nextClaims, "access", getAccessSecret(), "15m");
}

export function generateRefreshToken(claims: AuthTokenClaims) {
  const nextClaims = {
    ...claims,
    jti: claims.jti || crypto.randomUUID(),
  };

  return signToken(nextClaims, "refresh", getRefreshSecret(), "7d");
}

export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, getAccessSecret(), {
    issuer: "restaurant-pos-auth",
    audience: "restaurant-pos-api",
  });

  return assertTokenKind(decoded, "access");
}

export function verifyRefreshToken(token: string) {
  const decoded = jwt.verify(token, getRefreshSecret(), {
    issuer: "restaurant-pos-auth",
    audience: "restaurant-pos-api",
  });

  return assertTokenKind(decoded, "refresh");
}
