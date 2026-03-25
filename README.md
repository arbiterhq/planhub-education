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
