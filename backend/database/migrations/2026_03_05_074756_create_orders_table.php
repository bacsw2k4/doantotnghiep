<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->unsignedBigInteger('author')->nullable()->index('orders_author_foreign');
            $table->unsignedBigInteger('shippingaddress_id')->nullable()->index('orders_shippingaddress_id_foreign');
            $table->decimal('discount_price', 15)->nullable()->default(0);
            $table->string('voucher_code', 50)->nullable()->index();
            $table->decimal('discount_percent', 5)->nullable()->default(0);
            $table->decimal('total_price', 15)->default(0);
            $table->decimal('discount_total_price', 15)->nullable()->default(0);
            $table->timestamp('createdate')->useCurrent();
            $table->timestamp('updatedate')->useCurrentOnUpdate()->nullable();
            $table->timestamp('enddate')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])->default('pending');
            $table->unsignedBigInteger('language_id')->nullable()->index('orders_language_id_foreign');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
