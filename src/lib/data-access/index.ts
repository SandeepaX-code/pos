import { createCrudRepository } from "@/lib/repositories/crud-repository";
import { ActivityLogModel } from "@/models/activity-log";
import { BillModel } from "@/models/bill";
import { BranchModel } from "@/models/branch";
import { CategoryModel } from "@/models/category";
import { CustomerModel } from "@/models/customer";
import { InventoryModel } from "@/models/inventory";
import { KitchenOrderModel } from "@/models/kitchen-order";
import { NotificationModel } from "@/models/notification";
import { OrderItemModel } from "@/models/order-item";
import { OrderModel } from "@/models/order";
import { PaymentModel } from "@/models/payment";
import { PermissionModel } from "@/models/permission";
import { ProductModel } from "@/models/product";
import { PurchaseOrderModel } from "@/models/purchase-order";
import { RecipeModel } from "@/models/recipe";
import { ReservationModel } from "@/models/reservation";
import { RestaurantTableModel } from "@/models/restaurant-table";
import { RoleModel } from "@/models/role";
import { SettingModel } from "@/models/setting";
import { StockMovementModel } from "@/models/stock-movement";
import { SupplierModel } from "@/models/supplier";
import { UserModel } from "@/models/user";

function lazyRepository<T extends object>(
  factory: () => ReturnType<typeof createCrudRepository<T>>,
) {
  let cached: ReturnType<typeof createCrudRepository<T>> | null = null;

  return () => {
    if (!cached) {
      cached = factory();
    }

    return cached;
  };
}

const activityRepository = lazyRepository(() =>
  createCrudRepository(ActivityLogModel),
);
const billsRepository = lazyRepository(() => createCrudRepository(BillModel));
const branchesRepository = lazyRepository(() =>
  createCrudRepository(BranchModel),
);
const categoriesRepository = lazyRepository(() =>
  createCrudRepository(CategoryModel),
);
const customersRepository = lazyRepository(() =>
  createCrudRepository(CustomerModel),
);
const inventoriesRepository = lazyRepository(() =>
  createCrudRepository(InventoryModel),
);
const kitchenOrdersRepository = lazyRepository(() =>
  createCrudRepository(KitchenOrderModel),
);
const notificationsRepository = lazyRepository(() =>
  createCrudRepository(NotificationModel),
);
const orderItemsRepository = lazyRepository(() =>
  createCrudRepository(OrderItemModel),
);
const ordersRepository = lazyRepository(() => createCrudRepository(OrderModel));
const paymentsRepository = lazyRepository(() =>
  createCrudRepository(PaymentModel),
);
const permissionsRepository = lazyRepository(() =>
  createCrudRepository(PermissionModel),
);
const productsRepository = lazyRepository(() =>
  createCrudRepository(ProductModel),
);
const purchaseOrdersRepository = lazyRepository(() =>
  createCrudRepository(PurchaseOrderModel),
);
const recipesRepository = lazyRepository(() =>
  createCrudRepository(RecipeModel),
);
const reservationsRepository = lazyRepository(() =>
  createCrudRepository(ReservationModel),
);
const restaurantTablesRepository = lazyRepository(() =>
  createCrudRepository(RestaurantTableModel),
);
const rolesRepository = lazyRepository(() => createCrudRepository(RoleModel));
const settingsRepository = lazyRepository(() =>
  createCrudRepository(SettingModel),
);
const stockMovementsRepository = lazyRepository(() =>
  createCrudRepository(StockMovementModel),
);
const suppliersRepository = lazyRepository(() =>
  createCrudRepository(SupplierModel),
);
const usersRepository = lazyRepository(() => createCrudRepository(UserModel));

export const repositories = {
  get activities() {
    return activityRepository();
  },
  get bills() {
    return billsRepository();
  },
  get branches() {
    return branchesRepository();
  },
  get categories() {
    return categoriesRepository();
  },
  get customers() {
    return customersRepository();
  },
  get inventories() {
    return inventoriesRepository();
  },
  get kitchenOrders() {
    return kitchenOrdersRepository();
  },
  get notifications() {
    return notificationsRepository();
  },
  get orderItems() {
    return orderItemsRepository();
  },
  get orders() {
    return ordersRepository();
  },
  get payments() {
    return paymentsRepository();
  },
  get permissions() {
    return permissionsRepository();
  },
  get products() {
    return productsRepository();
  },
  get purchaseOrders() {
    return purchaseOrdersRepository();
  },
  get recipes() {
    return recipesRepository();
  },
  get reservations() {
    return reservationsRepository();
  },
  get restaurantTables() {
    return restaurantTablesRepository();
  },
  get roles() {
    return rolesRepository();
  },
  get settings() {
    return settingsRepository();
  },
  get stockMovements() {
    return stockMovementsRepository();
  },
  get suppliers() {
    return suppliersRepository();
  },
  get users() {
    return usersRepository();
  },
} as const;
