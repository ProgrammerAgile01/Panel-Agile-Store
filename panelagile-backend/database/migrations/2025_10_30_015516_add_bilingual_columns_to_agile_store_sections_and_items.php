<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ===== Sections: content_en =====
        Schema::table('agile_store_sections', function (Blueprint $table) {
            $table->json('content_en')->nullable()->after('content');
        });

        // Seed awal: copy dari content -> content_en (agar tak kosong)
        // Catatan: pakai SQL raw untuk MySQL/MariaDB/PG yang mendukung JSON assignment.
        try {
            DB::statement('UPDATE agile_store_sections SET content_en = content');
        } catch (\Throwable $e) {
            // ignore jika engine tidak support; bisa diisi manual via seeder
        }

        // ===== Items: *_en + extras_en =====
        Schema::table('agile_store_items', function (Blueprint $table) {
            $table->string('title_en')->nullable()->after('title');
            $table->string('subtitle_en')->nullable()->after('subtitle');
            $table->text('description_en')->nullable()->after('description');
            $table->string('cta_label_en')->nullable()->after('cta_label');
            $table->json('extras_en')->nullable()->after('extras');
        });

        // Seed awal: copy nilai ID (lama) -> kolom EN (supaya keduanya ada)
        try {
            DB::statement('UPDATE agile_store_items SET
                title_en = title,
                subtitle_en = subtitle,
                description_en = description,
                cta_label_en = cta_label,
                extras_en = extras
            ');
        } catch (\Throwable $e) {
            // abaikan jika tak didukung
        }
    }

    public function down(): void
    {
        Schema::table('agile_store_items', function (Blueprint $table) {
            $table->dropColumn(['title_en','subtitle_en','description_en','cta_label_en','extras_en']);
        });

        Schema::table('agile_store_sections', function (Blueprint $table) {
            $table->dropColumn(['content_en']);
        });
    }
};
