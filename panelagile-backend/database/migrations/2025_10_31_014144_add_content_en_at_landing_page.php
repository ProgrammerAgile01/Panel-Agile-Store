<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('landing_page_sections', function (Blueprint $table) {
            // Tambahkan kolom JSON untuk menyimpan konten versi Inggris
            // (nullable supaya tetap kompatibel jika belum diisi)
            $table->json('content_en')->nullable()->after('content');
        });
    }

    public function down(): void {
        Schema::table('landing_page_sections', function (Blueprint $table) {
            $table->dropColumn('content_en');
        });
    }
};
