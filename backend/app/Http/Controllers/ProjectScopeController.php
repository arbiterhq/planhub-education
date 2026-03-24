<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectScopeRequest;
use App\Http\Resources\ProjectScopeResource;
use App\Models\Project;
use App\Models\ProjectScope;

class ProjectScopeController extends Controller
{
    public function store(StoreProjectScopeRequest $request, Project $project)
    {
        if ($project->company_id !== auth()->user()->company_id) {
            abort(403);
        }

        $scope = $project->scopes()->create($request->validated());

        return new ProjectScopeResource($scope->load('trade'));
    }

    public function update(StoreProjectScopeRequest $request, Project $project, ProjectScope $scope)
    {
        if ($project->company_id !== auth()->user()->company_id || $scope->project_id !== $project->id) {
            abort(403);
        }

        $scope->update($request->validated());

        return new ProjectScopeResource($scope->fresh()->load('trade'));
    }

    public function destroy(Project $project, ProjectScope $scope)
    {
        if ($project->company_id !== auth()->user()->company_id || $scope->project_id !== $project->id) {
            abort(403);
        }

        $scope->delete();

        return response()->noContent();
    }
}
