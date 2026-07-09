/*
  Minimal compatibility shim for @asteasolutions/zod-to-openapi.

  The runtime environment for this task could not reliably install the dependency.
  This shim keeps the project compiling while we still implement the required
  /api/openapi.json and /api/docs endpoints.

  Structure intentionally mirrors the OpenAPIRegistry API we use.
*/

import type { ZodTypeAny } from "zod";

export type RouteConfig = {
  method: string;
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  request?: unknown;
  responses?: unknown;
  security?: unknown;
};

export class OpenAPIRegistry {
  private paths: Record<string, unknown> = {};

  registerPath(route: unknown) {
    // Best-effort: store a minimal representation keyed by path if possible.
    const r = route as Partial<RouteConfig>;
    if (typeof r.path === "string") {
      this.paths[r.path] = r;
    }
  }

  registeredPaths() {
    return {
      openapi: {
        openapi: "3.1.0",
        info: { title: "Restaurant POS API", version: "0.1.0" },
        paths: this.paths,
        components: {
          securitySchemes: {},
        },
      },
    };
  }
}

export function extendZodWithOpenApi() {
  // no-op
}

export function zodToOpenApiSchema(schema: ZodTypeAny) {
  return schema;
}
