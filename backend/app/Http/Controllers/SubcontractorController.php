<?php

namespace App\Http\Controllers;

use App\Http\Resources\SubcontractorResource;
use App\Models\Company;
use Illuminate\Http\Request;

class SubcontractorController extends Controller
{
    public function index(Request $request)
    {
        $query = Company::subcontractors()
            ->with('trades')
            ->withCount(['bids as total_bids'])
            ->withCount(['bids as accepted_bids' => fn($q) => $q->where('status', 'accepted')])
            ->withCount(['activeContracts']);

        if ($request->filled('trade_id')) {
            $query->whereHas('trades', fn($q) => $q->where('trades.id', $request->trade_id));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        $subcontractors = $query->orderBy('name')->paginate(12);

        return SubcontractorResource::collection($subcontractors);
    }

    public function show(int $id)
    {
        $subcontractor = Company::subcontractors()
            ->withCount(['bids as total_bids'])
            ->withCount(['bids as accepted_bids' => fn($q) => $q->where('status', 'accepted')])
            ->withCount(['activeContracts'])
            ->findOrFail($id);

        $subcontractor->load([
            'trades',
            'bids.projectScope.project',
            'bids.projectScope.trade',
            'contracts.project',
            'contracts.trade',
        ]);

        return new SubcontractorResource($subcontractor);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'trades' => 'nullable|array',
            'trades.*' => 'integer|exists:trades,id',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:2',
            'zip' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'description' => 'nullable|string',
            'employee_count' => 'nullable|integer|min:1',
            'established_year' => 'nullable|integer|min:1800|max:2100',
            'license_number' => 'nullable|string|max:100',
        ]);

        $subcontractor = Company::create([
            ...collect($validated)->except(['trades'])->toArray(),
            'type' => 'subcontractor',
        ]);

        if (!empty($validated['trades'])) {
            $subcontractor->trades()->sync($validated['trades']);
        }

        $subcontractor->load('trades');

        return new SubcontractorResource($subcontractor);
    }

    public function update(Request $request, int $id)
    {
        $subcontractor = Company::subcontractors()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'trades' => 'nullable|array',
            'trades.*' => 'integer|exists:trades,id',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:2',
            'zip' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'description' => 'nullable|string',
            'employee_count' => 'nullable|integer|min:1',
            'established_year' => 'nullable|integer|min:1800|max:2100',
            'license_number' => 'nullable|string|max:100',
        ]);

        $subcontractor->update(collect($validated)->except(['trades'])->toArray());

        if (array_key_exists('trades', $validated)) {
            $subcontractor->trades()->sync($validated['trades'] ?? []);
        }

        $subcontractor->load('trades');

        return new SubcontractorResource($subcontractor);
    }
}
