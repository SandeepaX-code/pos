import { connectToDatabase } from "@/lib/mongoose";
import { ReportRepository } from "@/repositories/report-repository";
import type { DashboardSummary } from "@/types/report-types";

export class DashboardService {
  private readonly reportRepository = new ReportRepository();

  async getDashboardSummary(branchId?: string): Promise<DashboardSummary> {
    await connectToDatabase();
    return this.reportRepository.aggregateDashboardKPIs(branchId);
  }
}
