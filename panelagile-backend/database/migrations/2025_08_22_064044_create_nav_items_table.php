<?php
// database/migrations/2025_08_23_000000_create_nav_items_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mst_nav_items', function (Blueprint $table) {
            $table->id();
            $table->string('label'); // Teks yang ditampilkan di navbar
            $table->string('slug')->index(); // Harus cocok dengan activePage (e.g. 'dashboard', 'products', dst.)
            $table->string('icon')->nullable(); // opsional, jika di header Anda menampilkan ikon
            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->unsignedInteger('order_number')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('mst_nav_items')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mst_nav_items');
    }
};