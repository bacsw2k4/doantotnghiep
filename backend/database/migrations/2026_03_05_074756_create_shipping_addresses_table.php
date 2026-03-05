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
        Schema::create('shipping_addresses', function (Blueprint $table) {
            $table->unsignedBigInteger('id');
            $table->string('address');
            $table->string('phone');
            $table->text('desc')->nullable();
            $table->string('email')->nullable();
            $table->string('name');
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamp('createdate')->useCurrent();
            $table->timestamp('updatedate')->useCurrentOnUpdate()->nullable();
            $table->unsignedBigInteger('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipping_addresses');
    }
};
