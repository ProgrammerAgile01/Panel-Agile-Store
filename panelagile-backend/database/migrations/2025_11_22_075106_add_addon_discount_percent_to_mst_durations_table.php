<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('mst_durations', function (Blueprint $table) {
            // persen diskon addon khusus untuk durasi ini
            $table->unsignedTinyInteger('addon_discount_percent')
                  ->default(0)
                  ->after('status'); // boleh digeser posisi sesuai selera
        });
    }

    public function down(): void
    {
        Schema::table('mst_durations', function (Blueprint $table) {
            $table->dropColumn('addon_discount_percent');
        });
    }
};
