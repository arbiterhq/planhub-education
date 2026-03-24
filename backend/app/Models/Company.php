<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'description',
        'address',
        'city',
        'state',
        'zip',
        'phone',
        'email',
        'website',
        'logo_url',
        'license_number',
        'established_year',
        'employee_count',
    ];

    protected $casts = [
        'established_year' => 'integer',
        'employee_count' => 'integer',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function trades(): BelongsToMany
    {
        return $this->belongsToMany(Trade::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function invitationsToBid(): HasMany
    {
        return $this->hasMany(InvitationToBid::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function scopeGeneralContractors(Builder $query): Builder
    {
        return $query->where('type', 'general_contractor');
    }

    public function scopeSubcontractors(Builder $query): Builder
    {
        return $query->where('type', 'subcontractor');
    }
}
