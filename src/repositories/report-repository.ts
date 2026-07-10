import { Types } from "mongoose";
import { OrderModel } from "@/models/order";
import { PaymentModel } from "@/models/payment";
import { PurchaseOrderModel } from "@/models/purchase-order";
import { InventoryModel } from "@/models/inventory";
import { KitchenOrderModel } from "@/models/kitchen-order";
import { CustomerModel } from "@/models/customer";
import type {
  DashboardSummary,
  SalesDataPoint,
  RevenueByMethod,
  BestSellerItem,
  CategoryPerformance,
  ProfitAndLoss,
  WaiterPerformance,
  DateRangeFilter,
} from "@/types/report-types";

export class ReportRepository {
  async aggregateSalesTimeSeries(
    filter: DateRangeFilter,
    granularity: "daily" | "weekly" | "monthly" | "yearly"
  ): Promise<SalesDataPoint[]> {
    const matchFilter: Record<string, unknown> = {
      status: { $ne: "void" },
      createdAt: { $gte: filter.from, $lte: filter.to },
    };

    if (filter.branchId) {
      matchFilter.branchId = new Types.ObjectId(filter.branchId);
    }

    let format = "%Y-%m-%d";
    if (granularity === "weekly") {
      format = "%Y-w%U";
    } else if (granularity === "monthly") {
      format = "%Y-%m";
    } else if (granularity === "yearly") {
      format = "%Y";
    }

    const results = await OrderModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: { format, date: "$createdAt" },
          },
          revenue: { $sum: "$grandTotal" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          label: "$_id",
          revenue: 1,
          orderCount: 1,
          avgTicket: {
            $cond: {
              if: { $gt: ["$orderCount", 0] },
              then: { $divide: ["$revenue", "$orderCount"] },
              else: 0,
            },
          },
        },
      },
      { $sort: { label: 1 } },
    ]).exec();

    return results as SalesDataPoint[];
  }

  async aggregateRevenueByPaymentMethod(
    filter: DateRangeFilter
  ): Promise<RevenueByMethod[]> {
    const matchFilter: Record<string, unknown> = {
      status: "completed",
      paidAt: { $gte: filter.from, $lte: filter.to },
    };

    if (filter.branchId) {
      matchFilter.branchId = new Types.ObjectId(filter.branchId);
    }

    const results = await PaymentModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$method",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          method: "$_id",
          total: 1,
          count: 1,
        },
      },
      { $sort: { total: -1 } },
    ]).exec();

    return results as RevenueByMethod[];
  }

  async aggregateBestSellers(
    filter: DateRangeFilter,
    limit = 10
  ): Promise<BestSellerItem[]> {
    const matchFilter: Record<string, unknown> = {
      status: { $ne: "void" },
      createdAt: { $gte: filter.from, $lte: filter.to },
    };

    if (filter.branchId) {
      matchFilter.branchId = new Types.ObjectId(filter.branchId);
    }

    const results = await OrderModel.aggregate([
      { $match: matchFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          productId: { $toString: "$_id" },
          name: 1,
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
    ]).exec();

    return results as BestSellerItem[];
  }

  async aggregateCategoryPerformance(
    filter: DateRangeFilter
  ): Promise<CategoryPerformance[]> {
    const matchFilter: Record<string, unknown> = {
      status: { $ne: "void" },
      createdAt: { $gte: filter.from, $lte: filter.to },
    };

    if (filter.branchId) {
      matchFilter.branchId = new Types.ObjectId(filter.branchId);
    }

    const results = await OrderModel.aggregate([
      { $match: matchFilter },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$productDetails.categoryId",
          categoryName: { $first: "$categoryDetails.name" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          orderCount: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: { $toString: "$_id" },
          categoryName: 1,
          totalRevenue: 1,
          orderCount: { $size: "$orderCount" },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]).exec();

    return results as CategoryPerformance[];
  }

  async aggregateProfitAndLoss(
    filter: DateRangeFilter
  ): Promise<ProfitAndLoss> {
    const revenueMatch: Record<string, unknown> = {
      status: "completed",
      paidAt: { $gte: filter.from, $lte: filter.to },
    };

    const costMatch: Record<string, unknown> = {
      status: { $in: ["received", "partial"] },
      orderDate: { $gte: filter.from, $lte: filter.to },
    };

    if (filter.branchId) {
      const branchIdObj = new Types.ObjectId(filter.branchId);
      revenueMatch.branchId = branchIdObj;
      costMatch.branchId = branchIdObj;
    }

    const [revenueRes, costRes] = await Promise.all([
      PaymentModel.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
          },
        },
      ]).exec(),
      PurchaseOrderModel.aggregate([
        { $match: costMatch },
        {
          $group: {
            _id: null,
            totalCost: { $sum: "$total" },
          },
        },
      ]).exec(),
    ]);

    const revenue = revenueRes[0]?.totalRevenue || 0;
    const purchaseCost = costRes[0]?.totalCost || 0;
    const grossProfit = revenue - purchaseCost;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      revenue,
      purchaseCost,
      grossProfit,
      margin: parseFloat(margin.toFixed(2)),
    };
  }

  async aggregateWaiterPerformance(
    filter: DateRangeFilter
  ): Promise<WaiterPerformance[]> {
    const matchFilter: Record<string, unknown> = {
      status: { $ne: "void" },
      createdAt: { $gte: filter.from, $lte: filter.to },
    };

    if (filter.branchId) {
      matchFilter.branchId = new Types.ObjectId(filter.branchId);
    }

    const results = await OrderModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$waiterId",
          waiterName: { $first: "$waiterName" },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
        },
      },
      {
        $project: {
          _id: 0,
          waiterId: { $toString: "$_id" },
          waiterName: 1,
          totalOrders: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]).exec();

    return results as WaiterPerformance[];
  }

  async aggregateDashboardKPIs(branchId?: string): Promise<DashboardSummary> {
    const branchFilter: Record<string, unknown> = {};
    if (branchId) {
      branchFilter.branchId = new Types.ObjectId(branchId);
    }

    const nonVoidFilter = { ...branchFilter, status: { $ne: "void" } };
    const activeCustomerFilter = { active: true }; // Customer is global, no branchId field
    const lowStockFilter = branchId
      ? { branchId: new Types.ObjectId(branchId), $expr: { $lte: ["$stockOnHand", "$reorderLevel"] } }
      : { $expr: { $lte: ["$stockOnHand", "$reorderLevel"] } };

    const pendingKitchenFilter = branchId
      ? { branchId: new Types.ObjectId(branchId), status: { $in: ["pending", "preparing", "ready"] } }
      : { status: { $in: ["pending", "preparing", "ready"] } };

    const [
      salesSummary,
      activeCustomers,
      lowStockAlerts,
      pendingKitchenOrders,
    ] = await Promise.all([
      // Sales metrics
      OrderModel.aggregate([
        { $match: nonVoidFilter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$grandTotal" },
            totalDiscount: { $sum: "$discount" },
            totalTax: { $sum: "$tax" },
            totalServiceCharge: { $sum: "$serviceCharge" },
          },
        },
      ]).exec(),
      // Customer metrics
      CustomerModel.countDocuments(activeCustomerFilter).exec(),
      // Inventory alerts
      InventoryModel.countDocuments(lowStockFilter).exec(),
      // KDS status count
      KitchenOrderModel.countDocuments(pendingKitchenFilter).exec(),
    ]);

    const sales = salesSummary[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalDiscount: 0,
      totalTax: 0,
      totalServiceCharge: 0,
    };

    const averageOrderValue =
      sales.totalOrders > 0 ? sales.totalRevenue / sales.totalOrders : 0;

    return {
      totalOrders: sales.totalOrders,
      totalRevenue: sales.totalRevenue,
      totalDiscount: sales.totalDiscount,
      totalTax: sales.totalTax,
      totalServiceCharge: sales.totalServiceCharge,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      activeCustomers,
      lowStockAlerts,
      pendingKitchenOrders,
    };
  }
}
