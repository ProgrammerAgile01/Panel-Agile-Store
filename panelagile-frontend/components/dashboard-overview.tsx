"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  Send,
  Gift,
  Eye,
  Calendar,
  Target,
  Zap,
} from "lucide-react"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { CustomerGrowthChart } from "@/components/charts/customer-growth-chart"
import { ProductPerformanceChart } from "@/components/charts/product-performance-chart"

export function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Header with Smart Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Good morning, Admin
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with Agile Store today</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="animate-pulse-glow bg-gradient-to-r from-primary to-accent text-primary-foreground border-primary/30">
            <Zap className="h-3 w-3 mr-1" />
            AI Insights Active
          </Badge>
        </div>
      </div>

      {/* Smart Alert Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-morphism border-l-4 border-l-accent animate-pulse-glow bg-gradient-to-br from-card to-accent/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-accent" />
                Smart Alert
              </CardTitle>
              <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30 glow-gold">Action Required</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              <strong className="text-foreground">23 customers</strong> will have their subscriptions expire this week.
              Send them renewal reminders to reduce churn.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 glow-primary"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Reminders
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-chart-4/30 text-chart-4 hover:bg-chart-4/10 bg-transparent"
              >
                <Gift className="h-4 w-4 mr-2" />
                Create Discount
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism border-l-4 border-l-primary bg-gradient-to-br from-card to-primary/5 glow-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Revenue Opportunity
              </CardTitle>
              <Badge className="bg-primary/20 text-primary border-primary/30">Trending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your <strong className="text-foreground">Premium Package</strong> has 85% conversion rate. Consider
              promoting it to increase monthly revenue by ~$12,000.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-gradient-to-r from-secondary to-primary hover:from-secondary/80 hover:to-primary/80"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button size="sm" variant="outline" className="border-primary/30 hover:bg-primary/10 bg-transparent">
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-morphism glow-primary bg-gradient-to-br from-card to-primary/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              1,234
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12%</span>
              <span className="text-muted-foreground">from last month</span>
            </div>
            <Progress value={75} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="glass-morphism glow-accent bg-gradient-to-br from-card to-accent/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              5,678
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+8%</span>
              <span className="text-muted-foreground">from last month</span>
            </div>
            <Progress value={68} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="glass-morphism bg-gradient-to-br from-card to-secondary/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-secondary to-chart-4 bg-clip-text text-transparent">
              $45,678
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+15%</span>
              <span className="text-muted-foreground">from last month</span>
            </div>
            <Progress value={82} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="glass-morphism animate-pulse-glow border-chart-4/50 bg-gradient-to-br from-card to-chart-4/10 glow-gold">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Calendar className="h-4 w-4 text-chart-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">23</div>
            <div className="flex items-center gap-1 text-xs">
              <AlertTriangle className="h-3 w-3 text-chart-4" />
              <span className="text-chart-4">Action needed</span>
            </div>
            <Button
              size="sm"
              className="mt-2 w-full bg-gradient-to-r from-chart-4/20 to-chart-4/10 border-chart-4/30 hover:bg-chart-4/20"
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Reminders
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-morphism bg-gradient-to-br from-card to-primary/5 glow-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card className="glass-morphism bg-gradient-to-br from-card to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              <Users className="h-5 w-5 text-accent" />
              Customer Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerGrowthChart />
          </CardContent>
        </Card>
      </div>

      {/* Product Performance */}
      <Card className="glass-morphism bg-gradient-to-br from-card to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            <Package className="h-5 w-5 text-secondary" />
            Product Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductPerformanceChart />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass-morphism bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              className="h-20 flex-col gap-2 bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20 hover:bg-primary/20 hover:glow-primary"
              variant="outline"
            >
              <Package className="h-6 w-6 text-primary" />
              Add Product
            </Button>
            <Button
              className="h-20 flex-col gap-2 bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20 hover:bg-accent/20 hover:glow-accent"
              variant="outline"
            >
              <Users className="h-6 w-6 text-accent" />
              Manage Users
            </Button>
            <Button
              className="h-20 flex-col gap-2 bg-gradient-to-br from-chart-4/10 to-primary/5 border-chart-4/20 hover:bg-chart-4/20 hover:glow-gold"
              variant="outline"
            >
              <Gift className="h-6 w-6 text-chart-4" />
              Create Coupon
            </Button>
            <Button
              className="h-20 flex-col gap-2 bg-gradient-to-br from-secondary/10 to-accent/5 border-secondary/20 hover:bg-secondary/20"
              variant="outline"
            >
              <Eye className="h-6 w-6 text-secondary" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
