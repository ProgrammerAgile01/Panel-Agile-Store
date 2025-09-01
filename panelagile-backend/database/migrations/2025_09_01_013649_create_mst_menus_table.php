<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mst_menus', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->tinyInteger('level')->default(1);
            $table->enum('type', ['group', 'module', 'menu', 'submenu'])->default('menu');
            $table->string('title');
            $table->string('icon')->nullable();
            $table->string('color', 32)->nullable();
            $table->integer('order_number')->default(0);
            $table->unsignedBigInteger('crud_builder_id')->nullable()->index();
            $table->string('product_code', 64)->index()->nullable();
            $table->string('route_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('note')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::table('mst_menus', function (Blueprint $table) {
            $table->foreign('parent_id')
                  ->references('id')->on('mst_menus')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('mst_menus', function (Blueprint $table) {
            try { $table->dropForeign(['parent_id']); } catch (\Throwable $e) {}
            try { $table->dropForeign(['crud_builder_id']); } catch (\Throwable $e) {}
            try { $table->dropForeign(['created_by']); } catch (\Throwable $e) {}
        });
        Schema::dropIfExists('mst_menus');
    }
};
