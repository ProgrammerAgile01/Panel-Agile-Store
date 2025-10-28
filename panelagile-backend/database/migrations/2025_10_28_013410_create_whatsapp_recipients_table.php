<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateWhatsappRecipientsTable extends Migration
{
    public function up()
    {
        Schema::create('whatsapp_recipients', function (Blueprint $table) {
            $table->id();
            $table->string('phone_number', 50);
            $table->string('name', 150);
            $table->string('position', 150)->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            // jika kamu pakai users table standar
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('whatsapp_recipients', function ($table) {
            // drop foreigns safely
            if (Schema::hasColumn('whatsapp_recipients', 'created_by')) {
                $table->dropForeign(['created_by']);
            }
            if (Schema::hasColumn('whatsapp_recipients', 'updated_by')) {
                $table->dropForeign(['updated_by']);
            }
        });

        Schema::dropIfExists('whatsapp_recipients');
    }
}
