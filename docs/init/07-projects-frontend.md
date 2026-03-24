# Task 07 — Projects Frontend (List + Detail)

## Objective

Build the Angular projects list page with a Material table, filtering, and pagination, plus a project detail page with a tabbed interface showing overview, scopes, bids, contracts, and invoices.

## Prerequisites

- Task 02 complete (Angular frontend with Material)
- Task 05 complete (App shell and navigation)
- Task 06 complete (Projects API endpoints)

## Steps

### 1. Create TypeScript models

Create `frontend/src/app/shared/models/project.model.ts`:

```typescript
export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  project_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  estimated_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  bid_due_date: string | null;
  scopes_count?: number;
  active_bids_count?: number;
  contracts_count?: number;
  scopes?: ProjectScope[];
  contracts?: Contract[];
  invoices?: Invoice[];
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'planning' | 'bidding' | 'in_progress' | 'completed' | 'on_hold';

export interface ProjectScope {
  id: number;
  project_id: number;
  trade_id: number;
  trade?: Trade;
  description: string | null;
  estimated_value: number;
  status: ScopeStatus;
  bids_count?: number;
  bids?: Bid[];
  invitations_count?: number;
}

export type ScopeStatus = 'open' | 'bidding' | 'awarded' | 'in_progress' | 'completed';

export interface Trade {
  id: number;
  name: string;
  category: string;
}
```

Also create `frontend/src/app/shared/models/bid.model.ts`, `contract.model.ts`, and `invoice.model.ts` with interfaces matching the API resource output from Task 06.

### 2. Create ProjectService

Create `frontend/src/app/core/services/project.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);

  getProjects(params?: {
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
    sort?: string;
    direction?: string;
  }): Observable<PaginatedResponse<Project>> {
    return this.http.get<PaginatedResponse<Project>>('/api/projects', { params: cleanParams(params) });
  }

  getProject(id: number): Observable<{ data: Project }> {
    return this.http.get<{ data: Project }>(`/api/projects/${id}`);
  }

  createProject(data: Partial<Project>): Observable<{ data: Project }> {
    return this.http.post<{ data: Project }>('/api/projects', data);
  }

  updateProject(id: number, data: Partial<Project>): Observable<{ data: Project }> {
    return this.http.put<{ data: Project }>(`/api/projects/${id}`, data);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`/api/projects/${id}`);
  }

  addScope(projectId: number, data: Partial<ProjectScope>): Observable<{ data: ProjectScope }> {
    return this.http.post<{ data: ProjectScope }>(`/api/projects/${projectId}/scopes`, data);
  }

  updateScope(projectId: number, scopeId: number, data: Partial<ProjectScope>): Observable<{ data: ProjectScope }> {
    return this.http.put<{ data: ProjectScope }>(`/api/projects/${projectId}/scopes/${scopeId}`, data);
  }

  deleteScope(projectId: number, scopeId: number): Observable<void> {
    return this.http.delete<void>(`/api/projects/${projectId}/scopes/${scopeId}`);
  }
}
```

Create a `PaginatedResponse<T>` interface in `frontend/src/app/shared/models/paginated-response.model.ts`:

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
```

Also create a `TradeService` in `frontend/src/app/core/services/trade.service.ts` that calls `GET /api/trades`.

### 3. Build the project list component

Replace `frontend/src/app/features/projects/project-list/project-list.component.ts`:

#### Filter Bar
- `mat-form-field` with search input (debounced, 300ms)
- `mat-select` for status filter with options: All, Planning, Bidding, In Progress, Completed, On Hold
- "New Project" `mat-raised-button` (color=primary) on the right

#### Table
Use `mat-table` with columns:
- **Name** — project name (bold), with city/state underneath in smaller text
- **Type** — project_type
- **Status** — `mat-chip` with color based on status:
  - planning = gray
  - bidding = blue
  - in_progress = green
  - completed = teal
  - on_hold = orange
- **Budget** — formatted as currency (e.g., "$12,000,000")
- **Bid Due** — formatted date, or "—" if null
- **Scopes** — scopes_count number
- **Actions** — `mat-icon-button` with `more_vert` icon and `mat-menu` (View, Edit, Delete)

Clicking a row navigates to `/projects/:id`.

#### Pagination
`mat-paginator` at the bottom, synced with API pagination.

#### Loading State
Show `mat-spinner` while data is loading.

### 4. Create the "New Project" dialog

Create `frontend/src/app/features/projects/project-form-dialog/project-form-dialog.component.ts`:

A `mat-dialog` with a reactive form containing:
- Name (required)
- Project Type (text input or select with common types: Commercial Office, Healthcare, Education, Residential, Government, Industrial, Hospitality, Mixed-Use)
- Status (select, default: "planning")
- Address, City, State, Zip
- Estimated Budget (number input, formatted as currency)
- Start Date, End Date, Bid Due Date (`mat-datepicker`)
- Description (textarea)
- Cancel and Save buttons

This dialog is also reused for editing (pass existing project data via `MAT_DIALOG_DATA`).

### 5. Build the project detail component

Replace `frontend/src/app/features/projects/project-detail/project-detail.component.ts`:

#### Header Section
- Back button (← Projects) linking to `/projects`
- Project name (large heading)
- Status chip
- Address line (city, state, zip)
- Key stats row: Budget, Start Date, End Date, Bid Due Date
- "Edit Project" button that opens the project form dialog

#### Tabbed Content (`mat-tab-group`)

**Tab 1: Overview**
- Full description text
- Project details card: type, status, dates, budget
- Quick stats: total scopes, active bids, active contracts, total invoiced

**Tab 2: Scopes**
- `mat-table` showing: Trade name, Description, Estimated Value, Status (chip), Bid Count
- "Add Scope" button — opens a dialog with: trade select (from TradeService), description, estimated value
- Each scope row expandable or clickable to see associated bids

**Tab 3: Bids**
- `mat-table` showing bids for this project's scopes: Trade/Scope, Subcontractor, Amount, Timeline, Status (chip), Submitted Date
- Grouped by scope (optional) or flat list
- Filter by status
- This is read-only here — bid actions happen in the Bids feature (Task 10)

**Tab 4: Contracts**
- `mat-table` showing: Subcontractor, Trade, Amount, Status (chip), Start Date, End Date
- Clicking a sub name navigates to `/subcontractors/:id`

**Tab 5: Invoices**
- `mat-table` showing: Invoice #, Subcontractor, Amount, Status (chip), Due Date, Submitted Date
- Clicking navigates to invoices page or opens detail (cross-links added in Task 13)

### 6. Add status utility

Create `frontend/src/app/shared/utils/status.utils.ts`:

A helper that maps status strings to display labels and colors:

```typescript
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planning: 'default',
    bidding: 'primary',
    in_progress: 'accent',
    completed: 'primary',
    on_hold: 'warn',
    // ... scope, bid, invoice statuses too
  };
  return colors[status] || 'default';
}

export function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
```

### 7. Verify

1. Navigate to `/projects` — see all 8 projects in the table
2. Filter by status "In Progress" — see 3 projects
3. Search "austin" — see relevant projects
4. Click a project row — navigate to detail page
5. See all 5 tabs with data
6. "Add Scope" dialog works and scope appears in the table
7. "New Project" dialog creates a project and it appears in the list
8. Pagination works when viewing more than 10 projects
9. Back button returns to the list

## Files Created/Modified

- `frontend/src/app/shared/models/project.model.ts`
- `frontend/src/app/shared/models/bid.model.ts`
- `frontend/src/app/shared/models/contract.model.ts`
- `frontend/src/app/shared/models/invoice.model.ts`
- `frontend/src/app/shared/models/paginated-response.model.ts`
- `frontend/src/app/shared/utils/status.utils.ts`
- `frontend/src/app/core/services/project.service.ts`
- `frontend/src/app/core/services/trade.service.ts`
- `frontend/src/app/features/projects/project-list/project-list.component.ts` — Full rewrite
- `frontend/src/app/features/projects/project-detail/project-detail.component.ts` — Full rewrite
- `frontend/src/app/features/projects/project-form-dialog/project-form-dialog.component.ts` — New

## Acceptance Criteria

1. `/projects` shows all 8 seeded projects in a Material table
2. Status filter works correctly
3. Search filter works with debounce
4. Clicking a row navigates to `/projects/:id`
5. Project detail page shows all 5 tabs with correct data
6. Scopes tab shows trade names and estimated values
7. "New Project" dialog creates a project via the API
8. "Add Scope" dialog creates a scope via the API
9. Edit project dialog pre-fills current values and updates via the API
10. Pagination and sorting work
11. Status chips have appropriate colors
12. Loading spinners display while data loads
