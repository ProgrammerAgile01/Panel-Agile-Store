// //components/dashboard-overview.tsx
// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import {
//   TrendingUp,
//   Users,
//   Package,
//   DollarSign,
//   AlertTriangle,
//   Send,
//   Gift,
//   Eye,
//   Calendar,
//   Target,
//   Zap,
// } from "lucide-react";
// import { RevenueChart } from "@/components/charts/revenue-chart";
// import { CustomerGrowthChart } from "@/components/charts/customer-growth-chart";
// import { ProductPerformanceChart } from "@/components/charts/product-performance-chart";

// import {
//   getDashboardOverview,
//   getRevenueChart,
//   getCustomerGrowth,
//   getProductPerformance,
// } from "@/lib/api";

// type OverviewData = {
//   total_subscriptions: number;
//   active_subscriptions: number;
//   expiring_soon: number;
//   total_customers: number;
//   new_customers_this_month: number;
//   monthly_revenue: number;
//   revenue_last_month: number;
//   total_products: number;
//   last_updated: string;
// };

// export function DashboardOverview() {
//   // UI state
//   const [overview, setOverview] = useState<OverviewData | null>(null);
//   const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
//   const [overviewError, setOverviewError] = useState<string | null>(null);

//   // charts
//   const [revenueChart, setRevenueChart] = useState<{
//     labels: string[];
//     values: number[];
//   } | null>(null);
//   const [customerGrowthChart, setCustomerGrowthChart] = useState<{
//     labels: string[];
//     values: number[];
//   } | null>(null);
//   const [productPerformance, setProductPerformance] = useState<any[] | null>(
//     null
//   );

//   // polling ref
//   const pollRef = useRef<number | null>(null);

//   // helper: load overview
//   const loadOverview = async (signal?: AbortSignal) => {
//     setLoadingOverview(true);
//     setOverviewError(null);
//     try {
//       const res = await getDashboardOverview();
//       if (signal?.aborted) return;
//       setOverview(res.data);
//     } catch (err: any) {
//       console.error("Failed loading overview:", err);
//       setOverviewError(err?.message || "Failed to load overview");
//     } finally {
//       setLoadingOverview(false);
//     }
//   };

//   const loadCharts = async (months = 6) => {
//     try {
//       const [revenues, customers, products] = await Promise.all([
//         getRevenueChart(months),
//         getCustomerGrowth(months),
//         // ⬇️ samakan scope Product Performance ke bulan berjalan
//         getProductPerformance(6, { range: "month" }),
//       ]);
//       if (revenues?.data) {
//         setRevenueChart({
//           labels: revenues.data.labels,
//           values: revenues.data.values,
//         });
//       }
//       if (customers?.data) {
//         setCustomerGrowthChart({
//           labels: customers.data.labels,
//           values: customers.data.values,
//         });
//       }
//       if (products?.data) {
//         setProductPerformance(products.data);
//       }
//     } catch (err) {
//       console.error("Failed loading charts:", err);
//       // keep previous charts if any
//     }
//   };

//   // initial load + charts
//   useEffect(() => {
//     const controller = new AbortController();
//     loadOverview(controller.signal);
//     loadCharts();

//     return () => {
//       controller.abort();
//     };
//   }, []);

//   // polling (light realtime) every 30s by default
//   useEffect(() => {
//     const POLL_INTERVAL = 30_000; // 30s (adjustable)
//     if (pollRef.current) {
//       window.clearInterval(pollRef.current);
//       pollRef.current = null;
//     }

//     pollRef.current = window.setInterval(() => {
//       loadOverview();
//     }, POLL_INTERVAL);

//     const CHARTS_INTERVAL = POLL_INTERVAL * 5;
//     const chartTimer = window.setInterval(() => {
//       loadCharts();
//     }, CHARTS_INTERVAL);

//     return () => {
//       if (pollRef.current) {
//         window.clearInterval(pollRef.current);
//       }
//       window.clearInterval(chartTimer);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // OPTIONAL: realtime via Laravel Echo (if you have Echo configured)
//   useEffect(() => {
//     // @ts-ignore
//     const Echo = (window as any).Echo;
//     if (!Echo) return;
//     try {
//       const channel = Echo.channel("dashboard");
//       channel.listen(".dashboard.updated", () => {
//         // Invalidate and refresh overview + charts quickly when server broadcasts update
//         loadOverview();
//         loadCharts();
//       });
//       return () => {
//         channel.stopListening(".dashboard.updated");
//       };
//     } catch (e) {
//       console.debug("Echo not available or failed to subscribe", e);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // small helpers for display formatting
//   const formatNumber = (n?: number | null) =>
//     typeof n === "number" ? n.toLocaleString("id-ID") : "--";

//   // ⬇️ tampilkan Rupiah (Rp) tanpa desimal
//   const currencyFormat = (n?: number | null) =>
//     typeof n === "number"
//       ? n.toLocaleString("id-ID", {
//           style: "currency",
//           currency: "IDR",
//           maximumFractionDigits: 0,
//         })
//       : "--";

//   // compute percent change for revenue (basic)
//   const revenueChangePercent = (() => {
//     if (!overview) return 0;
//     const { monthly_revenue, revenue_last_month } = overview;
//     if ((revenue_last_month ?? 0) === 0) return 0;
//     return Math.round(
//       ((monthly_revenue - revenue_last_month) / (revenue_last_month || 1)) * 100
//     );
//   })();

//   return (
//     <div className="space-y-8">
//       {/* Header with Smart Greeting */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
//             Good morning, Admin
//           </h1>
//           <p className="text-muted-foreground mt-1">
//             Here's what's happening with Agile Store today
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Badge className="animate-pulse-glow bg-gradient-to-r from-primary to-accent text-primary-foreground border-primary/30 whitespace-nowrap">
//             <Zap className="h-3 w-3 mr-1" />
//             AI Insights Active
//           </Badge>
//         </div>
//       </div>

//       {/* Smart Alert Cards */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <Card className="glass-morphism border-l-4 border-l-accent animate-pulse-glow bg-gradient-to-br from-card to-accent/5">
//           <CardHeader className="pb-3">
//             <div className="flex items-center justify-between">
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <AlertTriangle className="h-5 w-5 text-accent" />
//                 Smart Alert
//               </CardTitle>
//               <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30 glow-gold whitespace-nowrap">
//                 Action Required
//               </Badge>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <p className="text-sm text-muted-foreground mb-4">
//               <strong className="text-foreground">
//                 {loadingOverview
//                   ? "..."
//                   : formatNumber(overview?.total_customers ?? null)}
//               </strong>{" "}
//               customers will have their subscriptions expire this week. Send
//               them renewal reminders to reduce churn.
//             </p>
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
//               <Button
//                 size="sm"
//                 className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 glow-primary"
//                 onClick={() => {
//                   loadOverview();
//                 }}
//               >
//                 <Send className="h-4 w-4 mr-2" />
//                 Send Reminders
//               </Button>
//               <Button
//                 size="sm"
//                 variant="outline"
//                 className="w-full sm:w-auto border-chart-4/30 text-chart-4 hover:bg-chart-4/10 bg-transparent"
//               >
//                 <Gift className="h-4 w-4 mr-2" />
//                 Create Discount
//               </Button>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="glass-morphism border-l-4 border-l-primary bg-gradient-to-br from-card to-primary/5 glow-primary">
//           <CardHeader className="pb-3">
//             <div className="flex items-center justify-between">
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <Target className="h-5 w-5 text-primary" />
//                 Revenue Opportunity
//               </CardTitle>
//               <Badge className="bg-primary/20 text-primary border-primary/30 whitespace-nowrap">
//                 Trending
//               </Badge>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <p className="text-sm text-muted-foreground mb-4">
//               Your <strong className="text-foreground">Premium Package</strong>{" "}
//               has{" "}
//               <strong>
//                 {loadingOverview ? "..." : `${revenueChangePercent}%`}
//               </strong>{" "}
//               conversion rate. Consider promoting it to increase monthly
//               revenue.
//             </p>
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
//               <Button
//                 size="sm"
//                 className="w-full sm:w-auto bg-gradient-to-r from-secondary to-primary hover:from-secondary/80 hover:to-primary/80"
//               >
//                 <Eye className="h-4 w-4 mr-2" />
//                 View Analytics
//               </Button>
//               <Button
//                 size="sm"
//                 variant="outline"
//                 className="w-full sm:w-auto border-primary/30 hover:bg-primary/10 bg-transparent"
//                 onClick={() => {
//                   // quick create campaign action placeholder
//                 }}
//               >
//                 Create Campaign
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Key Metrics Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <Card className="glass-morphism glow-primary bg-gradient-to-br from-card to-primary/10">
//           <CardHeader className="pb-2">
//             <div className="flex items-center justify-between">
//               <CardTitle className="text-sm font-medium">
//                 Total Products
//               </CardTitle>
//               <Package className="h-4 w-4 text-primary" />
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
//               {loadingOverview
//                 ? "..."
//                 : formatNumber(overview?.total_products ?? null)}
//             </div>
//             <div className="flex items-center gap-1 text-xs">
//               <TrendingUp className="h-3 w-3 text-green-500" />
//               <span className="text-green-500">+12%</span>
//               <span className="text-muted-foreground">from last month</span>
//             </div>
//             <Progress value={75} className="mt-2 h-1" />
//           </CardContent>
//         </Card>

//         <Card className="glass-morphism glow-accent bg-gradient-to-br from-card to-accent/10">
//           <CardHeader className="pb-2">
//             <div className="flex items-center justify-between">
//               <CardTitle className="text-sm font-medium">
//                 Active Customers
//               </CardTitle>
//               <Users className="h-4 w-4 text-accent" />
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
//               {loadingOverview
//                 ? "..."
//                 : formatNumber(overview?.active_subscriptions ?? null)}
//             </div>
//             <div className="flex items-center gap-1 text-xs">
//               <TrendingUp className="h-3 w-3 text-green-500" />
//               <span className="text-green-500">+8%</span>
//               <span className="text-muted-foreground">from last month</span>
//             </div>
//             <Progress
//               value={
//                 overview
//                   ? Math.min(
//                       100,
//                       Math.round(
//                         (overview.active_subscriptions /
//                           Math.max(1, overview.total_subscriptions || 1)) *
//                           100
//                       )
//                     )
//                   : 0
//               }
//               className="mt-2 h-1"
//             />
//           </CardContent>
//         </Card>

//         <Card className="glass-morphism bg-gradient-to-br from-card to-secondary/10">
//           <CardHeader className="pb-2">
//             <div className="flex items-center justify-between">
//               <CardTitle className="text-sm font-medium">
//                 Monthly Revenue
//               </CardTitle>
//               <DollarSign className="h-4 w-4 text-secondary" />
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold bg-gradient-to-r from-secondary to-chart-4 bg-clip-text text-transparent">
//               {loadingOverview
//                 ? "..."
//                 : currencyFormat(overview?.monthly_revenue ?? null)}
//             </div>
//             <div className="flex items-center gap-1 text-xs">
//               <TrendingUp className="h-3 w-3 text-green-500" />
//               <span className="text-green-500">
//                 {revenueChangePercent >= 0
//                   ? `+${revenueChangePercent}%`
//                   : `${revenueChangePercent}%`}
//               </span>
//               <span className="text-muted-foreground">from last month</span>
//             </div>
//             <Progress value={82} className="mt-2 h-1" />
//           </CardContent>
//         </Card>

//         <Card className="glass-morphism animate-pulse-glow border-chart-4/50 bg-gradient-to-br from-card to-chart-4/10 glow-gold">
//           <CardHeader className="pb-2">
//             <div className="flex items-center justify-between">
//               <CardTitle className="text-sm font-medium">
//                 Expiring Soon
//               </CardTitle>
//               <Calendar className="h-4 w-4 text-chart-4" />
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-chart-4">
//               {loadingOverview
//                 ? "..."
//                 : formatNumber(overview?.expiring_soon ?? null)}
//             </div>
//             <div className="flex items-center gap-1 text-xs">
//               <AlertTriangle className="h-3 w-3 text-chart-4" />
//               <span className="text-chart-4">Action needed</span>
//             </div>
//             <Button
//               size="sm"
//               className="mt-2 w-full bg-gradient-to-r from-chart-4/20 to-chart-4/10 border-chart-4/30 hover:bg-chart-4/20"
//               variant="outline"
//             >
//               <Send className="h-4 w-4 mr-2" />
//               Send Reminders
//             </Button>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Charts Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <Card className="glass-morphism bg-gradient-to-br from-card to-primary/5 glow-primary">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
//               <TrendingUp className="h-5 w-5 text-primary" />
//               Revenue Trends
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             {revenueChart ? (
//               <RevenueChart
//                 labels={revenueChart.labels}
//                 values={revenueChart.values}
//               />
//             ) : (
//               <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
//                 Loading chart...
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <Card className="glass-morphism bg-gradient-to-br from-card to-accent/5">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
//               <Users className="h-5 w-5 text-accent" />
//               Customer Growth
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             {customerGrowthChart ? (
//               <CustomerGrowthChart
//                 labels={customerGrowthChart.labels}
//                 values={customerGrowthChart.values}
//               />
//             ) : (
//               <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
//                 Loading chart...
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Product Performance */}
//       <Card className="glass-morphism bg-gradient-to-br from-card to-secondary/5">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
//             <Package className="h-5 w-5 text-secondary" />
//             Product Performance
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           {productPerformance ? (
//             <ProductPerformanceChart data={productPerformance} />
//           ) : (
//             <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
//               Loading product performance...
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Quick Actions */}
//       <Card className="glass-morphism bg-gradient-to-br from-card to-primary/5">
//         <CardHeader>
//           <CardTitle className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
//             Quick Actions
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <Button
//               className="h-20 flex-col gap-2 bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20 hover:bg-primary/20 hover:glow-primary"
//               variant="outline"
//             >
//               <Package className="h-6 w-6 text-primary" />
//               Add Product
//             </Button>
//             <Button
//               className="h-20 flex-col gap-2 bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20 hover:bg-accent/20 hover:glow-accent"
//               variant="outline"
//             >
//               <Users className="h-6 w-6 text-accent" />
//               Manage Users
//             </Button>
//             <Button
//               className="h-20 flex-col gap-2 bg-gradient-to-br from-chart-4/10 to-primary/5 border-chart-4/20 hover:bg-chart-4/20 hover:glow-gold"
//               variant="outline"
//             >
//               <Gift className="h-6 w-6 text-chart-4" />
//               Create Coupon
//             </Button>
//             <Button
//               className="h-20 flex-col gap-2 bg-gradient-to-br from-secondary/10 to-accent/5 border-secondary/20 hover:bg-secondary/20"
//               variant="outline"
//             >
//               <Eye className="h-6 w-6 text-secondary" />
//               View Reports
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// components/dashboard-overview.tsx
// components/dashboard-overview.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  Gift,
  Eye,
  Calendar,
  Target,
  Zap,
} from "lucide-react";

import { RevenueChart } from "@/components/charts/revenue-chart";
import { CustomerGrowthChart } from "@/components/charts/customer-growth-chart";
import { ProductPerformanceChart } from "@/components/charts/product-performance-chart";
import ViewAnalyticsDialog from "@/components/analytics/view-analytics-dialog";

import {
  getDashboardOverview,
  getRevenueChart,
  getCustomerGrowth,
  getProductPerformance,
} from "@/lib/api";

type OverviewData = {
  total_subscriptions: number;
  active_subscriptions: number;
  expiring_soon: number;
  total_customers: number;
  new_customers_this_month: number;
  monthly_revenue: number;
  revenue_last_month: number;
  total_products: number;
  /** ⬇️ opsional: kalau backend kirim, kita pakai; kalau tidak, fallback 0% */
  total_products_last_month?: number | null;
  last_updated: string;
};

export function DashboardOverview() {
  // UI state
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // charts
  const [revenueChart, setRevenueChart] = useState<{
    labels: string[];
    values: number[];
  } | null>(null);
  const [customerGrowthChart, setCustomerGrowthChart] = useState<{
    labels: string[];
    values: number[];
  } | null>(null);
  const [productPerformance, setProductPerformance] = useState<any[] | null>(
    null
  );

  // analytics dialog
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // polling ref
  const pollRef = useRef<number | null>(null);

  // helper: load overview
  const loadOverview = async (signal?: AbortSignal) => {
    setLoadingOverview(true);
    setOverviewError(null);
    try {
      const res = await getDashboardOverview();
      if (signal?.aborted) return;
      setOverview(res.data);
    } catch (err: any) {
      console.error("Failed loading overview:", err);
      setOverviewError(err?.message || "Failed to load overview");
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadCharts = async (months = 6) => {
    try {
      const [revenues, customers, products] = await Promise.all([
        getRevenueChart(months),
        getCustomerGrowth(months),
        // samakan scope Product Performance ke bulan berjalan
        getProductPerformance(6, { range: "month" }),
      ]);
      if (revenues?.data) {
        setRevenueChart({
          labels: revenues.data.labels,
          values: revenues.data.values,
        });
      }
      if (customers?.data) {
        setCustomerGrowthChart({
          labels: customers.data.labels,
          values: customers.data.values,
        });
      }
      if (products?.data) {
        setProductPerformance(products.data);
      }
    } catch (err) {
      console.error("Failed loading charts:", err);
    }
  };

  // initial load + charts
  useEffect(() => {
    const controller = new AbortController();
    loadOverview(controller.signal);
    loadCharts();
    return () => controller.abort();
  }, []);

  // polling (light realtime) every 30s by default
  useEffect(() => {
    const POLL_INTERVAL = 30_000; // 30s
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollRef.current = window.setInterval(() => {
      loadOverview();
    }, POLL_INTERVAL);

    const CHARTS_INTERVAL = POLL_INTERVAL * 5;
    const chartTimer = window.setInterval(() => {
      loadCharts();
    }, CHARTS_INTERVAL);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      window.clearInterval(chartTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // optional realtime via Echo
  useEffect(() => {
    // @ts-ignore
    const Echo = (window as any).Echo;
    if (!Echo) return;
    try {
      const channel = Echo.channel("dashboard");
      channel.listen(".dashboard.updated", () => {
        loadOverview();
        loadCharts();
      });
      return () => {
        channel.stopListening(".dashboard.updated");
      };
    } catch (e) {
      console.debug("Echo not available or failed to subscribe", e);
    }
  }, []);

  // formatters
  const formatNumber = (n?: number | null) =>
    typeof n === "number" ? n.toLocaleString("id-ID") : "--";

  const currencyFormat = (n?: number | null) =>
    typeof n === "number"
      ? n.toLocaleString("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        })
      : "--";

  // compute percent change for revenue (data asli)
  const revenueChangePercent = useMemo(() => {
    if (!overview) return 0;
    const { monthly_revenue, revenue_last_month } = overview;
    if ((revenue_last_month ?? 0) === 0) return 0;
    return Math.round(
      ((monthly_revenue - revenue_last_month) / (revenue_last_month || 1)) * 100
    );
  }, [overview]);

  // compute percent change untuk Active Customers dari chart
  const activeCustomersChangePct = useMemo(() => {
    const vals = customerGrowthChart?.values || [];
    if (vals.length < 2) return null;
    const prev = vals[vals.length - 2] ?? 0;
    const curr = vals[vals.length - 1] ?? 0;
    if (prev === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  }, [customerGrowthChart]);

  // compute percent change untuk Total Products (fallback 0% bila data prev tidak ada)
  const totalProductsChangePct = useMemo(() => {
    if (!overview) return 0;
    const curr = overview.total_products ?? 0;
    const prev = (overview.total_products_last_month ?? 0) as number;
    if (!prev || prev <= 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  }, [overview]);

  return (
    <div className="space-y-8">
      {/* Header with Smart Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Good morning, Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with Agile Store today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="animate-pulse-glow bg-gradient-to-r from-primary to-accent text-primary-foreground border-primary/30 whitespace-nowrap">
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
              <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30 glow-gold whitespace-nowrap">
                Action Required
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              <strong className="text-foreground">
                {loadingOverview
                  ? "..."
                  : formatNumber(overview?.expiring_soon ?? null)}
              </strong>{" "}
              customers will have their subscriptions expire this week. Send
              them renewal reminders to reduce churn.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto border-chart-4/30 text-chart-4 hover:bg-chart-4/10 bg-transparent"
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
              <Badge className="bg-primary/20 text-primary border-primary/30 whitespace-nowrap">
                Trending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your <strong className="text-foreground">Premium Package</strong>{" "}
              has{" "}
              <strong>
                {loadingOverview ? "..." : `${revenueChangePercent}%`}
              </strong>{" "}
              conversion rate. Consider promoting it to increase monthly
              revenue.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
              <Button
                size="sm"
                className="w-full sm:w-auto bg-gradient-to-r from-secondary to-primary hover:from-secondary/80 hover:to-primary/80"
                onClick={() => setAnalyticsOpen(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <Card className="glass-morphism glow-primary bg-gradient-to-br from-card to-primary/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {loadingOverview
                ? "..."
                : formatNumber(overview?.total_products ?? null)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp
                className={`h-3 w-3 ${
                  (totalProductsChangePct ?? 0) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              />
              <span
                className={
                  (totalProductsChangePct ?? 0) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {(totalProductsChangePct ?? 0) >= 0
                  ? `+${totalProductsChangePct}%`
                  : `${totalProductsChangePct}%`}
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
            <Progress value={75} className="mt-2 h-1" />
          </CardContent>
        </Card>

        {/* Active Customers */}
        <Card className="glass-morphism glow-accent bg-gradient-to-br from-card to-accent/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Active Customers
              </CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {loadingOverview
                ? "..."
                : formatNumber(overview?.active_subscriptions ?? null)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp
                className={`h-3 w-3 ${
                  (activeCustomersChangePct ?? 0) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              />
              <span
                className={
                  (activeCustomersChangePct ?? 0) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {activeCustomersChangePct === null
                  ? "+0%"
                  : (activeCustomersChangePct ?? 0) >= 0
                  ? `+${activeCustomersChangePct}%`
                  : `${activeCustomersChangePct}%`}
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
            <Progress
              value={
                overview
                  ? Math.min(
                      100,
                      Math.round(
                        (overview.active_subscriptions /
                          Math.max(1, overview.total_subscriptions || 1)) *
                          100
                      )
                    )
                  : 0
              }
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="glass-morphism bg-gradient-to-br from-card to-secondary/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-secondary to-chart-4 bg-clip-text text-transparent">
              {loadingOverview
                ? "..."
                : currencyFormat(overview?.monthly_revenue ?? null)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">
                {revenueChangePercent >= 0
                  ? `+${revenueChangePercent}%`
                  : `${revenueChangePercent}%`}
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
            <Progress value={82} className="mt-2 h-1" />
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card className="glass-morphism animate-pulse-glow border-chart-4/50 bg-gradient-to-br from-card to-chart-4/10 glow-gold">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Expiring Soon
              </CardTitle>
              <Calendar className="h-4 w-4 text-chart-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">
              {loadingOverview
                ? "..."
                : formatNumber(overview?.expiring_soon ?? null)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <AlertTriangle className="h-3 w-3 text-chart-4" />
              <span className="text-chart-4">Action needed</span>
            </div>
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
            {revenueChart ? (
              <RevenueChart
                labels={revenueChart.labels}
                values={revenueChart.values}
              />
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                Loading chart...
              </div>
            )}
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
            {customerGrowthChart ? (
              <CustomerGrowthChart
                labels={customerGrowthChart.labels}
                values={customerGrowthChart.values}
              />
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                Loading chart...
              </div>
            )}
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
          {productPerformance ? (
            <ProductPerformanceChart data={productPerformance} />
          ) : (
            <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
              Loading product performance...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions (pakai Link) */}
      <Card className="glass-morphism bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              asChild
              className="h-20 flex-col gap-2 bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20 hover:bg-primary/20 hover:glow-primary"
              variant="outline"
            >
              <Link href="/products/all">
                <Package className="h-6 w-6 text-primary" />
                Add Product
              </Link>
            </Button>

            <Button
              asChild
              className="h-20 flex-col gap-2 bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20 hover:bg-accent/20 hover:glow-accent"
              variant="outline"
            >
              <Link href="/matrix-level">
                <Users className="h-6 w-6 text-accent" />
                Manage Users
              </Link>
            </Button>

            <Button
              asChild
              className="h-20 flex-col gap-2 bg-gradient-to-br from-chart-4/10 to-primary/5 border-chart-4/20 hover:bg-chart-4/20 hover:glow-gold"
              variant="outline"
            >
              <Link href="/pricelist">
                <Gift className="h-6 w-6 text-chart-4" />
                Create Discount
              </Link>
            </Button>

            <Button
              asChild
              className="h-20 flex-col gap-2 bg-gradient-to-br from-secondary/10 to-accent/5 border-secondary/20 hover:bg-secondary/20"
              variant="outline"
            >
              <Link href="/reports">
                <Eye className="h-6 w-6 text-secondary" />
                View Report
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Analytics */}
      <ViewAnalyticsDialog
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
        defaultMonths={6}
      />
    </div>
  );
}
