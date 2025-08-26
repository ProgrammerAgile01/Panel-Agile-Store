<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sys_users', function (Blueprint $table) {
            $table->id();

            // Identitas dasar
            $table->string('nama');
            $table->string('email')->unique();
            $table->string('password');

            // Role utama (opsional) → relasi ke sys_level_user.id
            $table->foreignId('role')
                ->nullable()
                ->constrained('sys_level_user') // pastikan tabel ini ada dulu
                ->nullOnDelete();                // lebih aman daripada cascadeOnDelete

            // Status selaras UI
            $table->enum('status', ['Active', 'Invited', 'Suspended'])->default('Invited');

            // Daftar level (nama level) yang diassign ke user, disimpan sebagai JSON
            $table->json('levels_json')->nullable();

            // Catatan tambahan (opsional)
            $table->text('notes')->nullable();

            // Terakhir login (untuk "x hours ago" di frontend)
            $table->timestamp('last_login_at')->nullable();

            $table->timestamps();

            // Index tambahan (opsional)
            $table->index('status');
            $table->index('last_login_at');
        });
    }

    public function down(): void
    {
        // Hapus FK dulu (opsional, Laravel biasanya urus otomatis, tapi aman)
        // Schema::table('sys_users', function (Blueprint $table) {
        //     $table->dropForeign(['role']);
        // });

        Schema::dropIfExists('sys_users');
    }
};
