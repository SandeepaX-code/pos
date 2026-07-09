import type { RouteConfig } from "./types";
import { registry } from "./registry";

export function createRoute(route: RouteConfig) {
  registry.registerPath(route);
  return route;
}
