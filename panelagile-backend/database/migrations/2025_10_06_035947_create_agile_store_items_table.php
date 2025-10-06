<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('agile_store_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('agile_store_sections')->cascadeOnDelete();

            // klasifikasi item (diisi otomatis oleh controller berdasar key section, atau bisa dikirim dari FE)
            // contoh: product, pricing, testimonial, feature, step, link
            $table->string('item_type')->index();

            // konten generik
            $table->string('title')->nullable();        // name/heading untuk feature/plan
            $table->string('subtitle')->nullable();
            $table->text('description')->nullable();
            $table->string('cta_label')->nullable();
            $table->unsignedInteger('order')->default(1);

            // relasi opsional ke domain existing
            $table->string('product_code')->nullable()->index();   // -> mst_products.product_code
            $table->unsignedBigInteger('package_id')->nullable()->index(); // -> mst_product_packages.id
            $table->unsignedBigInteger('duration_id')->nullable()->index(); // -> mst_durations.id

            // pricing override
            $table->decimal('price_monthly', 12, 2)->nullable();
            $table->decimal('price_yearly', 12, 2)->nullable();

            // data tambahan (misal testimonials: {name, role}, pricing.features: [..], footer.link, dst)
            $table->json('extras')->nullable();

            $table->timestamps();

            // FK opsional (aktifkan jika tipe-tipe kolom sudah match di DB-mu)
            $table->foreign('product_code')->references('product_code')->on('mst_products')->nullOnDelete();
            $table->foreign('package_id')->references('id')->on('mst_product_packages')->nullOnDelete();
            $table->foreign('duration_id')->references('id')->on('mst_durations')->nullOnDelete();
        });
    }

    public function down(): void {
        Schema::dropIfExists('agile_store_items');
    }
};
