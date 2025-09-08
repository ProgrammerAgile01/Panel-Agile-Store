<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('landing_pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // relasi via product_code supaya konsisten dgn mirror warehouse/panel
            $table->string('product_code')->index();
            $table->enum('status', ['draft','published'])->default('draft');
            $table->json('meta')->nullable(); // ruang ekstra (theme, etc)
            $table->timestamps();
            $table->softDeletes();

            // FK aman (ON UPDATE CASCADE, ON DELETE CASCADE/SET NULL sesuai preferensi)
            $table->foreign('product_code')->references('product_code')->on('mst_products')
                ->onUpdate('cascade')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('landing_pages');
    }
};
