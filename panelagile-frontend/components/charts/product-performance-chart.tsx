"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { product: "Basic Plan", sales: 1200, revenue: 24000 },
  { product: "Premium Plan", sales: 800, revenue: 48000 },
  { product: "Business Plan", sales: 400, revenue: 32000 },
  { product: "Enterprise", sales: 150, revenue: 22500 },
  { product: "Add-ons", sales: 600, revenue: 12000 },
]

export function ProductPerformanceChart() {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="product" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-morphism p-3 border border-border rounded-lg">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-primary">Sales: {payload[0].value} units</p>
                    <p className="text-sm text-accent">Revenue: ${payload[1].value?.toLocaleString()}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
