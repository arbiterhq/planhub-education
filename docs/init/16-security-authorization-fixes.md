# Task 16 — Security & Authorization Fixes

## Objective

Fix critical security vulnerabilities and authorization gaps identified during code review. These are the highest-priority issues: SQL injection risks, missing ownership checks, and a missing API action.

## Prerequisites

- Tasks 01-15 complete

## Steps

### 1. Fix SQL injection in sort fields

**Files**: `backend/app/Http/Controllers/BidController.php`, `backend/app/Http/Controllers/InvoiceController.php`

Both controllers pass user-supplied sort field names directly to Eloquent's `orderBy()` without validation, allowing SQL injection.

#### BidController (lines 38-40)

Current (vulnerable):
```php
$sortField = $request->input('sort', 'submitted_at');
$direction = $request->input('direction', 'desc');
$query->orderBy($sortField, $direction);
```

Fix — add an allow-list before `orderBy()`, matching the pattern used in `ProjectController`:
```php
$allowedSorts = ['submitted_at', 'amount', 'created_at', 'status', 'timeline_days'];
$sortField = in_array($request->input('sort'), $allowedSorts)
    ? $request->input('sort')
    : 'submitted_at';
$direction = $request->input('direction') === 'asc' ? 'asc' : 'desc';
$query->orderBy($sortField, $direction);
```

#### InvoiceController (lines 92-94)

Same pattern. Apply allow-list:
```php
$allowedSorts = ['created_at', 'amount', 'status', 'invoice_number', 'submitted_at'];
$sortField = in_array($request->input('sort'), $allowedSorts)
    ? $request->input('sort')
    : 'created_at';
$direction = $request->input('direction') === 'asc' ? 'asc' : 'desc';
$query->orderBy($sortField, $direction);
```

### 2. Add authorization to BidController@store

**File**: `backend/app/Http/Controllers/BidController.php` (line 69)

Currently any authenticated user can create a bid for any `company_id` and `project_scope_id` with no ownership verification.

Fix — after validation, verify that the `project_scope_id` belongs to a project owned by the authenticated user's company (i.e., the GC is simulating a bid submission). Add after the `$validated = $request->validate(...)` block:

```php
// Verify the scope belongs to a project owned by the user's company (GC simulating a bid)
$scope = \App\Models\ProjectScope::findOrFail($validated['project_scope_id']);
abort_unless(
    $scope->project->company_id === $request->user()->company_id,
    403,
    'You can only simulate bids on your own projects.'
);
```

### 3. Add authorization to SubcontractorController store/update

**File**: `backend/app/Http/Controllers/SubcontractorController.php`

The `store()` and `update()` methods have no authorization check — any authenticated user can create or modify subcontractor records.

Fix — add a company type check at the top of both `store()` and `update()`:

```php
abort_unless(
    $request->user()->company->type === 'general_contractor',
    403,
    'Only general contractors can manage subcontractors.'
);
```

### 4. Add `under_review` action to BidController@review

**File**: `backend/app/Http/Controllers/BidController.php` (line 120)

The `review()` method only accepts `accept` and `reject` actions, but `under_review` is a valid status in the database enum (`submitted`, `under_review`, `accepted`, `rejected`). The frontend has a "Mark as Under Review" button that currently calls `reject` as a workaround — a destructive bug.

Fix — update the validation and add handling for `under_review`:

Change the validation rule:
```php
'action' => 'required|in:accept,reject,under_review',
```

Add a new branch before the existing `if ($validated['action'] === 'accept')` block:

```php
if ($validated['action'] === 'under_review') {
    $bid->update([
        'status' => 'under_review',
        'notes' => $validated['notes'] ?? $bid->notes,
    ]);

    $bid->load(['company', 'projectScope.project', 'projectScope.trade', 'contract']);

    ActivityLogger::log(
        'bid_reviewed',
        "{$bid->company->name}'s bid for {$bid->projectScope->trade->name} on {$bid->projectScope->project->name} marked as under review",
        $bid->projectScope->project_id
    );

    return new BidResource($bid);
}
```

## Files Modified

- `backend/app/Http/Controllers/BidController.php`
- `backend/app/Http/Controllers/InvoiceController.php`
- `backend/app/Http/Controllers/SubcontractorController.php`

## Acceptance Criteria

1. `GET /api/bids?sort=DROP TABLE bids` does NOT cause an error or execute SQL — it falls back to the default sort field
2. `GET /api/invoices?sort=1;DROP TABLE invoices` same — falls back to default
3. `POST /api/bids` with a `project_scope_id` belonging to a different company returns 403
4. `POST /api/subcontractors` from a non-GC user returns 403
5. `POST /api/bids/{id}/review` with `action: under_review` correctly sets bid status to `under_review` without rejecting it
6. Bid can still be accepted or rejected after being marked `under_review`
7. Activity log entry is created when a bid is marked as under review
