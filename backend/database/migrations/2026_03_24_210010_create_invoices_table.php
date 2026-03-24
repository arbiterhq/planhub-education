<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained();
            $table->foreignId('company_id')->constrained();
            $table->foreignId('project_id')->constrained();
            $table->string('invoice_number')->unique();
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'paid', 'rejected'])->default('draft');
            $table->date('due_date')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
