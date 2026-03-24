<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BidResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'invitation_id' => $this->invitation_id,
            'company_id' => $this->company_id,
            'project_scope_id' => $this->project_scope_id,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'timeline_days' => $this->timeline_days,
            'status' => $this->status,
            'submitted_at' => $this->submitted_at,
            'reviewed_at' => $this->reviewed_at,
            'notes' => $this->notes,
            'company' => new CompanyResource($this->whenLoaded('company')),
            'project_scope' => $this->when(
                $this->relationLoaded('projectScope'),
                fn() => [
                    'id' => $this->projectScope->id,
                    'project' => $this->projectScope->relationLoaded('project') ? [
                        'id' => $this->projectScope->project->id,
                        'name' => $this->projectScope->project->name,
                    ] : null,
                    'trade' => $this->projectScope->relationLoaded('trade') ? [
                        'id' => $this->projectScope->trade->id,
                        'name' => $this->projectScope->trade->name,
                    ] : null,
                ]
            ),
        ];
    }
}
