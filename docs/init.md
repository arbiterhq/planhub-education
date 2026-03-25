# PlanHub Education — Initialization Plan

## Overview

This project is a **toy version of PlanHub.com's contractor/subcontractor management platform**, built to demonstrate how Claude Code can create a full-stack web application from scratch. The app lets you log in as a general contractor and manage construction projects, subcontractors, bids, invoices, and messages — all backed by realistic dummy data.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular + Angular Material | 18 |
| Backend | PHP / Laravel | 11 |
| Database | SQLite | 3 |
| Auth | Laravel Sanctum (SPA cookie-based) | — |

## Demo Persona

You log in as **Apex Construction Group**, a mid-size general contractor based in Austin, TX:

- **Company**: Apex Construction Group, est. 2003, ~150 employees
- **Admin User**: `admin@apexconstruction.com` / `password`
- **Projects**: 8 active construction projects ($4M–$22M) at various stages
- **Subcontractors**: 15–20 companies across 16 construction trades
- **Data**: Realistic bids, contracts, invoices, and messages at various statuses

## Project Structure

```
planhub-education/
├── backend/          # Laravel application
│   ├── app/
│   ├── database/
│   │   ├── migrations/
│   │   ├── factories/
│   │   ├── seeders/
│   │   └── database.sqlite
│   ├── routes/
│   └── ...
├── frontend/         # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Auth, guards, interceptors, services
│   │   │   ├── features/    # Feature modules (projects, subs, bids, etc.)
│   │   │   ├── shared/      # Shared components, pipes, models
│   │   │   └── app.routes.ts
│   │   ├── styles.scss
│   │   └── ...
│   └── proxy.conf.json
├── docs/
│   ├── init.md       # This file
│   └── init/         # Individual task files
└── README.md
```

## Quick Reference

```bash
# Backend (from /backend)
php artisan serve                    # Start Laravel on :8000
php artisan migrate:fresh --seed     # Reset DB with seed data

# Frontend (from /frontend)
ng serve                             # Start Angular on :4200 (proxies API to :8000)

# Login
# Email: admin@apexconstruction.com
# Password: password
```

## Task List

Execute these tasks in order. Each links to a detailed file that can be run via `claude -p "Read the file docs/init/XX-name.md and execute all of the instructions in it."`.

- [ ] **[Task 00 — Dev Environment Setup](init/00-dev-environment-setup.md)**
  Install PHP 8.3, required extensions, and Composer on Ubuntu 24.04 (WSL2).

- [ ] **[Task 01 — Initialize Laravel Backend](init/01-laravel-backend-scaffolding.md)**
  Create Laravel project in `backend/`, configure SQLite, install Sanctum, set up CORS.

- [ ] **[Task 02 — Initialize Angular Frontend](init/02-angular-frontend-scaffolding.md)**
  Create Angular 18 project in `frontend/`, add Angular Material 18, proxy config, minimal app shell.

- [ ] **[Task 03 — Database Schema, Models & Seed Data](init/03-database-schema-models-seeds.md)**
  Create all migrations (12+ tables), Eloquent models with relationships, factories, and a comprehensive realistic seeder.

- [ ] **[Task 04 — Authentication (Full Stack)](init/04-authentication-full-stack.md)**
  Laravel Sanctum auth API + Angular auth service, login page, route guards, HTTP interceptor.

- [ ] **[Task 05 — App Shell, Navigation & Dashboard](init/05-app-shell-navigation-dashboard.md)**
  Material toolbar, sidenav, theme, routing + Dashboard API + Dashboard page with KPI cards.

- [ ] **[Task 06 — Projects Backend API](init/06-projects-api.md)**
  CRUD endpoints for projects and project scopes with API resources and validation.

- [ ] **[Task 07 — Projects Frontend (List + Detail)](init/07-projects-frontend.md)**
  Projects list page with table/filters + tabbed project detail page.

- [ ] **[Task 08 — Subcontractors (Full Stack)](init/08-subcontractors-full-stack.md)**
  Subcontractor API + directory page (card grid) + detail page with stats.

- [ ] **[Task 09 — Bidding Backend API](init/09-bidding-api.md)**
  ITB and bid endpoints with auto-contract creation on bid acceptance.

- [ ] **[Task 10 — Bidding Frontend (ITBs + Review)](init/10-bidding-frontend.md)**
  Send ITBs stepper workflow + bid review/comparison page.

- [ ] **[Task 11 — Invoices (Full Stack)](init/11-invoices-full-stack.md)**
  Invoice API with approval workflow + list/detail UI with create/approve/pay actions.

- [ ] **[Task 12 — Messages (Full Stack)](init/12-messages-full-stack.md)**
  Simple messaging API + two-panel messaging UI.

- [ ] **[Task 13 — Activity Log & Integration](init/13-activity-log-integration.md)**
  Activity logging across features + cross-linking + breadcrumbs.

- [ ] **[Task 14 — Error Handling & Polish](init/14-error-handling-polish.md)**
  Global error handling, loading/empty states, confirmations, toast notifications.

- [ ] **[Task 15 — README & Final Verification](init/15-readme-final-verification.md)**
  Project README, architecture docs, end-to-end verification.

- [ ] **[Task 16 — Security & Authorization Fixes](init/16-security-authorization-fixes.md)**
  Fix SQL injection in sort fields, add missing authorization checks, add `under_review` bid action.

- [ ] **[Task 17 — Backend Bug Fixes & Code Quality](init/17-backend-bug-fixes.md)**
  Fix invoice race condition, ProjectResource count mismatch, N+1 queries, extract FormRequests.

- [ ] **[Task 18 — Frontend Bug Fixes & Code Quality](init/18-frontend-bug-fixes.md)**
  Fix bid review bug, missing types, CSS duplication, signal reactivity, service consistency.
