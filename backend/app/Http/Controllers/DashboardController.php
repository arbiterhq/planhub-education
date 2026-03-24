<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Bid;
use App\Models\Invoice;
use App\Models\Message;
use App\Models\Project;
use App\Models\ProjectScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user      = $request->user();
        $companyId = $user->company_id;

        // ── Project IDs owned by this company ────────────────────────────────────
        $projectIds = Project::where('company_id', $companyId)->pluck('id');

        // ── Project summary ───────────────────────────────────────────────────────
        $statusCounts = Project::where('company_id', $companyId)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $projectSummary = [
            'total'       => (int) $statusCounts->sum(),
            'planning'    => (int) ($statusCounts['planning']    ?? 0),
            'bidding'     => (int) ($statusCounts['bidding']     ?? 0),
            'in_progress' => (int) ($statusCounts['in_progress'] ?? 0),
            'completed'   => (int) ($statusCounts['completed']   ?? 0),
            'on_hold'     => (int) ($statusCounts['on_hold']     ?? 0),
        ];

        // ── Bid summary (bids on this company's project scopes) ───────────────────
        $scopeIds = ProjectScope::whereIn('project_id', $projectIds)->pluck('id');

        $bidStats = Bid::whereIn('project_scope_id', $scopeIds)
            ->selectRaw("
                COUNT(CASE WHEN status IN ('submitted', 'under_review') THEN 1 END) AS active_bids,
                COUNT(CASE WHEN status = 'submitted'                    THEN 1 END) AS pending_review,
                SUM(CASE  WHEN status IN ('submitted', 'under_review') THEN amount ELSE 0 END) AS total_bid_value
            ")
            ->first();

        // ── Invoice summary ───────────────────────────────────────────────────────
        $startOfMonth = now()->startOfMonth();

        $invoiceStats = Invoice::whereIn('project_id', $projectIds)
            ->selectRaw("
                COUNT(CASE WHEN status IN ('submitted', 'approved') THEN 1 END) AS open_invoices,
                SUM(CASE  WHEN status IN ('submitted', 'approved') THEN amount ELSE 0 END) AS total_outstanding
            ")
            ->first();

        $paidThisMonth = Invoice::whereIn('project_id', $projectIds)
            ->where('status', 'paid')
            ->where('paid_at', '>=', $startOfMonth)
            ->sum('amount');

        // ── Unread messages for this user ─────────────────────────────────────────
        $unreadMessages = Message::where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->count();

        // ── Recent activity (last 10) ─────────────────────────────────────────────
        $recentActivity = ActivityLog::with('project:id,name')
            ->where('company_id', $companyId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'action'      => $log->action,
                'description' => $log->description,
                'created_at'  => $log->created_at,
                'project'     => $log->project
                    ? ['id' => $log->project->id, 'name' => $log->project->name]
                    : null,
            ]);

        // ── Upcoming bid deadlines (next 5) ───────────────────────────────────────
        $upcomingDeadlines = Project::where('company_id', $companyId)
            ->whereNotNull('bid_due_date')
            ->where('bid_due_date', '>=', now()->toDateString())
            ->orderBy('bid_due_date')
            ->limit(5)
            ->withCount(['scopes as open_scopes' => fn ($q) => $q->where('status', 'open')])
            ->get()
            ->map(fn ($project) => [
                'project_id'     => $project->id,
                'project_name'   => $project->name,
                'bid_due_date'   => $project->bid_due_date->toDateString(),
                'days_remaining' => (int) now()->startOfDay()->diffInDays($project->bid_due_date),
                'open_scopes'    => (int) $project->open_scopes,
            ]);

        return response()->json([
            'project_summary' => $projectSummary,
            'bid_summary'     => [
                'active_bids'     => (int)   ($bidStats->active_bids    ?? 0),
                'pending_review'  => (int)   ($bidStats->pending_review ?? 0),
                'total_bid_value' => (float) ($bidStats->total_bid_value ?? 0),
            ],
            'invoice_summary' => [
                'open_invoices'     => (int)   ($invoiceStats->open_invoices    ?? 0),
                'total_outstanding' => (float) ($invoiceStats->total_outstanding ?? 0),
                'paid_this_month'   => (float) $paidThisMonth,
            ],
            'unread_messages'    => $unreadMessages,
            'recent_activity'    => $recentActivity,
            'upcoming_deadlines' => $upcomingDeadlines,
        ]);
    }
}
