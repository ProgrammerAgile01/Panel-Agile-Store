<?php
// database/migrations/2025_08_29_000000_create_mst_product_features_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mst_product_features', function (Blueprint $t) {
            $t->string('id')->primary();
            $t->string('product_code')->index();
            $t->enum('item_type', ['FEATURE','SUBFEATURE'])->default('FEATURE')->index();

            $t->string('feature_code')->nullable()->index();
            $t->string('name'); // ✅ konsisten dengan warehouse
            $t->text('description')->nullable();

            $t->string('module_name')->default('General')->index();
            $t->string('menu_parent_code')->nullable()->index();

            $t->boolean('is_active')->default(true)->index();
            $t->integer('order_number')->default(0)->index();

            $t->decimal('price_addon', 12, 2)->default(0);
            $t->boolean('trial_available')->default(false);
            $t->integer('trial_days')->nullable();

            $t->timestamps();
            $t->timestamp('synced_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mst_product_features');
    }
};
