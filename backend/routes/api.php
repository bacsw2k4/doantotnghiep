<?php

use App\Http\Controllers\Admin\AttributeController;
use App\Http\Controllers\Admin\BannerController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FooterController;
use App\Http\Controllers\Admin\LanguageController;
use App\Http\Controllers\Admin\LanguageItemController;
use App\Http\Controllers\Admin\LanguageKeyController;
use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\PromotionSubscriberController;
use App\Http\Controllers\Admin\ReviewController;
use App\Http\Controllers\Admin\ReviewReplyController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VoucherController;
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Shopping\BannerController as ShoppingBannerController;
use App\Http\Controllers\Shopping\CartController;
use App\Http\Controllers\Shopping\FooterController as ShoppingFooterController;
use App\Http\Controllers\Shopping\LanguageController as ShoppingLanguageController;
use App\Http\Controllers\Shopping\MenuController as ShoppingMenuController;
use App\Http\Controllers\Shopping\OrderController as ShoppingOrderController;
use App\Http\Controllers\Shopping\PaymentController;
use App\Http\Controllers\Shopping\ProductController as ShoppingProductController;
use App\Http\Controllers\Shopping\ReviewController as ShoppingReviewController;



Route::get('/shopping/menus', [ShoppingMenuController::class, 'index']);
Route::get('/shopping/languages', [ShoppingLanguageController::class, 'index']);
Route::get('/shopping/languages/get/', [ShoppingLanguageController::class, 'get']);
Route::get('/shopping/banners', [ShoppingBannerController::class, 'index']);
Route::get('/shopping/footers', [ShoppingFooterController::class, 'index']);
Route::get('/shopping/products', [ShoppingProductController::class, 'index']);
Route::get('/shopping/products/{id}', [ShoppingProductController::class, 'show']);
Route::get('/shopping/dual-category-products', [ShoppingProductController::class, 'getDualCategoryProducts']);
Route::get('/shopping/getCategory', [ShoppingProductController::class, 'getCategory']);
Route::get('/products/recently-viewed', [ShoppingProductController::class, 'recentlyViewed']);
Route::post('/promotion/subscribe', [PromotionSubscriberController::class, 'store']);
Route::get('/shopping/products/{id}/related', [ShoppingProductController::class, 'getRelatedProducts']);
// ========== SHOPPING REVIEW ROUTES (Public) ==========
Route::prefix('shopping')->group(function () {
    // Review routes - Public (không cần đăng nhập)
    Route::get('/products/{productId}/reviews', [ShoppingReviewController::class, 'getProductReviews']);
    Route::get('/products/{productId}/reviews/stats', [ShoppingReviewController::class, 'getProductRatingStats']);
});
// ================= AUTH ROUTES =================
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
});
Route::prefix('payment')->group(function () {
    Route::post('/paypal/create', [PaymentController::class, 'createPayPalPayment'])->middleware('auth:sanctum');

    // 2 route này KHÔNG cần auth, PayPal gọi trực tiếp
    Route::get('/paypal/success', [PaymentController::class, 'paypalSuccess']);
    Route::get('/paypal/cancel', [PaymentController::class, 'paypalCancel']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/auth/check-auth', [AuthController::class, 'checkAuth'])->name('auth.check');
    Route::get('/auth/profile', [AuthController::class, 'getProfile']);
    Route::get('/auth/orders', [AuthController::class, 'getOrders']);
    Route::apiResource('orders', OrderController::class);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/upload-avatar', [AuthController::class, 'uploadAvatar']);
    Route::get('/auth/shipping-addresses', [AuthController::class, 'getShippingAddress']);
    Route::post('/auth/shipping-addresses', [AuthController::class, 'addShippingAddress']);
    Route::put('/auth/shipping-addresses/{id}', [AuthController::class, 'updateShippingAddress']);
    Route::delete('/auth/shipping-addresses/{id}', [AuthController::class, 'deleteShippingAddress']);
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::get('/admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::delete('/admin/orders/bulk-destroy', [OrderController::class, 'bulkDestroy']);
    Route::delete('/admin/orders/{order}', [OrderController::class, 'destroy']);
    // ========== SHOPPING REVIEW ROUTES (User) ==========
    Route::prefix('shopping')->group(function () {
        Route::get('/products/{productId}/can-review', [ShoppingReviewController::class, 'canReviewProduct']);
        Route::post('/products/{productId}/reviews', [ShoppingReviewController::class, 'createReview']);
        Route::get('/products/{productId}/user-review', [ShoppingReviewController::class, 'getUserProductReview']);
        Route::put('/reviews/{id}', [ShoppingReviewController::class, 'updateReview']);
        Route::delete('/reviews/{id}', [ShoppingReviewController::class, 'deleteReview']);
    });
    // Footers
    Route::prefix('footers')->group(function () {
        Route::get('/', [FooterController::class, 'index']);
        Route::post('/', [FooterController::class, 'store']);
        Route::get('/{id}', [FooterController::class, 'show']);
        Route::put('/{id}', [FooterController::class, 'update']);
        Route::delete('/{id}', [FooterController::class, 'destroy']);
    });
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
    // Roles
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('roles.index');
        Route::post('/', [RoleController::class, 'store'])->name('roles.store');
        Route::get('/{id}', [RoleController::class, 'show'])->name('roles.show');
        Route::put('/{id}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('/{id}', [RoleController::class, 'destroy'])->name('roles.destroy');
        Route::post('/delete-multiple', [RoleController::class, 'destroyMultiple'])->name('roles.destroyMultiple');
    });
    Route::middleware(['auth:sanctum', 'web'])->group(function () {
        Route::post('/shopping/apply-coupon', [ShoppingOrderController::class, 'applyCoupon']);
        Route::post('/shopping/order', [ShoppingOrderController::class, 'store']);
        Route::post('/shopping/cart', [CartController::class, 'store']);
        Route::get('/shopping/cart', [CartController::class, 'index']);
        Route::put('/shopping/cart/{id}', [CartController::class, 'update']);
        Route::delete('/shopping/cart/{id}', [CartController::class, 'destroy']);
        Route::get('/shopping/order/{order_id}', [ShoppingOrderController::class, 'show']);
    });
    // Users
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('users.index');
        Route::post('/', [UserController::class, 'store'])->name('users.store');
        Route::get('/{id}', [UserController::class, 'show'])->name('users.show');
        Route::put('/{id}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/{id}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/delete-multiple', [UserController::class, 'destroyMultiple'])->name('users.destroyMultiple');
    });
    Route::post('/promotion-subscribers/send-email', [PromotionSubscriberController::class, 'sendEmail']);
    // Attributes
    Route::prefix('attributes')->group(function () {
        Route::get('/', [AttributeController::class, 'index'])->name('attributes.index');
        Route::post('/', [AttributeController::class, 'store'])->name('attributes.store');
        Route::get('/max-order', [AttributeController::class, 'getMaxOrder']);
        Route::get('/{id}', [AttributeController::class, 'show'])->name('attributes.show');
        Route::put('/{id}', [AttributeController::class, 'update'])->name('attributes.update');
        Route::delete('/{id}', [AttributeController::class, 'destroy'])->name('attributes.destroy');
        Route::post('/delete-multiple', [AttributeController::class, 'destroyMultiple'])->name('attributes.destroyMultiple');
        Route::get('/{id}/children', [AttributeController::class, 'getChildren'])->name('attributes.children');
        Route::get('/tree/full', [AttributeController::class, 'getFullTree'])->name('attributes.tree.full');
    });
    Route::prefix('menus')->group(function () {
        Route::get('/', [MenuController::class, 'index'])->name('menus.index');
        Route::post('/', [MenuController::class, 'store'])->name('menus.store');
        Route::get('/dropdown', [MenuController::class, 'getAllForDropdown']);
        Route::get('/max-order', [MenuController::class, 'getMaxOrder']);
        Route::get('/children/{id}', [MenuController::class, 'getChildren']);
        Route::get('/{id}', [MenuController::class, 'show'])->name('menus.show');
        Route::put('/{id}', [MenuController::class, 'update'])->name('menus.update');
        Route::delete('/{id}', [MenuController::class, 'destroy'])->name('menus.destroy');
        Route::post('/delete-multiple', [MenuController::class, 'destroyMultiple'])->name('menus.destroyMultiple');
    });
    // Categories
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('/', [CategoryController::class, 'store'])->name('categories.store');
        Route::get('/{category}', [CategoryController::class, 'show'])->name('categories.show');
        Route::put('/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
        Route::post('/delete-multiple', [CategoryController::class, 'destroyMultiple'])->name('categories.destroyMultiple');
    });
    // Promotion Subscriber
    Route::prefix('promotion-subscribers')->group(function () {
        Route::get('/', [PromotionSubscriberController::class, 'index'])->name('promotion-subscribers.index');
        Route::post('/', [PromotionSubscriberController::class, 'store'])->name('promotion-subscribers.store');
        Route::get('/{promotionSubscriber}', [PromotionSubscriberController::class, 'show'])->name('promotion-subscribers.show');
        Route::put('/{promotionSubscriber}', [PromotionSubscriberController::class, 'update'])->name('promotion-subscribers.update');
        Route::delete('/{promotionSubscriber}', [PromotionSubscriberController::class, 'destroy'])->name('promotion-subscribers.destroy');
        Route::post('/delete-multiple', [PromotionSubscriberController::class, 'destroyMultiple'])->name('promotion-subscribers.destroyMultiple');
    });
    // Products
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('products.index');
        Route::post('/', [ProductController::class, 'store'])->name('products.store');
        Route::get('/{slug}', [ProductController::class, 'show'])->name('products.show');
        Route::put('/{id}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('/{id}', [ProductController::class, 'destroy'])->name('products.destroy');
        Route::post('/delete-multiple', [ProductController::class, 'destroyMultiple'])->name('products.destroyMultiple');
    });
    // Vouchers
    Route::prefix('vouchers')->group(function () {
        Route::get('/', [VoucherController::class, 'index'])->name('vouchers.index');
        Route::post('/', [VoucherController::class, 'store'])->name('vouchers.store');
        Route::get('/{id}', [VoucherController::class, 'show'])->name('vouchers.show');
        Route::put('/{id}', [VoucherController::class, 'update'])->name('vouchers.update');
        Route::delete('/{id}', [VoucherController::class, 'destroy'])->name('vouchers.destroy');
        Route::post('/delete-multiple', [VoucherController::class, 'destroyMultiple'])->name('vouchers.destroyMultiple');
    });
    // Review management
    Route::prefix('reviews')->group(function () {
        Route::get('/', [ReviewController::class, 'index']);
        Route::get('/pending', [ReviewController::class, 'getPendingReviews']);
        Route::get('/statistics', [ReviewController::class, 'statistics']);
        Route::get('/{id}', [ReviewController::class, 'show']);
        Route::put('/{id}/status', [ReviewController::class, 'updateStatus']);
        Route::delete('/{id}', [ReviewController::class, 'destroy']);
    });

    // Reply management
    Route::prefix('reviews')->group(function () {
        Route::get('/{reviewId}/replies', [ReviewReplyController::class, 'getReplies']);
        Route::post('/{reviewId}/replies', [ReviewReplyController::class, 'store']);
        Route::put('/replies/{id}', [ReviewReplyController::class, 'update']);
        Route::delete('/replies/{id}', [ReviewReplyController::class, 'destroy']);
    });
});
