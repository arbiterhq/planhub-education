<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectScopeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'trade_id' => 'required|exists:trades,id',
            'description' => 'nullable|string',
            'estimated_value' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:open,bidding,awarded,in_progress,completed',
        ];
    }
}
