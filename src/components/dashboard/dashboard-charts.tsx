"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  monthlyRevenue,
  weeklyRevenue,
  yearlyRevenue,
} from "@/data/restaurant";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#64748b" },
    },
    y: {
      grid: { color: "rgba(148,163,184,0.15)" },
      ticks: { color: "#64748b" },
    },
  },
} as const;

export function DashboardCharts() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <Line
              options={chartOptions}
              data={{
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                datasets: [
                  {
                    label: "Weekly Revenue",
                    data: weeklyRevenue,
                    borderColor: "#f97316",
                    backgroundColor: "rgba(249,115,22,0.14)",
                    tension: 0.45,
                    fill: true,
                    pointBackgroundColor: "#f97316",
                    pointBorderColor: "#ffffff",
                    pointRadius: 4,
                  },
                ],
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <Bar
              options={chartOptions}
              data={{
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                datasets: [
                  {
                    label: "Monthly Revenue",
                    data: monthlyRevenue,
                    backgroundColor: [
                      "#fed7aa",
                      "#fdba74",
                      "#fb923c",
                      "#f97316",
                      "#ea580c",
                      "#c2410c",
                    ],
                    borderRadius: 18,
                  },
                ],
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Yearly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="h-[280px]">
              <Line
                options={chartOptions}
                data={{
                  labels: ["2022", "2023", "2024", "2025", "2026"],
                  datasets: [
                    {
                      label: "Yearly Revenue",
                      data: yearlyRevenue,
                      borderColor: "#ea580c",
                      backgroundColor: "rgba(234,88,12,0.16)",
                      tension: 0.4,
                      fill: true,
                    },
                  ],
                }}
              />
            </div>
            <div className="grid gap-3 rounded-[24px] bg-orange-50 p-5">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-sm text-slate-500">Profit margin</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">
                  67.8%
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-sm text-slate-500">
                  Year-over-year growth
                </div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">
                  +18.2%
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-sm text-slate-500">Average basket</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">
                  LKR 1,860
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
