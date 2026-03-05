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
        Schema::create('order_details', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->unsignedBigInteger('orders_id')->index('order_details_orders_id_foreign');
            $table->unsignedBigInteger('product_id')->index('order_details_product_id_foreign');
            $table->decimal('price', 12)->default(0);
            $table->integer('volume')->default(1);
            $table->decimal('total_price', 12)->default(0);
            $table->timestamp('createdate')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_details');
    }
};
