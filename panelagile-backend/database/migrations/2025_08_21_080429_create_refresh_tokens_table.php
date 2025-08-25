<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token', 255)->unique();      // refresh token plaintext (bisa di-hash kalau mau)
            $table->timestamp('expires_at');
            $table->boolean('revoked')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'expires_at', 'revoked']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refresh_tokens');
    }
};
