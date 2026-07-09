export type TableManagementErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "NOT_FOUND"
  | "INVALID_TRANSITION"
  | "INTERNAL_ERROR";

export class TableManagementError extends Error {
  public readonly errorCode: TableManagementErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    errorCode: TableManagementErrorCode,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "TableManagementError";
    this.errorCode = errorCode;
    this.details = details;
  }
}
