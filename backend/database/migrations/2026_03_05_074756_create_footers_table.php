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
        Schema::create('footers', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->unsignedBigInteger('lang_id')->index('footers_lang_id_foreign');
            $table->longText('company')->nullable();
            $table->longText('support')->nullable();
            $table->longText('categories')->nullable();
            $table->longText('legal')->nullable();
            $table->longText('features')->nullable();
            $table->string('company_description')->nullable();
            $table->string('contact_address')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('social_facebook')->nullable();
            $table->string('social_instagram')->nullable();
            $table->string('social_twitter')->nullable();
            $table->string('social_youtube')->nullable();
            $table->string('bottom_copyright')->nullable();
            $table->longText('badges')->nullable();
            $table->longText('payment_methods')->nullable();
            $table->string('status')->default('active');
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('footers');
    }
};
