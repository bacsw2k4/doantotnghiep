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
        Schema::create('menus', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->unsignedBigInteger('lang_id')->nullable()->index('menus_lang_id_foreign');
            $table->unsignedBigInteger('parentid')->nullable()->index('menus_parentid_foreign');
            $table->string('parentsid')->nullable();
            $table->string('name');
            $table->text('desc')->nullable();
            $table->text('content')->nullable();
            $table->string('seotitle')->nullable();
            $table->text('seodesc')->nullable();
            $table->string('url')->nullable();
            $table->text('params')->nullable();
            $table->integer('order')->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
