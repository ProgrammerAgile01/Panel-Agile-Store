<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mst_products', function (Blueprint $table) {
            $table->id();

            // Kode unik dari AppGenerate/Warehouse
            $table->string('product_code', 64)->unique()->index();

            // Info dasar
            $table->string('product_name', 160);
            $table->string('category', 80)->nullable();
            $table->string('status', 32)->default('Active');
            $table->text('description')->nullable();
               $table->string('db_name', 60);

            // Info statistik ringan
            $table->unsignedInteger('total_features')->default(0);

            // Stempel kapan data upstream terakhir diketahui
            $table->timestamp('upstream_updated_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mst_products');
    }
};
