# Task 08 — Subcontractors (Full Stack)

## Objective

Build the subcontractor management feature end-to-end: Laravel API for browsing/managing subcontractor companies, Angular directory page with a card-grid layout and filters, and a subcontractor detail page showing company info, trade specialties, bid history, and active contracts.

## Prerequisites

- Task 03 complete (Database with subcontractor data)
- Task 04 complete (Authentication)
- Task 05 complete (App shell and navigation)
- Task 06 complete (API resource classes created — we'll reuse ContractResource, BidResource)

## Steps

### Backend

#### 1. Create SubcontractorResource

Create `backend/app/Http/Resources/SubcontractorResource.php`:

```php
class SubcontractorResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'description' => $this->description,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'zip' => $this->zip,
            'phone' => $this->phone,
            'email' => $this->email,
            'website' => $this->website,
            'logo_url' => $this->logo_url,
            'license_number' => $this->license_number,
            'established_year' => $this->established_year,
            'employee_count' => $this->employee_count,
            'trades' => TradeResource::collection($this->whenLoaded('trades')),
            'total_bids' => $this->when(isset($this->total_bids), $this->total_bids),
            'accepted_bids' => $this->when(isset($this->accepted_bids), $this->accepted_bids),
            'win_rate' => $this->when(isset($this->total_bids) && $this->total_bids > 0,
                fn() => round(($this->accepted_bids / $this->total_bids) * 100, 1)
            ),
            'active_contracts_count' => $this->whenCounted('activeContracts'),
            'bids' => BidResource::collection($this->whenLoaded('bids')),
            'contracts' => ContractResource::collection($this->whenLoaded('contracts')),
            'created_at' => $this->created_at,
        ];
    }
}
```

#### 2. Add model scopes to Company

Update `backend/app/Models/Company.php` — add:
- `scopeSubcontractors($query)` — `where('type', 'subcontractor')`
- Relationship: `activeContracts()` — `hasMany(Contract::class)->where('status', 'active')`

#### 3. Create SubcontractorController

Create `backend/app/Http/Controllers/SubcontractorController.php`:

##### `index` — `GET /api/subcontractors`

- Query `Company::subcontractors()`
- Eager load: `trades`
- Add bid statistics via subqueries or withCount:
  ```php
  ->withCount(['bids as total_bids'])
  ->withCount(['bids as accepted_bids' => fn($q) => $q->where('status', 'accepted')])
  ->withCount(['activeContracts'])
  ```
- Supports query parameters:
  - `trade_id` — filter by trade (using whereHas on trades relationship)
  - `search` — search by company name (LIKE)
  - `city` — filter by city
- Paginate: 12 per page (card grid works best with multiples of 3/4)
- Return `SubcontractorResource::collection($subcontractors)`

##### `show` — `GET /api/subcontractors/{subcontractor}`

- Find company where type = subcontractor (or return 404)
- Eager load: `trades`, `bids.projectScope.project`, `bids.projectScope.trade`, `contracts.project`, `contracts.trade`
- Add bid statistics (same subqueries as index)
- Return `new SubcontractorResource($subcontractor)`

##### `store` — `POST /api/subcontractors`

- Validate: name (required), trades (array of trade IDs), address, city, state, zip, phone, email, etc.
- Create company with `type: 'subcontractor'`
- Sync trades via pivot table
- Return `new SubcontractorResource($subcontractor)` with 201

##### `update` — `PUT /api/subcontractors/{subcontractor}`

- Validate and update company fields
- Sync trades if provided
- Return updated resource

#### 4. Register routes

In `routes/api.php` inside `auth:sanctum` group:

```php
Route::apiResource('subcontractors', SubcontractorController::class)->except(['destroy']);
```

### Frontend

#### 5. Create SubcontractorService

Create `frontend/src/app/core/services/subcontractor.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class SubcontractorService {
  private http = inject(HttpClient);

  getSubcontractors(params?: {
    trade_id?: number;
    search?: string;
    city?: string;
    page?: number;
    per_page?: number;
  }): Observable<PaginatedResponse<Subcontractor>> {
    return this.http.get<PaginatedResponse<Subcontractor>>('/api/subcontractors', { params: cleanParams(params) });
  }

  getSubcontractor(id: number): Observable<{ data: Subcontractor }> {
    return this.http.get<{ data: Subcontractor }>(`/api/subcontractors/${id}`);
  }

  createSubcontractor(data: any): Observable<{ data: Subcontractor }> {
    return this.http.post<{ data: Subcontractor }>('/api/subcontractors', data);
  }

  updateSubcontractor(id: number, data: any): Observable<{ data: Subcontractor }> {
    return this.http.put<{ data: Subcontractor }>(`/api/subcontractors/${id}`, data);
  }
}
```

Create the Subcontractor model interface in `frontend/src/app/shared/models/subcontractor.model.ts`.

#### 6. Build the subcontractor list page

Replace `frontend/src/app/features/subcontractors/subcontractor-list/subcontractor-list.component.ts`:

##### Filter Bar
- Search input (`mat-form-field`, debounced)
- Trade filter (`mat-select` populated from TradeService)
- "Add Subcontractor" `mat-raised-button`

##### Card Grid
Display subcontractors as `mat-card` elements in a responsive CSS grid (3 columns desktop, 2 tablet, 1 mobile).

Each card shows:
- **Company name** (bold, as card title)
- **Trades** — `mat-chip-set` with trade names
- **Location** — city, state
- **Employees** — employee count with icon
- **Stats row**: Total bids | Win rate | Active contracts
- Card is clickable — navigates to `/subcontractors/:id`

##### Pagination
`mat-paginator` below the grid.

##### "Add Subcontractor" dialog
A `mat-dialog` with form fields:
- Company name (required)
- Trades (multi-select from trade list)
- Address, City, State, Zip
- Phone, Email, Website
- Description
- Employee count, Established year, License number

#### 7. Build the subcontractor detail page

Replace `frontend/src/app/features/subcontractors/subcontractor-detail/subcontractor-detail.component.ts`:

##### Header
- Back button (← Subcontractors)
- Company name (large heading)
- Trade chips
- Contact info: address, phone, email, website
- Company stats: established year, employee count, license number

##### Stats Row (3 cards)
- Total Bids: count
- Win Rate: percentage
- Active Contracts: count

##### Tabs (`mat-tab-group`)

**Tab 1: Bid History**
- `mat-table`: Project, Trade/Scope, Amount, Timeline, Status (chip), Submitted Date
- Sorted by date descending
- Clicking project name navigates to `/projects/:id`

**Tab 2: Active Contracts**
- `mat-table`: Project, Trade, Amount, Status (chip), Start Date, End Date
- Clicking project name navigates to `/projects/:id`

**Tab 3: Contact Info**
- Full company details: description, address (with map placeholder/icon), phone, email, website
- Company admin contact (if available from the sub's user data)

### 8. Verify

1. Navigate to `/subcontractors` — see 18 subcontractor cards
2. Filter by trade "Electrical" — see relevant subs
3. Search "summit" — find Summit Plumbing Solutions
4. Click a card — navigate to detail page
5. Detail page shows company info, trades, and stats
6. Bid History tab shows past bids
7. Active Contracts tab shows current contracts
8. "Add Subcontractor" dialog works
9. Pagination works

## Files Created/Modified

### Backend
- `backend/app/Http/Controllers/SubcontractorController.php`
- `backend/app/Http/Resources/SubcontractorResource.php`
- `backend/app/Models/Company.php` — Updated with scopes and relationships
- `backend/routes/api.php` — Subcontractor routes added

### Frontend
- `frontend/src/app/shared/models/subcontractor.model.ts`
- `frontend/src/app/core/services/subcontractor.service.ts`
- `frontend/src/app/features/subcontractors/subcontractor-list/subcontractor-list.component.ts` — Full rewrite
- `frontend/src/app/features/subcontractors/subcontractor-detail/subcontractor-detail.component.ts` — Full rewrite
- `frontend/src/app/features/subcontractors/subcontractor-form-dialog/subcontractor-form-dialog.component.ts` — New

## Acceptance Criteria

1. `GET /api/subcontractors` returns paginated subcontractor list with trades and stats
2. `GET /api/subcontractors/1` returns detailed subcontractor with bids and contracts
3. Trade filter and search work correctly on both API and frontend
4. Card grid layout is responsive
5. Each card displays trades as chips, location, and key stats
6. Detail page shows company info header, stats row, and 3 tabs
7. Bid history and contracts tables link to projects
8. "Add Subcontractor" creates a new sub via the API
9. Win rate calculation is correct
