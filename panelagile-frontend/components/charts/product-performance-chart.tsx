"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { ProductPerformanceItem } from "@/lib/api";

type Props = {
  data: ProductPerformanceItem[];
};

export function ProductPerformanceChart({ data }: Props) {
  const chartData = data.map((d) => ({
    product: d.product_name || d.product_code,
    revenue: d.revenue,
    orders: d.orders_count,
  }));

  return (
    <div className="w-full">
      {/* ✅ HEIGHT DIKUNCI */}
      <div className="h-[260px] md:h-[320px] lg:h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
            barCategoryGap={"30%"} // ✅ mencegah bar melebar penuh
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

            <XAxis
              dataKey="product"
              axisLine={false}
              tickLine={false}
              className="text-xs fill-muted-foreground"
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              className="text-xs fill-muted-foreground"
              tickFormatter={(value) =>
                (value as number).toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                })
              }
            />

            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const revenue = payload.find((p) => p.dataKey === "revenue")
                    ?.value as number;
                  const orders = payload.find((p) => p.dataKey === "orders")
                    ?.value as number;

                  return (
                    <div className="glass-morphism p-3 border border-border rounded-lg text-xs shadow-lg">
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-primary">
                        Revenue:{" "}
                        {revenue.toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-muted-foreground">Orders: {orders}</p>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* ✅ BATASI LEBAR BAR */}
            <Bar
              dataKey="revenue"
              fill="hsl(var(--primary))"
              maxBarSize={45}
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="orders"
              fill="hsl(var(--accent))"
              maxBarSize={45}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
