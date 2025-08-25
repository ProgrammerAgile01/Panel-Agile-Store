"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "Jan", customers: 4200, churn: 150 },
  { month: "Feb", customers: 4500, churn: 120 },
  { month: "Mar", customers: 4800, churn: 100 },
  { month: "Apr", customers: 5200, churn: 90 },
  { month: "May", customers: 5500, churn: 85 },
  { month: "Jun", customers: 5678, churn: 78 },
]

export function CustomerGrowthChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-morphism p-3 border border-border rounded-lg">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-accent">Customers: {payload[0].value?.toLocaleString()}</p>
                    <p className="text-sm text-destructive">Churn: {payload[1].value}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey="customers"
            stroke="hsl(var(--accent))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="churn"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
