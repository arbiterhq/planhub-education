<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bids', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->nullable()->constrained('invitations_to_bid')->nullOnDelete();
            $table->foreignId('company_id')->constrained();
            $table->foreignId('project_scope_id')->constrained();
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->integer('timeline_days')->nullable();
            $table->enum('status', ['submitted', 'under_review', 'accepted', 'rejected'])->default('submitted');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bids');
    }
};
