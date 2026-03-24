<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InvitationToBidResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'project_scope_id' => $this->project_scope_id,
            'company_id' => $this->company_id,
            'status' => $this->status,
            'sent_at' => $this->sent_at,
            'responded_at' => $this->responded_at,
            'notes' => $this->notes,
            'project_scope' => new ProjectScopeResource($this->whenLoaded('projectScope')),
            'company' => new SubcontractorResource($this->whenLoaded('company')),
            'bid' => new BidResource($this->whenLoaded('bid')),
            'project' => new ProjectResource($this->whenLoaded('projectScope.project')),
            'created_at' => $this->created_at,
        ];
    }
}
