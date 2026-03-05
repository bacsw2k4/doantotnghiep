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
        Schema::create('order_details_attributes', function (Blueprint $table) {
            $table->unsignedBigInteger('id');
            $table->unsignedBigInteger('order_details_id');
            $table->unsignedBigInteger('attribute_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_details_attributes');
    }
};
