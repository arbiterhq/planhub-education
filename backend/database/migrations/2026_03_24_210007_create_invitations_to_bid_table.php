<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations_to_bid', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_scope_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->constrained();
            $table->enum('status', ['sent', 'viewed', 'declined', 'bid_submitted'])->default('sent');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations_to_bid');
    }
};
