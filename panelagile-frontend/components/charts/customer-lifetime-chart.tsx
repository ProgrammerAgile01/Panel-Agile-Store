"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "Month 1", basic: 29, premium: 79, business: 149 },
  { month: "Month 3", basic: 87, premium: 237, business: 447 },
  { month: "Month 6", basic: 174, premium: 474, business: 894 },
  { month: "Month 12", basic: 348, premium: 948, business: 1788 },
  { month: "Month 18", basic: 522, premium: 1422, business: 2682 },
  { month: "Month 24", basic: 696, premium: 1896, business: 3576 },
]

export function CustomerLifetimeChart() {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="basicGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="businessGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <YAxis
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-morphism p-3 border border-border rounded-lg">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-chart-1">Basic: ${payload[0]?.value}</p>
                    <p className="text-sm text-primary">Premium: ${payload[1]?.value}</p>
                    <p className="text-sm text-accent">Business: ${payload[2]?.value}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area type="monotone" dataKey="basic" stackId="1" stroke="hsl(var(--chart-1))" fill="url(#basicGradient)" />
          <Area
            type="monotone"
            dataKey="premium"
            stackId="1"
            stroke="hsl(var(--primary))"
            fill="url(#premiumGradient)"
          />
          <Area
            type="monotone"
            dataKey="business"
            stackId="1"
            stroke="hsl(var(--accent))"
            fill="url(#businessGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
