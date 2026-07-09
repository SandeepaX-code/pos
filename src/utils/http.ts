import { NextResponse } from "next/server";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "NOT_FOUND"
  | "INVALID_TRANSITION"
  | "INVALID_CREDENTIALS"
  | "REFRESH_INVALID"
  | "USER_INACTIVE"
  | "PASSWORD_REUSED"
  | "INVALID_CURRENT_PASSWORD"
  | "ROLE_PROTECTED"
  | "ROLE_IN_USE"
  | "USER_ROLE_ESCALATION"
  | "SELF_DELETE_FORBIDDEN"
  | "SELF_ROLE_ESCALATION"
  | "INTERNAL_ERROR";

export function jsonSuccess<T>(data: T, status = 200, message = "Success") {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function jsonError(
  status: number,
  message: string,
  errorCode: ErrorCode,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      success: false,
      message,
      errorCode,
      ...(extra ? { details: extra } : {}),
    },
    { status },
  );
}
