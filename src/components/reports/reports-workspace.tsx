"use client";

import { useState } from "react";
import {
  TrendingUp,
  Award,
  Users,
  Percent,
  Wallet,
  Download,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  BestSellerItem,
  CategoryPerformance,
  ProfitAndLoss,
  WaiterPerformance,
  RevenueByMethod,
} from "@/types/report-types";

interface ReportsWorkspaceProps {
  bestSellers: BestSellerItem[];
  categoryPerformance: CategoryPerformance[];
  profitLoss: ProfitAndLoss;
  waiterPerformance: WaiterPerformance[];
  revenueBreakdown: RevenueByMethod[];
}

export function ReportsWorkspace({
  bestSellers,
  categoryPerformance,
  profitLoss,
  waiterPerformance,
  revenueBreakdown,
}: ReportsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "categories" | "staff" | "tax">("overview");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  // Format currency in LKR
  const formatLKR = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // CSV Exporter helper
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvRows = [headers.join(",")];
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
      });
      csvRows.push(values.join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Tanderrum AI Insights Heuristics
  const triggerAiInsights = () => {
    setGeneratingAi(true);
    setAiInsights([]);
    
    setTimeout(() => {
      const insights: string[] = [];
      
      // Insight 1: Profit Margin Check
      if (profitLoss.margin > 65) {
        insights.push(`📈 Healthy Margins: Profit margin is at a strong ${profitLoss.margin.toFixed(1)}%. Maintain present pricing structure and supplier contracts.`);
      } else {
        insights.push(`⚠️ Margin Audit: Profit margin has dropped to ${profitLoss.margin.toFixed(1)}%. Recommend evaluating ingredient costs with suppliers.`);
      }

      // Insight 2: Best Seller Item Demand
      if (bestSellers.length > 0) {
        const topProduct = bestSellers[0];
        insights.push(`🔥 High Demand: "${topProduct.name}" is the top dish, representing ${topProduct.totalQuantity} items sold. Ensure raw materials are stocked for peak hours.`);
      }

      // Insight 3: Waiter Efficiency
      if (waiterPerformance.length > 0) {
        const topWaiter = waiterPerformance.reduce((prev, current) => 
          (prev.totalRevenue > current.totalRevenue) ? prev : current
        );
        insights.push(`👤 Staff Efficiency: ${topWaiter.waiterName} is the top revenue generator, contributing ${formatLKR(topWaiter.totalRevenue)} total sales. Recommend booking during high-volume shifts.`);
      }

      // Insight 4: Category distribution
      if (categoryPerformance.length > 0) {
        const topCategory = categoryPerformance[0];
        insights.push(`🍛 Category Leader: "${topCategory.categoryName}" leads the menu sales volume with ${topCategory.orderCount} orders.`);
      }

      setAiInsights(insights);
      setGeneratingAi(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Tanderrum AI Insights Engine (Next Level AI Feature) */}
      <Card className="border border-orange-100/50 bg-gradient-to-br from-white to-orange-50/20 shadow-[0_15px_40px_rgba(249,115,22,0.06)] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-orange-100/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-950">Tanderrum AI Insights Engine</CardTitle>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Automated analytics & business recommendations</p>
            </div>
          </div>
          <Button 
            onClick={triggerAiInsights} 
            disabled={generatingAi}
            className="h-9 px-4 bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold rounded-xl shadow-md transition-all duration-300"
          >
            {generatingAi ? "Analyzing Data..." : "Run AI Insights"}
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {aiInsights.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {aiInsights.map((insight, idx) => (
                <div 
                  key={idx} 
                  className="rounded-2xl border border-orange-100/40 bg-white p-4 text-xs font-semibold text-slate-700 shadow-xs flex gap-3 items-start animate-in slide-in-from-top duration-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{insight}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-orange-200" />
              <span>Click "Run AI Insights" to generate operational suggestions based on current live MongoDB records.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs Selector Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-orange-100 pb-px">
        {[
          { id: "overview", label: "Overview & P&L", icon: TrendingUp },
          { id: "products", label: "Best Sellers", icon: Award },
          { id: "categories", label: "Category Mix", icon: Wallet },
          { id: "staff", label: "Waiter Efficiency", icon: Users },
          { id: "tax", label: "Tax & Compliance", icon: Percent },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Screen Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* P&L Cards Row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border border-orange-100/50 bg-white/95 p-5 shadow-xs hover:border-orange-200 transition-all duration-300">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Revenue</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{formatLKR(profitLoss.revenue)}</div>
                <div className="mt-3.5 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-100/50">
                  Gross Income
                </div>
              </Card>
              <Card className="border border-orange-100/50 bg-white/95 p-5 shadow-xs hover:border-orange-200 transition-all duration-300">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Cost of Goods (COGS)</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{formatLKR(profitLoss.purchaseCost)}</div>
                <div className="mt-3.5 inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700 border border-rose-100/50">
                  Purchases & Stock
                </div>
              </Card>
              <Card className="border border-orange-100/50 bg-white/95 p-5 shadow-xs hover:border-orange-200 transition-all duration-300">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Net Profit Margin</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{formatLKR(profitLoss.grossProfit)}</div>
                <div className="mt-3.5 inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-700 border border-orange-100/50">
                  {profitLoss.margin.toFixed(1)}% Profit Margin
                </div>
              </Card>
            </div>

            {/* General Description Card */}
            <Card className="border border-orange-100/50 bg-white/95 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-bold text-slate-950">Profit & Loss Analysis</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportToCSV([profitLoss], "ProfitAndLoss", ["revenue", "purchaseCost", "grossProfit", "margin"])}
                  className="h-8 border-orange-100 hover:bg-orange-50 text-orange-700 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent className="text-xs text-slate-500 leading-relaxed space-y-2">
                <p>This report highlights the gross margin calculations derived from ingredients costs registered in the Inventory records versus total completed billing settlements.</p>
                <p>Formula used: <code>Margin = (Gross Revenue - COGS) / Gross Revenue * 100</code></p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "products" && (
          <Card className="border border-orange-100/50 bg-white/95 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-orange-50/50">
              <CardTitle className="text-sm font-bold text-slate-950">Best Selling Menu Items</CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => exportToCSV(bestSellers, "BestSellers", ["productId", "name", "totalQuantity", "totalRevenue"])}
                className="h-8 border-orange-100 hover:bg-orange-50 text-orange-700 text-[10px] font-bold rounded-lg cursor-pointer"
              >
                <Download className="h-3 w-3 mr-1" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y divide-orange-50/40">
                {bestSellers.map((item) => (
                  <div key={item.productId} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-950">{item.name}</div>
                      <div className="mt-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {item.totalQuantity} units sold
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-950">{formatLKR(item.totalRevenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "categories" && (
          <Card className="border border-orange-100/50 bg-white/95 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-orange-50/50">
              <CardTitle className="text-sm font-bold text-slate-950">Category Performance Share</CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => exportToCSV(categoryPerformance, "CategoryPerformance", ["categoryId", "categoryName", "totalRevenue", "orderCount"])}
                className="h-8 border-orange-100 hover:bg-orange-50 text-orange-700 text-[10px] font-bold rounded-lg cursor-pointer"
              >
                <Download className="h-3 w-3 mr-1" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y divide-orange-50/40">
                {categoryPerformance.map((item) => (
                  <div key={item.categoryId} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-950">{item.categoryName}</div>
                      <div className="mt-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {item.orderCount} orders placed
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-950">{formatLKR(item.totalRevenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "staff" && (
          <Card className="border border-orange-100/50 bg-white/95 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-orange-50/50">
              <CardTitle className="text-sm font-bold text-slate-950">Waiter Sales Efficiency</CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => exportToCSV(waiterPerformance, "WaiterPerformance", ["waiterId", "waiterName", "totalOrders", "totalRevenue"])}
                className="h-8 border-orange-100 hover:bg-orange-50 text-orange-700 text-[10px] font-bold rounded-lg cursor-pointer"
              >
                <Download className="h-3 w-3 mr-1" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y divide-orange-50/40">
                {waiterPerformance.map((waiter) => (
                  <div key={waiter.waiterId} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-950">{waiter.waiterName}</div>
                      <div className="mt-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {waiter.totalOrders} tickets served
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-950">{formatLKR(waiter.totalRevenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "tax" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Tax Breakdown */}
            <Card className="border border-orange-100/50 bg-white/95 shadow-xs">
              <CardHeader className="pb-3 border-b border-orange-50/50">
                <CardTitle className="text-sm font-bold text-slate-950">Government Tax & Surcharges</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Gross Sales Revenue</span>
                  <span className="text-slate-950 font-bold">{formatLKR(profitLoss.revenue)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 border-t border-slate-50 pt-3">
                  <span>VAT Collected (8%)</span>
                  <span className="text-slate-950 font-bold">{formatLKR(profitLoss.revenue * 0.08)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 border-t border-slate-50 pt-3">
                  <span>Service Charges (5%)</span>
                  <span className="text-slate-950 font-bold">{formatLKR(profitLoss.revenue * 0.05)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-950 border-t border-orange-100 pt-3.5">
                  <span>Net Revenue (Excl Tax/SC)</span>
                  <span className="text-orange-600">{formatLKR(profitLoss.revenue * 0.87)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Breakdown */}
            <Card className="border border-orange-100/50 bg-white/95 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-orange-50/50">
                <CardTitle className="text-sm font-bold text-slate-950">Payment Channels Share</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportToCSV(revenueBreakdown, "PaymentMethodsBreakdown", ["method", "total", "count"])}
                  className="h-8 border-orange-100 hover:bg-orange-50 text-orange-700 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="divide-y divide-orange-50/40">
                  {revenueBreakdown.map((channel) => (
                    <div key={channel.method} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-950 capitalize">
                        <Wallet className="h-4 w-4 text-orange-500" />
                        <span>{channel.method}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-950">{formatLKR(channel.total)}</div>
                        <div className="text-[9px] font-semibold text-slate-400">{channel.count} payments</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
