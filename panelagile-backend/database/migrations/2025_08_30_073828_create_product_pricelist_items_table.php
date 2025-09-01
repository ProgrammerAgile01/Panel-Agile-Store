<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_pricelist_items', function (Blueprint $table) {
            $table->char('id', 36)->primary(); // UUID v4 string
            $table->char('pricelist_id', 36);  // referensi header (uuid/string)
            $table->unsignedBigInteger('package_id');    // rel ke mst_product_packages.id
            $table->string('package_code', 100);         // simpan code untuk read cepat
            $table->unsignedBigInteger('duration_id');   // rel ke mst_durations.id (atau tabel kamu)
            $table->string('duration_code', 50);         // simpan code untuk read cepat

            // angka
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->unsignedInteger('min_billing_cycle')->default(0);
            $table->boolean('prorate')->default(false);

            // periode efektif
            $table->dateTime('effective_start')->nullable();
            $table->dateTime('effective_end')->nullable();

            $table->timestamps();

            // index untuk upsert berdasarkan kombinasi
            $table->unique(['pricelist_id', 'package_id', 'duration_id'], 'uq_pricelist_package_duration');
            $table->index('package_code');
            $table->index('duration_code');

            // (opsional) FK kalau tabelnya ada:
            // $table->foreign('package_id')->references('id')->on('mst_product_packages');
            // $table->foreign('duration_id')->references('id')->on('mst_durations');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_pricelist_items');
    }
};
