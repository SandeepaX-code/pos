export const ALL_PERMISSIONS = [
  "dashboard.view",
  "users.view",
  "users.create",
  "users.update",
  "users.delete",
  "users.manage",
  "users.disable",
  "users.resetPassword",
  "roles.view",
  "roles.create",
  "roles.update",
  "roles.delete",
  "roles.manage",
  "roles.assign",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "categories.manage",
  "inventory.view",
  "inventory.create",
  "inventory.update",
  "inventory.delete",
  "inventory.manage",
  "inventory.receive",
  "orders.view",
  "orders.create",
  "orders.update",
  "orders.cancel",
  "orders.checkout",
  "tables.view",
  "tables.manage",
  "kitchen.view",
  "kitchen.update",
  "kitchen.print",
  "reports.view",
  "settings.manage",
  "billing.print",
  "customers.manage",
  "suppliers.manage",
  "branches.manage",
  "purchaseOrders.manage",
  "payments.create",
  "payments.view",
  "expenses.manage",
  "taxes.manage",
  "printers.manage",
  "menu.manage",
] as const;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];

export const rolePermissions = {
  superAdmin: [...ALL_PERMISSIONS],
  admin: [
    "dashboard.view",
    "users.view",
    "users.create",
    "users.update",
    "users.delete",
    "users.manage",
    "users.disable",
    "users.resetPassword",
    "roles.view",
    "roles.create",
    "roles.update",
    "roles.delete",
    "roles.manage",
    "roles.assign",
    "products.view",
    "products.create",
    "products.update",
    "products.delete",
    "categories.manage",
    "menu.manage",
    "inventory.view",
    "inventory.create",
    "inventory.update",
    "inventory.delete",
    "inventory.manage",
    "customers.manage",
    "suppliers.manage",
    "orders.view",
    "orders.create",
    "orders.update",
    "orders.cancel",
    "tables.view",
    "tables.manage",
    "reports.view",
    "settings.manage",
    "branches.manage",
    "printers.manage",
    "taxes.manage",
  ],
  cashier: [
    "dashboard.view",
    "orders.view",
    "orders.create",
    "orders.update",
    "orders.checkout",
    "billing.print",
    "customers.manage",
    "tables.view",
    "tables.manage",
    "payments.create",
  ],
  waiter: [
    "orders.view",
    "orders.create",
    "orders.update",
    "tables.view",
    "tables.manage",
  ],
  kitchenStaff: ["kitchen.view", "kitchen.update", "kitchen.print"],
  inventoryManager: [
    "inventory.view",
    "inventory.create",
    "inventory.update",
    "inventory.delete",
    "inventory.manage",
    "inventory.receive",
    "purchaseOrders.manage",
    "suppliers.manage",
  ],
  accountant: ["reports.view", "expenses.manage", "payments.view", "taxes.manage"],
} as const satisfies Record<string, readonly PermissionKey[]>;

export type RoleName = keyof typeof rolePermissions;

const MANAGE_PERMISSION_GRANTS: Partial<
  Record<PermissionKey, readonly PermissionKey[]>
> = {
  "users.manage": [
    "users.view",
    "users.create",
    "users.update",
    "users.delete",
    "users.disable",
    "users.resetPassword",
  ],
  "roles.manage": [
    "roles.view",
    "roles.create",
    "roles.update",
    "roles.delete",
    "roles.assign",
  ],
  "categories.manage": ["products.view", "products.create", "products.update"],
  "inventory.manage": [
    "inventory.view",
    "inventory.create",
    "inventory.update",
    "inventory.delete",
    "inventory.receive",
  ],
  "tables.manage": ["tables.view"],
};

export function isSuperAdmin(role: string) {
  return role === "superAdmin";
}

export function getRoleLabel(role: RoleName) {
  return role
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}

export function hasPermission(role: RoleName, permission: PermissionKey | string) {
  if (isSuperAdmin(role)) {
    return true;
  }

  const permissions = rolePermissions[role] as readonly string[];
  return permissions.includes(permission);
}

export function userHasPermission(
  role: string,
  permissions: string[],
  permission: string,
) {
  if (isSuperAdmin(role)) {
    return true;
  }

  if (permissions.includes(permission)) {
    return true;
  }

  for (const [managePermission, granted] of Object.entries(
    MANAGE_PERMISSION_GRANTS,
  )) {
    if (
      permissions.includes(managePermission) &&
      granted?.includes(permission as PermissionKey)
    ) {
      return true;
    }
  }

  return false;
}

export function permissionMeta(key: PermissionKey | string) {
  const [group = "general", action = key] = key.split(".");
  const label = action
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());

  return {
    key,
    label,
    description: `${label} permission for ${group}`,
    group,
  };
}
