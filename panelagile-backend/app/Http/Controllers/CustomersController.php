<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;

class CustomersController extends Controller
{
    /* ========================= Helpers ========================= */

    /** Normalisasi nomor HP untuk perbandingan (hapus spasi, +, -, (), dll). */
    private function phoneSql(string $col): string
    {
        return "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE($col,''),' ',''),'+',''),'-',''),'(',''),')','')";
    }

    /**
     * Tambahkan kondisi pencocokan Orders -> Customer (id/email/phone/name).
     * @param  EloquentBuilder|QueryBuilder $w
     */
    private function matchOrderToCustomer(EloquentBuilder|QueryBuilder $w): void
    {
        $normPhoneOrders   = $this->phoneSql('orders.customer_phone');
        $normPhoneCustomer = $this->phoneSql('mst_customers.phone');

        $w->where(function ($m) use ($normPhoneOrders, $normPhoneCustomer) {
            $m->whereColumn('orders.customer_id', 'mst_customers.id')
              ->orWhereRaw('LOWER(orders.customer_email) = LOWER(mst_customers.email)')
              ->orWhereRaw("$normPhoneOrders = $normPhoneCustomer")
              ->orWhereRaw('LOWER(orders.customer_name) = LOWER(mst_customers.full_name)')
              ->orWhereRaw("LOWER(orders.customer_name) = SUBSTRING_INDEX(LOWER(mst_customers.full_name), ' ', 2)");
        });
    }

    /* ========================= Customers (unik) ========================= */

    /** GET /api/customers  — daftar customer unik + paket terakhir/aktif + revenue sukses */
    public function index(Request $r)
    {
        // Subquery paket aktif
        $activePkgCode = Order::select('package_code')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->where('is_active', true)
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        $activePkgName = Order::select('package_name')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->where('is_active', true)
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        $activeLastUpd = Order::select('updated_at')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->where('is_active', true)
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        // Fallback paket apapun (terakhir)
        $anyPkgCode = Order::select('package_code')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        $anyPkgName = Order::select('package_name')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        $anyLastUpd = Order::select('updated_at')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        // Revenue sukses
        $revenuePaid = Order::selectRaw('COALESCE(SUM(total),0)')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->where(function ($s) {
                $s->where('status', 'paid')
                  ->orWhereIn('payment_status', ['paid','capture','settlement'])
                  ->orWhereNotNull('paid_at');
            });

        $q = Customer::query()
            ->from('mst_customers')
            ->select('mst_customers.*')
            ->addSelect([
                'current_package_code_active' => $activePkgCode,
                'current_package_active'      => $activePkgName,
                'last_order_updated_active'   => $activeLastUpd,
                'current_package_code_any'    => $anyPkgCode,
                'current_package_any'         => $anyPkgName,
                'last_order_updated_any'      => $anyLastUpd,
                'revenue_paid'                => $revenuePaid,
            ]);

        if ($s = $r->query('q')) {
            $q->where(function ($qq) use ($s) {
                $qq->where('full_name','like',"%$s%")
                   ->orWhere('email','like',"%$s%")
                   ->orWhere('phone','like',"%$s%")
                   ->orWhere('company','like',"%$s%");
            });
        }

        if (!is_null($r->query('is_active'))) {
            $q->where('mst_customers.is_active', filter_var($r->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $q->orderBy('mst_customers.created_at','desc');

        $perPage   = max(1, (int) $r->query('per_page', 25));
        $paginated = $q->paginate($perPage);

        $rows = collect($paginated->items())->map(function ($c) {
            $pkgCode = $c->current_package_code_active ?: $c->current_package_code_any;
            $pkgName = $c->current_package_active      ?: $c->current_package_any;
            $lastUpd = $c->last_order_updated_active   ?: $c->last_order_updated_any;

            return [
                'id'                   => (string) $c->id,
                'full_name'            => (string) $c->full_name,
                'email'                => (string) $c->email,
                'phone'                => $c->phone,
                'company'              => $c->company,
                'is_active'            => (bool) $c->is_active,
                'profile_photo_url'    => $c->profile_photo_url,
                'created_at'           => optional($c->created_at)->toIso8601String(),
                'updated_at'           => optional($c->updated_at)->toIso8601String(),
                'current_package_code' => $pkgCode,
                'current_package'      => $pkgName,
                'last_order_updated'   => $lastUpd ? Carbon::parse($lastUpd)->toDateString() : null,
                'revenue_paid'         => (float) ($c->revenue_paid ?? 0),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data'    => $rows,
            'meta'    => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    /** GET /api/customers/{id} */
    public function show(string $id)
    {
        $activePkgCode = Order::select('package_code')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->where('is_active', true)
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        $activePkgName = Order::select('package_name')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->where('is_active', true)
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        $activeLastUpd = Order::select('updated_at')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->where('is_active', true)
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        $anyPkgCode = Order::select('package_code')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        $anyPkgName = Order::select('package_name')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        $anyLastUpd = Order::select('updated_at')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->orderByDesc(DB::raw('COALESCE(end_date, created_at)'))
            ->limit(1);

        $revenuePaid = Order::selectRaw('COALESCE(SUM(total),0)')
            ->where(fn($w) => $this->matchOrderToCustomer($w))
            ->where(function ($s) {
                $s->where('status', 'paid')
                  ->orWhereIn('payment_status', ['paid','capture','settlement'])
                  ->orWhereNotNull('paid_at');
            });

        $c = Customer::query()
            ->from('mst_customers')
            ->select('mst_customers.*')
            ->addSelect([
                'current_package_code_active' => $activePkgCode,
                'current_package_active'      => $activePkgName,
                'last_order_updated_active'   => $activeLastUpd,
                'current_package_code_any'    => $anyPkgCode,
                'current_package_any'         => $anyPkgName,
                'last_order_updated_any'      => $anyLastUpd,
                'revenue_paid'                => $revenuePaid,
            ])
            ->where('mst_customers.id', $id)
            ->firstOrFail();

        $pkgCode = $c->current_package_code_active ?: $c->current_package_code_any;
        $pkgName = $c->current_package_active      ?: $c->current_package_any;
        $lastUpd = $c->last_order_updated_active   ?: $c->last_order_updated_any;

        return response()->json([
            'success' => true,
            'data'    => [
                'id'                   => (string) $c->id,
                'full_name'            => (string) $c->full_name,
                'email'                => (string) $c->email,
                'phone'                => $c->phone,
                'company'              => $c->company,
                'is_active'            => (bool) $c->is_active,
                'profile_photo_url'    => $c->profile_photo_url,
                'created_at'           => optional($c->created_at)->toIso8601String(),
                'updated_at'           => optional($c->updated_at)->toIso8601String(),
                'current_package_code' => $pkgCode,
                'current_package'      => $pkgName,
                'last_order_updated'   => $lastUpd ? Carbon::parse($lastUpd)->toDateString() : null,
                'revenue_paid'         => (float) ($c->revenue_paid ?? 0),
            ],
        ]);
    }

    /* =============== Subscriptions (customer × package) =============== */

    /** GET /api/customer-subscriptions  — baris per (customer × package_code) + order_count + status */
    public function subscriptions(Request $r)
    {
        $normPhoneOrders   = $this->phoneSql('o.customer_phone');
        $normPhoneCustomer = $this->phoneSql('c.phone');

        // pasangan customer × package_code (aman ONLY_FULL_GROUP_BY)
        $pairs = DB::table('mst_customers as c')
            ->join('orders as o', function ($j) use ($normPhoneOrders, $normPhoneCustomer) {
                $j->on('o.customer_id', '=', 'c.id')
                  ->orOn(DB::raw('LOWER(o.customer_email)'), '=', DB::raw('LOWER(c.email)'))
                  ->orOn(DB::raw($normPhoneOrders), '=', DB::raw($normPhoneCustomer))
                  ->orOn(DB::raw('LOWER(o.customer_name)'), '=', DB::raw('LOWER(c.full_name)'))
                  ->orOn(DB::raw('LOWER(o.customer_name)'), '=', DB::raw("SUBSTRING_INDEX(LOWER(c.full_name), ' ', 2)"));
            })
            ->select([
                'c.id as customer_id',
                'c.full_name',
                'c.email',
                'c.phone',
                'c.company',
                'c.is_active as customer_is_active',
                DB::raw('MAX(o.product_code) as product_code'),
                'o.package_code',
            ])
            ->when($r->filled('product_code'), fn($q) => $q->where('o.product_code', $r->query('product_code')))
            ->when($r->filled('package_code'), fn($q) => $q->where('o.package_code', $r->query('package_code')))
            ->groupBy('c.id', 'o.package_code');

        $outer = DB::query()->fromSub($pairs, 'p');

        // mapping orders(oo) ke pair p
        $applyMatchPair = function ($q) {
            $normPhoneOo   = $this->phoneSql('oo.customer_phone');
            $normPhoneCust = $this->phoneSql('p.phone');
            $q->whereColumn('oo.package_code', 'p.package_code')
              ->where(function ($m) use ($normPhoneOo, $normPhoneCust) {
                  $m->whereColumn('oo.customer_id', 'p.customer_id')
                    ->orWhereRaw('LOWER(oo.customer_email) = LOWER(p.email)')
                    ->orWhereRaw("$normPhoneOo = $normPhoneCust")
                    ->orWhereRaw('LOWER(oo.customer_name) = LOWER(p.full_name)')
                    ->orWhereRaw("LOWER(oo.customer_name) = SUBSTRING_INDEX(LOWER(p.full_name), ' ', 2)");
              });
        };

        // subquery best/latest order per pair
        $best = fn ($col) => DB::table('orders as oo')
            ->select($col)
            ->when(true, $applyMatchPair)
            ->orderByDesc('oo.is_active')
            ->orderByDesc(DB::raw('COALESCE(oo.end_date, oo.created_at)'))
            ->orderByDesc('oo.updated_at')
            ->limit(1);

        $bestCode    = $best('oo.package_code');
        $bestName    = $best('oo.package_name');
        $bestUpdated = $best('oo.updated_at');
        $bestEnd     = $best('oo.end_date');
        $bestPaidSt  = $best('oo.payment_status');
        $bestStatus  = $best('oo.status');
        $bestIsAct   = $best('oo.is_active');

        // revenue sukses dan jumlah order
        $revenuePaid = DB::table('orders as oo')
            ->selectRaw('COALESCE(SUM(oo.total),0)')
            ->when(true, $applyMatchPair)
            ->where(function ($s) {
                $s->where('oo.status', 'paid')
                  ->orWhereIn('oo.payment_status', ['paid','capture','settlement'])
                  ->orWhereNotNull('oo.paid_at');
            });

        $orderCount = DB::table('orders as oo')
            ->selectRaw('COUNT(*)')
            ->when(true, $applyMatchPair);

        $rows = $outer
            ->select([
                DB::raw("CONCAT(p.customer_id, ':', p.package_code) as id"),
                'p.full_name', 'p.email', 'p.phone', 'p.company',
                DB::raw('p.customer_is_active as is_active'),
                'p.product_code', 'p.package_code',
            ])
            ->addSelect([
                'current_package_code' => $bestCode,
                'current_package'      => $bestName,
                'last_order_updated'   => $bestUpdated,
                'last_end_date'        => $bestEnd,
                'last_payment_status'  => $bestPaidSt,
                'last_status'          => $bestStatus,
                'last_is_active'       => $bestIsAct,
                'revenue_paid'         => $revenuePaid,
                'order_count'          => $orderCount,
            ])
            ->when($r->filled('q'), function ($q) use ($r) {
                $s = $r->query('q');
                $q->where(function ($qq) use ($s) {
                    $qq->where('p.full_name','like',"%$s%")
                       ->orWhere('p.email','like',"%$s%")
                       ->orWhere('p.phone','like',"%$s%")
                       ->orWhere('p.company','like',"%$s%")
                       ->orWhere('p.package_code','like',"%$s%");
                });
            })
            ->orderBy('p.full_name')
            ->get()
            ->map(function ($row) {
                $today  = Carbon::now()->startOfDay();
                $end    = $row->last_end_date ? Carbon::parse($row->last_end_date)->startOfDay() : null;

                $subscriptionStatus = 'Churned';
                if ((int)$row->last_is_active === 1 && ($end === null || $end->greaterThanOrEqualTo($today))) {
                    $subscriptionStatus = 'Active';
                } elseif (
                    strtolower((string) $row->last_status) === 'expired' ||
                    ($end !== null && $end->lt($today))
                ) {
                    $subscriptionStatus = 'Expired';
                }

                return [
                    'id'                   => (string) $row->id,
                    'full_name'            => (string) $row->full_name,
                    'email'                => (string) $row->email,
                    'phone'                => $row->phone,
                    'company'              => $row->company,
                    'is_active'            => (bool) $row->is_active,
                    'current_package_code' => $row->current_package_code ?: null,
                    'current_package'      => $row->current_package ?: null,
                    'last_order_updated'   => $row->last_order_updated
                                                ? Carbon::parse($row->last_order_updated)->toDateString()
                                                : null,
                    'last_end_date'        => $row->last_end_date
                                                ? Carbon::parse($row->last_end_date)->toDateString()
                                                : null,
                    'last_payment_status'  => $row->last_payment_status ?: null,
                    'last_status'          => $row->last_status ?: null,
                    'order_count'          => (int) ($row->order_count ?? 0),
                    'subscription_status'  => $subscriptionStatus,
                    'revenue_paid'         => (float) ($row->revenue_paid ?? 0),
                    'product_code'         => $row->product_code,
                    'package_code'         => $row->package_code,
                ];
            })
            ->values();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /* ========================= Stats agregat ========================= */

    /** GET /api/customer-subscriptions/stats  — statistik status & per package */
    public function subscriptionStats(Request $r)
    {
        $product = $r->query('product_code');
        $pkg     = $r->query('package_code');
        $today   = Carbon::now()->toDateString();

        // Status counts
        $statusCounts = DB::table('orders as o')
            ->selectRaw("
                SUM(CASE WHEN o.is_active = 1 AND (o.end_date IS NULL OR DATE(o.end_date) >= ?) THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN (LOWER(o.status) = 'expired') OR (o.end_date IS NOT NULL AND DATE(o.end_date) < ?) THEN 1 ELSE 0 END) as expired_count,
                SUM(CASE WHEN NOT (o.is_active = 1 AND (o.end_date IS NULL OR DATE(o.end_date) >= ?))
                          AND NOT ((LOWER(o.status) = 'expired') OR (o.end_date IS NOT NULL AND DATE(o.end_date) < ?))
                    THEN 1 ELSE 0 END) as churned_count
            ", [$today, $today, $today, $today])
            ->when($product, fn($q) => $q->where('o.product_code', $product))
            ->when($pkg, fn($q) => $q->where('o.package_code', $pkg))
            ->first();

        // Aggregat per package
        $byPackage = DB::table('orders as o')
            ->select([
                'o.package_code',
                DB::raw('MAX(o.package_name) as package_name'),
                DB::raw('COUNT(*) as order_count'),
                DB::raw("SUM(CASE WHEN (o.status = 'paid' OR o.payment_status IN ('paid','capture','settlement') OR o.paid_at IS NOT NULL) THEN 1 ELSE 0 END) as paid_order_count"),
                DB::raw("SUM(CASE WHEN LOWER(o.status) = 'expired' THEN 1 ELSE 0 END) as expired_order_count"),
                DB::raw("COALESCE(SUM(CASE WHEN (o.status = 'paid' OR o.payment_status IN ('paid','capture','settlement') OR o.paid_at IS NOT NULL) THEN o.total ELSE 0 END),0) as revenue_paid"),
            ])
            ->when($product, fn($q) => $q->where('o.product_code', $product))
            ->groupBy('o.package_code')
            ->orderBy('o.package_code')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'status_counts' => [
                    'active'  => (int) ($statusCounts->active_count ?? 0),
                    'expired' => (int) ($statusCounts->expired_count ?? 0),
                    'churned' => (int) ($statusCounts->churned_count ?? 0),
                ],
                'by_package' => $byPackage,
            ],
        ]);
    }
}
