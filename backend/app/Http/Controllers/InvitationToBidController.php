<?php

namespace App\Http\Controllers;

use App\Http\Resources\InvitationToBidResource;
use App\Models\Company;
use App\Models\InvitationToBid;
use App\Models\ProjectScope;
use Illuminate\Http\Request;

class InvitationToBidController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        $query = InvitationToBid::whereHas(
            'projectScope.project',
            fn($q) => $q->where('company_id', $companyId)
        )->with(['projectScope.project', 'projectScope.trade', 'company', 'bid']);

        if ($request->filled('project_id')) {
            $query->whereHas(
                'projectScope',
                fn($q) => $q->where('project_id', $request->project_id)
            );
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $invitations = $query->orderBy('sent_at', 'desc')->paginate(15);

        return InvitationToBidResource::collection($invitations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_scope_id' => 'required|exists:project_scopes,id',
            'company_id' => 'required|exists:companies,id',
            'notes' => 'nullable|string',
        ]);

        $companyId = $request->user()->company_id;

        $scope = ProjectScope::whereHas(
            'project',
            fn($q) => $q->where('company_id', $companyId)
        )->findOrFail($validated['project_scope_id']);

        $subcontractor = Company::subcontractors()->findOrFail($validated['company_id']);

        $existing = InvitationToBid::where('project_scope_id', $scope->id)
            ->where('company_id', $subcontractor->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'An invitation already exists for this scope and company.'], 422);
        }

        $invitation = InvitationToBid::create([
            'project_scope_id' => $scope->id,
            'company_id' => $subcontractor->id,
            'notes' => $validated['notes'] ?? null,
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        if ($scope->status === 'open') {
            $scope->update(['status' => 'bidding']);
        }

        $invitation->load(['projectScope.project', 'projectScope.trade', 'company', 'bid']);

        return new InvitationToBidResource($invitation);
    }

    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'project_scope_id' => 'required|exists:project_scopes,id',
            'company_ids' => 'required|array|min:1',
            'company_ids.*' => 'exists:companies,id',
            'notes' => 'nullable|string',
        ]);

        $companyId = $request->user()->company_id;

        $scope = ProjectScope::whereHas(
            'project',
            fn($q) => $q->where('company_id', $companyId)
        )->findOrFail($validated['project_scope_id']);

        $existingCompanyIds = InvitationToBid::where('project_scope_id', $scope->id)
            ->whereIn('company_id', $validated['company_ids'])
            ->pluck('company_id')
            ->toArray();

        $newCompanyIds = array_diff($validated['company_ids'], $existingCompanyIds);

        $created = [];
        foreach ($newCompanyIds as $subId) {
            $subcontractor = Company::subcontractors()->find($subId);
            if (!$subcontractor) {
                continue;
            }
            $created[] = InvitationToBid::create([
                'project_scope_id' => $scope->id,
                'company_id' => $subId,
                'notes' => $validated['notes'] ?? null,
                'status' => 'sent',
                'sent_at' => now(),
            ]);
        }

        if (count($created) > 0 && $scope->status === 'open') {
            $scope->update(['status' => 'bidding']);
        }

        $ids = collect($created)->pluck('id');
        $invitations = InvitationToBid::whereIn('id', $ids)
            ->with(['projectScope.project', 'projectScope.trade', 'company', 'bid'])
            ->get();

        return response()->json([
            'created_count' => count($created),
            'skipped_count' => count($existingCompanyIds),
            'data' => InvitationToBidResource::collection($invitations),
        ], 201);
    }

    public function update(Request $request, InvitationToBid $invitation)
    {
        $companyId = $request->user()->company_id;

        abort_unless(
            $invitation->projectScope->project->company_id === $companyId,
            403
        );

        $validated = $request->validate([
            'status' => 'sometimes|required|string|in:sent,viewed,bid_submitted,declined',
            'notes' => 'nullable|string',
        ]);

        $invitation->update($validated);

        $invitation->load(['projectScope.project', 'projectScope.trade', 'company', 'bid']);

        return new InvitationToBidResource($invitation);
    }
}
