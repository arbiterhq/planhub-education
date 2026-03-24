<?php

namespace App\Http\Controllers;

use App\Http\Resources\BidResource;
use App\Models\Bid;
use App\Models\Contract;
use App\Models\InvitationToBid;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class BidController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        $query = Bid::whereHas(
            'projectScope.project',
            fn($q) => $q->where('company_id', $companyId)
        )->with(['company', 'projectScope.project', 'projectScope.trade', 'contract']);

        if ($request->filled('project_id')) {
            $query->whereHas(
                'projectScope',
                fn($q) => $q->where('project_id', $request->project_id)
            );
        }

        if ($request->filled('project_scope_id')) {
            $query->where('project_scope_id', $request->project_scope_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $sortField = $request->input('sort', 'submitted_at');
        $direction = $request->input('direction', 'desc');
        $query->orderBy($sortField, $direction);

        $bids = $query->paginate(15);

        return BidResource::collection($bids);
    }

    public function show(Request $request, Bid $bid)
    {
        $companyId = $request->user()->company_id;

        abort_unless(
            $bid->projectScope->project->company_id === $companyId,
            403
        );

        $bid->load(['company.trades', 'projectScope.project', 'projectScope.trade', 'invitation', 'contract']);

        $siblingBids = Bid::where('project_scope_id', $bid->project_scope_id)
            ->where('id', '!=', $bid->id)
            ->with('company')
            ->get();

        return response()->json([
            'data' => new BidResource($bid),
            'sibling_bids' => BidResource::collection($siblingBids),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invitation_id' => 'nullable|exists:invitations_to_bid,id',
            'company_id' => 'required|exists:companies,id',
            'project_scope_id' => 'required|exists:project_scopes,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'timeline_days' => 'nullable|integer|min:1',
        ]);

        $bid = Bid::create([
            ...$validated,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        if (!empty($validated['invitation_id'])) {
            InvitationToBid::where('id', $validated['invitation_id'])->update([
                'status' => 'bid_submitted',
                'responded_at' => now(),
            ]);
        }

        $bid->load(['company', 'projectScope.project', 'projectScope.trade', 'contract']);

        $amount = number_format($bid->amount, 2);
        ActivityLogger::log(
            'bid_submitted',
            "{$bid->company->name} submitted a bid of \${$amount} for {$bid->projectScope->trade->name} on {$bid->projectScope->project->name}",
            $bid->projectScope->project_id
        );

        return new BidResource($bid);
    }

    public function review(Request $request, Bid $bid)
    {
        $companyId = $request->user()->company_id;

        abort_unless(
            $bid->projectScope->project->company_id === $companyId,
            403
        );

        abort_unless(
            in_array($bid->status, ['submitted', 'under_review']),
            422,
            'Bid is not in a reviewable status.'
        );

        $validated = $request->validate([
            'action' => 'required|in:accept,reject',
            'notes' => 'nullable|string',
        ]);

        if ($validated['action'] === 'accept') {
            $bid->update([
                'status' => 'accepted',
                'reviewed_at' => now(),
                'notes' => $validated['notes'] ?? $bid->notes,
            ]);

            Bid::where('project_scope_id', $bid->project_scope_id)
                ->where('id', '!=', $bid->id)
                ->whereIn('status', ['submitted', 'under_review'])
                ->update(['status' => 'rejected', 'reviewed_at' => now()]);

            $bid->load('projectScope');

            $contract = Contract::create([
                'bid_id' => $bid->id,
                'project_id' => $bid->projectScope->project_id,
                'company_id' => $bid->company_id,
                'trade_id' => $bid->projectScope->trade_id,
                'amount' => $bid->amount,
                'status' => 'active',
                'start_date' => now()->addDays(14)->toDateString(),
                'end_date' => now()->addDays(14 + $bid->timeline_days)->toDateString(),
                'signed_at' => now(),
            ]);

            $bid->projectScope->update(['status' => 'awarded']);
        } else {
            $bid->update([
                'status' => 'rejected',
                'reviewed_at' => now(),
                'notes' => $validated['notes'] ?? $bid->notes,
            ]);
        }

        $bid->load(['company', 'projectScope.project', 'projectScope.trade', 'contract']);

        if ($validated['action'] === 'accept') {
            ActivityLogger::log(
                'bid_accepted',
                "Accepted bid from {$bid->company->name} for {$bid->projectScope->trade->name} on {$bid->projectScope->project->name} — contract created",
                $bid->projectScope->project_id,
                ['bid_id' => $bid->id, 'contract_id' => $contract->id]
            );
        } else {
            ActivityLogger::log(
                'bid_rejected',
                "Rejected bid from {$bid->company->name} for {$bid->projectScope->trade->name} on {$bid->projectScope->project->name}",
                $bid->projectScope->project_id
            );
        }

        return new BidResource($bid);
    }
}
