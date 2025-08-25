"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { feature: "Dashboard", usage: 95, satisfaction: 4.8 },
  { feature: "Mobile App", usage: 87, satisfaction: 4.6 },
  { feature: "Analytics", usage: 73, satisfaction: 4.4 },
  { feature: "API Access", usage: 45, satisfaction: 4.2 },
  { feature: "Integrations", usage: 38, satisfaction: 4.0 },
  { feature: "White Label", usage: 22, satisfaction: 3.8 },
]

export function UsageInsightsChart() {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="horizontal">
          <XAxis type="number" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <YAxis
            type="category"
            dataKey="feature"
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
            width={80}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-morphism p-3 border border-border rounded-lg">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-primary">Usage: {payload[0]?.value}%</p>
                    <p className="text-sm text-accent">Satisfaction: {payload[1]?.value}/5</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="usage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          <Bar dataKey="satisfaction" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
