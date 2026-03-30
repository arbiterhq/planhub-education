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
│   ├── init/                  # Individual task files (01-15)
│   └── test-plans/
│       └── procedures/        # Composable agent-browser building blocks
├── ecosystem.config.cjs       # PM2 process definitions (backend + frontend)
├── dev.sh                     # Dev server management (start/stop/restart/logs)
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

Both servers are managed via **PM2** (local install in node_modules):

```bash
./dev.sh start         # Start backend + frontend (deletes stale procs first)
./dev.sh stop          # Stop all services
./dev.sh restart       # Restart all services
./dev.sh status        # Show service status
./dev.sh logs          # Tail all logs (last 50 lines)
./dev.sh logs:back     # Tail backend logs only
./dev.sh logs:front    # Tail frontend logs only
./dev.sh reset-db      # Run migrate:fresh --seed
```

- **Backend**: http://localhost:8000 (PHP artisan serve via PM2)
- **Frontend**: http://localhost:4200 (Angular ng serve via PM2, proxied to :8000)
- **Config**: `ecosystem.config.cjs` defines both processes
- **PM2 binary**: `./node_modules/.bin/pm2` (repo-local, no global install needed)

### Managing Individual Processes

```bash
# Restart just the backend (e.g., after changing PHP code that isn't hot-reloaded)
./node_modules/.bin/pm2 restart backend

# Restart just the frontend
./node_modules/.bin/pm2 restart frontend

# Stop one service without affecting the other
./node_modules/.bin/pm2 stop backend
./node_modules/.bin/pm2 start backend

# View logs for a single process
./node_modules/.bin/pm2 logs backend --lines 100
./node_modules/.bin/pm2 logs frontend --lines 100
```

### Worktree / Parallel Development Sessions

When using `claude --worktree` for parallel feature branches, each worktree has its own copy of the repo but **shares the same PM2 daemon**. To avoid port conflicts:

1. **Don't run `./dev.sh start` from a worktree** — the main checkout's servers serve all worktrees since they share the same SQLite database and compiled frontend.
2. If you need isolated servers per worktree (e.g., testing different backend branches simultaneously), use different ports:
   ```bash
   # In the worktree, start manually on alternate ports
   cd backend && php artisan serve --port=8001 &
   cd frontend && npx ng serve --port 4201 --proxy-config proxy.conf.json &
   ```
   You'll also need to update `proxy.conf.json` in the worktree to point to the alternate backend port.
3. **Database**: All worktrees share `backend/database/database.sqlite` from the main checkout unless you create a separate SQLite file in the worktree's backend directory.

## Claude Code Tooling

### MCP Servers

**Chrome DevTools MCP** — Configured in `.claude/settings.json`. Provides 30 browser automation tools (click, fill, navigate, screenshot, network inspection, performance tracing, etc.) via Chrome DevTools Protocol. The MCP server launches Chrome automatically when tools are first invoked.

### Skills

**agent-browser** — Skill defined in `.claude/skills/agent-browser/SKILL.md`. A headless browser CLI for AI agents. Use for navigating pages, filling forms, clicking buttons, taking screenshots, and extracting data. Core workflow: `open` → `snapshot -i` → interact with `@refs` → re-snapshot.

**e2e-test** — Skill defined in `.claude/skills/e2e-test/SKILL.md`. Quick browser-based testing using composable building blocks. Invoke when asked to "test this", "verify the app", or "check if X works". Core chains for login (1 bash call) and navigation (1 bash call) are inline in the skill. Additional procedures live in `docs/test-plans/procedures/*.md` and grow over time as useful patterns are discovered.

### Permissions

Project-level permissions in `.claude/settings.json` grant full access to:
- All file operations (Read, Edit, Write, Glob, Grep)
- Shell execution (Bash)
- Web access (WebFetch, WebSearch)
- All Chrome DevTools MCP tools (`mcp__chrome-devtools__*`)
- agent-browser CLI (`Bash(agent-browser:*)`, `Bash(npx agent-browser:*)`)

### Dev Dependencies

Both tools are installed as project dev dependencies (see root `package.json`):
- `agent-browser` — browser automation CLI
- `chrome-devtools-mcp` — Chrome DevTools MCP server

Run `npm install` at the project root to install them locally.

## Task Execution

Tasks in `docs/init/` are numbered 00-15 and designed to be executed sequentially via `run-tasks.sh`. Task 00 installs PHP/Composer; tasks 01-15 build the app. Each task file contains complete instructions. The runner script handles git commits and idempotency — tasks already committed (checked via `[Task XX]` in git log) are skipped on re-run.
