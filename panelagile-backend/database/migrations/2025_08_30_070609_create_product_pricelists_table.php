<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_pricelists', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Relasi ke product
            $table->unsignedBigInteger('product_id')->nullable();
            $table->string('product_code')->nullable()->index();

            // Header
            $table->string('currency', 8)->default('IDR');
            $table->enum('tax_mode', ['inclusive','exclusive'])->default('inclusive');

            $table->timestamps();
            $table->softDeletes();

            // Index berguna
            $table->index(['product_id', 'product_code']);

            // Opsi: kalau mau FK strict (pastikan tabel product ada & konsisten)
            // $table->foreign('product_id')->references('id')->on('mst_products')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_pricelists');
    }
};
