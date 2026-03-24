# PlanHub Education Demo

A toy version of PlanHub.com's contractor/subcontractor management platform, built to demonstrate full-stack development with Claude Code.

## Prerequisites

Installed via Task 00 (`docs/init/00-dev-environment-setup.md`):
- **PHP 8.3** + extensions: sqlite3, mbstring, xml, curl, bcmath, zip, readline
- **Composer 2.x**
- **Node.js v24.x** + npm 11.x (pre-installed via Proto)
- **Git 2.43+** (pre-installed)
- **OS**: Ubuntu 24.04 (WSL2), sudo is passwordless

## Tech Stack

- **Frontend**: Angular 18 + Angular Material 18 (standalone components, no NgModules)
- **Backend**: PHP 8.3 / Laravel 11 (SQLite, Sanctum SPA cookie auth)
- **Database**: SQLite (`backend/database/database.sqlite`)

## Directory Structure

```
planhub-education/
├── backend/          # Laravel 11 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   ├── Requests/      # Form request validation
│   │   │   └── Resources/     # API JSON resources
│   │   ├── Models/
│   │   └── Services/
│   ├── bootstrap/app.php      # Middleware, exception handling, routing
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   ├── factories/
│   │   ├── seeders/
│   │   └── database.sqlite
│   └── routes/
│       ├── api.php            # API routes (auth:sanctum middleware)
│       └── web.php            # Session auth routes (login/logout)
├── frontend/         # Angular 18 SPA
│   ├── src/app/
│   │   ├── core/              # Singleton services, guards, interceptors
│   │   │   ├── auth/          # AuthService, guard, interceptor
│   │   │   ├── layout/        # App shell (toolbar, sidenav)
│   │   │   └── services/      # API services (ProjectService, etc.)
│   │   ├── features/          # Feature pages (lazy-loaded routes)
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── subcontractors/
│   │   │   ├── bids/
│   │   │   ├── invoices/
│   │   │   ├── messages/
│   │   │   └── login/
│   │   ├── shared/            # Shared components, models, pipes, utils
│   │   │   ├── components/
│   │   │   ├── models/
│   │   │   └── utils/
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── proxy.conf.json        # Dev proxy: /api/* → localhost:8000
│   └── angular.json
├── docs/
│   ├── init.md                # Task index
│   └── init/                  # Individual task files (01-15)
├── run-tasks.sh               # Idempotent task runner
└── CLAUDE.md                  # This file
```

## Laravel 11 Specifics

- **Sanctum** is bundled by default — no need for `composer require laravel/sanctum`
- **SQLite** is the default database — `.env` ships with `DB_CONNECTION=sqlite`
- **Middleware** is configured in `bootstrap/app.php` (there is no `app/Http/Kernel.php`)
- **Exception handling** is configured in `bootstrap/app.php`
- **Session auth routes** (login/logout) go in `routes/web.php` for cookie-based Sanctum SPA auth
- **API routes** go in `routes/api.php` inside an `auth:sanctum` middleware group
- **CORS** is configured via `config/cors.php` or middleware in `bootstrap/app.php`

## Angular 18 Specifics

- All components must be **standalone** (no NgModules) — use `standalone: true` in `@Component`
- Use **signals** (`signal()`, `computed()`) for reactive state in services and components
- Use **functional guards** (`CanActivateFn`) and **functional interceptors** (`HttpInterceptorFn`)
- Routes use **lazy loading**: `loadComponent: () => import('./path').then(m => m.Component)`
- `HttpClient` is provided via `provideHttpClient()` in `app.config.ts` with XSRF config
- Material components are imported individually per component (e.g., `MatTableModule`, `MatButtonModule`)

## Coding Conventions

### Backend
- Use **API Resources** (`JsonResource`) for all JSON responses
- Use **Form Request** classes for validation
- All API routes protected by `auth:sanctum` middleware
- Company ownership checks on all data access (verify project/resource belongs to user's company)
- Use Eloquent relationships and eager loading — avoid N+1 queries

### Frontend
- Services in `core/services/` — one per backend resource (ProjectService, BidService, etc.)
- Feature components in `features/{name}/` — each route gets its own component
- Shared models as TypeScript interfaces in `shared/models/`
- Use `mat-table` for list views, `mat-card` for card layouts, `mat-dialog` for modals
- Use `mat-chip` for status display with color coding
- Reactive forms (`FormGroup`) for all forms with `mat-error` for validation

## Demo Persona

- **Company**: Apex Construction Group (Austin, TX general contractor)
- **Login**: `admin@apexconstruction.com` / `password`
- **Data**: 8 projects, 18 subcontractors, 16 trades, bids, contracts, invoices, messages

## Running the App

```bash
# Backend
cd backend && php artisan serve           # http://localhost:8000

# Frontend (separate terminal)
cd frontend && ng serve                   # http://localhost:4200 (proxied to :8000)

# Reset database
cd backend && php artisan migrate:fresh --seed
```

## Task Execution

Tasks in `docs/init/` are numbered 00-15 and designed to be executed sequentially via `run-tasks.sh`. Task 00 installs PHP/Composer; tasks 01-15 build the app. Each task file contains complete instructions. The runner script handles git commits and idempotency — tasks already committed (checked via `[Task XX]` in git log) are skipped on re-run.
