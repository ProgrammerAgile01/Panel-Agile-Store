"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  labels: string[];
  values: number[];
};

export function CustomerGrowthChart({ labels, values }: Props) {
  const data = labels.map((label, i) => ({
    month: label,
    customers: values[i] ?? 0,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const v = payload[0].value as number;
                return (
                  <div className="glass-morphism p-3 border border-border rounded-lg text-xs">
                    <p className="font-medium">{label}</p>
                    <p className="text-accent">
                      Customers: {v.toLocaleString("id-ID")}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="customers"
            stroke="hsl(var(--accent))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
