# Task 18 — Frontend Bug Fixes & Code Quality

## Objective

Fix frontend bugs (bid review dialog, missing types, broken reactivity) and clean up code quality issues (CSS duplication, inconsistent service usage, duplicate components, missing computed signals).

## Prerequisites

- Task 17 complete (Task 16's `under_review` API action is needed for step 1)

## Steps

### 1. Fix `markUnderReview()` — currently rejects the bid

**File**: `frontend/src/app/features/bids/bid-review-dialog/bid-review-dialog.component.ts` (line 354)

The `markUnderReview()` method calls `this.bidService.reviewBid(bid.id, 'reject')` which permanently rejects the bid while showing a success message saying "marked as under review." This is a destructive bug.

Fix — Task 16 adds `under_review` as a valid action on the backend. Update the frontend:

1. In `bid.service.ts`, verify the `reviewBid` method signature accepts any action string (it should already accept `'accept' | 'reject'` — expand to include `'under_review'`).

2. In `bid-review-dialog.component.ts` line 354, change:
```typescript
this.bidService.reviewBid(bid.id, 'reject').subscribe({
```
to:
```typescript
this.bidService.reviewBid(bid.id, 'under_review').subscribe({
```

3. Remove the misleading comment on line 355 about the workaround.

### 2. Add `project_scope` to Bid interface and remove `any` casts

**File**: `frontend/src/app/shared/models/bid.model.ts`

The `Bid` interface is missing the `project_scope` property that the API returns. This forces `any` casts in multiple files.

Fix — add to the `Bid` interface:
```typescript
project_scope?: {
  id: number;
  project_id: number;
  trade_id: number;
  trade?: { id: number; name: string };
  project?: { id: number; name: string };
  estimated_value?: number;
  status?: string;
};
```

Then remove all `(bid as any).project_scope` casts in:
- `frontend/src/app/features/bids/bid-list/bid-list.component.ts` (lines 502-515) — update `getBidProjectId()`, `getBidProjectName()`, `getBidTradeName()` to use `bid.project_scope?.project?.id` etc.
- `frontend/src/app/features/bids/bid-review-dialog/bid-review-dialog.component.ts` (line 337) — remove `(res.data as any)` cast
- Any other `(bid as any)` or `(res.data as any)` casts related to `project_scope`

### 3. Fix `project-detail` route snapshot → subscribe to paramMap

**File**: `frontend/src/app/features/projects/project-detail/project-detail.component.ts` (line 513)

Uses `this.route.snapshot.paramMap.get('id')` which won't update if navigating between projects within the same component instance.

Fix — subscribe to `this.route.paramMap` in `ngOnInit`:
```typescript
this.route.paramMap.pipe(
  takeUntil(this.destroy$)
).subscribe(params => {
  const id = params.get('id');
  if (id) {
    this.loadProject(+id);
  }
});
```

Remove the snapshot-based call.

### 4. Fix `filteredContacts` computed signal reactivity

**File**: `frontend/src/app/features/messages/message-list/message-list.component.ts` (lines 497-503)

The `filteredContacts` computed signal reads `this.searchControl.value`, but `FormControl` values are not signals — the computed won't re-evaluate when the search input changes.

Fix — create a signal from the FormControl's valueChanges:

```typescript
// Add a signal for the search term
private searchTerm = signal('');

// In ngOnInit or constructor, sync the FormControl to the signal:
this.searchControl.valueChanges.pipe(
  takeUntil(this.destroy$)
).subscribe(value => this.searchTerm.set(value || ''));

// Update the computed to read the signal instead:
filteredContacts = computed(() => {
  const search = this.searchTerm().toLowerCase();
  const all = this.contacts();
  if (!search) return all;
  return all.filter(c =>
    c.name.toLowerCase().includes(search) ||
    (c.company && c.company.toLowerCase().includes(search))
  );
});
```

### 5. Extract `::ng-deep` status chip CSS to global styles

**Files affected**: Multiple component `.ts` files with inline styles

The same `::ng-deep .mat-mdc-chip` status color CSS is duplicated across at least 5 components:
- `project-list.component.ts`
- `project-detail.component.ts`
- `subcontractor-detail.component.ts`
- `bid-list.component.ts`
- `invoice-list.component.ts`

Fix:

1. Add the shared status chip styles to `frontend/src/styles.scss`:
```scss
// Status chip colors — shared across all components
.status-chip {
  &.planning .mdc-evolution-chip__cell { background-color: #9e9e9e; color: white; }
  &.bidding .mdc-evolution-chip__cell { background-color: #1976d2; color: white; }
  &.in_progress .mdc-evolution-chip__cell, &.in-progress .mdc-evolution-chip__cell { background-color: #388e3c; color: white; }
  &.completed .mdc-evolution-chip__cell { background-color: #00897b; color: white; }
  &.on_hold .mdc-evolution-chip__cell, &.on-hold .mdc-evolution-chip__cell { background-color: #f57c00; color: white; }
  &.submitted .mdc-evolution-chip__cell { background-color: #1976d2; color: white; }
  &.under_review .mdc-evolution-chip__cell { background-color: #f57c00; color: white; }
  &.accepted .mdc-evolution-chip__cell { background-color: #388e3c; color: white; }
  &.rejected .mdc-evolution-chip__cell { background-color: #d32f2f; color: white; }
  &.draft .mdc-evolution-chip__cell { background-color: #9e9e9e; color: white; }
  &.pending .mdc-evolution-chip__cell, &.pending_review .mdc-evolution-chip__cell { background-color: #f57c00; color: white; }
  &.approved .mdc-evolution-chip__cell { background-color: #1976d2; color: white; }
  &.paid .mdc-evolution-chip__cell { background-color: #388e3c; color: white; }
  &.overdue .mdc-evolution-chip__cell { background-color: #d32f2f; color: white; }
  &.active .mdc-evolution-chip__cell { background-color: #388e3c; color: white; }
  &.sent .mdc-evolution-chip__cell { background-color: #1976d2; color: white; }
  &.viewed .mdc-evolution-chip__cell { background-color: #7b1fa2; color: white; }
  &.bid_submitted .mdc-evolution-chip__cell { background-color: #00897b; color: white; }
  &.declined .mdc-evolution-chip__cell { background-color: #d32f2f; color: white; }
  &.awarded .mdc-evolution-chip__cell { background-color: #388e3c; color: white; }
}
```

2. Remove the `::ng-deep` status chip styles from each component's inline `styles` array.

3. Add the `status-chip` CSS class plus the status value class to each `<mat-chip>` element in the templates (if not already using this pattern). For example:
```html
<mat-chip class="status-chip" [ngClass]="project.status">{{ project.status }}</mat-chip>
```

### 6. Standardize on NotificationService

**Files**:
- `frontend/src/app/features/bids/bid-review-dialog/bid-review-dialog.component.ts`
- `frontend/src/app/features/bids/send-itb/send-itb.component.ts`
- `frontend/src/app/features/invoices/invoice-list/invoice-list.component.ts`
- `frontend/src/app/features/invoices/create-invoice-dialog/create-invoice-dialog.component.ts`

These components inject `MatSnackBar` directly instead of using `NotificationService`.

Fix — in each file:
1. Replace `private snackBar = inject(MatSnackBar)` with `private notification = inject(NotificationService)`
2. Replace `this.snackBar.open('message', 'Dismiss', { duration: 3000 })` with `this.notification.success('message')` or `this.notification.error('message')` as appropriate
3. Remove `MatSnackBar` import if no longer used

### 7. Remove duplicate confirm dialog components

**Files**:
- `frontend/src/app/features/invoices/invoice-list/invoice-list.component.ts` (lines 33-74)
- `frontend/src/app/features/invoices/invoice-detail-dialog/invoice-detail-dialog.component.ts` (lines 23-64)

Both files define inline confirm/reject dialog components that are near-identical to the shared `ConfirmDialogComponent` in `shared/components/`.

Fix:
1. Remove the inline `ConfirmActionDialogComponent` and `RejectInvoiceInlineDialogComponent` from `invoice-list.component.ts`
2. Remove the inline `InvoiceConfirmDialogComponent` and `InvoiceRejectDialogComponent` from `invoice-detail-dialog.component.ts`
3. Update dialog open calls to use the shared `ConfirmDialogComponent` instead, passing `title`, `message`, `confirmText`, and `confirmColor` via dialog data
4. For the reject dialog (which has a notes textarea), either extend the shared dialog to support an optional notes field or create a single shared `RejectDialogComponent` in `shared/components/`

### 8. Convert methods to computed signals in subcontractor-detail

**File**: `frontend/src/app/features/subcontractors/subcontractor-detail/subcontractor-detail.component.ts` (lines 424-435)

`sortedBids()` and `activeContracts()` are regular methods called from the template — they create new arrays on every change detection cycle.

Fix — convert to computed signals:
```typescript
sortedBids = computed(() => {
  const sub = this.subcontractor();
  if (!sub?.bids) return [];
  return [...sub.bids].sort((a, b) =>
    new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );
});

activeContracts = computed(() => {
  const sub = this.subcontractor();
  if (!sub?.contracts) return [];
  return sub.contracts.filter(c => c.status === 'active');
});
```

Update template references from `sortedBids()` to `sortedBids()` (already function-call syntax, which works for both methods and computed signals — no template changes needed).

### 9. Create DashboardService

**File to create**: `frontend/src/app/core/services/dashboard.service.ts`

**File to modify**: `frontend/src/app/features/dashboard/dashboard.component.ts` (line 383)

The dashboard component directly injects `HttpClient` instead of using a service like every other feature.

Fix:

1. Create `dashboard.service.ts`:
```typescript
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>('/api/dashboard');
  }
}
```

2. Move the `DashboardData` interface (and its sub-interfaces) from the component file to either the service file or a new `dashboard.model.ts` in `shared/models/`.

3. Update the component to inject `DashboardService` instead of `HttpClient`.

## Files Created

- `frontend/src/app/core/services/dashboard.service.ts`

## Files Modified

- `frontend/src/app/features/bids/bid-review-dialog/bid-review-dialog.component.ts`
- `frontend/src/app/shared/models/bid.model.ts`
- `frontend/src/app/features/bids/bid-list/bid-list.component.ts`
- `frontend/src/app/features/projects/project-detail/project-detail.component.ts`
- `frontend/src/app/features/messages/message-list/message-list.component.ts`
- `frontend/src/styles.scss`
- `frontend/src/app/features/projects/project-list/project-list.component.ts`
- `frontend/src/app/features/subcontractors/subcontractor-detail/subcontractor-detail.component.ts`
- `frontend/src/app/features/invoices/invoice-list/invoice-list.component.ts`
- `frontend/src/app/features/invoices/invoice-detail-dialog/invoice-detail-dialog.component.ts`
- `frontend/src/app/features/invoices/create-invoice-dialog/create-invoice-dialog.component.ts`
- `frontend/src/app/features/bids/send-itb/send-itb.component.ts`
- `frontend/src/app/features/dashboard/dashboard.component.ts`
- `frontend/src/app/core/services/bid.service.ts` (if action type needs updating)

## Acceptance Criteria

1. Clicking "Mark as Under Review" on a bid sets its status to `under_review` (not `rejected`)
2. No `any` casts remain related to `project_scope` in the bids feature
3. Navigating from `/projects/1` to `/projects/2` correctly loads the second project's data
4. Typing in the messages search box immediately filters the contact list
5. No `::ng-deep` status chip styles remain in individual component files
6. No direct `MatSnackBar` injection remains — all components use `NotificationService`
7. No duplicate confirm dialog components remain in the invoices feature
8. `sortedBids()` and `activeContracts()` in subcontractor-detail are `computed()` signals
9. Dashboard component uses `DashboardService` instead of direct `HttpClient`
10. The app compiles without errors: `cd frontend && npx ng build`
11. All existing functionality still works — test by navigating through the app
