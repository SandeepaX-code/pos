import { connectToDatabase } from "@/lib/mongoose";
import { ReportRepository } from "@/repositories/report-repository";
import type {
  SalesDataPoint,
  RevenueByMethod,
  BestSellerItem,
  CategoryPerformance,
  ProfitAndLoss,
  WaiterPerformance,
  DateRangeFilter,
} from "@/types/report-types";

export class ReportService {
  private readonly reportRepository = new ReportRepository();

  private parseDateRange(
    fromParam?: string | Date,
    toParam?: string | Date,
    branchId?: string
  ): DateRangeFilter {
    let from = fromParam ? new Date(fromParam) : new Date();
    if (isNaN(from.getTime())) {
      // Default to 30 days ago if invalid
      from = new Date();
      from.setDate(from.getDate() - 30);
    }

    let to = toParam ? new Date(toParam) : new Date();
    if (isNaN(to.getTime())) {
      to = new Date();
    }

    // Ensure start date is before end date
    if (from > to) {
      const temp = from;
      from = to;
      to = temp;
    }

    // Set boundary times: start of day for 'from', end of day for 'to' if input was a date-only string
    // But since the query can have precise timestamps, we let it be as parsed.
    return {
      from,
      to,
      branchId,
    };
  }

  async getSalesAnalytics(
    from?: string | Date,
    to?: string | Date,
    granularity: "daily" | "weekly" | "monthly" | "yearly" = "daily",
    branchId?: string
  ): Promise<SalesDataPoint[]> {
    await connectToDatabase();
    const filter = this.parseDateRange(from, to, branchId);
    return this.reportRepository.aggregateSalesTimeSeries(filter, granularity);
  }

  async getRevenueBreakdown(
    from?: string | Date,
    to?: string | Date,
    branchId?: string
  ): Promise<RevenueByMethod[]> {
    await connectToDatabase();
    const filter = this.parseDateRange(from, to, branchId);
    return this.reportRepository.aggregateRevenueByPaymentMethod(filter);
  }

  async getBestSellers(
    from?: string | Date,
    to?: string | Date,
    limit?: number,
    branchId?: string
  ): Promise<BestSellerItem[]> {
    await connectToDatabase();
    const filter = this.parseDateRange(from, to, branchId);
    return this.reportRepository.aggregateBestSellers(filter, limit);
  }

  async getCategoryPerformance(
    from?: string | Date,
    to?: string | Date,
    branchId?: string
  ): Promise<CategoryPerformance[]> {
    await connectToDatabase();
    const filter = this.parseDateRange(from, to, branchId);
    return this.reportRepository.aggregateCategoryPerformance(filter);
  }

  async getProfitAndLoss(
    from?: string | Date,
    to?: string | Date,
    branchId?: string
  ): Promise<ProfitAndLoss> {
    await connectToDatabase();
    const filter = this.parseDateRange(from, to, branchId);
    return this.reportRepository.aggregateProfitAndLoss(filter);
  }

  async getWaiterPerformance(
    from?: string | Date,
    to?: string | Date,
    branchId?: string
  ): Promise<WaiterPerformance[]> {
    await connectToDatabase();
    const filter = this.parseDateRange(from, to, branchId);
    return this.reportRepository.aggregateWaiterPerformance(filter);
  }
}
