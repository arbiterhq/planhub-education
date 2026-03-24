<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'company_id' => $this->company_id,
            'project_id' => $this->project_id,
            'invoice_number' => $this->invoice_number,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'status' => $this->status,
            'due_date' => $this->due_date?->toDateString(),
            'submitted_at' => $this->submitted_at,
            'approved_at' => $this->approved_at,
            'paid_at' => $this->paid_at,
            'notes' => $this->notes,
            'company' => new CompanyResource($this->whenLoaded('company')),
            'contract' => new ContractResource($this->whenLoaded('contract')),
        ];
    }
}
