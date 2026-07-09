export const bearerAuthSecurity = {
  type: "http" as const,
  scheme: "bearer" as const,
  bearerFormat: "JWT" as const,
};
