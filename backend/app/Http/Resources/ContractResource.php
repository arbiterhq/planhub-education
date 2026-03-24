<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'bid_id' => $this->bid_id,
            'project_id' => $this->project_id,
            'company_id' => $this->company_id,
            'trade_id' => $this->trade_id,
            'amount' => (float) $this->amount,
            'status' => $this->status,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'signed_at' => $this->signed_at,
            'company' => new CompanyResource($this->whenLoaded('company')),
            'trade' => new TradeResource($this->whenLoaded('trade')),
        ];
    }
}
