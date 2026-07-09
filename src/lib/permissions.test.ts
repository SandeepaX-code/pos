import { describe, expect, it } from "vitest";

import {
  getRoleLabel,
  hasPermission,
  userHasPermission,
} from "./permissions";

describe("permissions", () => {
  it("grants super admin full access", () => {
    expect(hasPermission("superAdmin", "settings.manage")).toBe(true);
    expect(
      userHasPermission("superAdmin", [], "users.delete"),
    ).toBe(true);
  });

  it("expands manage permissions for admin users", () => {
    expect(
      userHasPermission("admin", ["users.manage"], "users.view"),
    ).toBe(true);
    expect(
      userHasPermission("admin", ["roles.manage"], "roles.create"),
    ).toBe(true);
  });

  it("returns a readable role label", () => {
    expect(getRoleLabel("inventoryManager")).toBe("Inventory Manager");
  });

  it("assigns cashier billing permissions", () => {
    expect(hasPermission("cashier", "billing.print")).toBe(true);
    expect(hasPermission("cashier", "orders.checkout")).toBe(true);
  });
});
