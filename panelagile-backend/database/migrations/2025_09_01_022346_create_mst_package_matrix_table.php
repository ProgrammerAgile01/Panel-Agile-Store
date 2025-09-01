<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mst_package_matrix', function (Blueprint $t) {
            $t->bigIncrements('id');

            // identitas produk dan paket
            $t->string('product_code')->index();
            $t->unsignedBigInteger('package_id')->index();

            // item yg diatur: feature/menu
            $t->enum('item_type', ['feature','menu'])->index();
            // simpan id sumber (ProductFeature.id untuk feature, mst_menus.id untuk menu)
            $t->string('item_id')->index();

            // flag
            $t->boolean('enabled')->default(false);

            $t->timestamps();

            // unik per product+package+item
            $t->unique(['product_code','package_id','item_type','item_id'], 'uq_pkg_matrix');

            // FK opsional (biar aman, ON DELETE CASCADE)
            $t->foreign('package_id')
              ->references('id')->on('mst_product_packages')
              ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mst_package_matrix');
    }
};
