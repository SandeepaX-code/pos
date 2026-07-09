import { extendZodWithOpenApi } from "./zod-to-openapi";
import type { ZodTypeAny } from "zod";

extendZodWithOpenApi();

export function zodToOpenApiSchema(schema: ZodTypeAny) {
  return schema;
}
