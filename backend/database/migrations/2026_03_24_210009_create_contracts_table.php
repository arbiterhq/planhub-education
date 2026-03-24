<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bid_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->constrained();
            $table->foreignId('company_id')->constrained();
            $table->foreignId('trade_id')->constrained();
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['draft', 'active', 'completed', 'terminated'])->default('draft');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
