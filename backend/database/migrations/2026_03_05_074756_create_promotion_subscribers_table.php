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
        Schema::create('promotion_subscribers', function (Blueprint $table) {
            $table->unsignedBigInteger('id');
            $table->string('email');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('subscribed_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotion_subscribers');
    }
};
