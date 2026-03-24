<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectScope extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'trade_id',
        'description',
        'estimated_value',
        'status',
    ];

    protected $casts = [
        'estimated_value' => 'decimal:2',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function trade(): BelongsTo
    {
        return $this->belongsTo(Trade::class);
    }

    public function invitationsToBid(): HasMany
    {
        return $this->hasMany(InvitationToBid::class);
    }

    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class);
    }
}
