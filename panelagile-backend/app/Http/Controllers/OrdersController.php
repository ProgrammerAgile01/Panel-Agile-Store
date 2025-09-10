<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class OrdersController extends Controller
{
    /** GET /api/orders */
    public function index(Request $r)
    {
        $q = Order::query()->with('customer');

        // ====== Filters ======
        if ($v = $r->query('q')) {
            $q->where(function($qq) use ($v) {
                $qq->where('customer_name', 'like', "%$v%")
                   ->orWhere('customer_email', 'like', "%$v%")
                   ->orWhere('customer_phone', 'like', "%$v%")
                   ->orWhere('product_code', 'like', "%$v%")
                   ->orWhere('product_name', 'like', "%$v%")
                   ->orWhere('package_name', 'like', "%$v%")
                   ->orWhere('package_code', 'like', "%$v%")
                   ->orWhere('midtrans_order_id', 'like', "%$v%")
                   ->orWhere('midtrans_transaction_id', 'like', "%$v%");
            });
        }

        if ($v = $r->query('customer_id')) $q->where('customer_id', $v);
        if ($v = $r->query('product_code')) $q->where('product_code', $v);
        if ($v = $r->query('status')) $q->where('status', $v);
        if ($v = $r->query('payment_status')) $q->where('payment_status', $v);
        if (!is_null($r->query('is_active'))) $q->where('is_active', filter_var($r->query('is_active'), FILTER_VALIDATE_BOOLEAN));

        // date range by created_at
        if ($from = $r->query('date_from')) $q->whereDate('created_at', '>=', $from);
        if ($to   = $r->query('date_to'))   $q->whereDate('created_at', '<=', $to);

        // sort
        $sort   = $r->query('sort', 'created_at');
        $dir    = strtolower($r->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $q->orderBy($sort, $dir);

        // pagination (default 25)
        $perPage = (int) $r->query('per_page', 25);
        if ($perPage <= 0) $perPage = 25;

        $paginated = $q->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $paginated->items(),
            'meta'    => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    /** POST /api/orders */
    public function store(Request $r)
    {
        $v = $r->validate([
            'id'                 => ['nullable','uuid'],
            'customer_id'        => ['nullable','string'],
            'customer_name'      => ['required','string','max:200'],
            'customer_email'     => ['nullable','email','max:200'],
            'customer_phone'     => ['nullable','string','max:50'],

            'product_code'       => ['required','string','max:100'],
            'product_name'       => ['required','string','max:200'],
            'package_code'       => ['required','string','max:100'],
            'package_name'       => ['required','string','max:200'],
            'duration_code'      => ['required','string','max:100'],
            'duration_name'      => ['required','string','max:200'],
            'pricelist_item_id'  => ['nullable'],

            'price'              => ['required','numeric'],
            'discount'           => ['nullable','numeric'],
            'total'              => ['required','numeric'],
            'currency'           => ['required','string','max:10'],

            'status'             => ['required','string','max:50'],
            'intent'             => ['nullable','string','max:50'],
            'base_order_id'      => ['nullable','string','max:64'],
            'is_active'          => ['nullable','boolean'],
            'start_date'         => ['nullable','date'],
            'end_date'           => ['nullable','date'],
            'provision_notified_at' => ['nullable','date'],

            'payment_status'     => ['nullable','string','max:50'],
            'paid_at'            => ['nullable','date'],

            'midtrans_order_id'        => ['nullable','string','max:100'],
            'midtrans_transaction_id'  => ['nullable','string','max:100'],
            'payment_type'             => ['nullable','string','max:50'],
            'va_number'                => ['nullable','string','max:50'],
            'bank'                     => ['nullable','string','max:50'],
            'permata_va_number'        => ['nullable','string','max:50'],
            'qris_data'                => ['nullable'],
            'snap_token'               => ['nullable','string','max:255'],

            'meta'               => ['nullable','array'],
        ]);

        $order = Order::create($v);
        return response()->json(['success'=>true,'data'=>$order], 201);
    }

    /** GET /api/orders/{id} */
    public function show(string $id)
    {
        $row = Order::with('customer')->findOrFail($id);
        return response()->json(['success'=>true,'data'=>$row]);
    }

    /** PUT/PATCH /api/orders/{id} */
    public function update(Request $r, string $id)
    {
        $row = Order::findOrFail($id);

        $v = $r->validate([
            'customer_id'        => ['nullable','string'],
            'customer_name'      => ['sometimes','string','max:200'],
            'customer_email'     => ['sometimes','nullable','email','max:200'],
            'customer_phone'     => ['sometimes','nullable','string','max:50'],

            'product_code'       => ['sometimes','string','max:100'],
            'product_name'       => ['sometimes','string','max:200'],
            'package_code'       => ['sometimes','string','max:100'],
            'package_name'       => ['sometimes','string','max:200'],
            'duration_code'      => ['sometimes','string','max:100'],
            'duration_name'      => ['sometimes','string','max:200'],
            'pricelist_item_id'  => ['sometimes'],

            'price'              => ['sometimes','numeric'],
            'discount'           => ['sometimes','nullable','numeric'],
            'total'              => ['sometimes','numeric'],
            'currency'           => ['sometimes','string','max:10'],

            'status'             => ['sometimes','string','max:50'],
            'intent'             => ['sometimes','nullable','string','max:50'],
            'base_order_id'      => ['sometimes','nullable','string','max:64'],
            'is_active'          => ['sometimes','boolean'],
            'start_date'         => ['sometimes','nullable','date'],
            'end_date'           => ['sometimes','nullable','date'],
            'provision_notified_at' => ['sometimes','nullable','date'],

            'payment_status'     => ['sometimes','nullable','string','max:50'],
            'paid_at'            => ['sometimes','nullable','date'],

            'midtrans_order_id'        => ['sometimes','nullable','string','max:100'],
            'midtrans_transaction_id'  => ['sometimes','nullable','string','max:100'],
            'payment_type'             => ['sometimes','nullable','string','max:50'],
            'va_number'                => ['sometimes','nullable','string','max:50'],
            'bank'                     => ['sometimes','nullable','string','max:50'],
            'permata_va_number'        => ['sometimes','nullable','string','max:50'],
            'qris_data'                => ['sometimes','nullable'],
            'snap_token'               => ['sometimes','nullable','string','max:255'],

            'meta'               => ['sometimes','nullable','array'],
        ]);

        $row->fill($v)->save();
        return response()->json(['success'=>true,'data'=>$row]);
    }

    /** DELETE /api/orders/{id} */
    public function destroy(string $id)
    {
        $row = Order::findOrFail($id);
        $row->delete();
        return response()->json(['success'=>true]);
    }

    /** GET /api/orders/stats */
    public function stats(Request $r)
    {
        $base = Order::query();

        // optional product filter / date range
        if ($v = $r->query('product_code')) $base->where('product_code', $v);
        if ($from = $r->query('date_from')) $base->whereDate('created_at', '>=', $from);
        if ($to   = $r->query('date_to'))   $base->whereDate('created_at', '<=', $to);

        $totalOrders = (clone $base)->count();
        $sumRevenue  = (clone $base)->where('payment_status','paid')->sum('total');

        $byStatus = (clone $base)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')->pluck('count','status');

        $byPayment = (clone $base)
            ->select('payment_status', DB::raw('COUNT(*) as count'))
            ->groupBy('payment_status')->pluck('count','payment_status');

        $today = now();
        $monthStart = $today->copy()->startOfMonth()->toDateString();
        $monthEnd   = $today->copy()->endOfMonth()->toDateString();

        $mrr = (clone $base)
            ->whereBetween(DB::raw('DATE(created_at)'), [$monthStart, $monthEnd])
            ->where('payment_status', 'paid')
            ->sum('total');

        // Active subscriptions
        $activeNow = (clone $base)->activeNow()->count();

        // Expiring soon (7 hari)
        $expiringSoon = (clone $base)
            ->where('is_active', true)
            ->whereNotNull('end_date')
            ->whereBetween(DB::raw('DATE(end_date)'), [now()->toDateString(), now()->addDays(7)->toDateString()])
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_orders'   => $totalOrders,
                'revenue_paid'   => (float) $sumRevenue,
                'mrr_this_month' => (float) $mrr,
                'by_status'      => $byStatus,
                'by_payment'     => $byPayment,
                'active_now'     => $activeNow,
                'expiring_7d'    => $expiringSoon,
            ],
        ]);
    }

    /** PATCH /api/orders/{id}/provision-notified — set now() */
    public function markProvisionNotified(string $id)
    {
        $row = Order::findOrFail($id);
        $row->provision_notified_at = now();
        $row->save();

        return response()->json(['success'=>true,'data'=>$row]);
    }
}
