<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sys_level_user', function (Blueprint $table) {
            $table->id();
            $table->string('nama_level');
            $table->text('deskripsi')->nullable();
            $table->enum('status', ['Aktif', 'Tidak Aktif'])->default('Aktif');
            $table->string('default_homepage')->default('dashboard');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_level_user');
    }
};
