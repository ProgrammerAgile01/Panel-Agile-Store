<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sys_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_user_id')->constrained('sys_level_user')->cascadeOnDelete();
            $table->foreignId('nav_item_id')->constrained('mst_nav_items')->cascadeOnDelete();

            $table->boolean('access')->default(false);
            $table->boolean('view')->default(false);
            $table->boolean('add')->default(false);
            $table->boolean('edit')->default(false);
            $table->boolean('delete')->default(false);
            $table->boolean('approve')->default(false);
            $table->boolean('print')->default(false);

            $table->timestamps();

            $table->unique(['level_user_id', 'nav_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_permissions');
    }
};
