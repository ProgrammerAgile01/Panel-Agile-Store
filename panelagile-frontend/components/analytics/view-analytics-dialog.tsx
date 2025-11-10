// components/analytics/view-analytics-dialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose, // ← pastikan komponen ini diexport oleh shadcn/ui dialog-mu
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { CustomerGrowthChart } from "@/components/charts/customer-growth-chart";
import { ProductPerformanceChart } from "@/components/charts/product-performance-chart";
import {
  getRevenueChart,
  getCustomerGrowth,
  getProductPerformance,
} from "@/lib/api";
import { ArrowLeft, X } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  months?: number;
};

export default function ViewAnalyticsDialog({
  open,
  onOpenChange,
  months = 6,
}: Props) {
  const [revenue, setRevenue] = React.useState<{
    labels: string[];
    values: number[];
  } | null>(null);
  const [growth, setGrowth] = React.useState<{
    labels: string[];
    values: number[];
  } | null>(null);
  const [perf, setPerf] = React.useState<any[] | null>(null);

  React.useEffect(() => {
    if (!open) return;
    (async () => {
      const [r, g, p] = await Promise.all([
        getRevenueChart(months),
        getCustomerGrowth(months),
        getProductPerformance(10, { range: "month" }),
      ]);
      if (r?.data) setRevenue(r.data);
      if (g?.data) setGrowth(g.data);
      if (p?.data) setPerf(p.data);
    })();
  }, [open, months]);

  const perfMinWidth = React.useMemo(() => {
    const n = perf?.length ?? 0;
    return Math.max(640, n * 140);
  }, [perf]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`
          max-w-[100vw] sm:max-w-[900px]
          rounded-none sm:rounded-2xl
          p-0
          h-[90vh] sm:h-[85vh]
          flex flex-col
          overflow-hidden
        `}
      >
        {/* Header sticky + CLOSE/BACK BUTTON */}
        <DialogHeader className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-3 sm:px-6 py-2.5">
          <div className="flex items-center gap-2">
            {/* Back (mobile) */}
            <DialogClose asChild>
              <Button
                size="sm"
                variant="ghost"
                className="sm:hidden shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </DialogClose>

            <div className="min-w-0">
              <DialogTitle>Analytics Overview</DialogTitle>
              <DialogDescription className="truncate">
                High-level insight for revenue, customers, and product
                performance.
              </DialogDescription>
            </div>

            {/* Close (desktop) */}
            <div className="ml-auto hidden sm:block">
              <DialogClose asChild>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Close analytics"
                >
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </DialogClose>
            </div>

            {/* Close icon (fallback for very small widths) */}
            <DialogClose asChild>
              <Button
                size="icon"
                variant="ghost"
                className="ml-auto sm:hidden"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 pb-6 space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[190px] sm:h-[220px]">
                  {revenue ? (
                    <RevenueChart
                      labels={revenue.labels}
                      values={revenue.values}
                    />
                  ) : (
                    <div className="h-full grid place-items-center text-sm text-muted-foreground">
                      Loading…
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Customer Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[190px] sm:h-[220px]">
                  {growth ? (
                    <CustomerGrowthChart
                      labels={growth.labels}
                      values={growth.values}
                    />
                  ) : (
                    <div className="h-full grid place-items-center text-sm text-muted-foreground">
                      Loading…
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2 – Product Performance (horizontal scroll bila banyak) */}
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Product Performance (this month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] sm:h-[260px] overflow-x-auto">
                <div style={{ width: perfMinWidth }} className="h-full">
                  {perf ? (
                    <ProductPerformanceChart data={perf} />
                  ) : (
                    <div className="h-full grid place-items-center text-sm text-muted-foreground">
                      Loading…
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
