"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, TrendingDown, Users, DollarSign, Download, Filter, RefreshCw } from "lucide-react"
import { SalesAnalyticsChart } from "@/components/charts/sales-analytics-chart"
import { ChurnAnalysisChart } from "@/components/charts/churn-analysis-chart"
import { UsageInsightsChart } from "@/components/charts/usage-insights-chart"
import { CustomerLifetimeChart } from "@/components/charts/customer-lifetime-chart"

export function AnalyticsManagement() {
  const analyticsData = {
    totalRevenue: 157600,
    revenueGrowth: 15.2,
    totalCustomers: 5678,
    customerGrowth: 8.4,
    churnRate: 3.2,
    avgLifetimeValue: 2340,
    conversionRate: 12.8,
    monthlyRecurring: 89400,
  }

  const topProducts = [
    { name: "Premium Plan", revenue: 63200, growth: 23.1, customers: 800 },
    { name: "Business Plan", revenue: 59600, growth: 18.7, customers: 400 },
    { name: "Basic Plan", revenue: 34800, growth: 12.3, customers: 1200 },
  ]

  const recentInsights = [
    {
      title: "Revenue Spike Detected",
      description: "Premium plan sales increased 45% this week",
      type: "positive",
      action: "View Details",
    },
    {
      title: "Churn Risk Alert",
      description: "23 customers showing signs of potential churn",
      type: "warning",
      action: "Send Retention Campaign",
    },
    {
      title: "Feature Usage Drop",
      description: "Mobile app usage down 12% from last month",
      type: "negative",
      action: "Investigate",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Analytics & Reports</h1>
          <p className="text-muted-foreground">Comprehensive business intelligence and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" className="glow-primary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-morphism glow-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${analyticsData.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+{analyticsData.revenueGrowth}%</span>
                </div>
              </div>
              <div className="p-3 bg-primary/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism glow-accent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{analyticsData.totalCustomers.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+{analyticsData.customerGrowth}%</span>
                </div>
              </div>
              <div className="p-3 bg-accent/20 rounded-lg">
                <Users className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{analyticsData.churnRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">-0.8%</span>
                </div>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg LTV</p>
                <p className="text-2xl font-bold">${analyticsData.avgLifetimeValue}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+5.2%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      <Card className="glass-morphism glow-accent animate-pulse-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentInsights.map((insight, index) => (
              <Card key={index} className="glass-morphism">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{insight.title}</h3>
                      <Badge
                        className={
                          insight.type === "positive"
                            ? "bg-green-500/20 text-green-500"
                            : insight.type === "warning"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-red-500/20 text-red-500"
                        }
                      >
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                    <Button size="sm" variant="outline" className="w-full bg-transparent">
                      {insight.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="glass-morphism">
          <TabsTrigger value="sales">Sales Dashboard</TabsTrigger>
          <TabsTrigger value="customers">Customer Growth</TabsTrigger>
          <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
          <TabsTrigger value="usage">Usage Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesAnalyticsChart />
              </CardContent>
            </Card>

            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.customers} customers</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${product.revenue.toLocaleString()}</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-500">+{product.growth}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Monthly Recurring Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    ${analyticsData.monthlyRecurring.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Current MRR</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{analyticsData.conversionRate}%</div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">$2,340</div>
                  <p className="text-sm text-muted-foreground">Avg Revenue/User</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">18 months</div>
                  <p className="text-sm text-muted-foreground">Avg Retention</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Customer Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerLifetimeChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn" className="space-y-6">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Churn Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ChurnAnalysisChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Feature Usage Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageInsightsChart />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
