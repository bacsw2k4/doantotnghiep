<?php

use App\Http\Controllers\Admin\BannerController;
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/


Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
});
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/auth/check-auth', [AuthController::class, 'checkAuth'])->name('auth.check');
    Route::get('/auth/profile', [AuthController::class, 'getProfile']);
    Route::get('/auth/orders', [AuthController::class, 'getOrders']);
    Route::get('/auth/shipping-addresses', [AuthController::class, 'getShippingAddress']);
    Route::post('/auth/shipping-addresses', [AuthController::class, 'addShippingAddress']);
    Route::put('/auth/shipping-addresses/{id}', [AuthController::class, 'updateShippingAddress']);
    Route::delete('/auth/shipping-addresses/{id}', [AuthController::class, 'deleteShippingAddress']);
    //Banner
    Route::prefix('banners')->group(function () {
        Route::get('/', [BannerController::class, 'index'])->name('banners.index');
        Route::post('/', [BannerController::class, 'store'])->name('banners.store');
        Route::get('/{id}', [BannerController::class, 'show'])->name('banners.show');
        Route::put('/{id}', [BannerController::class, 'update'])->name('banners.update');
        Route::delete('/{id}', [BannerController::class, 'destroy'])->name('banners.destroy');
    });
});
