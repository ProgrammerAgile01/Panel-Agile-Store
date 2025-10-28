<?php

use App\Http\Controllers\Catalog\ProductCatalogController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\NavItemController;
use App\Http\Controllers\LevelPermissionController;
use App\Http\Controllers\LevelUserController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\ProductFeatureController;
use App\Http\Controllers\ProductPackageController;
use App\Http\Controllers\PackageMatrixController;
use App\Http\Controllers\DurationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PricelistController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\OrdersController;
use App\Http\Middleware\PermissionMiddleware;
use App\Http\Controllers\Catalog\ProductSyncController; 
use App\Http\Controllers\Store\OfferingMatrixController;
use App\Http\Middleware\VerifyServiceKey;
use App\Http\Controllers\AgileStoreSettingsController;
use App\Http\Controllers\WhatsappRecipientController;



/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
| Login/refresh publik, endpoint lain di-protect jwt.auth
*/
Route::prefix('auth')->group(function () {
    Route::post('/login',   [AuthController::class, 'login']);
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('jwt.refresh');

    Route::middleware('jwt.auth')->group(function () {
        Route::get('/me',      [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

/*
|--------------------------------------------------------------------------
| NAV ITEMS
|--------------------------------------------------------------------------
| index: publik (controller akan filter tree berdasarkan JWT bila ada token)
| CRUD: di-protect jwt.auth saja (kalau mau ketat, tambahkan PermissionMiddleware).
*/
Route::get('/nav-items', [NavItemController::class, 'index']); // ?format=flat|tree

Route::middleware(['jwt.auth'])->group(function () {
    Route::post  ('/nav-items',            [NavItemController::class, 'store']);
    Route::get   ('/nav-items/{nav_item}', [NavItemController::class, 'show']);
    Route::put   ('/nav-items/{nav_item}', [NavItemController::class, 'update']);
    Route::delete('/nav-items/{nav_item}', [NavItemController::class, 'destroy']);

    // kalau kamu punya slug khusus utk kelola menu (mis. 'atur-menu'), aktifkan:
    // ->middleware(PermissionMiddleware::class . ':edit,atur-menu') dst.
});

/*
|--------------------------------------------------------------------------
| LEVEL ↔ NAV-ITEM PERMISSIONS (Matrix)
|--------------------------------------------------------------------------
| Disarankan pakai slug 'matrix-level' (lihat nav item "Matrix Level")
*/
Route::middleware('jwt.auth')->group(function () {
    Route::get ('/level-permissions',            [LevelPermissionController::class, 'index'])
        ->middleware(PermissionMiddleware::class . ':view,matrix-level');        // ?level_id= / ?level_name=
    Route::post('/level-permissions/bulk',       [LevelPermissionController::class, 'bulkUpsert'])
        ->middleware(PermissionMiddleware::class . ':edit,matrix-level');
    Route::get ('/level-permissions/stats',      [LevelPermissionController::class, 'stats'])
        ->middleware(PermissionMiddleware::class . ':view,matrix-level');
    Route::get ('/level-permissions/export-csv', [LevelPermissionController::class, 'exportCsv'])
        ->middleware(PermissionMiddleware::class . ':print,matrix-level');
});

/*
|--------------------------------------------------------------------------
| LEVEL USERS  (Admin boleh VIEW/ADD/DELETE, TIDAK bisa EDIT → set edit=false di matrix)
|--------------------------------------------------------------------------
| Slug: level-user
*/
Route::middleware(['jwt.auth'])->group(function () {
    // VIEW
    Route::get ('/level_users',        [LevelUserController::class, 'index'])
        ->middleware(PermissionMiddleware::class . ':view,level-user');
    Route::get ('/level_users/{id}',   [LevelUserController::class, 'show'])
        ->middleware(PermissionMiddleware::class . ':view,level-user');
    Route::get ('/level_users/export', [LevelUserController::class, 'exportExcel'])
        ->middleware(PermissionMiddleware::class . ':view,level-user');

    // MUTASI — Admin akan tertahan di EDIT (karena edit=false di sys_permissions)
    Route::post('/level_users',        [LevelUserController::class, 'store'])
        ->middleware(PermissionMiddleware::class . ':add,level-user');
    Route::put ('/level_users/{id}',   [LevelUserController::class, 'update'])
        ->middleware(PermissionMiddleware::class . ':edit,level-user');
    Route::delete('/level_users/{id}', [LevelUserController::class, 'destroy'])
        ->middleware(PermissionMiddleware::class . ':delete,level-user');
});

/*
|--------------------------------------------------------------------------
| USER MANAGEMENT (Data User)
|--------------------------------------------------------------------------
| Slug: data-user  (lihat nav item "Data User"; sesuaikan jika beda)
*/
Route::middleware(['jwt.auth'])->group(function () {
    Route::get   ('/user_managements',      [UserManagementController::class, 'index'])
        ->middleware(PermissionMiddleware::class . ':view,data-user');
    Route::post  ('/user_managements',      [UserManagementController::class, 'store'])
        ->middleware(PermissionMiddleware::class . ':add,data-user');
    Route::put   ('/user_managements/{id}', [UserManagementController::class, 'update'])
        ->middleware(PermissionMiddleware::class . ':edit,data-user');
    Route::delete('/user_managements/{id}', [UserManagementController::class, 'destroy'])
        ->middleware(PermissionMiddleware::class . ':delete,data-user');
});
// === Tetap: endpoint CRUD products (panel DB) butuh JWT ===
Route::middleware(['jwt.auth'])->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::post('/products/{id}', [ProductController::class, 'update']); // for FormData + _method=PUT
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    // (optional) kalau mau sync via tombol admin yg login, boleh taruh di sini juga
    // Route::get('/products-sync', [ProductController::class, 'sync']);
});

// === Publik untuk FE (tidak pakai JWT) ===
Route::get ('/catalog/products',                 [ProductSyncController::class, 'index']);
Route::get ('/catalog/products/{codeOrId}',      [ProductSyncController::class, 'show']);
Route::post('/catalog/products/sync',            [ProductSyncController::class, 'sync']); // tombol Import di FE pakai ini



// Route::prefix('store')
//   ->middleware(['service.key']) // pakai VerifyServiceKey yang sudah kamu daftarkan
//   ->group(function () {
//       // GET /api/store/offerings/{product}/{offering}/matrix
//       Route::get('/offerings/{product}/{offering}/matrix', [OfferingMatrixController::class, 'matrix']);

//       // (opsional) listing offering di sebuah produk
//       Route::get('/offerings/{product}', [OfferingMatrixController::class, 'list']);
//   });

Route::prefix('store')
    ->middleware([VerifyServiceKey::class]) // <- tanpa alias
    ->group(function () {
        Route::get('/offerings/{product}', [OfferingMatrixController::class, 'list']);
        Route::get('/offerings/{product}/{offering}/matrix', [OfferingMatrixController::class, 'matrix']);
    });

/* ===================== Public — Frontend Catalog ===================== */
// Produk katalog dari Panel
Route::get ('/catalog/products',                 [ProductSyncController::class, 'index']);
Route::get ('/catalog/products/{codeOrId}',      [ProductSyncController::class, 'show']);
// Tombol Import pada FE → push produk Panel ke Warehouse
Route::post('/catalog/products/sync',            [ProductSyncController::class, 'sync']);

// Features & Menus (READ-ONLY, keduanya dari tabel yang sama)
Route::get ('/catalog/products/{codeOrId}/features',      [ProductFeatureController::class, 'listFeatures']); // ?refresh=1
Route::post('/catalog/products/{codeOrId}/features/sync', [ProductFeatureController::class, 'syncFeatures']);
Route::get ('/catalog/products/{codeOrId}/menus',         [ProductFeatureController::class, 'listMenus']);    // ?refresh=1
Route::post('/catalog/products/{codeOrId}/menus/sync',    [ProductFeatureController::class, 'syncMenus']);     // <<-- TAMBAHAN
// routes/api.php
Route::middleware(['auth:api'])->group(function () {
    Route::patch(
        '/catalog/products/{codeOrId}/features/{feature}/price',
        [ProductFeatureController::class, 'updatePrice']
    );
});

/* ===================== Packages (Public + Admin) ===================== */
// PUBLIC — list packages for a product (used by FE)
Route::get('/catalog/products/{codeOrId}/packages', [ProductPackageController::class, 'listByProduct']);
// READ (public)
Route::get('/catalog/products/{codeOrId}/matrix', [PackageMatrixController::class, 'index']);

// WRITE (JWT)
Route::middleware(['jwt.auth'])->group(function () {
    Route::post ('/catalog/products/{codeOrId}/matrix/bulk',   [PackageMatrixController::class, 'bulkUpsert']);
    Route::patch('/catalog/products/{codeOrId}/matrix/toggle', [PackageMatrixController::class, 'toggle']);
});
Route::middleware(['jwt.auth'])->group(function () {
    Route::post ('/catalog/products/{codeOrId}/matrix/bulk',   [ProductPackageController::class, 'saveMatrixBulk']);
    Route::patch('/catalog/products/{codeOrId}/matrix/toggle', [ProductPackageController::class, 'toggleCell']);

    // Admin CRUD paket (sudah ada)
    Route::get   ('/packages',        [ProductPackageController::class, 'index']);
    Route::get   ('/packages/{id}',   [ProductPackageController::class, 'show']);
    Route::post  ('/packages',        [ProductPackageController::class, 'store']);
    Route::put   ('/packages/{id}',   [ProductPackageController::class, 'update']);
    Route::delete('/packages/{id}',   [ProductPackageController::class, 'destroy']);
});
/* ===================== Duration ===================== */
Route::middleware('jwt.auth')->group(function () {
    Route::get('/durations', [DurationController::class, 'index']);
    Route::get('/durations/{id}', [DurationController::class, 'show']);
    Route::post('/durations', [DurationController::class, 'store']);
    Route::put('/durations/{id}', [DurationController::class, 'update']);
    Route::delete('/durations/{id}', [DurationController::class, 'destroy']);
    
});

/* ===================== Price List ===================== */


// Publik GET (baca pricelist)
Route::get('/catalog/products/{codeOrId}/pricelist', [PricelistController::class, 'show']);

// Proteksi untuk edit (kalau pakai JWT, ganti 'jwt.auth')
Route::middleware(['jwt.auth'])->group(function () {
    Route::put ('/catalog/products/{codeOrId}/pricelist',       [PricelistController::class, 'updateHeader']);
    Route::post('/catalog/products/{codeOrId}/pricelist/bulk',   [PricelistController::class, 'bulkUpsert']);
    
});

// ==================== Landing Page (Public + JWT Write) ====================
// BACA (public)
Route::get('/catalog/products/{codeOrId}/landing', [LandingPageController::class, 'show']);

// TULIS (JWT)
Route::middleware(['jwt.auth'])->group(function () {
    Route::put  ('/catalog/products/{codeOrId}/landing', [LandingPageController::class, 'upsert']);
    Route::patch('/catalog/products/{codeOrId}/landing/sections/{sectionId}', [LandingPageController::class, 'updateSection']);
    Route::delete('/catalog/products/{codeOrId}/landing/sections/{sectionId}', [LandingPageController::class, 'destroySection']);
});
Route::post('/uploads', function () {
    request()->validate([
        'file' => 'required|file|max:51200|mimes:jpg,jpeg,png,webp,gif,mp4,mov',
    ]);

    $path = request()->file('file')->store('uploads', 'public');
    $rel  = Storage::disk('public')->url($path);
    $abs  = url($rel);

    return response()->json(['success'=>true,'path'=>$path,'url'=>$abs,'rel_url'=>$rel], 201);
})->middleware('jwt.auth');

// ==================== Agile Store setting ====================

Route::prefix('agile-store')->group(function () {
    Route::get('/sections',        [AgileStoreSettingsController::class, 'index']);
    Route::get('/sections/{key}',  [AgileStoreSettingsController::class, 'show'])->whereAlphaNumeric('key');
    Route::post('/sections/upsert',[AgileStoreSettingsController::class, 'upsert']);
});


// ==================== Customer dan Order ====================
Route::middleware(['jwt.auth'])->group(function () {

    // Orders CRUD + stats
    Route::get   ('/orders',               [OrdersController::class, 'index']);
    Route::post  ('/orders',               [OrdersController::class, 'store']);
    Route::get   ('/orders/stats',         [OrdersController::class, 'stats']); // dipakai fetchStats('orders')
    Route::get   ('/orders/{id}',          [OrdersController::class, 'show']);
    Route::put   ('/orders/{id}',          [OrdersController::class, 'update']);
    Route::patch ('/orders/{id}',          [OrdersController::class, 'update']);
    Route::delete('/orders/{id}',          [OrdersController::class, 'destroy']);

    // Helper set provision_notified_at = now()
    Route::patch ('/orders/{id}/provision-notified', [OrdersController::class, 'markProvisionNotified']);

    // Customers (read-only untuk panel)
    Route::get('/customers',     [CustomersController::class, 'index']);
    Route::get('/customers/{id}',[CustomersController::class, 'show']);

    // NEW: subscriptions (satu baris per customer × product)
    Route::get('/customer-subscriptions', [CustomersController::class, 'subscriptions']);
    Route::get('/customer-subscriptions/stats', [CustomersController::class, 'subscriptionStats']);

});
/*


// Route::get('/catalog/products', [ProductSyncController::class, 'index']);
// Route::get('/catalog/products/{codeOrId}', [ProductSyncController::class, 'show']);
Route::post('/catalog/products/sync', [ProductSyncController::class, 'sync']);


/* ========== KATALOG PUBLIK untuk Warehouse ========== */
Route::prefix('catalog')->group(function () {
    Route::get('/products',                [ProductCatalogController::class, 'index']);
    Route::get('/products/{codeOrId}',     [ProductCatalogController::class, 'show']);
});
// Features & Menus (READ-ONLY mirror + SYNC)
Route::get ('/catalog/products/{codeOrId}/features',      [ProductFeatureController::class, 'listFeatures']);
Route::post('/catalog/products/{codeOrId}/features/sync', [ProductFeatureController::class, 'syncFeatures']);
Route::get ('/catalog/products/{codeOrId}/menus',         [ProductFeatureController::class, 'listMenus']);
Route::post('/catalog/products/{codeOrId}/menus/sync',    [ProductFeatureController::class, 'syncMenus']);


/* ========== WHATSAPP SETTINGS ========== */

Route::middleware(['jwt.auth'])->group(function () {
    Route::get('/whatsapp-recipients', [WhatsappRecipientController::class, 'index']);
    Route::post('/whatsapp-recipients', [WhatsappRecipientController::class, 'store']);
    Route::get('/whatsapp-recipients/{id}', [WhatsappRecipientController::class, 'show']);
    Route::put('/whatsapp-recipients/{id}', [WhatsappRecipientController::class, 'update']);
    Route::post('/whatsapp-recipients/{id}', [WhatsappRecipientController::class, 'update']); // for FormData + _method=PUT
    Route::delete('/whatsapp-recipients/{id}', [WhatsappRecipientController::class, 'destroy']);

    // optional stats
    Route::get('/whatsapp-recipients/stats', [WhatsappRecipientController::class, 'stats']);
});

/*
|--------------------------------------------------------------------------
| DIAGNOSTIC (opsional)
|--------------------------------------------------------------------------
*/
// Route::middleware('jwt.auth')->get('/__whoami', function () {
//     $p = \Tymon\JWTAuth\Facades\JWTAuth::getPayload();
//     return ['user_id'=>$p->get('sub'),'level_id'=>$p->get('level_id'),'level_name'=>$p->get('level_name')];
// });
// Route::middleware('jwt.auth')->get('/__check/permission/{action}/{slug}', function ($action,$slug) {
//     $p = \Tymon\JWTAuth\Facades\JWTAuth::getPayload();
//     $levelId = (int)$p->get('level_id');
//     $norm = \Illuminate\Support\Str::of($slug)->trim()->lower()->replace(' ','-')->replace('_','-')->replace('--','-')->value();
//     $nav  = \App\Models\NavItem::whereRaw('LOWER(TRIM(slug)) = ?', [$norm])->first();
//     if (!$nav) return ['ok'=>false,'reason'=>"slug '{$norm}' not found"];
//     $perm = \App\Models\LevelNavItemPermission::where('level_user_id',$levelId)->where('nav_item_id',$nav->id)->first();
//     if (!$perm) return ['ok'=>false,'reason'=>'no row in sys_permissions'];
//     $map = ['access'=>$perm->access,'view'=>$perm->view,'add'=>$perm->add,'edit'=>$perm->edit,'delete'=>$perm->delete,'approve'=>$perm->approve,'print'=>$perm->print];
//     return ['ok'=> (bool)($map[$action]??false), 'action'=>$action, 'slug'=>$norm, 'nav_id'=>$nav->id, 'level_id'=>$levelId, 'flags'=>$map];
// });
