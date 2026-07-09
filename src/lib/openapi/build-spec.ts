import { registry } from "./registry";

export function buildOpenApiSpec() {
  return registry.registeredPaths().openapi;
}
