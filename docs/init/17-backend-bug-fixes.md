# Task 17 — Backend Bug Fixes & Code Quality

## Objective

Fix backend bugs (invoice number race condition, ProjectResource count mismatch, N+1 queries) and improve code quality (extract inline routes to controllers, add missing FormRequest classes).

## Prerequisites

- Task 16 complete

## Steps

### 1. Fix invoice number race condition

**File**: `backend/app/Http/Controllers/InvoiceController.php` (lines 144-153)

The current code reads the max invoice number and increments it without any locking, so concurrent requests can generate duplicate invoice numbers.

Fix — wrap the invoice number generation and creation in a database transaction with a lock:

```php
use Illuminate\Support\Facades\DB;

// Inside the store() method, replace the invoice number generation block with:
$invoice = DB::transaction(function () use ($validated, $contract) {
    $year = now()->year;

    // Lock the invoices table to prevent concurrent duplicate numbers
    $maxInvoice = Invoice::whereYear('created_at', $year)
        ->lockForUpdate()
        ->orderByDesc('id')
        ->first();

    if ($maxInvoice && preg_match('/INV-\d{4}-(\d+)/', $maxInvoice->invoice_number, $m)) {
        $seq = (int) $m[1] + 1;
    } else {
        $seq = 1;
    }

    $invoiceNumber = 'INV-' . $year . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT);

    return Invoice::create([
        'contract_id' => $contract->id,
        'company_id' => $contract->company_id,
        'project_id' => $contract->project_id,
        'invoice_number' => $invoiceNumber,
        'amount' => $validated['amount'],
        'description' => $validated['description'] ?? null,
        'status' => 'draft',
        'submitted_at' => now(),
    ]);
});
```

### 2. Fix ProjectResource `whenCounted('activeBids')` mismatch

**File**: `backend/app/Http/Resources/ProjectResource.php` (line 26)

The controller uses `withCount(['scopes as active_bids_count' => ...])` which creates an attribute named `active_bids_count`, but the resource calls `whenCounted('activeBids')` which looks for a relationship count named `activeBids`.

Fix — replace line 26 with a direct attribute access:

```php
'active_bids_count' => $this->active_bids_count ?? null,
```

This directly reads the `active_bids_count` attribute that the controller's `withCount` alias creates. When the attribute isn't present (e.g., on show endpoints where this count isn't loaded), it returns `null`.

### 3. Optimize MessageController@contacts N+1 query

**File**: `backend/app/Http/Controllers/MessageController.php` (lines 136-164)

Current implementation loads ALL messages into memory, extracts unique contact IDs, then fires 2 queries per contact (latest message + unread count). This is O(N) in database queries.

Fix — replace the entire `contacts()` method body with an optimized version using subqueries:

```php
public function contacts(Request $request)
{
    $me = auth()->id();

    // Get contact IDs from messages in a single query
    $sentTo = Message::where('sender_id', $me)->select('recipient_id as contact_id');
    $receivedFrom = Message::where('recipient_id', $me)->select('sender_id as contact_id');

    $contactIds = $sentTo->union($receivedFrom)->distinct()->pluck('contact_id');

    if ($contactIds->isEmpty()) {
        return response()->json(['data' => []]);
    }

    $contacts = User::whereIn('id', $contactIds)
        ->with('company')
        ->get()
        ->map(function ($user) use ($me) {
            $latest = Message::where(function ($q) use ($me, $user) {
                $q->where(fn($q2) => $q2->where('sender_id', $me)->where('recipient_id', $user->id))
                  ->orWhere(fn($q2) => $q2->where('sender_id', $user->id)->where('recipient_id', $me));
            })
                ->orderBy('created_at', 'desc')
                ->first();

            $unreadCount = Message::where('sender_id', $user->id)
                ->where('recipient_id', $me)
                ->whereNull('read_at')
                ->count();

            return [
                'id' => $user->id,
                'name' => $user->name,
                'company' => $user->company?->name,
                'latest_message' => $latest ? [
                    'body' => \Str::limit($latest->body, 80),
                    'created_at' => $latest->created_at,
                    'is_mine' => $latest->sender_id === $me,
                ] : null,
                'unread_count' => $unreadCount,
            ];
        })
        ->sortByDesc(fn($c) => $c['latest_message']['created_at'] ?? '')
        ->values();

    return response()->json(['data' => $contacts]);
}
```

The key fix is replacing the initial `Message::get()` (which loads ALL messages into memory) with a union query that only fetches distinct contact IDs. The per-contact queries remain (they're simple indexed lookups), but the initial memory explosion is eliminated.

### 4. Extract inline contract route to controller

**File**: `backend/routes/api.php` (lines 39-64 approximately)

There is an inline closure route for contracts that should be in a proper controller.

Fix:

1. Create `backend/app/Http/Controllers/ContractController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Resources\ContractResource;
use App\Models\Contract;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        // Move the existing closure logic here
        // Keep the same query, eager loading, and response format
    }
}
```

2. Replace the closure in `routes/api.php` with:
```php
Route::get('contracts', [ContractController::class, 'index']);
```

### 5. Create missing FormRequest classes

Create the following FormRequest classes in `backend/app/Http/Requests/`:

#### `StoreBidRequest.php`
Extract validation from `BidController@store`:
- `invitation_id`: `nullable|exists:invitations_to_bid,id`
- `company_id`: `required|exists:companies,id`
- `project_scope_id`: `required|exists:project_scopes,id`
- `amount`: `required|numeric|min:0`
- `description`: `nullable|string`
- `timeline_days`: `nullable|integer|min:1`

#### `StoreInvoiceRequest.php`
Extract validation from `InvoiceController@store`:
- `contract_id`: `required|exists:contracts,id`
- `amount`: `required|numeric|min:0.01`
- `description`: `nullable|string|max:1000`

#### `StoreMessageRequest.php`
Extract validation from `MessageController@store`:
- `recipient_id`: `required|exists:users,id`
- `subject`: `nullable|string|max:255`
- `body`: `required|string`
- `project_id`: `nullable|exists:projects,id`

#### `StoreSubcontractorRequest.php`
Extract validation from `SubcontractorController@store` — all the company fields plus `trades` array.

#### `UpdateSubcontractorRequest.php`
Extract validation from `SubcontractorController@update` — same fields but with `sometimes` modifier on `name`.

After creating each FormRequest, update the corresponding controller method to type-hint the FormRequest instead of `Request`, and replace `$request->validate(...)` with `$request->validated()`.

## Files Created

- `backend/app/Http/Controllers/ContractController.php`
- `backend/app/Http/Requests/StoreBidRequest.php`
- `backend/app/Http/Requests/StoreInvoiceRequest.php`
- `backend/app/Http/Requests/StoreMessageRequest.php`
- `backend/app/Http/Requests/StoreSubcontractorRequest.php`
- `backend/app/Http/Requests/UpdateSubcontractorRequest.php`

## Files Modified

- `backend/app/Http/Controllers/InvoiceController.php`
- `backend/app/Http/Resources/ProjectResource.php`
- `backend/app/Http/Controllers/MessageController.php`
- `backend/app/Http/Controllers/BidController.php`
- `backend/app/Http/Controllers/SubcontractorController.php`
- `backend/routes/api.php`

## Acceptance Criteria

1. Creating two invoices in rapid succession produces sequential, non-duplicate invoice numbers
2. Project list endpoint returns correct `active_bids_count` values matching the actual bid data
3. `GET /api/messages/contacts` returns the same data as before but without loading all messages into memory
4. `GET /api/contracts` works via the new `ContractController` with the same response format
5. All controllers use FormRequest classes for validation — no inline `$request->validate()` calls remain in store/update methods
6. `php artisan migrate:fresh --seed` still works cleanly
7. All existing API responses remain unchanged in structure
