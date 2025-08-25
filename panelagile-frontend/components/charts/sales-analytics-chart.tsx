"use client"

import { Area, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, ComposedChart, Line } from "recharts"

const data = [
  { month: "Jan", revenue: 45000, customers: 1200, conversion: 12.5 },
  { month: "Feb", revenue: 52000, customers: 1350, conversion: 13.2 },
  { month: "Mar", revenue: 48000, customers: 1280, conversion: 11.8 },
  { month: "Apr", revenue: 61000, customers: 1520, conversion: 14.1 },
  { month: "May", revenue: 58000, customers: 1480, conversion: 13.7 },
  { month: "Jun", revenue: 67000, customers: 1650, conversion: 15.2 },
]

export function SalesAnalyticsChart() {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <YAxis
            yAxisId="revenue"
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <YAxis
            yAxisId="customers"
            orientation="right"
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-morphism p-3 border border-border rounded-lg">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-primary">Revenue: ${payload[0]?.value?.toLocaleString()}</p>
                    <p className="text-sm text-accent">Customers: {payload[1]?.value?.toLocaleString()}</p>
                    <p className="text-sm text-blue-500">Conversion: {payload[2]?.value}%</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
          <Bar yAxisId="customers" dataKey="customers" fill="hsl(var(--accent))" opacity={0.6} />
          <Line yAxisId="revenue" type="monotone" dataKey="conversion" stroke="hsl(var(--chart-3))" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
