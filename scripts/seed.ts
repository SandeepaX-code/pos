import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectToDatabase } from "../src/lib/mongoose";
import {
  restaurantBrand,
  branches,
  categories,
  products,
  tables,
  customers,
  suppliers,
  inventory,
  orders,
} from "../src/data/restaurant";
import { BranchModel } from "../src/models/branch";
import { CategoryModel } from "../src/models/category";
import { ProductModel } from "../src/models/product";
import { RestaurantTableModel } from "../src/models/restaurant-table";
import { CustomerModel } from "../src/models/customer";
import { SupplierModel } from "../src/models/supplier";
import { InventoryModel } from "../src/models/inventory";
import { OrderModel } from "../src/models/order";
import { PermissionModel } from "../src/models/permission";
import { RoleModel } from "../src/models/role";
import { UserModel } from "../src/models/user";
import { getRoleLabel, permissionMeta, rolePermissions } from "../src/lib/permissions";

const defaultPassword = process.env.SEED_PASSWORD ?? "Password123!";

async function seedRolesAndPermissions() {
  const permissionKeys = new Set<string>([
    ...Object.values(rolePermissions).flat(),
  ]);

  const permissionLookup = new Map<string, string>();
  for (const key of permissionKeys) {
    const document = await PermissionModel.findOneAndUpdate(
      { key },
      permissionMeta(key),
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    permissionLookup.set(key, String(document?._id));
  }

  for (const [roleName, permissions] of Object.entries(rolePermissions)) {
    const permissionIds = permissions
      .map((permission) => permissionLookup.get(permission))
      .filter((value): value is string => Boolean(value));

    await RoleModel.findOneAndUpdate(
      { name: roleName },
      {
        name: roleName,
        label: getRoleLabel(roleName as keyof typeof rolePermissions),
        permissions: permissionIds,
        description: `${getRoleLabel(roleName as keyof typeof rolePermissions)} system role`,
        active: true,
        system: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  }
}

async function upsertBranch(source: (typeof branches)[number]) {
  return BranchModel.findOneAndUpdate(
    { code: source.code },
    {
      name: source.name,
      code: source.code,
      city: source.city,
      address: source.address,
      phone: restaurantBrand.phone,
      email: restaurantBrand.email,
      active: true,
      taxRate: 0.08,
      serviceChargeRate: 0.05,
      currencyCode: "LKR",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
}

async function upsertCategory(source: (typeof categories)[number]) {
  return CategoryModel.findOneAndUpdate(
    { slug: source.slug },
    {
      name: source.name,
      slug: source.slug,
      icon: source.icon,
      image: source.image,
      color: source.color,
      active: true,
      sortOrder: categories.findIndex(
        (category) => category.slug === source.slug,
      ),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
}

async function upsertProduct(
  source: (typeof products)[number],
  categoryLookup: Map<string, string>,
  branchId: string,
) {
  const categoryId = categoryLookup.get(source.categoryId);
  if (!categoryId) {
    throw new Error(`Missing category for product ${source.name}`);
  }

  return ProductModel.findOneAndUpdate(
    { sku: source.sku },
    {
      name: source.name,
      sku: source.sku,
      categoryId,
      image: source.image,
      price: source.price,
      cost: source.cost,
      available: source.available,
      stock: source.stock,
      lowStockThreshold: source.lowStockThreshold,
      branchId,
      description: `${source.name} signature menu item`,
      recipe: [],
      variants: source.variants ?? [],
      addons: source.addons ?? [],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
}

async function upsertCustomer(source: (typeof customers)[number]) {
  return CustomerModel.findOneAndUpdate(
    { phone: source.phone },
    {
      name: source.name,
      phone: source.phone,
      email: source.email,
      loyaltyPoints: source.loyaltyPoints,
      favoriteOrders: source.favoriteOrders,
      address: source.address,
      active: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
}

async function upsertSupplier(
  source: (typeof suppliers)[number],
  productIds: string[],
) {
  return SupplierModel.findOneAndUpdate(
    { company: source.company },
    {
      company: source.company,
      contactName: source.contactName,
      phone: source.phone,
      email: source.email,
      address: source.address,
      products: productIds,
      active: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
}

async function upsertTable(source: (typeof tables)[number], branchId: string, index: number) {
  const isValidBillId = source.billId && mongoose.Types.ObjectId.isValid(source.billId);
  return RestaurantTableModel.findOneAndUpdate(
    { label: source.label, branchId },
    {
      tableNumber: index + 1,
      label: source.label,
      seats: source.seats,
      zone: source.zone,
      floor: 0,
      section: source.zone,
      status: source.status,
      branchId,
      billId: isValidBillId ? new mongoose.Types.ObjectId(source.billId) : undefined,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
}

async function upsertInventory(
  source: (typeof inventory)[number],
  productLookup: Map<string, string>,
  branchId: string,
) {
  const productId = productLookup.get(source.productId);
  if (!productId) {
    throw new Error(`Missing product for inventory item ${source.name}`);
  }

  return InventoryModel.findOneAndUpdate(
    { productId, branchId },
    {
      productId,
      branchId,
      name: source.name,
      unit: source.unit,
      stockOnHand: source.stockOnHand,
      stockReserved: source.stockReserved,
      reorderLevel: source.reorderLevel,
      expiryDate: source.expiryDate,
      barcode: source.barcode,
      lastCountedAt: new Date(),
      autoDeduct: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
}

async function upsertOrder(
  source: (typeof orders)[number],
  branchId: string,
  tableLookup: Map<string, string>,
  customerLookup: Map<string, string>,
  waiterLookup: Map<string, string>,
  productLookup: Map<string, string>,
) {
  const tableId = source.tableId ? tableLookup.get(source.tableId) : undefined;
  const customerId = source.customerName
    ? customerLookup.get(
        customers.find((customer) => customer.name === source.customerName)
          ?.phone ?? "",
      )
    : undefined;
  const waiterId =
    waiterLookup.get(source.waiterName) ?? waiterLookup.values().next().value;

  if (!waiterId) {
    throw new Error("Missing seed waiter user");
  }

  return OrderModel.findOneAndUpdate(
    { orderNumber: source.orderNumber },
    {
      orderNumber: source.orderNumber,
      branchId,
      tableId,
      customerId,
      waiterId,
      waiterName: source.waiterName,
      customerName: source.customerName,
      tableLabel: source.tableLabel,
      status: source.status,
      priority: source.priority,
      items: source.items
        .map((item) => ({
          productId: productLookup.get(item.productId),
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
        }))
        .filter((item) => item.productId),
      subtotal: source.subtotal,
      discount: source.discount,
      tax: source.tax,
      serviceCharge: source.serviceCharge,
      grandTotal: source.grandTotal,
      notes: source.notes,
      source: "pos",
      mergedFromTableIds: source.tableId && tableId ? [tableId] : [],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
}

async function upsertUser(
  role: string,
  branchId: string,
  fullName: string,
  username: string,
  email: string,
  phone: string,
  defaultPasswordHash: string,
) {
  const user = await UserModel.findOne({ username })
    .select("+passwordHash")
    .exec();
  if (user) {
    user.fullName = fullName;
    user.email = email;
    user.phone = phone;
    user.role = role as never;
    user.branchId = branchId as never;
    user.active = true;
    user.passwordHash = defaultPasswordHash;
    await user.save();
    return user;
  }

  return UserModel.create({
    fullName,
    username,
    email,
    phone,
    role,
    branchId,
    active: true,
    passwordHash: defaultPasswordHash,
  });
}

async function main() {
  await connectToDatabase();
  await seedRolesAndPermissions();
  const defaultPasswordHash = await bcrypt.hash(defaultPassword, 12);

  const seededBranches = new Map<string, string>();
  for (const branch of branches) {
    const document = await upsertBranch(branch);
    seededBranches.set(branch.id, String(document?._id));
  }

  const centralBranchId = seededBranches.get("branch-central");
  if (!centralBranchId) {
    throw new Error("Failed to seed central branch");
  }

  await upsertUser(
    "superAdmin",
    centralBranchId,
    "Nimal Perera",
    "superadmin",
    "admin@aurumbistro.com",
    "+94 77 123 4567",
    defaultPasswordHash,
  );
  await upsertUser(
    "cashier",
    centralBranchId,
    "Kavindi Silva",
    "cashier1",
    "cashier@aurumbistro.com",
    "+94 77 246 8135",
    defaultPasswordHash,
  );
  await upsertUser(
    "waiter",
    centralBranchId,
    "Nadun Silva",
    "waiter1",
    "waiter@aurumbistro.com",
    "+94 77 246 9999",
    defaultPasswordHash,
  );

  const seededCategories = new Map<string, string>();
  for (const category of categories) {
    const document = await upsertCategory(category);
    seededCategories.set(category.id, String(document?._id));
  }

  const seededProducts = new Map<string, string>();
  for (const product of products) {
    const document = await upsertProduct(
      product,
      seededCategories,
      centralBranchId,
    );
    seededProducts.set(product.id, String(document?._id));
  }

  const tableLookup = new Map<string, string>();
  for (let i = 0; i < tables.length; i++) {
    const document = await upsertTable(tables[i], centralBranchId, i);
    tableLookup.set(tables[i].id, String(document?._id));
  }

  for (const customer of customers) {
    await upsertCustomer(customer);
  }

  const customerLookup = new Map<string, string>();
  for (const customer of customers) {
    customerLookup.set(
      customer.phone,
      String(
        (await CustomerModel.findOne({ phone: customer.phone }).exec())?._id,
      ),
    );
  }

  const supplierProductIds = Array.from(seededProducts.values());
  for (const supplier of suppliers) {
    await upsertSupplier(supplier, supplierProductIds);
  }

  for (const item of inventory) {
    await upsertInventory(item, seededProducts, centralBranchId);
  }

  const waiterLookup = new Map<string, string>();
  const seededWaiters = await UserModel.find({
    role: { $in: ["superAdmin", "cashier", "waiter"] },
  })
    .select("_id username fullName")
    .lean()
    .exec();
  for (const user of seededWaiters) {
    waiterLookup.set(user.fullName, String(user._id));
  }

  for (const order of orders) {
    await upsertOrder(
      order,
      centralBranchId,
      tableLookup,
      customerLookup,
      waiterLookup,
      seededProducts,
    );
  }

  console.log(
    `Seeded ${Object.keys(rolePermissions).length} roles, ${branches.length} branches, ${categories.length} categories, ${products.length} products, ${tables.length} tables, ${customers.length} customers, ${suppliers.length} suppliers, ${inventory.length} inventory items, and ${orders.length} orders.`,
  );
  console.log(`Default login password for seeded users: ${defaultPassword}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
