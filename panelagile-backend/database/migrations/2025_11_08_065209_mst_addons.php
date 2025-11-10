<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mst_addons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->string('product_code', 150)->index();

            $table->string('addon_code', 150); // unik per product_code
            $table->string('name', 150);
            $table->text('description')->nullable();

            // Jenis & cara billing
            $table->enum('kind', ['quantity', 'toggle'])->default('quantity');
            $table->enum('pricing_mode', ['per_unit_per_cycle', 'one_time'])->default('per_unit_per_cycle');

            // Kuantitas (untuk kind=quantity)
            $table->string('unit_label', 60)->nullable(); // ex: "pelanggan"
            $table->unsignedInteger('min_qty')->default(1);
            $table->unsignedInteger('step_qty')->default(1);
            $table->unsignedInteger('max_qty')->nullable(); // null = tanpa batas

            // Harga
            $table->string('currency', 10)->default('IDR');
            $table->unsignedBigInteger('unit_price')->default(0); // 5000 = Rp 5.000

            // Status & urutan
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->integer('order_number')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['product_code', 'addon_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mst_addons');
    }
};