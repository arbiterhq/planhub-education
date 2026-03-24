# Task 05 — App Shell, Navigation & Dashboard

## Objective

Build the main application layout (toolbar, sidebar navigation, content area) with a custom Material theme, and implement the dashboard page with KPI summary cards, recent activity, and upcoming bid deadlines.

## Prerequisites

- Task 02 complete (Angular with Material installed)
- Task 04 complete (Authentication working)

## Steps

### 1. Define custom Material theme

Update `frontend/src/styles.scss` to define a construction-themed custom Material theme:

- **Primary**: Deep blue (#1565C0 or similar) — professional, trustworthy
- **Accent**: Orange (#F57C00 or similar) — construction/safety, call-to-action
- **Warn**: Red (#D32F2F)
- Set up global typography, body margins, and Material component overrides
- Add CSS custom properties for reuse: `--color-success: #4CAF50`, `--color-warning: #FF9800`, `--color-info: #2196F3`
- Add utility classes for status colors used throughout the app

### 2. Create the layout component

Create `frontend/src/app/core/layout/layout.component.ts`:

A standalone component that wraps all authenticated routes with:

- **`mat-toolbar`** (top bar):
  - Left: PlanHub logo/icon + "PlanHub" text
  - Right: Company name ("Apex Construction Group"), user name (from AuthService), `mat-icon-button` for logout

- **`mat-sidenav-container`** (body):
  - **`mat-sidenav`** (left sidebar):
    - `mat-nav-list` with navigation items, each with an icon and label:
      - Dashboard (`dashboard` icon)
      - Projects (`business` icon)
      - Subcontractors (`people` icon)
      - Bids (`gavel` icon)
      - Invoices (`receipt_long` icon)
      - Messages (`mail` icon) — with unread badge (optional, can add in Task 12)
    - Active route should be highlighted (use `routerLinkActive`)
    - Sidenav mode: `side` on desktop, `over` on mobile

  - **`mat-sidenav-content`** (main area):
    - `<router-outlet>` for page content
    - Consistent padding (24px)

- Use `BreakpointObserver` from `@angular/cdk/layout` to toggle between desktop and mobile sidenav modes
- Sidenav width: ~250px
- Toolbar height: 64px
- Toolbar should be fixed at top (or use the Material toolbar's natural position)

### 3. Update routing to use layout

Update `frontend/src/app/app.routes.ts` so all authenticated routes are children of the layout component:

```typescript
{
  path: '',
  component: LayoutComponent,
  canActivate: [authGuard],
  children: [
    { path: 'dashboard', loadComponent: () => ... },
    { path: 'projects', loadComponent: () => ... },
    // ... all other authenticated routes
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  ]
},
```

### 4. Create the dashboard API endpoint

Create `backend/app/Http/Controllers/DashboardController.php`:

`GET /api/dashboard` returns:

```json
{
  "project_summary": {
    "total": 8,
    "planning": 1,
    "bidding": 2,
    "in_progress": 3,
    "completed": 1,
    "on_hold": 1
  },
  "bid_summary": {
    "active_bids": 12,
    "pending_review": 5,
    "total_bid_value": 4250000
  },
  "invoice_summary": {
    "open_invoices": 8,
    "total_outstanding": 1850000,
    "paid_this_month": 520000
  },
  "unread_messages": 4,
  "recent_activity": [
    {
      "id": 1,
      "action": "bid_submitted",
      "description": "Lone Star Electrical submitted a bid for Downtown Austin Office Tower - Electrical scope",
      "created_at": "2026-03-23T14:30:00Z",
      "project": { "id": 1, "name": "Downtown Austin Office Tower" }
    }
    // ... last 10 entries
  ],
  "upcoming_deadlines": [
    {
      "project_id": 1,
      "project_name": "Downtown Austin Office Tower",
      "bid_due_date": "2026-04-15",
      "days_remaining": 22,
      "open_scopes": 6
    }
    // ... next 5 deadlines
  ]
}
```

Add the route inside the `auth:sanctum` middleware group in `routes/api.php`.

### 5. Build the dashboard frontend component

Replace the placeholder `frontend/src/app/features/dashboard/dashboard.component.ts`:

Create a `DashboardService` (or inline the HTTP call) and build the dashboard component with:

#### KPI Summary Row (4 cards)
A row of `mat-card` elements at the top:

1. **Projects** — total count, small breakdown by status underneath, icon: `business`
2. **Active Bids** — count of bids pending review, icon: `gavel`
3. **Open Invoices** — count + total outstanding dollar amount, icon: `receipt_long`
4. **Messages** — unread count, icon: `mail`

Each card should be clickable and navigate to the relevant page.

Style: Cards in a responsive grid (4 columns on desktop, 2 on tablet, 1 on mobile). Each card has a colored left border or icon color matching its category.

#### Recent Activity Section
Below the KPI row:
- Heading: "Recent Activity"
- `mat-list` showing the last 10 activity entries
- Each item shows: icon (based on action type), description text, relative timestamp ("2 hours ago")
- Clicking an item navigates to the relevant project/bid/invoice

#### Upcoming Bid Deadlines Section
Side-by-side with recent activity (or below on mobile):
- Heading: "Upcoming Bid Deadlines"
- Small `mat-table` or `mat-list` with: project name, bid due date, days remaining, open scopes count
- Days remaining should be color-coded: red if <7 days, yellow if <14, green otherwise
- Clicking a row navigates to the project detail

#### Layout
- Use CSS Grid or Flexbox for the dashboard layout
- KPI cards row at top
- Below: two-column layout on desktop (activity left, deadlines right), stacked on mobile

### 6. Verify

1. Start both servers
2. Login and land on `/dashboard`
3. Verify all 4 KPI cards show correct data
4. Verify recent activity list shows entries
5. Verify bid deadlines table shows upcoming dates
6. Click a KPI card — navigates to correct page
7. Resize browser — layout responds correctly
8. Sidebar navigation works for all routes
9. Logout button works

## Files Created/Modified

### Backend
- `backend/app/Http/Controllers/DashboardController.php`
- `backend/routes/api.php` — Dashboard route added

### Frontend
- `frontend/src/styles.scss` — Custom Material theme + utility classes
- `frontend/src/app/core/layout/layout.component.ts` — Main layout with toolbar + sidenav
- `frontend/src/app/features/dashboard/dashboard.component.ts` — Full dashboard page
- `frontend/src/app/app.routes.ts` — Updated to wrap routes in layout component

## Acceptance Criteria

1. After login, user sees a toolbar with "PlanHub" branding and their name
2. Sidebar navigation shows all 6 menu items with icons
3. Active route is highlighted in the sidebar
4. Dashboard shows 4 KPI cards with real data from the API
5. Recent activity section lists the latest entries
6. Upcoming deadlines section shows projects with bid due dates
7. Clicking navigation items routes correctly
8. Layout is responsive — sidenav collapses on mobile
9. Logout button clears session and returns to login
10. Custom Material theme (blue/orange) is applied consistently
