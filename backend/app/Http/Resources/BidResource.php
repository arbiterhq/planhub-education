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
            'company' => new SubcontractorResource($this->whenLoaded('company')),
            'project_scope' => new ProjectScopeResource($this->whenLoaded('projectScope')),
            'contract' => new ContractResource($this->whenLoaded('contract')),
        ];
    }
}
