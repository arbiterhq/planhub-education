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

### 3. Install root dependencies (PM2, browser tools)

    cd ..
    npm install

### 4. Start the dev servers

Both servers are managed via PM2:

    ./dev.sh start

This starts:
- **Backend** at http://localhost:8000 (Laravel via `php artisan serve`)
- **Frontend** at http://localhost:4200 (Angular via `ng serve`, proxied to backend)

Other commands:

    ./dev.sh stop          # Stop all services
    ./dev.sh restart       # Restart all services
    ./dev.sh status        # Show service status
    ./dev.sh logs          # Tail logs from all services
    ./dev.sh logs:back     # Tail backend logs only
    ./dev.sh logs:front    # Tail frontend logs only
    ./dev.sh reset-db      # Reset database to seed state

#### Managing individual processes

    # Restart just the backend or frontend
    ./node_modules/.bin/pm2 restart backend
    ./node_modules/.bin/pm2 restart frontend

    # View logs for one process
    ./node_modules/.bin/pm2 logs backend --lines 100

#### Running without PM2

If you prefer manual control:

    cd backend && php artisan serve           # Terminal 1
    cd frontend && ng serve                   # Terminal 2

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

## Claude Code Setup

This project includes configuration for [Claude Code](https://claude.ai/claude-code) with browser automation tools pre-configured.

### What's included

| Tool | Type | Purpose |
|------|------|---------|
| [Chrome DevTools MCP](https://github.com/nichochar/chrome-devtools-mcp) | MCP Server | 30 browser tools via Chrome DevTools Protocol — click, fill, navigate, screenshot, network inspection, performance tracing |
| [agent-browser](https://github.com/vercel-labs/agent-browser) | Skill (CLI) | Headless browser automation CLI — navigate, snapshot, interact with element refs, capture screenshots |

### Prerequisites

- **Claude Code** CLI installed ([installation guide](https://docs.anthropic.com/en/docs/claude-code/overview))
- **Google Chrome** (stable) — required by both tools
- **Node.js 20.19+** — required by chrome-devtools-mcp

### Quick start

```bash
# 1. Install project dependencies (includes both browser tools)
npm install

# 2. (Optional) Install Chrome for agent-browser if not already available
npx agent-browser install

# 3. Start Claude Code — settings and permissions are auto-loaded from .claude/
claude
```

### How it works

- **`.claude/settings.json`** — Configures the Chrome DevTools MCP server and grants permissions for all tools (file I/O, shell, web access, MCP tools, agent-browser CLI)
- **`.claude/skills/agent-browser/SKILL.md`** — Skill definition that teaches Claude when and how to use the agent-browser CLI
- Both `chrome-devtools-mcp` and `agent-browser` are installed as dev dependencies in the root `package.json`, so `npx` resolves them locally

### Usage examples

Once inside Claude Code, you can ask things like:

- "Open http://localhost:4200 and take a screenshot of the dashboard"
- "Fill out the login form with the demo credentials and verify the redirect"
- "Run a Lighthouse audit on the projects page"
- "Navigate to the bids page, snapshot the table, and extract the bid amounts"

### Permissions

The project `.claude/settings.json` grants full permissions for all tools. If you want to restrict access, edit `.claude/settings.json` and remove entries from the `permissions.allow` array.

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
