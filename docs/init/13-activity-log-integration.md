# Task 13 — Activity Log & Cross-Feature Integration

## Objective

Add activity logging throughout the application so that user actions are tracked and displayed on the dashboard, and wire up cross-feature navigation (clicking a project name in the invoices page navigates to the project detail, clicking a subcontractor name goes to their profile, etc.) with breadcrumbs on detail pages.

## Prerequisites

- Tasks 05-12 complete (all features built)

## Steps

### Backend

#### 1. Create an ActivityLogger service

Create `backend/app/Services/ActivityLogger.php`:

```php
class ActivityLogger
{
    public static function log(
        string $action,
        string $description,
        ?int $projectId = null,
        ?array $metadata = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => auth()->id(),
            'company_id' => auth()->user()?->company_id,
            'project_id' => $projectId,
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata,
        ]);
    }
}
```

#### 2. Add logging calls to existing controllers

Update each controller to log significant actions. Add calls after the successful completion of each action:

**ProjectController:**
- `store`: `ActivityLogger::log('project_created', "Created project \"{$project->name}\"", $project->id)`
- `update`: `ActivityLogger::log('project_updated', "Updated project \"{$project->name}\"", $project->id, ['changes' => $changes])`

**InvitationToBidController:**
- `store`: `ActivityLogger::log('itb_sent', "Sent invitation to bid to {$company->name} for {$scope->trade->name} on {$project->name}", $projectId)`
- `storeBulk`: `ActivityLogger::log('itb_bulk_sent', "Sent {$count} invitations to bid for {$scope->trade->name} on {$project->name}", $projectId)`

**BidController:**
- `store`: `ActivityLogger::log('bid_submitted', "{$company->name} submitted a bid of \${$amount} for {$trade->name} on {$project->name}", $projectId)`
- `review` (accept): `ActivityLogger::log('bid_accepted', "Accepted bid from {$company->name} for {$trade->name} on {$project->name} — contract created", $projectId, ['bid_id' => $bid->id, 'contract_id' => $contract->id])`
- `review` (reject): `ActivityLogger::log('bid_rejected', "Rejected bid from {$company->name} for {$trade->name} on {$project->name}", $projectId)`

**InvoiceController:**
- `store`: `ActivityLogger::log('invoice_submitted', "Invoice {$invoice->invoice_number} submitted by {$company->name} for \${$amount}", $projectId)`
- `review` (approve): `ActivityLogger::log('invoice_approved', "Approved invoice {$invoice->invoice_number} for \${$amount}", $projectId)`
- `review` (reject): `ActivityLogger::log('invoice_rejected', "Rejected invoice {$invoice->invoice_number}", $projectId)`
- `pay`: `ActivityLogger::log('invoice_paid', "Marked invoice {$invoice->invoice_number} as paid (\${$amount})", $projectId)`

**MessageController:**
- `store`: `ActivityLogger::log('message_sent', "Sent message to {$recipient->name}: \"{$subject}\"", $projectId)`

#### 3. Create ActivityLog API endpoint

Create `backend/app/Http/Controllers/ActivityLogController.php`:

##### `index` — `GET /api/activities`

- Filter by company: `where('company_id', auth()->user()->company_id)`
- Query params:
  - `project_id` — filter by project
  - `action` — filter by action type
  - `date_from`, `date_to` — filter by date range
- Eager load: `user`, `project`
- Order by `created_at` descending
- Paginate: 20 per page
- Return with: id, action, description, metadata, user (name), project (id, name), created_at

Register route in `routes/api.php`:
```php
Route::get('activities', [ActivityLogController::class, 'index']);
```

#### 4. Update the Dashboard endpoint

Update `DashboardController` to pull recent activity from the `activity_logs` table (if it was previously hardcoded or pulling from seed data, now make it dynamic):

```php
'recent_activity' => ActivityLog::where('company_id', $companyId)
    ->with('user', 'project')
    ->latest()
    ->take(10)
    ->get()
    ->map(fn($log) => [
        'id' => $log->id,
        'action' => $log->action,
        'description' => $log->description,
        'created_at' => $log->created_at,
        'user' => $log->user?->name,
        'project' => $log->project ? ['id' => $log->project->id, 'name' => $log->project->name] : null,
    ]),
```

### Frontend

#### 5. Add cross-feature navigation links

Go through each feature component and ensure clickable links exist where entity names are displayed:

**Project Detail Page (Task 07):**
- In Contracts tab: subcontractor name → `routerLink="/subcontractors/{{contract.company_id}}"`
- In Invoices tab: subcontractor name → link to sub detail
- In Bids tab: subcontractor name → link to sub detail

**Subcontractor Detail Page (Task 08):**
- In Bid History tab: project name → `routerLink="/projects/{{bid.project_scope.project.id}}"`
- In Contracts tab: project name → link to project detail

**Bid List Page (Task 10):**
- Project name in table → link to project detail
- Subcontractor name → link to sub detail

**Invoice List Page (Task 11):**
- Project name → link to project detail
- Subcontractor name → link to sub detail

**Messages Page (Task 12):**
- Project reference in messages → link to project detail

**Dashboard (Task 05):**
- Activity items with project references → link to project detail
- Upcoming deadlines → link to project detail

All links should use `routerLink` directives and be styled as clickable text (primary color, underline on hover) — not buttons.

#### 6. Add breadcrumbs

Create `frontend/src/app/shared/components/breadcrumb/breadcrumb.component.ts`:

A simple breadcrumb component that accepts an array of `{ label: string, link?: string }` items:

```typescript
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="breadcrumb">
      @for (item of items; track item.label; let last = $last) {
        @if (!last && item.link) {
          <a [routerLink]="item.link">{{ item.label }}</a>
          <mat-icon class="separator">chevron_right</mat-icon>
        } @else {
          <span class="current">{{ item.label }}</span>
        }
      }
    </nav>
  `,
})
export class BreadcrumbComponent {
  @Input() items: { label: string; link?: string }[] = [];
}
```

Add breadcrumbs to detail pages:
- Project detail: `Projects > Downtown Austin Office Tower`
- Subcontractor detail: `Subcontractors > Lone Star Electrical Services`
- Send ITBs: `Bids > Send Invitations`

#### 7. Update dashboard activity to use action-specific icons

Map activity actions to Material icons in the dashboard recent activity list:

```typescript
const actionIcons: Record<string, string> = {
  project_created: 'add_business',
  project_updated: 'edit',
  itb_sent: 'send',
  itb_bulk_sent: 'send',
  bid_submitted: 'gavel',
  bid_accepted: 'check_circle',
  bid_rejected: 'cancel',
  invoice_submitted: 'receipt_long',
  invoice_approved: 'thumb_up',
  invoice_rejected: 'thumb_down',
  invoice_paid: 'paid',
  message_sent: 'mail',
};
```

Each activity item in the list shows the appropriate icon with color coding.

### 8. Verify

1. Perform an action (e.g., accept a bid) → see it appear in the dashboard activity
2. Navigate to `/activities` or check the dashboard — activity log shows recent entries
3. Click a project name in the invoices table → navigates to project detail
4. Click a sub name in project contracts tab → navigates to sub detail
5. Breadcrumbs appear on detail pages and navigate correctly
6. Dashboard activity items have appropriate icons
7. Dashboard activity items with project references are clickable

## Files Created/Modified

### Backend
- `backend/app/Services/ActivityLogger.php` — New service
- `backend/app/Http/Controllers/ActivityLogController.php` — New controller
- `backend/app/Http/Controllers/ProjectController.php` — Updated with logging
- `backend/app/Http/Controllers/InvitationToBidController.php` — Updated with logging
- `backend/app/Http/Controllers/BidController.php` — Updated with logging
- `backend/app/Http/Controllers/InvoiceController.php` — Updated with logging
- `backend/app/Http/Controllers/MessageController.php` — Updated with logging
- `backend/app/Http/Controllers/DashboardController.php` — Updated to use activity_logs
- `backend/routes/api.php` — Activities route added

### Frontend
- `frontend/src/app/shared/components/breadcrumb/breadcrumb.component.ts` — New
- `frontend/src/app/features/projects/project-detail/project-detail.component.ts` — Updated with links
- `frontend/src/app/features/subcontractors/subcontractor-detail/subcontractor-detail.component.ts` — Updated with links
- `frontend/src/app/features/bids/bid-list/bid-list.component.ts` — Updated with links
- `frontend/src/app/features/invoices/invoice-list/invoice-list.component.ts` — Updated with links
- `frontend/src/app/features/messages/message-list/message-list.component.ts` — Updated with links
- `frontend/src/app/features/dashboard/dashboard.component.ts` — Updated with icons and links

## Acceptance Criteria

1. ActivityLogger service logs all major user actions
2. `GET /api/activities` returns paginated activity log with user and project info
3. Dashboard recent activity section shows dynamically logged entries
4. Cross-feature links work: clicking entity names navigates to correct detail pages
5. Breadcrumbs appear on all detail pages and link correctly
6. Activity icons match action types
7. No broken links or navigation errors
