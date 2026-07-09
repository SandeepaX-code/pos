import type {
  Branch,
  Category,
  Customer,
  InventoryItem,
  KitchenOrder,
  NotificationItem,
  Order,
  Product,
  RestaurantTable,
  Reservation,
  Supplier,
  User,
} from "@/types/domain";

export const restaurantBrand = {
  name: "Aurum Bistro",
  slogan: "Precision service for high-volume restaurants",
  address: "24 Golden Lane, Colombo, Sri Lanka",
  phone: "+94 11 555 0199",
  email: "hello@aurumbistro.com",
};

export const branches: Branch[] = [
  {
    id: "branch-central",
    name: "Aurum Bistro Central",
    code: "CEN",
    city: "Colombo",
    address: "24 Golden Lane, Colombo",
  },
  {
    id: "branch-marina",
    name: "Aurum Bistro Marina",
    code: "MAR",
    city: "Galle",
    address: "11 Ocean View, Galle",
  },
];

export const users: User[] = [
  {
    id: "user-super-admin",
    fullName: "Nimal Perera",
    username: "superadmin",
    email: "admin@aurumbistro.com",
    phone: "+94 77 123 4567",
    role: "superAdmin",
    branchId: "branch-central",
    active: true,
    lastLoginAt: "2026-07-06T06:20:00.000Z",
  },
  {
    id: "user-cashier",
    fullName: "Kavindi Silva",
    username: "cashier1",
    email: "cashier@aurumbistro.com",
    phone: "+94 77 246 8135",
    role: "cashier",
    branchId: "branch-central",
    active: true,
    lastLoginAt: "2026-07-06T06:41:00.000Z",
  },
];

export const categories: Category[] = [
  {
    id: "rice",
    name: "Rice",
    slug: "rice",
    icon: "UtensilsCrossed",
    image: "/categories/rice.svg",
    color: "#f97316",
  },
  {
    id: "kottu",
    name: "Kottu",
    slug: "kottu",
    icon: "ChefHat",
    image: "/categories/kottu.svg",
    color: "#fb923c",
  },
  {
    id: "fried-rice",
    name: "Fried Rice",
    slug: "fried-rice",
    icon: "Flame",
    image: "/categories/fried-rice.svg",
    color: "#f59e0b",
  },
  {
    id: "pizza",
    name: "Pizza",
    slug: "pizza",
    icon: "Pizza",
    image: "/categories/pizza.svg",
    color: "#f43f5e",
  },
  {
    id: "burger",
    name: "Burger",
    slug: "burger",
    icon: "Sandwich",
    image: "/categories/burger.svg",
    color: "#ea580c",
  },
  {
    id: "submarine",
    name: "Submarine",
    slug: "submarine",
    icon: "CookingPot",
    image: "/categories/submarine.svg",
    color: "#0ea5e9",
  },
  {
    id: "pasta",
    name: "Pasta",
    slug: "pasta",
    icon: "Spaghetti",
    image: "/categories/pasta.svg",
    color: "#f97316",
  },
  {
    id: "sea-food",
    name: "Sea Food",
    slug: "sea-food",
    icon: "Fish",
    image: "/categories/sea-food.svg",
    color: "#0284c7",
  },
  {
    id: "dessert",
    name: "Dessert",
    slug: "dessert",
    icon: "CakeSlice",
    image: "/categories/dessert.svg",
    color: "#db2777",
  },
  {
    id: "coffee",
    name: "Coffee",
    slug: "coffee",
    icon: "Coffee",
    image: "/categories/coffee.svg",
    color: "#7c2d12",
  },
  {
    id: "tea",
    name: "Tea",
    slug: "tea",
    icon: "Leaf",
    image: "/categories/tea.svg",
    color: "#16a34a",
  },
  {
    id: "juices",
    name: "Juices",
    slug: "juices",
    icon: "Orange",
    image: "/categories/juices.svg",
    color: "#eab308",
  },
  {
    id: "soft-drinks",
    name: "Soft Drinks",
    slug: "soft-drinks",
    icon: "Sparkles",
    image: "/categories/soft-drinks.svg",
    color: "#2563eb",
  },
  {
    id: "cocktails",
    name: "Cocktails",
    slug: "cocktails",
    icon: "GlassWater",
    image: "/categories/cocktails.svg",
    color: "#7c3aed",
  },
];

export const products: Product[] = [
  {
    id: "product-jasmine-rice",
    name: "Jasmine Chicken Rice",
    sku: "RICE-001",
    categoryId: "rice",
    image: "/menu/jasmine-rice.svg",
    price: 1850,
    cost: 920,
    available: true,
    stock: 38,
    recipe: ["rice", "chicken", "egg", "spring onion"],
    variants: [{ id: "normal", label: "Normal", price: 1850, cost: 920 }],
    addons: [{ id: "extra-egg", label: "Extra Egg", price: 150 }],
    lowStockThreshold: 10,
  },
  {
    id: "product-spicy-kottu",
    name: "Spicy Chicken Kottu",
    sku: "KOT-014",
    categoryId: "kottu",
    image: "/menu/chicken-kottu.svg",
    price: 1650,
    cost: 770,
    available: true,
    stock: 25,
    recipe: ["roti", "chicken", "egg", "vegetables"],
    addons: [{ id: "cheese", label: "Cheese", price: 250 }],
    lowStockThreshold: 8,
  },
  {
    id: "product-margherita-pizza",
    name: "Margherita Pizza",
    sku: "PIZ-003",
    categoryId: "pizza",
    image: "/menu/margherita-pizza.svg",
    price: 2400,
    cost: 1160,
    available: true,
    stock: 18,
    variants: [
      { id: "medium", label: "Medium", price: 2400, cost: 1160 },
      { id: "large", label: "Large", price: 3200, cost: 1540 },
    ],
    lowStockThreshold: 6,
  },
  {
    id: "product-mango-juice",
    name: "Fresh Mango Juice",
    sku: "JUI-006",
    categoryId: "juices",
    image: "/menu/mango-juice.svg",
    price: 650,
    cost: 210,
    available: true,
    stock: 46,
    lowStockThreshold: 15,
  },
];

export const tables: RestaurantTable[] = [
  {
    id: "table-01",
    label: "T1",
    seats: 2,
    zone: "Main Hall",
    status: "available",
  },
  {
    id: "table-02",
    label: "T2",
    seats: 4,
    zone: "Main Hall",
    status: "occupied",
    billId: "B-10021",
  },
  { id: "table-03", label: "T3", seats: 4, zone: "Window", status: "reserved" },
  {
    id: "table-04",
    label: "T4",
    seats: 6,
    zone: "Terrace",
    status: "cleaning",
  },
  { id: "table-05", label: "T5", seats: 8, zone: "Private", status: "merged" },
  { id: "table-06", label: "T6", seats: 2, zone: "Terrace", status: "split" },
];

export const customers: Customer[] = [
  {
    id: "customer-001",
    name: "Sahan Rajapaksa",
    phone: "+94 77 200 1001",
    email: "sahan@example.com",
    loyaltyPoints: 420,
    favoriteOrders: ["Spicy Chicken Kottu"],
    address: "Colombo 05",
  },
  {
    id: "customer-002",
    name: "Anjali Fernando",
    phone: "+94 77 200 1002",
    email: "anjali@example.com",
    loyaltyPoints: 620,
    favoriteOrders: ["Margherita Pizza", "Fresh Mango Juice"],
    address: "Nugegoda",
  },
];

export const suppliers: Supplier[] = [
  {
    id: "supplier-001",
    company: "Island Foods Ltd.",
    contactName: "Roshan De Silva",
    phone: "+94 11 456 7788",
    email: "orders@islandfoods.lk",
    address: "45 Central Rd, Colombo",
  },
  {
    id: "supplier-002",
    company: "Fresh Sea Supply",
    contactName: "Imesha Perera",
    phone: "+94 11 445 8821",
    email: "sales@freshsea.lk",
    address: "Harbour Road, Negombo",
  },
];

export const inventory: InventoryItem[] = [
  {
    id: "inv-001",
    productId: "product-jasmine-rice",
    name: "Jasmine Rice",
    unit: "kg",
    stockOnHand: 74,
    stockReserved: 8,
    reorderLevel: 20,
    expiryDate: "2026-09-15",
    barcode: "977500100001",
  },
  {
    id: "inv-002",
    productId: "product-spicy-kottu",
    name: "Chicken Breast",
    unit: "kg",
    stockOnHand: 16,
    stockReserved: 4,
    reorderLevel: 12,
    expiryDate: "2026-07-16",
    barcode: "977500100002",
  },
  {
    id: "inv-003",
    productId: "product-margherita-pizza",
    name: "Mozzarella",
    unit: "kg",
    stockOnHand: 6,
    stockReserved: 1,
    reorderLevel: 8,
    expiryDate: "2026-07-09",
    barcode: "977500100003",
  },
  {
    id: "inv-004",
    productId: "product-mango-juice",
    name: "Mango Pulp",
    unit: "ltr",
    stockOnHand: 12,
    stockReserved: 2,
    reorderLevel: 12,
    expiryDate: "2026-08-03",
    barcode: "977500100004",
  },
];

export const reservations: Reservation[] = [
  {
    id: "res-001",
    customerName: "Sahan Rajapaksa",
    tableLabel: "T3",
    partySize: 4,
    time: "2026-07-06T12:30:00.000Z",
    status: "confirmed",
  },
  {
    id: "res-002",
    customerName: "Mihiri Jayasinghe",
    tableLabel: "T5",
    partySize: 6,
    time: "2026-07-06T19:00:00.000Z",
    status: "pending",
  },
];

export const orders: Order[] = [
  {
    id: "order-10021",
    orderNumber: "B-10021",
    tableId: "table-02",
    tableLabel: "T2",
    waiterName: "Kavindi Silva",
    customerName: "Sahan Rajapaksa",
    status: "preparing",
    items: [
      {
        productId: "product-jasmine-rice",
        name: "Jasmine Chicken Rice",
        quantity: 2,
        price: 1850,
        notes: "No onion",
      },
      {
        productId: "product-mango-juice",
        name: "Fresh Mango Juice",
        quantity: 2,
        price: 650,
      },
    ],
    subtotal: 5000,
    discount: 250,
    tax: 710,
    serviceCharge: 320,
    grandTotal: 5780,
    createdAt: "2026-07-06T07:08:00.000Z",
    priority: "high",
    notes: "VIP guest",
  },
  {
    id: "order-10022",
    orderNumber: "B-10022",
    tableId: "table-03",
    tableLabel: "T3",
    waiterName: "Nadun Silva",
    status: "ready",
    items: [
      {
        productId: "product-spicy-kottu",
        name: "Spicy Chicken Kottu",
        quantity: 1,
        price: 1650,
      },
    ],
    subtotal: 1650,
    discount: 0,
    tax: 198,
    serviceCharge: 105,
    grandTotal: 1953,
    createdAt: "2026-07-06T07:18:00.000Z",
    priority: "normal",
  },
];

export const kitchenOrders: KitchenOrder[] = orders.map((order) => ({
  id: `${order.id}-kitchen`,
  orderId: order.id,
  orderNumber: order.orderNumber,
  tableLabel: order.tableLabel ?? "Take Away",
  waiterName: order.waiterName,
  status:
    order.status === "paid" || order.status === "void"
      ? "pending"
      : order.status,
  items: order.items,
  notes: order.notes,
  createdAt: order.createdAt,
  priority: order.priority,
}));

export const notifications: NotificationItem[] = [
  {
    id: "notif-001",
    title: "Low Stock Alert",
    message: "Mozzarella stock is below reorder level.",
    type: "low-stock",
    createdAt: "2026-07-06T06:49:00.000Z",
  },
  {
    id: "notif-002",
    title: "New Order",
    message: "Order B-10021 sent to kitchen.",
    type: "new-order",
    createdAt: "2026-07-06T07:08:00.000Z",
  },
  {
    id: "notif-003",
    title: "Printer Offline",
    message: "Bar printer is disconnected.",
    type: "printer-offline",
    createdAt: "2026-07-06T07:05:00.000Z",
  },
];

export const dashboardMetrics = [
  { label: "Today's Sales", value: 68450, delta: 14.2 },
  { label: "Monthly Sales", value: 1987450, delta: 9.4 },
  { label: "Orders Today", value: 128, delta: 6.1 },
  { label: "Customers", value: 4287, delta: 12.8 },
  { label: "Average Order", value: 1860, delta: 4.7 },
  { label: "Revenue", value: 682320, delta: 11.1 },
  { label: "Expenses", value: 218990, delta: -3.4 },
  { label: "Profit", value: 463330, delta: 15.8 },
];

export const weeklyRevenue = [
  134000, 172000, 148000, 196000, 214000, 226000, 248000,
];
export const monthlyRevenue = [
  1120000, 1240000, 1380000, 1265000, 1490000, 1685000,
];
export const yearlyRevenue = [14920000, 15260000, 16150000, 16820000, 17490000];
