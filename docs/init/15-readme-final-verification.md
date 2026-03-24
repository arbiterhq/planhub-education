# Task 15 — README & Final Verification

## Objective

Write comprehensive project documentation (README, architecture overview) and perform a full end-to-end verification of every feature to ensure the application works correctly as a cohesive demo.

## Prerequisites

- Tasks 01-14 complete (entire application built and polished)

## Steps

### 1. Create project README

Create `README.md` at the project root (`/home/mike/Development/planhub-education/README.md`):

```markdown
# PlanHub Education Demo

A toy version of [PlanHub.com](https://planhub.com)'s contractor/subcontractor management platform, built to demonstrate full-stack development with Claude Code.

## Overview

This application simulates PlanHub's core workflow from a general contractor's perspective. Log in as **Apex Construction Group** and manage construction projects, subcontractors, bids, invoices, and communications — all backed by realistic dummy data.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular + Angular Material | 18 |
| Backend | PHP / Laravel | 11 |
| Database | SQLite | 3 |
| Auth | Laravel Sanctum (SPA cookies) | — |

## Features

- **Dashboard** — KPI summary cards, recent activity feed, upcoming bid deadlines
- **Project Management** — Browse, create, and manage construction projects with scopes of work
- **Subcontractor Directory** — Search and filter subcontractor companies by trade, view profiles and stats
- **Bid Management** — Send invitations to bid, review/compare bids, accept/reject with auto-contract creation
- **Invoice Management** — Submit, review, approve, and track payment of invoices
- **Messaging** — Two-panel messaging between GC and subcontractor contacts

## Prerequisites

- **PHP** 8.3+ (with extensions: sqlite3, mbstring, xml, curl, bcmath, zip)
- **Composer** 2.x
- **Node.js** 18+
- **npm** 9+

## Getting Started

### 1. Clone the repository

    git clone <repo-url>
    cd planhub-education

### 2. Set up the backend

    cd backend
    composer install
    cp .env.example .env
    php artisan key:generate
    touch database/database.sqlite
    php artisan migrate:fresh --seed
    php artisan serve

The API will be available at http://localhost:8000

### 3. Set up the frontend

    cd frontend
    npm install
    ng serve

The app will be available at http://localhost:4200

### 4. Log in

    Email:    admin@apexconstruction.com
    Password: password

## Demo Data

The seed data includes:

- **1 GC Company**: Apex Construction Group (Austin, TX)
- **3 GC Team Members**: Marcus Chen (admin), Sarah Mitchell, David Okafor
- **18 Subcontractor Companies** across 16 trades
- **8 Construction Projects** at various stages ($4.2M – $22M)
- **40+ Invitations to Bid**
- **25+ Bids** at various statuses
- **12+ Active Contracts**
- **20+ Invoices** from draft to paid
- **15+ Messages** between GC and subcontractors

To reset the database to its original state:

    cd backend
    php artisan migrate:fresh --seed

## Project Structure

    planhub-education/
    ├── backend/              # Laravel API
    │   ├── app/
    │   │   ├── Http/
    │   │   │   ├── Controllers/   # API controllers
    │   │   │   ├── Requests/      # Form validation
    │   │   │   └── Resources/     # JSON resources
    │   │   ├── Models/            # Eloquent models
    │   │   └── Services/          # Business logic
    │   ├── database/
    │   │   ├── migrations/        # Table definitions
    │   │   ├── factories/         # Model factories
    │   │   └── seeders/           # Demo data
    │   └── routes/
    │       ├── api.php            # API routes
    │       └── web.php            # Auth routes
    ├── frontend/             # Angular SPA
    │   └── src/app/
    │       ├── core/              # Auth, guards, interceptors, services
    │       ├── features/          # Feature pages
    │       │   ├── dashboard/
    │       │   ├── projects/
    │       │   ├── subcontractors/
    │       │   ├── bids/
    │       │   ├── invoices/
    │       │   └── messages/
    │       └── shared/            # Shared components, models, utils
    └── docs/                 # Build documentation
        ├── init.md
        └── init/
```

### 2. Create architecture document

Create `docs/architecture.md`:

```markdown
# Architecture Overview

## System Diagram

    ┌─────────────────────────────────┐
    │         Browser (SPA)           │
    │   Angular 18 + Material 18      │
    │   http://localhost:4200         │
    └──────────┬──────────────────────┘
               │ HTTP (proxied)
               │ Cookie-based auth
    ┌──────────▼──────────────────────┐
    │       Laravel API Server        │
    │   Laravel + Sanctum             │
    │   http://localhost:8000         │
    └──────────┬──────────────────────┘
               │ Eloquent ORM
    ┌──────────▼──────────────────────┐
    │         SQLite Database         │
    │   database/database.sqlite      │
    └─────────────────────────────────┘

## Authentication Flow

1. Angular requests CSRF cookie from `/sanctum/csrf-cookie`
2. Angular POSTs credentials to `/login`
3. Laravel validates and creates session cookie
4. All subsequent API requests include session cookie
5. Angular `authGuard` checks authentication on route navigation
6. On 401 response, interceptor redirects to `/login`

## API Design

- RESTful JSON API under `/api/*`
- Authentication endpoints under `/login`, `/logout` (web routes for session auth)
- All API routes protected by `auth:sanctum` middleware
- Consistent response format using API Resources
- Pagination via Laravel's built-in paginator

## Database Schema (ER Summary)

    Company (GC) ──< Project ──< ProjectScope ──< InvitationToBid
                                      │                   │
                                      │              Bid ──┘
                                      │               │
                                 Contract <────────────┘
                                      │
                                 Invoice

    Company (Sub) ──< Bid
                  ──< Contract
                  ──< Invoice
                  ──< InvitationToBid

    User ──< Message (sender)
         ──< Message (recipient)
         ── belongs to Company

## Key Design Decisions

- **SPA cookie auth over API tokens**: Simpler for same-origin SPA, more secure (no token in localStorage)
- **SQLite over MySQL/Postgres**: Zero-config database perfect for demos and development
- **Standalone components**: Angular 18 best practice, no NgModules
- **GC-centric with simulated sub actions**: Demo viewed as GC; "Simulate" buttons let users trigger sub actions
- **No real-time messaging**: Polling-based for simplicity; WebSockets noted as enhancement
```

### 3. End-to-end verification checklist

Perform the following verification steps. For each step, fix any issues found before moving on.

#### Authentication
- [ ] Navigate to `http://localhost:4200` → redirected to `/login`
- [ ] Login with wrong credentials → error message displayed
- [ ] Login with `admin@apexconstruction.com` / `password` → redirected to `/dashboard`
- [ ] Refresh the page → stays logged in (session persists)
- [ ] Click logout → redirected to `/login`, cannot access protected routes

#### Dashboard
- [ ] 4 KPI cards show correct numbers matching the seed data
- [ ] Recent activity section shows entries with icons
- [ ] Upcoming bid deadlines shows projects with due dates
- [ ] Clicking a KPI card navigates to the correct page
- [ ] Clicking an activity item with a project link navigates correctly

#### Projects
- [ ] `/projects` shows 8 projects in a table
- [ ] Status filter: select "In Progress" → shows 3 projects
- [ ] Search: type "austin" → filters correctly
- [ ] Click a project row → navigates to detail page
- [ ] Detail page: Overview tab shows description and stats
- [ ] Detail page: Scopes tab shows trade names and values
- [ ] "Add Scope" → select a trade, enter value → scope appears in list
- [ ] "New Project" → fill form → project appears in list
- [ ] Edit project → changes are saved
- [ ] Breadcrumb links work (Projects > Project Name)

#### Subcontractors
- [ ] `/subcontractors` shows 18 subcontractor cards
- [ ] Filter by trade → shows relevant subs
- [ ] Search by name → filters correctly
- [ ] Click a card → navigates to detail page
- [ ] Detail page: shows company info, trades, stats (bids, win rate, contracts)
- [ ] Bid History tab shows past bids with project links
- [ ] Active Contracts tab shows contracts with project links
- [ ] "Add Subcontractor" → fill form → sub appears in grid

#### Bids
- [ ] `/bids` shows two tabs: Invitations Sent, Bids Received
- [ ] Invitations tab shows ITBs with status chips
- [ ] Click "Send New ITBs" → stepper opens
- [ ] Step 1: Select project and scope
- [ ] Step 2: Select subcontractors (filtered by trade)
- [ ] Step 3: Review and send → ITBs created
- [ ] Bids tab shows bids with amounts and statuses
- [ ] Click "Review" on a bid → review dialog opens with comparison
- [ ] Accept a bid → confirmation dialog → contract created, other bids rejected
- [ ] Reject a bid → notes dialog → bid marked rejected
- [ ] "Simulate Bid" → create a bid → appears in list

#### Invoices
- [ ] `/invoices` shows summary cards with correct totals
- [ ] Invoice table shows all invoices with status chips
- [ ] Filter by status → works correctly
- [ ] Click an invoice → detail dialog with status timeline
- [ ] Detail shows contract progress (invoiced % of contract)
- [ ] Approve a submitted invoice → status changes, success toast
- [ ] Mark an approved invoice as paid → status changes
- [ ] Reject an invoice → notes saved, status changes
- [ ] "Create Invoice" → select contract, enter amount → validates against balance
- [ ] Invoice numbers are sequential (INV-20XX-XXXX)

#### Messages
- [ ] `/messages` shows two-panel layout
- [ ] Contact list shows conversations with previews
- [ ] Click a contact → thread loads with chat bubbles
- [ ] Sent messages right-aligned (blue), received left-aligned (gray)
- [ ] Type and send a message → appears in thread
- [ ] "New Message" → select recipient, send → thread opens
- [ ] Unread badge shows on sidebar Messages item
- [ ] Reading messages clears the unread indicator

#### Cross-Feature Integration
- [ ] Project detail → click subcontractor name → navigates to sub detail
- [ ] Sub detail → click project name → navigates to project detail
- [ ] Invoice table → click project name → navigates to project detail
- [ ] Performing actions creates activity log entries on dashboard

#### Error Handling & Polish
- [ ] Stop the backend server → frontend shows connection error
- [ ] Navigate to `/nonexistent` → 404 page displays
- [ ] All loading states show spinners
- [ ] Empty states show when filters produce no results
- [ ] Confirmation dialogs appear before destructive actions
- [ ] Success toasts appear after all CRUD operations
- [ ] Page titles update in browser tab
- [ ] Responsive layout: sidebar collapses on mobile

### 4. Fix any issues found

If any verification step fails:
1. Identify the root cause
2. Fix the issue in the relevant file
3. Re-verify that specific step
4. Continue with the checklist

### 5. Final touches

- Ensure no console errors in the browser developer tools
- Ensure no PHP warnings/errors in the Laravel log (`backend/storage/logs/laravel.log`)
- Remove any TODO comments left in the code
- Verify `php artisan migrate:fresh --seed` still works cleanly

## Files Created/Modified

- `README.md` — Project documentation
- `docs/architecture.md` — Architecture overview
- Various files may be patched based on verification findings

## Acceptance Criteria

1. `README.md` exists with complete setup instructions
2. `docs/architecture.md` exists with system diagram and design decisions
3. Every item in the verification checklist passes
4. No console errors in the browser
5. No errors in Laravel logs
6. `php artisan migrate:fresh --seed` runs cleanly
7. The full demo flow works: login → dashboard → projects → send ITBs → review bids → accept → invoices → pay → messages
