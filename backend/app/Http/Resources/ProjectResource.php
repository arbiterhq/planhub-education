<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'project_type' => $this->project_type,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'zip' => $this->zip,
            'estimated_budget' => (float) $this->estimated_budget,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'bid_due_date' => $this->bid_due_date?->toDateString(),
            'scopes_count' => $this->whenCounted('scopes'),
            'active_bids_count' => $this->whenCounted('activeBids'),
            'contracts_count' => $this->whenCounted('contracts'),
            'scopes' => ProjectScopeResource::collection($this->whenLoaded('scopes')),
            'contracts' => ContractResource::collection($this->whenLoaded('contracts')),
            'invoices' => InvoiceResource::collection($this->whenLoaded('invoices')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
