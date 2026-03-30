---
name: reset-db
description: Reset database to default seed state
produces: Clean database with 8 projects, 18 subcontractors, bids, contracts, invoices, messages
---

## Commands

```bash
cd /home/mike/Development/planhub-education/backend && php artisan migrate:fresh --seed
```

## When to Use

- Before testing if previous test runs created/modified data
- When a test leaves the database in a weird state
- When you need a known starting point for data-dependent tests

## Seed Data Summary

- **Company**: Apex Construction Group (Austin, TX)
- **User**: admin@apexconstruction.com / password
- **Projects**: 8 (various statuses: Planning, Bidding, In Progress, Completed, On Hold)
- **Subcontractors**: ~18 across 16 trades
- **Bids**: ~40+ in various states
- **Contracts**: Created from accepted bids
- **Invoices**: Various statuses (draft, submitted, approved, paid)
- **Messages**: Sample conversations between users

## Notes

- This is destructive — wipes all data and re-seeds
- Backend server does NOT need to be restarted after reset
- Takes ~2-3 seconds
