<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mst_durations', function (Blueprint $table) {
            $table->id();
            $table->string('name');                // e.g. "1 Bulan"
            $table->integer('length');             // angka 1, 6, 12
            $table->enum('unit', ['day','week','month','year'])->default('month');
            $table->string('code', 32)->unique();  // e.g. M1, M6, Y1
            $table->boolean('is_default')->default(false);
            $table->enum('status', ['active','archived'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mst_durations');
    }
};
