export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  totalTax: number;
  totalServiceCharge: number;
  averageOrderValue: number;
  activeCustomers: number;
  lowStockAlerts: number;
  pendingKitchenOrders: number;
}

export interface SalesDataPoint {
  label: string; // e.g. "YYYY-MM-DD" or "YYYY-WW" or "YYYY-MM" or "YYYY"
  revenue: number;
  orderCount: number;
  avgTicket: number;
}

export interface RevenueByMethod {
  method: string; // cash, card, qr, mixed
  total: number;
  count: number;
}

export interface BestSellerItem {
  productId: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  totalRevenue: number;
  orderCount: number;
}

export interface ProfitAndLoss {
  revenue: number;
  purchaseCost: number;
  grossProfit: number;
  margin: number; // percentage, e.g. 15.5 for 15.5%
}

export interface WaiterPerformance {
  waiterId: string;
  waiterName: string;
  totalOrders: number;
  totalRevenue: number;
}

export interface DateRangeFilter {
  from: Date;
  to: Date;
  branchId?: string;
}
