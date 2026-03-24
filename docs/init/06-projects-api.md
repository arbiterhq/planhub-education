# Task 06 — Projects Backend API

## Objective

Build the full CRUD API for projects and project scopes, including list filtering, pagination, eager-loaded relationships, API resources for consistent JSON output, and form request validation.

## Prerequisites

- Task 01 complete (Laravel backend)
- Task 03 complete (Database schema, models, seed data)
- Task 04 complete (Auth routes defined — we add project routes inside the `auth:sanctum` group)

## Steps

### 1. Create API Resource classes

Create `backend/app/Http/Resources/ProjectResource.php`:

```php
class ProjectResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'project_type' => $this->project_type,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'zip' => $this->zip,
            'estimated_budget' => (float) $this->estimated_budget,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'bid_due_date' => $this->bid_due_date?->toDateString(),
            'scopes_count' => $this->whenCounted('scopes'),
            'active_bids_count' => $this->whenCounted('activeBids'),
            'contracts_count' => $this->whenCounted('contracts'),
            'scopes' => ProjectScopeResource::collection($this->whenLoaded('scopes')),
            'contracts' => ContractResource::collection($this->whenLoaded('contracts')),
            'invoices' => InvoiceResource::collection($this->whenLoaded('invoices')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

Create `backend/app/Http/Resources/ProjectScopeResource.php`:

```php
class ProjectScopeResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'trade_id' => $this->trade_id,
            'trade' => new TradeResource($this->whenLoaded('trade')),
            'description' => $this->description,
            'estimated_value' => (float) $this->estimated_value,
            'status' => $this->status,
            'bids_count' => $this->whenCounted('bids'),
            'bids' => BidResource::collection($this->whenLoaded('bids')),
            'invitations_count' => $this->whenCounted('invitationsToBid'),
            'created_at' => $this->created_at,
        ];
    }
}
```

Also create these supporting resource classes if they don't exist yet:
- `TradeResource` (id, name, category)
- `ContractResource` (id, bid_id, project_id, company_id, trade_id, amount, status, start_date, end_date, signed_at, company [whenLoaded], trade [whenLoaded])
- `InvoiceResource` (id, contract_id, company_id, project_id, invoice_number, amount, description, status, due_date, submitted_at, approved_at, paid_at, notes, company [whenLoaded], contract [whenLoaded])
- `BidResource` (id, invitation_id, company_id, project_scope_id, amount, description, timeline_days, status, submitted_at, reviewed_at, notes, company [whenLoaded])

### 2. Create Form Request validation

Create `backend/app/Http/Requests/StoreProjectRequest.php`:

```php
class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:planning,bidding,in_progress,completed,on_hold',
            'project_type' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:2',
            'zip' => 'nullable|string|max:10',
            'estimated_budget' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'bid_due_date' => 'nullable|date',
        ];
    }
}
```

Create `backend/app/Http/Requests/UpdateProjectRequest.php` (same rules but all optional).

Create `backend/app/Http/Requests/StoreProjectScopeRequest.php`:

```php
public function rules(): array
{
    return [
        'trade_id' => 'required|exists:trades,id',
        'description' => 'nullable|string',
        'estimated_value' => 'nullable|numeric|min:0',
        'status' => 'nullable|in:open,bidding,awarded,in_progress,completed',
    ];
}
```

### 3. Create ProjectController

Create `backend/app/Http/Controllers/ProjectController.php`:

#### `index` — `GET /api/projects`

- Scoped to the authenticated user's company: `Project::where('company_id', auth()->user()->company_id)`
- Supports query parameters:
  - `status` — filter by status (e.g., `?status=in_progress`)
  - `search` — search by project name (LIKE query)
  - `sort` — sort field (default: `created_at`)
  - `direction` — `asc` or `desc` (default: `desc`)
- Eager load counts: `withCount(['scopes', 'contracts'])`
- Also count active bids: `withCount(['scopes as active_bids_count' => fn($q) => $q->whereHas('bids', fn($b) => $b->whereIn('status', ['submitted', 'under_review']))])`
- Paginate: 10 per page (use `?per_page=N` to override, max 50)
- Return `ProjectResource::collection($projects)`

#### `show` — `GET /api/projects/{project}`

- Use route model binding
- Verify the project belongs to the user's company (or return 403)
- Eager load: `scopes.trade`, `scopes.bids.company`, `contracts.company`, `contracts.trade`, `invoices.company`
- Return `new ProjectResource($project)`

#### `store` — `POST /api/projects`

- Use `StoreProjectRequest` for validation
- Set `company_id` to authenticated user's company
- Default status to `planning` if not provided
- Return `new ProjectResource($project)` with 201 status

#### `update` — `PUT /api/projects/{project}`

- Use `UpdateProjectRequest` for validation
- Verify ownership
- Return `new ProjectResource($project)`

#### `destroy` — `DELETE /api/projects/{project}`

- Verify ownership
- Delete the project (cascading deletes will handle related records)
- Return 204

### 4. Create ProjectScopeController

Create `backend/app/Http/Controllers/ProjectScopeController.php`:

#### `store` — `POST /api/projects/{project}/scopes`

- Verify the project belongs to the user's company
- Use `StoreProjectScopeRequest` for validation
- Create scope linked to the project
- Return `new ProjectScopeResource($scope)` with 201

#### `update` — `PUT /api/projects/{project}/scopes/{scope}`

- Verify ownership chain (scope belongs to project, project belongs to company)
- Update the scope
- Return `new ProjectScopeResource($scope)`

#### `destroy` — `DELETE /api/projects/{project}/scopes/{scope}`

- Verify ownership chain
- Delete scope
- Return 204

### 5. Create Trades endpoint

Create `backend/app/Http/Controllers/TradeController.php`:

#### `index` — `GET /api/trades`

- Return all trades, no pagination (small dataset)
- `TradeResource::collection(Trade::orderBy('category')->orderBy('name')->get())`

### 6. Register routes

In `routes/api.php`, inside the `auth:sanctum` middleware group:

```php
Route::apiResource('projects', ProjectController::class);
Route::apiResource('projects.scopes', ProjectScopeController::class)->only(['store', 'update', 'destroy']);
Route::get('trades', [TradeController::class, 'index']);
```

### 7. Verify the API

```bash
# Start server: cd backend && php artisan serve

# Login first (get session cookie), then:

# List projects
curl -b cookies.txt http://localhost:8000/api/projects

# Get project detail
curl -b cookies.txt http://localhost:8000/api/projects/1

# Filter by status
curl -b cookies.txt "http://localhost:8000/api/projects?status=in_progress"

# Search
curl -b cookies.txt "http://localhost:8000/api/projects?search=austin"

# List trades
curl -b cookies.txt http://localhost:8000/api/trades

# Create a project
curl -b cookies.txt -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","status":"planning","estimated_budget":1000000}'

# Add a scope
curl -b cookies.txt -X POST http://localhost:8000/api/projects/1/scopes \
  -H "Content-Type: application/json" \
  -d '{"trade_id":1,"estimated_value":250000,"description":"Full electrical work"}'
```

## Files Created/Modified

- `backend/app/Http/Controllers/ProjectController.php`
- `backend/app/Http/Controllers/ProjectScopeController.php`
- `backend/app/Http/Controllers/TradeController.php`
- `backend/app/Http/Resources/ProjectResource.php`
- `backend/app/Http/Resources/ProjectScopeResource.php`
- `backend/app/Http/Resources/TradeResource.php`
- `backend/app/Http/Resources/ContractResource.php`
- `backend/app/Http/Resources/InvoiceResource.php`
- `backend/app/Http/Resources/BidResource.php`
- `backend/app/Http/Requests/StoreProjectRequest.php`
- `backend/app/Http/Requests/UpdateProjectRequest.php`
- `backend/app/Http/Requests/StoreProjectScopeRequest.php`
- `backend/routes/api.php` — New routes added

## Acceptance Criteria

1. `GET /api/projects` returns paginated list of projects for the authenticated user's company
2. `GET /api/projects?status=in_progress` filters correctly
3. `GET /api/projects?search=austin` searches by name
4. `GET /api/projects/1` returns detailed project with scopes, bids, contracts, and invoices
5. `POST /api/projects` creates a new project
6. `PUT /api/projects/1` updates a project
7. `DELETE /api/projects/1` deletes a project
8. `POST /api/projects/1/scopes` adds a scope to a project
9. `GET /api/trades` returns all 16 trades
10. All endpoints return 401 if not authenticated
11. All endpoints verify company ownership (return 403 for other companies' projects)
