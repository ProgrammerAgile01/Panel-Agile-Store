<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('landing_page_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('landing_page_id')->index();
            $table->string('section_key', 64); // contoh: hero, features, pricing, dll
            $table->string('name');            // "Hero Section", "Features Section", dst
            $table->boolean('enabled')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->json('content')->nullable(); // tempat seluruh object konten kamu
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('landing_page_id')->references('id')->on('landing_pages')
                ->onUpdate('cascade')->onDelete('cascade');

            $table->unique(['landing_page_id','section_key']); // 1 key unik per page
        });
    }

    public function down(): void {
        Schema::dropIfExists('landing_page_sections');
    }
};
