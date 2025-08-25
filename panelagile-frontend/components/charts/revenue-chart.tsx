"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "Jan", revenue: 32000, target: 30000 },
  { month: "Feb", revenue: 35000, target: 32000 },
  { month: "Mar", revenue: 38000, target: 35000 },
  { month: "Apr", revenue: 42000, target: 38000 },
  { month: "May", revenue: 45000, target: 42000 },
  { month: "Jun", revenue: 48000, target: 45000 },
]

export function RevenueChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <YAxis
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-morphism p-3 border border-border rounded-lg">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-primary">Revenue: ${payload[0].value?.toLocaleString()}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
