<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Bid extends Model
{
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'company_id',
        'project_scope_id',
        'amount',
        'description',
        'timeline_days',
        'status',
        'submitted_at',
        'reviewed_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(InvitationToBid::class, 'invitation_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function projectScope(): BelongsTo
    {
        return $this->belongsTo(ProjectScope::class);
    }

    public function contract(): HasOne
    {
        return $this->hasOne(Contract::class);
    }
}
