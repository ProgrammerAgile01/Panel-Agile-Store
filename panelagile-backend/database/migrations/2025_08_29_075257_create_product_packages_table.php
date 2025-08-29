<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mst_product_packages', function (Blueprint $table) {
            $table->id();
            // referensi produk dari Panel Agile Store (hasil sinkron)
            $table->string('product_id', 36)->nullable();   // UUID bila disinkron dari panel
            $table->string('product_code', 50);             // kode unik produk dari panel (ex: RENTVIX, ABSENPRO)
            // data paket
            $table->string('package_code', 60);             // slug/unique per product (ex: starter, professional)
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->text('notes')->nullable();
            $table->unsignedInteger('order_number')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['product_code', 'status']);
            $table->unique(['product_code', 'package_code'], 'uk_product_package');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mst_product_packages');
    }
};
