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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->unsignedBigInteger('id');
            $table->string('code');
            $table->string('name');
            $table->string('image')->nullable();
            $table->string('type');
            $table->decimal('discount');
            $table->decimal('minmoney', 12)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('createdate')->useCurrent();
            $table->timestamp('updatedate')->useCurrentOnUpdate()->useCurrent();
            $table->timestamp('enddate')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
