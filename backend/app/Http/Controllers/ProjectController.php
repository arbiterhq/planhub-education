<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::where('company_id', auth()->user()->company_id)
            ->withCount(['scopes', 'contracts'])
            ->withCount([
                'scopes as active_bids_count' => fn($q) => $q->whereHas(
                    'bids',
                    fn($b) => $b->whereIn('status', ['submitted', 'under_review'])
                ),
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');
        $allowedSorts = ['name', 'status', 'created_at', 'start_date', 'end_date', 'estimated_budget'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min((int) $request->input('per_page', 10), 50);
        $projects = $query->paginate($perPage);

        return ProjectResource::collection($projects);
    }

    public function show(Project $project)
    {
        if ($project->company_id !== auth()->user()->company_id) {
            abort(403);
        }

        $project->load([
            'scopes.trade',
            'scopes.bids.company',
            'contracts.company',
            'contracts.trade',
            'invoices.company',
        ]);

        return new ProjectResource($project);
    }

    public function store(StoreProjectRequest $request)
    {
        $project = Project::create([
            ...$request->validated(),
            'company_id' => auth()->user()->company_id,
            'status' => $request->input('status', 'planning'),
        ]);

        ActivityLogger::log('project_created', "Created project \"{$project->name}\"", $project->id);

        return new ProjectResource($project->fresh());
    }

    public function update(UpdateProjectRequest $request, Project $project)
    {
        if ($project->company_id !== auth()->user()->company_id) {
            abort(403);
        }

        $changes = array_keys($request->validated());
        $project->update($request->validated());

        ActivityLogger::log('project_updated', "Updated project \"{$project->name}\"", $project->id, ['changes' => $changes]);

        return new ProjectResource($project->fresh());
    }

    public function destroy(Project $project)
    {
        if ($project->company_id !== auth()->user()->company_id) {
            abort(403);
        }

        $project->delete();

        return response()->noContent();
    }
}
