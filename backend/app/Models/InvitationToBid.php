<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class InvitationToBid extends Model
{
    use HasFactory;

    protected $table = 'invitations_to_bid';

    protected $fillable = [
        'project_scope_id',
        'company_id',
        'status',
        'sent_at',
        'responded_at',
        'notes',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function projectScope(): BelongsTo
    {
        return $this->belongsTo(ProjectScope::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function bid(): HasOne
    {
        return $this->hasOne(Bid::class, 'invitation_id');
    }
}
