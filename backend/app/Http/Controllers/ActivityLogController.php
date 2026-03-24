<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        $query = ActivityLog::where('company_id', $companyId)
            ->with(['user', 'project']);

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $activities = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'data' => $activities->map(fn ($log) => [
                'id'          => $log->id,
                'action'      => $log->action,
                'description' => $log->description,
                'metadata'    => $log->metadata,
                'user'        => $log->user?->name,
                'project'     => $log->project
                    ? ['id' => $log->project->id, 'name' => $log->project->name]
                    : null,
                'created_at'  => $log->created_at,
            ]),
            'meta' => [
                'current_page' => $activities->currentPage(),
                'last_page'    => $activities->lastPage(),
                'per_page'     => $activities->perPage(),
                'total'        => $activities->total(),
            ],
        ]);
    }
}
