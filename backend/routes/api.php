<?php

use App\Http\Controllers\Admin\BannerController;
use App\Http\Controllers\Admin\LanguageController;
use App\Http\Controllers\Admin\LanguageItemController;
use App\Http\Controllers\Admin\LanguageKeyController;
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
    // Languages
    Route::prefix('languages')->group(function () {
        Route::get('/', [LanguageController::class, 'index'])->name('languages.index');
        Route::post('/', [LanguageController::class, 'store'])->name('languages.store');
        Route::get('/{language}', [LanguageController::class, 'show'])->name('languages.show');
        Route::put('/{language}', [LanguageController::class, 'update'])->name('languages.update');
        Route::delete('/{language}', [LanguageController::class, 'destroy'])->name('languages.destroy');
        Route::post('/delete-multiple', [LanguageController::class, 'destroyMultiple'])->name('languages.destroyMultiple');
    });
    // Language Keys
    Route::prefix('language-keys')->group(function () {
        Route::get('/', [LanguageKeyController::class, 'index'])->name('language-keys.index');
        Route::post('/', [LanguageKeyController::class, 'store'])->name('language-keys.store');
        Route::get('/{id}', [LanguageKeyController::class, 'show'])->name('language-keys.show');
        Route::put('/', [LanguageKeyController::class, 'update'])->name('language-keys.update');
        Route::delete('/{id}', [LanguageKeyController::class, 'destroy'])->name('language-keys.destroy');
        Route::post('/delete-multiple', [LanguageKeyController::class, 'deleteMultiple'])->name('language-keys.deleteMultiple');
    });

    // Language Items
    Route::prefix('language-items')->group(function () {
        Route::get('/', [LanguageItemController::class, 'index'])->name('language-items.index');
        Route::post('/', [LanguageItemController::class, 'store'])->name('language-items.store');
        Route::get('/{id}', [LanguageItemController::class, 'show'])->name('language-items.show');
        Route::put('/', [LanguageItemController::class, 'update'])->name('language-items.update');
        Route::delete('/{id}', [LanguageItemController::class, 'destroy'])->name('language-items.destroy');
        Route::post('/delete-multiple', [LanguageItemController::class, 'deleteMultiple'])->name('language-items.deleteMultiple');
    });
});