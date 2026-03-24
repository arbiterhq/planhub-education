# Task 09 — Bidding Backend API

## Objective

Build the Laravel API for managing Invitations to Bid (ITBs) and bids, including the business logic for sending ITBs to subcontractors, receiving bids, reviewing bids, and automatically creating contracts when a bid is accepted.

## Prerequisites

- Task 03 complete (Database with ITBs, bids, and contracts data)
- Task 04 complete (Authentication)
- Task 06 complete (Projects API and related resource classes)

## Steps

### 1. Create InvitationToBidResource

Create `backend/app/Http/Resources/InvitationToBidResource.php`:

```php
class InvitationToBidResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'project_scope_id' => $this->project_scope_id,
            'company_id' => $this->company_id,
            'status' => $this->status,
            'sent_at' => $this->sent_at,
            'responded_at' => $this->responded_at,
            'notes' => $this->notes,
            'project_scope' => new ProjectScopeResource($this->whenLoaded('projectScope')),
            'company' => new SubcontractorResource($this->whenLoaded('company')),
            'bid' => new BidResource($this->whenLoaded('bid')),
            'project' => new ProjectResource($this->whenLoaded('projectScope.project')),
            'created_at' => $this->created_at,
        ];
    }
}
```

### 2. Update BidResource if needed

Ensure `backend/app/Http/Resources/BidResource.php` includes:

```php
'project_scope' => new ProjectScopeResource($this->whenLoaded('projectScope')),
'company' => new SubcontractorResource($this->whenLoaded('company')),
'contract' => new ContractResource($this->whenLoaded('contract')),
```

### 3. Create InvitationToBidController

Create `backend/app/Http/Controllers/InvitationToBidController.php`:

#### `index` — `GET /api/invitations`

- List ITBs for projects belonging to the authenticated user's company
- Filter using `whereHas('projectScope.project', fn($q) => $q->where('company_id', $companyId))`
- Query params:
  - `project_id` — filter by project
  - `status` — filter by ITB status
- Eager load: `projectScope.project`, `projectScope.trade`, `company`, `bid`
- Paginate: 15 per page
- Order by `sent_at` descending

#### `store` — `POST /api/invitations`

- Validate:
  ```php
  'project_scope_id' => 'required|exists:project_scopes,id',
  'company_id' => 'required|exists:companies,id',
  'notes' => 'nullable|string',
  ```
- Verify the project scope belongs to a project owned by the user's company
- Verify the company is a subcontractor
- Check for duplicate: no existing ITB for same scope + company combo
- Create ITB with `status: 'sent'`, `sent_at: now()`
- Update the project scope status to 'bidding' if it was 'open'
- Return `new InvitationToBidResource($invitation)` with 201

#### `storeBulk` — `POST /api/invitations/bulk`

- Validate:
  ```php
  'project_scope_id' => 'required|exists:project_scopes,id',
  'company_ids' => 'required|array|min:1',
  'company_ids.*' => 'exists:companies,id',
  'notes' => 'nullable|string',
  ```
- Same ownership verification as single store
- Create multiple ITBs, skipping any duplicates
- Return count of created invitations and the collection

#### `update` — `PUT /api/invitations/{invitation}`

- Allow updating status and notes
- Validate status transitions

### 4. Create BidController

Create `backend/app/Http/Controllers/BidController.php`:

#### `index` — `GET /api/bids`

- List bids for project scopes belonging to the authenticated user's company projects
- Filter: `whereHas('projectScope.project', fn($q) => $q->where('company_id', $companyId))`
- Query params:
  - `project_id` — filter by project
  - `project_scope_id` — filter by scope
  - `status` — filter by bid status
  - `sort` — field to sort by (default: `submitted_at`)
  - `direction` — `asc` or `desc`
- Eager load: `company`, `projectScope.project`, `projectScope.trade`, `contract`
- Paginate: 15 per page

#### `show` — `GET /api/bids/{bid}`

- Verify the bid is for a scope on one of the user's company's projects
- Eager load: `company.trades`, `projectScope.project`, `projectScope.trade`, `invitation`, `contract`
- Also load sibling bids (other bids for the same scope) for comparison:
  ```php
  $siblingBids = Bid::where('project_scope_id', $bid->project_scope_id)
      ->where('id', '!=', $bid->id)
      ->with('company')
      ->get();
  ```
- Return bid + sibling bids in response

#### `store` — `POST /api/bids`

This simulates a subcontractor submitting a bid (for demo purposes the GC user can trigger this):

- Validate:
  ```php
  'invitation_id' => 'nullable|exists:invitations_to_bid,id',
  'company_id' => 'required|exists:companies,id',
  'project_scope_id' => 'required|exists:project_scopes,id',
  'amount' => 'required|numeric|min:0',
  'description' => 'nullable|string',
  'timeline_days' => 'nullable|integer|min:1',
  ```
- Create bid with `status: 'submitted'`, `submitted_at: now()`
- If `invitation_id` is provided, update the ITB status to `'bid_submitted'` and set `responded_at`
- Return `new BidResource($bid)` with 201

#### `review` — `PUT /api/bids/{bid}/review`

- Validate:
  ```php
  'action' => 'required|in:accept,reject',
  'notes' => 'nullable|string',
  ```
- Verify the bid belongs to a scope on the user's company's project
- Verify bid is in `submitted` or `under_review` status

**On accept:**
1. Update bid status to `'accepted'`, set `reviewed_at`
2. Reject all other bids for the same scope:
   ```php
   Bid::where('project_scope_id', $bid->project_scope_id)
       ->where('id', '!=', $bid->id)
       ->whereIn('status', ['submitted', 'under_review'])
       ->update(['status' => 'rejected', 'reviewed_at' => now()]);
   ```
3. Create a `Contract`:
   ```php
   Contract::create([
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
   ```
4. Update the project scope status to `'awarded'`

**On reject:**
1. Update bid status to `'rejected'`, set `reviewed_at`, save notes

- Return the updated bid resource with the contract (if accepted)

### 5. Register routes

In `routes/api.php` inside `auth:sanctum` group:

```php
// Invitations to Bid
Route::get('invitations', [InvitationToBidController::class, 'index']);
Route::post('invitations', [InvitationToBidController::class, 'store']);
Route::post('invitations/bulk', [InvitationToBidController::class, 'storeBulk']);
Route::put('invitations/{invitation}', [InvitationToBidController::class, 'update']);

// Bids
Route::get('bids', [BidController::class, 'index']);
Route::get('bids/{bid}', [BidController::class, 'show']);
Route::post('bids', [BidController::class, 'store']);
Route::put('bids/{bid}/review', [BidController::class, 'review']);
```

### 6. Verify the API

```bash
# List ITBs
curl -b cookies.txt http://localhost:8000/api/invitations

# Send an ITB
curl -b cookies.txt -X POST http://localhost:8000/api/invitations \
  -H "Content-Type: application/json" \
  -d '{"project_scope_id":1,"company_id":2}'

# Send bulk ITBs
curl -b cookies.txt -X POST http://localhost:8000/api/invitations/bulk \
  -H "Content-Type: application/json" \
  -d '{"project_scope_id":1,"company_ids":[3,4,5]}'

# List bids
curl -b cookies.txt http://localhost:8000/api/bids

# Get bid detail with siblings
curl -b cookies.txt http://localhost:8000/api/bids/1

# Submit a bid (simulated)
curl -b cookies.txt -X POST http://localhost:8000/api/bids \
  -H "Content-Type: application/json" \
  -d '{"company_id":2,"project_scope_id":1,"amount":450000,"timeline_days":90}'

# Accept a bid (creates contract)
curl -b cookies.txt -X PUT http://localhost:8000/api/bids/1/review \
  -H "Content-Type: application/json" \
  -d '{"action":"accept","notes":"Best value proposal"}'

# Reject a bid
curl -b cookies.txt -X PUT http://localhost:8000/api/bids/2/review \
  -H "Content-Type: application/json" \
  -d '{"action":"reject","notes":"Over budget"}'
```

## Files Created/Modified

- `backend/app/Http/Controllers/InvitationToBidController.php`
- `backend/app/Http/Controllers/BidController.php`
- `backend/app/Http/Resources/InvitationToBidResource.php`
- `backend/app/Http/Resources/BidResource.php` — Updated with additional relationships
- `backend/routes/api.php` — ITB and bid routes added

## Acceptance Criteria

1. `GET /api/invitations` returns ITBs for the user's company's projects
2. `POST /api/invitations` creates a single ITB and updates scope status
3. `POST /api/invitations/bulk` creates multiple ITBs, skipping duplicates
4. `GET /api/bids` returns bids with filtering by project/scope/status
5. `GET /api/bids/{id}` returns bid detail with sibling bids for comparison
6. `POST /api/bids` creates a bid and updates the related ITB status
7. `PUT /api/bids/{id}/review` with `action=accept`:
   - Marks bid as accepted
   - Rejects all other bids for the same scope
   - Creates a contract record
   - Updates scope status to "awarded"
8. `PUT /api/bids/{id}/review` with `action=reject` marks bid as rejected
9. Duplicate ITBs (same scope + company) are prevented
10. All endpoints verify project ownership through the company chain
