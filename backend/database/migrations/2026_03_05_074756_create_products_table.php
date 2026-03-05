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
        Schema::create('products', function (Blueprint $table) {
            $table->unsignedBigInteger('id');
            $table->unsignedBigInteger('lang_id');
            $table->string('name');
            $table->text('desc')->nullable();
            $table->longText('content')->nullable();
            $table->string('image')->nullable();
            $table->text('attribute')->nullable();
            $table->string('url')->nullable();
            $table->string('author')->nullable();
            $table->string('seotitle')->nullable();
            $table->text('seodesc')->nullable();
            $table->decimal('price', 10)->nullable();
            $table->decimal('saleprice', 10)->nullable();
            $table->integer('totalview')->default(0);
            $table->integer('order')->default(0);
            $table->timestamp('lastview')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
