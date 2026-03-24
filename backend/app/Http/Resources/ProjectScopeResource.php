<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProjectScopeResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'trade_id' => $this->trade_id,
            'trade' => new TradeResource($this->whenLoaded('trade')),
            'description' => $this->description,
            'estimated_value' => (float) $this->estimated_value,
            'status' => $this->status,
            'bids_count' => $this->whenCounted('bids'),
            'bids' => BidResource::collection($this->whenLoaded('bids')),
            'invitations_count' => $this->whenCounted('invitationsToBid'),
            'created_at' => $this->created_at,
        ];
    }
}
