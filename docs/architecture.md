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
