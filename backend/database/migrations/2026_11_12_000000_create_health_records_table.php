<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['blood_type', 'allergy', 'medication', 'contact']);
            $table->string('title');
            $table->text('details')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('dosage', 100)->nullable();
            $table->string('remind_at', 5)->nullable(); // HH:MM
            $table->boolean('critical')->default(false);
            $table->string('image_path')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_records');
    }
};
