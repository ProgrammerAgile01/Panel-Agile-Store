"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "Jan", churnRate: 4.2, retention: 95.8, newCustomers: 450 },
  { month: "Feb", churnRate: 3.8, retention: 96.2, newCustomers: 520 },
  { month: "Mar", churnRate: 4.1, retention: 95.9, newCustomers: 480 },
  { month: "Apr", churnRate: 3.5, retention: 96.5, newCustomers: 610 },
  { month: "May", churnRate: 3.2, retention: 96.8, newCustomers: 580 },
  { month: "Jun", churnRate: 2.9, retention: 97.1, newCustomers: 650 },
]

export function ChurnAnalysisChart() {
  return (
    <div className="h-[350px] w-full">
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
                    <p className="text-sm text-red-500">Churn Rate: {payload[0]?.value}%</p>
                    <p className="text-sm text-green-500">Retention: {payload[1]?.value}%</p>
                    <p className="text-sm text-blue-500">New Customers: {payload[2]?.value}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey="churnRate"
            stroke="hsl(var(--destructive))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="retention"
            stroke="hsl(var(--accent))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="newCustomers"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
