# Task 14 — Error Handling, Loading States & Polish

## Objective

Add production-quality UX polish across the entire application: global error handling, consistent loading states, empty states, form validation feedback, confirmation dialogs, toast notifications, and a 404 page.

## Prerequisites

- Tasks 01-13 complete (all features and integration built)

## Steps

### Backend

#### 1. Consistent JSON error responses

In Laravel 11, exception handling is configured in `bootstrap/app.php`. Update it to always return JSON for API requests:

```php
// Ensure all API exceptions return JSON format:
// 404 → { "message": "Resource not found", "status": 404 }
// 422 → { "message": "Validation failed", "errors": { ... }, "status": 422 }
// 403 → { "message": "Forbidden", "status": 403 }
// 500 → { "message": "Server error", "status": 500 }
```

Ensure `Accept: application/json` requests always get JSON responses (the auth interceptor from Task 04 should already set this header).

### Frontend

#### 2. Global error interceptor

Update `frontend/src/app/core/auth/auth.interceptor.ts` (or create a separate error interceptor):

- **401 Unauthorized**: Clear auth state, redirect to `/login` (already done in Task 04)
- **403 Forbidden**: Show snackbar: "You don't have permission to perform this action"
- **404 Not Found**: Show snackbar: "The requested resource was not found"
- **422 Validation Error**: Let the component handle it (don't show global snackbar for validation)
- **500+ Server Error**: Show snackbar: "Something went wrong. Please try again."
- **Network Error** (status 0): Show snackbar: "Unable to connect to the server. Check your connection."

Use `MatSnackBar` for all error notifications:
```typescript
this.snackBar.open(message, 'Dismiss', { duration: 5000, panelClass: 'error-snackbar' });
```

Add CSS for `error-snackbar` in `styles.scss`: red background, white text.

#### 3. Notification service

Create `frontend/src/app/core/services/notification.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      panelClass: 'success-snackbar',
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: 'error-snackbar',
    });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
    });
  }
}
```

Add CSS classes in `styles.scss`:
- `.success-snackbar` — green background
- `.error-snackbar` — red background

#### 4. Add success notifications to all actions

Go through each feature and add `NotificationService.success()` calls after successful actions:

- **Projects**: "Project created successfully", "Project updated", "Scope added"
- **Subcontractors**: "Subcontractor added to directory"
- **Bids/ITBs**: "Invitations sent to N subcontractors", "Bid accepted — contract created", "Bid rejected"
- **Invoices**: "Invoice created", "Invoice approved", "Invoice rejected", "Invoice marked as paid"
- **Messages**: "Message sent"

#### 5. Loading states

Add loading indicators to every component that fetches data. Use a consistent pattern:

```typescript
// In component
loading = signal(true);

ngOnInit() {
  this.service.getData().pipe(
    finalize(() => this.loading.set(false))
  ).subscribe(data => { ... });
}
```

In templates, show loading state:

```html
@if (loading()) {
  <div class="loading-container">
    <mat-spinner diameter="40"></mat-spinner>
  </div>
} @else {
  <!-- actual content -->
}
```

Add to `styles.scss`:
```css
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px;
}
```

Components that need loading states:
- Dashboard
- Project list
- Project detail (each tab can have its own loading)
- Subcontractor list
- Subcontractor detail
- Bid list (both tabs)
- Invoice list
- Messages (contact list and thread)

#### 6. Empty states

Add friendly empty state displays when lists have no items. Create a reusable component:

Create `frontend/src/app/shared/components/empty-state/empty-state.component.ts`:

```typescript
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon() }}</mat-icon>
      <h3>{{ title() }}</h3>
      <p>{{ message() }}</p>
      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input('inbox');
  title = input('Nothing here yet');
  message = input('');
}
```

Style: centered, gray icon (64px), muted text.

Add empty states to:
- Project list (no projects): icon=`business`, "No projects yet", "Create your first project to get started"
- Subcontractor list (no results): icon=`people`, "No subcontractors found", "Try adjusting your filters"
- Bid list (no bids): icon=`gavel`, "No bids received yet", "Send invitations to bid to get started"
- Invoice list (no invoices): icon=`receipt_long`, "No invoices yet"
- Messages (no conversations): icon=`mail`, "No messages yet", "Start a conversation with a subcontractor"
- Message thread (no contact selected): icon=`chat`, "Select a conversation", "Choose a contact from the list to view messages"

Also show empty states for:
- Project detail tabs when they have no items (no scopes, no bids for this project, etc.)
- Filtered results with no matches

#### 7. Confirmation dialogs

Create `frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`:

A reusable Material dialog for confirmations:

```typescript
@Component({
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button [color]="data.confirmColor || 'primary'" [mat-dialog-close]="true">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}
```

Add confirmation dialogs before:
- Deleting a project
- Deleting a project scope
- Accepting a bid (mention side effects: other bids rejected, contract created)
- Rejecting a bid
- Approving an invoice
- Marking an invoice as paid
- Logging out

#### 8. Form validation feedback

Ensure all forms show inline validation errors using Material's `mat-error`:

```html
<mat-form-field>
  <mat-label>Project Name</mat-label>
  <input matInput formControlName="name">
  @if (form.controls.name.hasError('required')) {
    <mat-error>Project name is required</mat-error>
  }
</mat-form-field>
```

Check all forms:
- Login form
- Project create/edit dialog
- Scope create dialog
- Subcontractor create dialog
- Invoice create dialog
- Message compose dialog
- ITB send workflow

#### 9. Create 404 page

Create `frontend/src/app/features/not-found/not-found.component.ts`:

- Centered on page
- Large "404" text
- "Page not found" message
- "Go to Dashboard" button
- Uses app layout (toolbar + sidebar)

Update routes to catch unknown paths:
```typescript
{ path: '**', component: NotFoundComponent }
```

#### 10. Polish miscellaneous details

- **Page titles**: Set browser tab title per route (use Angular's `Title` service):
  - "PlanHub — Dashboard"
  - "PlanHub — Projects"
  - "PlanHub — Project Name" (on detail)
  - etc.

- **Logout cleanup**: Ensure all services/signals are reset on logout. The auth interceptor should handle 401, but also clear any cached data in services.

- **Button disabled states**: Disable submit buttons while API calls are in progress to prevent double-submission.

- **Currency formatting**: Ensure all dollar amounts use Angular's `CurrencyPipe` consistently (`$1,234,567.00`).

- **Date formatting**: Use `DatePipe` consistently. Relative dates for recent items ("2 hours ago"), absolute dates for formal fields ("Mar 15, 2026").

### 11. Verify

1. Kill the Laravel server → frontend shows "Unable to connect" snackbar
2. Navigate to a non-existent URL → see 404 page
3. All loading states show spinners before data appears
4. Empty states display when filtering produces no results
5. Form validation shows errors on invalid input
6. Confirmation dialogs appear before destructive actions
7. Success toasts appear after all CRUD operations
8. Page titles update in the browser tab
9. No double-submit possible on any form

## Files Created/Modified

### Backend
- Exception handler configuration (version-dependent location)

### Frontend
- `frontend/src/app/core/auth/auth.interceptor.ts` — Updated with error handling
- `frontend/src/app/core/services/notification.service.ts` — New
- `frontend/src/app/shared/components/empty-state/empty-state.component.ts` — New
- `frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts` — New
- `frontend/src/app/features/not-found/not-found.component.ts` — New
- `frontend/src/styles.scss` — Snackbar classes, loading styles
- `frontend/src/app/app.routes.ts` — 404 catch-all route
- Multiple feature components updated with loading/empty/notification/confirmation patterns:
  - `dashboard.component.ts`
  - `project-list.component.ts`
  - `project-detail.component.ts`
  - `subcontractor-list.component.ts`
  - `subcontractor-detail.component.ts`
  - `bid-list.component.ts`
  - `send-itb.component.ts`
  - `invoice-list.component.ts`
  - `message-list.component.ts`
  - All dialog components

## Acceptance Criteria

1. Server errors show appropriate snackbar messages
2. Network errors show a connection error message
3. Every data-loading component shows a spinner while loading
4. Empty lists show friendly empty state messages
5. All forms validate inputs with inline `mat-error` messages
6. Destructive actions require confirmation via dialog
7. Successful actions show green success toast
8. 404 page renders for unknown routes
9. Page titles are set correctly per route
10. No double-submission possible on any form
11. Currency and date formatting is consistent throughout the app
