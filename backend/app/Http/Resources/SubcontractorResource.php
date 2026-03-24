<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SubcontractorResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'description' => $this->description,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'zip' => $this->zip,
            'phone' => $this->phone,
            'email' => $this->email,
            'website' => $this->website,
            'logo_url' => $this->logo_url,
            'license_number' => $this->license_number,
            'established_year' => $this->established_year,
            'employee_count' => $this->employee_count,
            'trades' => TradeResource::collection($this->whenLoaded('trades')),
            'total_bids' => $this->when(isset($this->total_bids), $this->total_bids),
            'accepted_bids' => $this->when(isset($this->accepted_bids), $this->accepted_bids),
            'win_rate' => $this->when(
                isset($this->total_bids) && $this->total_bids > 0,
                fn() => round(($this->accepted_bids / $this->total_bids) * 100, 1)
            ),
            'active_contracts_count' => $this->whenCounted('activeContracts'),
            'bids' => BidResource::collection($this->whenLoaded('bids')),
            'contracts' => ContractResource::collection($this->whenLoaded('contracts')),
            'created_at' => $this->created_at,
        ];
    }
}
