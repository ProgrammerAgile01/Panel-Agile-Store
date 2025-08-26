<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LevelUserController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\NavItemController;
use App\Http\Controllers\LevelPermissionController;


// Level User

Route::get('level_users/export', [LevelUserController::class, 'exportExcel']);
Route::apiResource('level_users', LevelUserController::class);
Route::apiResource('user_managements', UserManagementController::class);

// Nav Items
Route::apiResource('nav-items', NavItemController::class);
// Proteksi CRUD nav-items di balik JWT (kalau kamu butuh kelola menu dari UI admin)
Route::middleware('jwt.auth')->group(function () {
    Route::post  ('/nav-items',                 [NavItemController::class, 'store']);
    Route::get   ('/nav-items/{nav_item}',      [NavItemController::class, 'show']);
    Route::put   ('/nav-items/{nav_item}',      [NavItemController::class, 'update']);
    Route::delete('/nav-items/{nav_item}',      [NavItemController::class, 'destroy']);
});

// Level ↔ NavItem Permissions
Route::get('/level-permissions', [LevelPermissionController::class, 'index']);  // ?level_id=1
Route::post('/level-permissions/bulk', [LevelPermissionController::class, 'bulkUpsert']);
Route::get('/level-permissions/stats', [LevelPermissionController::class, 'stats']);
Route::get('/level-permissions/export-csv', [LevelPermissionController::class, 'exportCsv']);
// Public
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('jwt.refresh');

    Route::middleware('jwt.auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});