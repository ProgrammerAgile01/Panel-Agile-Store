<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('agile_store_sections', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();      // hero, why, how, products, pricing, cta, testimonials, footer, about, contact
            $table->string('name');
            $table->boolean('enabled')->default(true);
            $table->unsignedInteger('order')->default(1);
            $table->json('theme')->nullable();    // { primary, secondary, accent, background, foreground }
            $table->json('content')->nullable();  // bebas mengikuti UI (subtitle, bullets, quickLinks, dll.)
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('agile_store_sections');
    }
};
