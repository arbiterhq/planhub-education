# Task 11 — Invoices (Full Stack)

## Objective

Build the complete invoicing feature: Laravel API with approval workflow (submit → review → approve → pay), and Angular UI with summary cards, invoice list, detail dialog, and create/approve/pay actions.

## Prerequisites

- Task 03 complete (Database with invoice data)
- Task 04 complete (Authentication)
- Task 05 complete (App shell and navigation)
- Task 06 complete (API resource classes)
- Task 09 complete (Contracts exist from bid acceptance)

## Steps

### Backend

#### 1. Create InvoiceController

Create `backend/app/Http/Controllers/InvoiceController.php`:

##### `index` — `GET /api/invoices`

- List invoices for projects belonging to the user's company
- Filter: `whereHas('project', fn($q) => $q->where('company_id', $companyId))`
- Query params:
  - `status` — filter by invoice status
  - `project_id` — filter by project
  - `company_id` — filter by subcontractor company
  - `date_from`, `date_to` — filter by submitted_at date range
  - `sort` — field (default: `created_at`)
  - `direction` — asc/desc
- Eager load: `company`, `project`, `contract.trade`
- Paginate: 15 per page
- Return `InvoiceResource::collection($invoices)`

##### `show` — `GET /api/invoices/{invoice}`

- Verify project ownership
- Eager load: `company`, `project`, `contract.trade`, `contract.bid`
- Return `new InvoiceResource($invoice)`

##### `store` — `POST /api/invoices`

Simulates a subcontractor submitting an invoice (demo action):

- Validate:
  ```php
  'contract_id' => 'required|exists:contracts,id',
  'amount' => 'required|numeric|min:0.01',
  'description' => 'required|string',
  'due_date' => 'required|date|after:today',
  ```
- Verify the contract belongs to a project owned by the user's company
- Validate invoice amount:
  - Get total already invoiced for this contract: `Invoice::where('contract_id', $contractId)->whereNotIn('status', ['rejected'])->sum('amount')`
  - Ensure new amount + already invoiced ≤ contract amount
- Auto-generate invoice number: `INV-{YEAR}-{SEQUENTIAL_PADDED}` (e.g., INV-2026-0023)
  - Get the max existing invoice number and increment
- Create invoice with:
  - `company_id` from the contract's company
  - `project_id` from the contract's project
  - `status: 'submitted'`
  - `submitted_at: now()`
- Return `new InvoiceResource($invoice)` with 201

##### `review` — `PUT /api/invoices/{invoice}/review`

- Validate:
  ```php
  'action' => 'required|in:approve,reject',
  'notes' => 'nullable|string',
  ```
- Verify project ownership
- Validate status transitions:
  - Can only approve from `submitted` or `under_review`
  - Can only reject from `submitted` or `under_review`

**On approve:**
- Update status to `'approved'`, set `approved_at`, save notes
- Return updated invoice

**On reject:**
- Update status to `'rejected'`, save notes
- Return updated invoice

##### `pay` — `PUT /api/invoices/{invoice}/pay`

- Verify project ownership
- Validate: invoice must be in `'approved'` status
- Update status to `'paid'`, set `paid_at: now()`
- Return updated invoice

##### `summary` — `GET /api/invoices/summary`

Returns aggregate stats:

```json
{
  "total_outstanding": 1850000,
  "pending_review": 5,
  "approved_unpaid": 3,
  "paid_this_month": 520000,
  "paid_all_time": 3200000,
  "total_invoiced": 5050000,
  "by_status": {
    "draft": 2,
    "submitted": 4,
    "under_review": 3,
    "approved": 3,
    "paid": 8,
    "rejected": 2
  }
}
```

#### 2. Register routes

In `routes/api.php` inside `auth:sanctum` group:

```php
Route::get('invoices/summary', [InvoiceController::class, 'summary']);
Route::get('invoices', [InvoiceController::class, 'index']);
Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
Route::post('invoices', [InvoiceController::class, 'store']);
Route::put('invoices/{invoice}/review', [InvoiceController::class, 'review']);
Route::put('invoices/{invoice}/pay', [InvoiceController::class, 'pay']);
```

**Important:** The `summary` route must come before the `{invoice}` wildcard route.

### Frontend

#### 3. Create InvoiceService

Create `frontend/src/app/core/services/invoice.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);

  getInvoices(params?: { ... }): Observable<PaginatedResponse<Invoice>> { ... }
  getInvoice(id: number): Observable<{ data: Invoice }> { ... }
  getSummary(): Observable<InvoiceSummary> { ... }
  createInvoice(data: { contract_id: number; amount: number; description: string; due_date: string }): Observable<{ data: Invoice }> { ... }
  reviewInvoice(id: number, action: 'approve' | 'reject', notes?: string): Observable<{ data: Invoice }> { ... }
  payInvoice(id: number): Observable<{ data: Invoice }> { ... }
}
```

#### 4. Build the invoice list page

Replace `frontend/src/app/features/invoices/invoice-list/invoice-list.component.ts`:

##### Summary Cards Row (4 cards)
Row of `mat-card` elements at the top (similar to dashboard KPIs):
1. **Total Outstanding** — sum of submitted + under_review + approved invoices
2. **Pending Review** — count of submitted + under_review
3. **Approved (Unpaid)** — count of approved invoices
4. **Paid This Month** — dollar amount

##### Filter Bar
- Status select (`mat-select`: All, Submitted, Under Review, Approved, Paid, Rejected)
- Project select (populated from projects)
- Subcontractor select (populated from subs with invoices)
- Date range picker (`mat-date-range-input` or two `mat-datepicker` fields)
- "Create Invoice" button (demo action, styled as outlined)

##### Invoice Table
`mat-table` with columns:
- **Invoice #** — e.g., "INV-2026-0023"
- **Project** — project name
- **Subcontractor** — company name
- **Amount** — formatted currency
- **Status** — `mat-chip` with colors:
  - draft = gray
  - submitted = blue
  - under_review = amber
  - approved = green
  - paid = teal
  - rejected = red
- **Due Date** — formatted date, red if overdue and not paid
- **Submitted** — formatted date
- **Actions** — contextual buttons based on status:
  - submitted → "Review" button
  - under_review → "Approve" / "Reject" buttons
  - approved → "Mark Paid" button
  - paid/rejected → no actions (view only)

Sorting by amount, due date, submitted date. Pagination with `mat-paginator`.

#### 5. Build the invoice detail dialog

Create `frontend/src/app/features/invoices/invoice-detail-dialog/invoice-detail-dialog.component.ts`:

A `mat-dialog` showing full invoice details:

- **Header**: Invoice number, status chip
- **From**: Subcontractor company name, address, contact
- **To**: Apex Construction Group (the GC)
- **Details**:
  - Project: name (clickable link)
  - Contract: trade name, contract amount
  - Invoice amount (large)
  - Description
  - Due date
  - Submitted date, approved date, paid date (as applicable)
- **Status Timeline**: Visual steps showing the invoice progression:
  - Submitted → Under Review → Approved → Paid
  - Show completed steps in green, current step highlighted, future steps gray
- **Contract Context**:
  - Total contract amount
  - Total invoiced to date
  - Remaining balance
  - Progress bar showing invoiced % of contract
- **Notes**: Any reviewer notes
- **Actions**: Same as table row actions (Approve, Reject, Mark Paid — based on current status)

#### 6. Build the "Create Invoice" dialog (demo)

Create `frontend/src/app/features/invoices/create-invoice-dialog/create-invoice-dialog.component.ts`:

A `mat-dialog` for simulating invoice submission:

- **Contract select**: dropdown of active contracts, showing project + trade + amount for each
  - On selection, show: contract amount, already invoiced amount, remaining balance
- **Amount**: number input, validated against remaining contract balance
- **Description**: textarea (required)
- **Due Date**: `mat-datepicker` (must be future date)
- Submit button → calls `InvoiceService.createInvoice()`
- On success: close dialog, refresh list, show snackbar

#### 7. Wire up actions

When the user clicks action buttons (Approve, Reject, Mark Paid):

- **Approve**: Confirmation dialog → `InvoiceService.reviewInvoice(id, 'approve')` → refresh → snackbar
- **Reject**: Small dialog with notes textarea → `InvoiceService.reviewInvoice(id, 'reject', notes)` → refresh → snackbar
- **Mark Paid**: Confirmation dialog → `InvoiceService.payInvoice(id)` → refresh → snackbar

### 8. Verify

1. Navigate to `/invoices` — see summary cards with correct totals
2. Invoice table shows all seeded invoices
3. Filter by status, project, subcontractor — all work
4. Click an invoice row — detail dialog opens with full info
5. Status timeline shows correct progression
6. Contract context shows progress bar
7. Approve a submitted invoice — status updates to "approved"
8. Reject an invoice — notes are saved, status updates
9. Mark an approved invoice as paid — status updates, paid_at set
10. "Create Invoice" dialog validates against contract balance
11. Creating an invoice generates correct invoice number
12. Overdue unpaid invoices show due date in red

## Files Created/Modified

### Backend
- `backend/app/Http/Controllers/InvoiceController.php`
- `backend/routes/api.php` — Invoice routes added

### Frontend
- `frontend/src/app/core/services/invoice.service.ts`
- `frontend/src/app/shared/models/invoice.model.ts` — Updated with full interface
- `frontend/src/app/features/invoices/invoice-list/invoice-list.component.ts` — Full rewrite
- `frontend/src/app/features/invoices/invoice-detail-dialog/invoice-detail-dialog.component.ts` — New
- `frontend/src/app/features/invoices/create-invoice-dialog/create-invoice-dialog.component.ts` — New

## Acceptance Criteria

1. `GET /api/invoices/summary` returns correct aggregate statistics
2. `GET /api/invoices` returns filtered, paginated invoices
3. `POST /api/invoices` creates invoice with auto-generated number, validates against contract balance
4. `PUT /api/invoices/{id}/review` approves or rejects with notes
5. `PUT /api/invoices/{id}/pay` marks approved invoice as paid
6. Frontend summary cards display correct totals
7. Invoice table shows all data with correct status chips
8. All filters work (status, project, subcontractor, date range)
9. Invoice detail dialog shows status timeline and contract progress
10. All actions (approve, reject, pay, create) work end-to-end
11. Invoice numbers are sequential and formatted correctly
