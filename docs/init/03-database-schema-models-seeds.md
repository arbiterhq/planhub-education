# Task 03 — Database Schema, Models & Seed Data

## Objective

Create the complete database schema via Laravel migrations, build Eloquent models with all relationships, define factories for each model, and write a comprehensive seeder that populates the app with realistic construction industry data for the Apex Construction Group demo.

## Prerequisites

- Task 01 complete (Laravel project with SQLite configured)

## Steps

### 1. Create migrations

Create migration files for each table below. Run them in this order due to foreign key dependencies.

#### `trades` table

```
Schema::create('trades', function (Blueprint $table) {
    $table->id();
    $table->string('name');           // e.g., "Electrical"
    $table->string('category');       // e.g., "MEP", "Structural", "Finishing", "Site Work"
    $table->timestamps();
});
```

#### `companies` table

```
Schema::create('companies', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->enum('type', ['general_contractor', 'subcontractor']);
    $table->text('description')->nullable();
    $table->string('address')->nullable();
    $table->string('city')->nullable();
    $table->string('state', 2)->nullable();
    $table->string('zip', 10)->nullable();
    $table->string('phone', 20)->nullable();
    $table->string('email')->nullable();
    $table->string('website')->nullable();
    $table->string('logo_url')->nullable();
    $table->string('license_number')->nullable();
    $table->integer('established_year')->nullable();
    $table->integer('employee_count')->nullable();
    $table->timestamps();
});
```

#### `company_trade` pivot table

```
Schema::create('company_trade', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained()->cascadeOnDelete();
    $table->foreignId('trade_id')->constrained()->cascadeOnDelete();
    $table->timestamps();
});
```

#### Extend `users` table

Create a migration to add columns to the existing `users` table:

```
Schema::table('users', function (Blueprint $table) {
    $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('role', ['gc_admin', 'gc_member', 'sub_admin', 'sub_member'])->default('gc_member');
    $table->string('phone', 20)->nullable();
    $table->string('job_title')->nullable();
});
```

#### `projects` table

```
Schema::create('projects', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained()->cascadeOnDelete(); // GC company
    $table->string('name');
    $table->text('description')->nullable();
    $table->enum('status', ['planning', 'bidding', 'in_progress', 'completed', 'on_hold'])->default('planning');
    $table->string('project_type')->nullable();  // e.g., "Commercial Office", "Healthcare"
    $table->string('address')->nullable();
    $table->string('city')->nullable();
    $table->string('state', 2)->nullable();
    $table->string('zip', 10)->nullable();
    $table->decimal('estimated_budget', 15, 2)->nullable();
    $table->date('start_date')->nullable();
    $table->date('end_date')->nullable();
    $table->date('bid_due_date')->nullable();
    $table->timestamps();
});
```

#### `project_scopes` table

```
Schema::create('project_scopes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained()->cascadeOnDelete();
    $table->foreignId('trade_id')->constrained();
    $table->text('description')->nullable();
    $table->decimal('estimated_value', 15, 2)->nullable();
    $table->enum('status', ['open', 'bidding', 'awarded', 'in_progress', 'completed'])->default('open');
    $table->timestamps();
});
```

#### `invitations_to_bid` table

```
Schema::create('invitations_to_bid', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_scope_id')->constrained()->cascadeOnDelete();
    $table->foreignId('company_id')->constrained();  // subcontractor company
    $table->enum('status', ['sent', 'viewed', 'declined', 'bid_submitted'])->default('sent');
    $table->timestamp('sent_at')->nullable();
    $table->timestamp('responded_at')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

#### `bids` table

```
Schema::create('bids', function (Blueprint $table) {
    $table->id();
    $table->foreignId('invitation_id')->nullable()->constrained('invitations_to_bid')->nullOnDelete();
    $table->foreignId('company_id')->constrained();  // subcontractor company
    $table->foreignId('project_scope_id')->constrained();
    $table->decimal('amount', 15, 2);
    $table->text('description')->nullable();
    $table->integer('timeline_days')->nullable();
    $table->enum('status', ['submitted', 'under_review', 'accepted', 'rejected'])->default('submitted');
    $table->timestamp('submitted_at')->nullable();
    $table->timestamp('reviewed_at')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

#### `contracts` table

```
Schema::create('contracts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('bid_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('project_id')->constrained();
    $table->foreignId('company_id')->constrained();  // subcontractor company
    $table->foreignId('trade_id')->constrained();
    $table->decimal('amount', 15, 2);
    $table->enum('status', ['draft', 'active', 'completed', 'terminated'])->default('draft');
    $table->date('start_date')->nullable();
    $table->date('end_date')->nullable();
    $table->timestamp('signed_at')->nullable();
    $table->timestamps();
});
```

#### `invoices` table

```
Schema::create('invoices', function (Blueprint $table) {
    $table->id();
    $table->foreignId('contract_id')->constrained();
    $table->foreignId('company_id')->constrained();  // subcontractor company
    $table->foreignId('project_id')->constrained();
    $table->string('invoice_number')->unique();
    $table->decimal('amount', 15, 2);
    $table->text('description')->nullable();
    $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'paid', 'rejected'])->default('draft');
    $table->date('due_date')->nullable();
    $table->timestamp('submitted_at')->nullable();
    $table->timestamp('approved_at')->nullable();
    $table->timestamp('paid_at')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

#### `messages` table

```
Schema::create('messages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('sender_id')->constrained('users');
    $table->foreignId('recipient_id')->constrained('users');
    $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
    $table->string('subject');
    $table->text('body');
    $table->timestamp('read_at')->nullable();
    $table->timestamps();
});
```

#### `activity_logs` table

```
Schema::create('activity_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
    $table->string('action');        // e.g., "bid_submitted", "invoice_approved"
    $table->text('description');
    $table->json('metadata')->nullable();
    $table->timestamps();
});
```

### 2. Create Eloquent models

Create a model for each table with `$fillable`, `$casts`, and relationship methods:

#### `Trade` model
- `belongsToMany(Company::class)`
- `hasMany(ProjectScope::class)`

#### `Company` model
- `hasMany(User::class)`
- `belongsToMany(Trade::class)`
- `hasMany(Project::class)` — for GC companies
- `hasMany(Bid::class)` — for sub companies
- `hasMany(Contract::class)` — for sub companies
- `hasMany(Invoice::class)` — for sub companies
- `hasMany(InvitationToBid::class)` — for sub companies
- Scope: `scopeGeneralContractors($query)` and `scopeSubcontractors($query)`

#### `User` model (update existing)
- Add `belongsTo(Company::class)`
- Add `sentMessages()` hasMany
- Add `receivedMessages()` hasMany
- Add `$fillable` fields: `company_id`, `role`, `phone`, `job_title`
- Add `$casts`: `role` as string

#### `Project` model
- `belongsTo(Company::class)` — GC company
- `hasMany(ProjectScope::class)`
- `hasMany(Contract::class)`
- `hasMany(Invoice::class)`
- `hasMany(Message::class)`
- `hasMany(ActivityLog::class)`

#### `ProjectScope` model
- `belongsTo(Project::class)`
- `belongsTo(Trade::class)`
- `hasMany(InvitationToBid::class)`
- `hasMany(Bid::class)`

#### `InvitationToBid` model
- `belongsTo(ProjectScope::class)`
- `belongsTo(Company::class)` — subcontractor
- `hasOne(Bid::class, 'invitation_id')`

#### `Bid` model
- `belongsTo(InvitationToBid::class, 'invitation_id')`
- `belongsTo(Company::class)` — subcontractor
- `belongsTo(ProjectScope::class)`
- `hasOne(Contract::class)`

#### `Contract` model
- `belongsTo(Bid::class)`
- `belongsTo(Project::class)`
- `belongsTo(Company::class)` — subcontractor
- `belongsTo(Trade::class)`
- `hasMany(Invoice::class)`

#### `Invoice` model
- `belongsTo(Contract::class)`
- `belongsTo(Company::class)` — subcontractor
- `belongsTo(Project::class)`

#### `Message` model
- `belongsTo(User::class, 'sender_id')`
- `belongsTo(User::class, 'recipient_id')`
- `belongsTo(Project::class)` — nullable

#### `ActivityLog` model
- `belongsTo(User::class)`
- `belongsTo(Company::class)`
- `belongsTo(Project::class)`

### 3. Create factories

Create a factory for each model. Use Faker where appropriate but prefer construction-realistic values. Each factory should produce valid records that satisfy foreign key constraints when used with `->for()` or explicit IDs.

### 4. Create the database seeder

Create `database/seeders/DatabaseSeeder.php` that populates the **entire demo dataset** in a specific order. Do NOT use factories with random data for the core demo content — use explicit, hand-crafted data so the demo is consistent and realistic every time.

#### Trades (16 entries)

| Name | Category |
|------|----------|
| Electrical | MEP |
| Plumbing | MEP |
| HVAC | MEP |
| Fire Protection | MEP |
| Concrete & Masonry | Structural |
| Structural Steel | Structural |
| Framing & Carpentry | Structural |
| Roofing | Exterior |
| Glazing & Windows | Exterior |
| Painting | Finishing |
| Drywall & Insulation | Finishing |
| Flooring | Finishing |
| Landscaping | Site Work |
| Demolition | Site Work |
| Excavation & Grading | Site Work |
| Elevator Installation | Specialty |

#### GC Company — Apex Construction Group

```
Name: Apex Construction Group
Type: general_contractor
Description: Full-service general contractor specializing in commercial, institutional, and mixed-use projects across Central Texas. Over two decades of experience delivering projects from $1M to $50M.
Address: 4200 Congress Ave, Suite 300
City: Austin
State: TX
Zip: 78745
Phone: (512) 555-0100
Email: info@apexconstruction.com
Website: https://www.apexconstruction.com
License: TX-GC-2003-04821
Established: 2003
Employees: 148
```

#### GC Team Members (3 users)

| Name | Email | Role | Job Title |
|------|-------|------|-----------|
| Marcus Chen | admin@apexconstruction.com | gc_admin | President & CEO |
| Sarah Mitchell | sarah.mitchell@apexconstruction.com | gc_member | Senior Project Manager |
| David Okafor | david.okafor@apexconstruction.com | gc_member | Project Manager |

All passwords: `password` (hashed with `bcrypt`).

#### Subcontractor Companies (18 companies)

| # | Company Name | Primary Trade(s) | City | Employees | Est. |
|---|-------------|-------------------|------|-----------|------|
| 1 | Lone Star Electrical Services | Electrical | Austin, TX | 65 | 1998 |
| 2 | Summit Plumbing Solutions | Plumbing | Round Rock, TX | 42 | 2005 |
| 3 | BlueLine HVAC Systems | HVAC | Cedar Park, TX | 55 | 2001 |
| 4 | Guardian Fire Protection | Fire Protection | San Marcos, TX | 30 | 2010 |
| 5 | Ironclad Concrete & Masonry | Concrete & Masonry | Georgetown, TX | 78 | 1995 |
| 6 | Texas Steel Erectors | Structural Steel | Pflugerville, TX | 45 | 2002 |
| 7 | Heritage Framing Co. | Framing & Carpentry | Buda, TX | 60 | 1999 |
| 8 | Peak Roofing Systems | Roofing | Leander, TX | 38 | 2008 |
| 9 | ClearView Glass & Glazing | Glazing & Windows | Austin, TX | 25 | 2012 |
| 10 | ProFinish Painting | Painting | Kyle, TX | 35 | 2006 |
| 11 | DryTech Interiors | Drywall & Insulation | Austin, TX | 50 | 2003 |
| 12 | Premier Flooring Solutions | Flooring | Lakeway, TX | 28 | 2011 |
| 13 | GreenScape Landscaping | Landscaping | Dripping Springs, TX | 40 | 2007 |
| 14 | Demo Force LLC | Demolition | Hutto, TX | 22 | 2014 |
| 15 | SitePrep Excavation | Excavation & Grading | Manor, TX | 35 | 2004 |
| 16 | Apex Elevators Inc. | Elevator Installation | Austin, TX | 18 | 2009 |
| 17 | Riverside Mechanical | Plumbing, HVAC | Austin, TX | 72 | 1997 |
| 18 | AllTrade Builders | Framing & Carpentry, Drywall & Insulation | Round Rock, TX | 85 | 2000 |

Each subcontractor company gets 1 user (sub_admin) with email pattern `admin@{company-slug}.com` and password `password`.

#### Projects (8 projects for Apex Construction Group)

| # | Name | Type | Status | Budget | City | Bid Due | Start | End |
|---|------|------|--------|--------|------|---------|-------|-----|
| 1 | Downtown Austin Office Tower | Commercial Office | bidding | $12,000,000 | Austin, TX | 2026-04-15 | 2026-06-01 | 2028-03-31 |
| 2 | St. Mary's Hospital Wing Renovation | Healthcare | in_progress | $8,500,000 | Austin, TX | — | 2025-09-15 | 2026-12-31 |
| 3 | The Meridian Mixed-Use Development | Mixed-Use Residential | in_progress | $22,000,000 | Austin, TX | — | 2025-06-01 | 2027-08-31 |
| 4 | Westlake Hills Elementary Expansion | Education | bidding | $4,200,000 | Westlake Hills, TX | 2026-04-30 | 2026-07-15 | 2027-06-30 |
| 5 | Cedar Park Municipal Center | Government | planning | $6,800,000 | Cedar Park, TX | 2026-06-15 | 2026-09-01 | 2027-12-31 |
| 6 | Lakeway Luxury Condominiums | Residential | in_progress | $15,000,000 | Lakeway, TX | — | 2025-11-01 | 2027-05-31 |
| 7 | Round Rock Distribution Warehouse | Industrial | completed | $9,300,000 | Round Rock, TX | — | 2024-08-01 | 2025-12-15 |
| 8 | Barton Creek Resort & Spa Renovation | Hospitality | on_hold | $11,000,000 | Austin, TX | — | 2026-03-01 | 2027-09-30 |

Each project should have a realistic multi-paragraph description.

#### Project Scopes

Create 3-6 scopes per project, linking to relevant trades with realistic estimated values. Example for Downtown Austin Office Tower:
- Electrical: $1,800,000 (bidding)
- HVAC: $1,500,000 (bidding)
- Structural Steel: $2,200,000 (bidding)
- Concrete & Masonry: $1,600,000 (bidding)
- Glazing & Windows: $950,000 (bidding)
- Elevator Installation: $800,000 (bidding)

For in-progress projects, scopes should be at various statuses (some awarded, some in_progress, some completed).

#### Invitations to Bid (40-50)

For projects in `bidding` or `in_progress` status, create ITBs sent to relevant subcontractors. Mix of statuses: sent, viewed, declined, bid_submitted. Each scope should have 2-4 ITBs to different subs.

#### Bids (25-35)

For ITBs with `bid_submitted` status, create corresponding bids. Bid amounts should be within ±15% of the scope's estimated value. Mix of statuses. Include realistic timeline_days values (30-180 depending on scope).

#### Contracts (12-15)

For in-progress and completed projects, create contracts from accepted bids. Include:
- Active contracts on in-progress projects
- Completed contracts on the completed project (Round Rock Warehouse)
- Each with realistic start/end dates and signed_at timestamps

#### Invoices (20-25)

For active and completed contracts, create invoices. Use sequential invoice numbers (INV-2025-0001 through INV-2026-XXXX). Mix of statuses:
- 3-4 paid invoices on the completed project
- 5-6 approved/paid invoices on in-progress projects
- 3-4 submitted/under_review invoices
- 2-3 draft invoices
- Amounts should be portions of the contract value (progress billing: 10-30% per invoice)

#### Messages (15-20)

Create messages between GC users and subcontractor users. Topics:
- Bid clarification questions
- Schedule coordination
- Invoice submission notifications
- Project update discussions
- Some read, some unread

#### Activity Log (30-40 entries)

Create recent activity entries spanning the last 60 days:
- Project status changes
- Bids submitted and reviewed
- Invoices submitted and approved
- Contracts signed
- ITBs sent

### 5. Run migrations and seed

```bash
cd backend
php artisan migrate:fresh --seed
```

Verify data integrity — spot-check a few relationships in tinker:

```bash
php artisan tinker
# Check: Company::where('type','general_contractor')->first()->projects->count()
# Check: Project::first()->scopes->count()
# Check: Invoice::first()->contract->company->name
```

## Files Created/Modified

- `backend/database/migrations/` — 12+ migration files
- `backend/app/Models/` — All model files (Trade, Company, Project, ProjectScope, InvitationToBid, Bid, Contract, Invoice, Message, ActivityLog + updated User)
- `backend/database/factories/` — Factory for each model
- `backend/database/seeders/DatabaseSeeder.php` — Comprehensive seeder
- `backend/database/database.sqlite` — Populated with seed data

## Acceptance Criteria

1. `php artisan migrate:fresh --seed` runs without errors
2. All 12+ tables are created with correct columns and foreign keys
3. Database contains: 1 GC company, 18 sub companies, 21+ users, 8 projects, 30+ scopes, 40+ ITBs, 25+ bids, 12+ contracts, 20+ invoices, 15+ messages, 30+ activity log entries
4. All Eloquent relationships work correctly (test in tinker)
5. Seed data is deterministic — running `migrate:fresh --seed` twice produces identical data
