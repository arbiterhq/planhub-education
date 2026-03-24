# Task 10 — Bidding Frontend (ITBs + Review)

## Objective

Build the Angular frontend for the bidding workflow: a page to send Invitations to Bid (ITBs) using a stepper wizard, a list of sent ITBs, and a bid review page with comparison and accept/reject functionality.

## Prerequisites

- Task 05 complete (App shell and navigation)
- Task 07 complete (Project service and models)
- Task 08 complete (Subcontractor service and models)
- Task 09 complete (Bidding API endpoints)

## Steps

### 1. Create BidService and InvitationService

Create `frontend/src/app/core/services/bid.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class BidService {
  private http = inject(HttpClient);

  getBids(params?: {
    project_id?: number;
    project_scope_id?: number;
    status?: string;
    sort?: string;
    direction?: string;
    page?: number;
    per_page?: number;
  }): Observable<PaginatedResponse<Bid>> {
    return this.http.get<PaginatedResponse<Bid>>('/api/bids', { params: cleanParams(params) });
  }

  getBid(id: number): Observable<{ data: Bid; sibling_bids: Bid[] }> {
    return this.http.get<{ data: Bid; sibling_bids: Bid[] }>(`/api/bids/${id}`);
  }

  submitBid(data: {
    company_id: number;
    project_scope_id: number;
    amount: number;
    description?: string;
    timeline_days?: number;
    invitation_id?: number;
  }): Observable<{ data: Bid }> {
    return this.http.post<{ data: Bid }>('/api/bids', data);
  }

  reviewBid(id: number, action: 'accept' | 'reject', notes?: string): Observable<{ data: Bid }> {
    return this.http.put<{ data: Bid }>(`/api/bids/${id}/review`, { action, notes });
  }
}
```

Create `frontend/src/app/core/services/invitation.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class InvitationService {
  private http = inject(HttpClient);

  getInvitations(params?: {
    project_id?: number;
    status?: string;
    page?: number;
    per_page?: number;
  }): Observable<PaginatedResponse<InvitationToBid>> {
    return this.http.get<PaginatedResponse<InvitationToBid>>('/api/invitations', { params: cleanParams(params) });
  }

  sendInvitation(data: { project_scope_id: number; company_id: number; notes?: string }): Observable<any> {
    return this.http.post('/api/invitations', data);
  }

  sendBulkInvitations(data: { project_scope_id: number; company_ids: number[]; notes?: string }): Observable<any> {
    return this.http.post('/api/invitations/bulk', data);
  }
}
```

Create the `InvitationToBid` interface in `frontend/src/app/shared/models/invitation.model.ts`.

### 2. Build the "Send ITBs" page

Replace `frontend/src/app/features/bids/send-itb/send-itb.component.ts`:

Use `mat-stepper` (horizontal) with 3 steps:

#### Step 1: Select Project & Scope
- `mat-select` for project (populated from ProjectService, filtered to bidding/in_progress projects)
- On project selection, load project scopes that are in 'open' or 'bidding' status
- `mat-select` for scope (shows trade name + estimated value)
- Scope details shown below selection: trade, description, estimated value

#### Step 2: Select Subcontractors
- Display subcontractors filtered by the selected scope's trade (auto-filter via TradeService)
- Show as a `mat-selection-list` (checkboxes) with:
  - Company name
  - Location (city, state)
  - Win rate badge
  - Already-invited indicator (disabled checkbox with "Already invited" note)
- Search filter at top to narrow the list
- "Select All" / "Deselect All" buttons

#### Step 3: Review & Send
- Summary of what will be sent:
  - Project name
  - Scope: trade name, estimated value
  - Selected subcontractors count + list of names
- Optional notes textarea
- "Send Invitations" button (primary)
- On submit: call `InvitationService.sendBulkInvitations()`
- On success: show snackbar confirmation, navigate to ITB list

### 3. Build the ITB list view

The Bids page at `/bids` should have two tabs at the top or a toggle:
- **Invitations Sent** — list of ITBs
- **Bids Received** — list of bids (built in step 4)

#### Invitations Sent tab
- `mat-table` columns: Project, Scope/Trade, Subcontractor, Status (chip), Date Sent
- Status chip colors:
  - sent = blue
  - viewed = yellow/amber
  - bid_submitted = green
  - declined = red
- Filters: project select, status select
- Pagination
- "Send New ITBs" button → navigates to `/bids/invite`

### 4. Build the bid review list

#### Bids Received tab
- `mat-table` columns: Project, Scope/Trade, Subcontractor, Amount (currency), Timeline (days), Status (chip), Submitted Date, Actions
- Status chip colors:
  - submitted = blue
  - under_review = amber
  - accepted = green
  - rejected = red
- Filters: project select, status select
- Sorting: by amount (asc/desc), by date
- Pagination
- Action column: "Review" button on bids in submitted/under_review status

### 5. Build the bid review dialog

Create `frontend/src/app/features/bids/bid-review-dialog/bid-review-dialog.component.ts`:

A `mat-dialog` that opens when clicking "Review" on a bid:

#### Bid Details Section
- Subcontractor: company name, trades, location
- Bid amount (large, prominent)
- Timeline: X days
- Description/notes from the subcontractor
- Submitted date

#### Comparison Section
If there are sibling bids (other bids for the same scope):
- "Compare with other bids" heading
- Small comparison table: Subcontractor | Amount | Timeline | Status
- Highlight the current bid row
- Highlight the lowest amount in green
- Show the scope's estimated value for reference

#### Actions
- **Accept Bid** — green `mat-raised-button`
  - Opens a confirmation dialog: "Accept this bid for $X from Company Y? This will automatically reject N other bids and create a contract."
  - On confirm: call `BidService.reviewBid(id, 'accept', notes)`
  - On success: close dialog, refresh bid list, show snackbar
- **Reject Bid** — red `mat-stroked-button`
  - Opens a small dialog for rejection notes (optional)
  - On confirm: call `BidService.reviewBid(id, 'reject', notes)`
- **Mark as Under Review** — if bid is in "submitted" status, option to change to "under_review"
- **Close** — dismiss dialog without action

### 6. Build "Simulate Bid" dialog (for demo)

Create `frontend/src/app/features/bids/simulate-bid-dialog/simulate-bid-dialog.component.ts`:

Since this is a demo app viewed from the GC perspective, provide a way to simulate a subcontractor submitting a bid:

- `mat-dialog` with form:
  - Project scope select (pre-filled if opened from project detail)
  - Subcontractor select (filtered by scope's trade)
  - Amount (number input)
  - Timeline days (number input)
  - Description (textarea)
- Submit calls `BidService.submitBid()`
- Accessible from a "Simulate Bid Submission" button on the Bids page (styled differently to indicate it's a demo action — e.g., outlined button with a "demo" badge)

### 7. Update routes

Ensure `app.routes.ts` has:
```typescript
{ path: 'bids', loadComponent: () => import('./features/bids/bid-list/bid-list.component').then(m => m.BidListComponent) },
{ path: 'bids/invite', loadComponent: () => import('./features/bids/send-itb/send-itb.component').then(m => m.SendItbComponent) },
```

### 8. Verify

1. Navigate to `/bids` — see two tabs: Invitations Sent, Bids Received
2. Invitations tab shows seeded ITBs with correct statuses
3. Click "Send New ITBs" → stepper workflow opens
4. Step 1: Select a project and scope
5. Step 2: See subcontractors filtered by trade, select several
6. Step 3: Review and send — ITBs appear in the list
7. Bids tab shows seeded bids
8. Click "Review" on a bid — see detail with comparison
9. Accept a bid — confirm dialog, contract created, other bids rejected
10. Reject a bid — notes saved
11. "Simulate Bid" creates a new bid visible in the list
12. Filters and pagination work

## Files Created/Modified

- `frontend/src/app/shared/models/invitation.model.ts`
- `frontend/src/app/core/services/bid.service.ts`
- `frontend/src/app/core/services/invitation.service.ts`
- `frontend/src/app/features/bids/bid-list/bid-list.component.ts` — Full rewrite (tabbed ITB + bid list)
- `frontend/src/app/features/bids/send-itb/send-itb.component.ts` — Full rewrite (stepper)
- `frontend/src/app/features/bids/bid-review-dialog/bid-review-dialog.component.ts` — New
- `frontend/src/app/features/bids/simulate-bid-dialog/simulate-bid-dialog.component.ts` — New

## Acceptance Criteria

1. ITB stepper sends invitations to multiple subcontractors for a scope
2. ITB list shows all invitations with filterable status chips
3. Bid list shows all bids with correct amounts and statuses
4. Bid review dialog displays bid details and comparison with siblings
5. Accepting a bid creates a contract and rejects sibling bids
6. Rejecting a bid allows notes entry
7. "Simulate Bid" demo feature works end-to-end
8. Filters by project and status work on both tabs
9. All bid amounts are formatted as currency
10. Lowest bid is highlighted in the comparison table
