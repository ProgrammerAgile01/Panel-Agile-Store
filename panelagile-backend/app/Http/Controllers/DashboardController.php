<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /** GET /api/dashboard/overview */
    public function overview(Request $request)
    {
        $today = Carbon::today();
        $startOfMonth = $today->copy()->startOfMonth();
        $startOfLastMonth = $startOfMonth->copy()->subMonth();
        $endOfLastMonth = $startOfMonth->copy()->subSecond();

        $totalSubscriptions = Subscription::count();
        $activeSubscriptions = Subscription::currentlyActive()->count();

        $days = (int) $request->integer('expiring_days', 7);
        $expiringSoon = Subscription::where('is_active', true)
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [$today, $today->copy()->addDays($days)])
            ->count();

        $totalCustomers = DB::table('mst_customers')->count();
        $newCustomersThisMonth = DB::table('mst_customers')
            ->whereDate('created_at', '>=', $startOfMonth)
            ->count();

        $monthlyRevenue = (float) DB::table('orders')
            ->whereNotNull('paid_at')
            ->whereDate('paid_at', '>=', $startOfMonth)
            ->sum('total');

        $revenueLastMonth = (float) DB::table('orders')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('total');

        $totalProducts = DB::table('mst_products')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_subscriptions'      => (int) $totalSubscriptions,
                'active_subscriptions'     => (int) $activeSubscriptions,
                'expiring_soon'            => (int) $expiringSoon,
                'total_customers'          => (int) $totalCustomers,
                'new_customers_this_month' => (int) $newCustomersThisMonth,
                'monthly_revenue'          => $monthlyRevenue,
                'revenue_last_month'       => $revenueLastMonth,
                'total_products'           => (int) $totalProducts,
                'last_updated'             => now()->toDateTimeString(),
            ],
        ]);
    }

    /** GET /api/dashboard/revenue-chart?months=6 */
    public function revenueChart(Request $request)
    {
        $months = max(1, (int) $request->integer('months', 6));
        $end = Carbon::today()->endOfMonth();
        $start = $end->copy()->subMonths($months - 1)->startOfMonth();

        $rows = DB::table('orders')
            ->select(
                DB::raw("DATE_FORMAT(paid_at, '%Y-%m') as ym"),
                DB::raw('SUM(total) as total')
            )
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$start, $end])
            ->groupBy('ym')
            ->orderBy('ym')
            ->get()
            ->keyBy('ym');

        $labels = [];
        $values = [];
        $cursor = $start->copy();

        while ($cursor <= $end) {
            $ym = $cursor->format('Y-m');
            $labels[] = $ym;
            $values[] = isset($rows[$ym]) ? (float) $rows[$ym]->total : 0.0;
            $cursor->addMonth();
        }

        return response()->json(['success' => true, 'data' => compact('labels', 'values')]);
    }

    /** GET /api/dashboard/customer-growth?months=6 */
    public function customerGrowth(Request $request)
    {
        $months = max(1, (int) $request->integer('months', 6));
        $end = Carbon::today()->endOfMonth();
        $start = $end->copy()->subMonths($months - 1)->startOfMonth();

        $rows = DB::table('mst_customers')
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as ym"),
                DB::raw('COUNT(*) as total')
            )
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('ym')
            ->orderBy('ym')
            ->get()
            ->keyBy('ym');

        $labels = [];
        $values = [];
        $cursor = $start->copy();

        while ($cursor <= $end) {
            $ym = $cursor->format('Y-m');
            $labels[] = $ym;
            $values[] = isset($rows[$ym]) ? (int) $rows[$ym]->total : 0;
            $cursor->addMonth();
        }

        return response()->json(['success' => true, 'data' => compact('labels', 'values')]);
    }

    /** GET /api/dashboard/product-performance?limit=5 */
    public function productPerformance(Request $request)
    {
        $limit = max(1, (int) $request->integer('limit', 5));

        $rows = DB::table('orders')
            ->select('product_code', 'product_name', DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as orders_count'))
            ->whereNotNull('paid_at')
            ->groupBy('product_code', 'product_name')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(function ($r) {
                $r->revenue = (float) $r->revenue;
                $r->orders_count = (int) $r->orders_count;
                return $r;
            });

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /** GET /api/dashboard/expiring-subscriptions?days=7&per_page=25 */
    public function expiringSubscriptions(Request $request)
    {
        $days = max(1, (int) $request->integer('days', 7));
        $perPage = max(1, (int) $request->integer('per_page', 25));

        $query = Subscription::where('is_active', true)
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [Carbon::today(), Carbon::today()->addDays($days)])
            ->orderBy('end_date');

        $data = $query->paginate($perPage);
        return response()->json(['success' => true, 'data' => $data]);
    }
}
