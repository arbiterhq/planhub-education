---
name: navigate
description: Navigation patterns for all feature pages (assumes logged in)
produces: Browser on the target page with snapshot ready to read
---

## Commands

Replace `{page}` with the target path.

```bash
agent-browser open http://localhost:4200/{page} && \
agent-browser wait --load networkidle && \
agent-browser snapshot -i
```

## Available Pages

| Page | Path | What You'll See |
|------|------|-----------------|
| Dashboard | `/dashboard` | KPI cards, recent activity, bid deadlines |
| Projects | `/projects` | Table with search/status filters, "New Project" button |
| Project Detail | `/projects/{id}` | Tabs: Overview, Scopes, Bids, Contracts, Invoices |
| Subcontractors | `/subcontractors` | Card grid with name, trades, location |
| Sub Detail | `/subcontractors/{id}` | Profile, stats, bid history |
| Bids | `/bids` | Bid table with filters |
| Send ITB | `/bids/invite` | 3-step stepper |
| Invoices | `/invoices` | Invoice table with status workflow |
| Messages | `/messages` | Two-panel inbox/sent view |

## Via Sidenav (alternative)

If already on a page, click sidenav items instead of direct URL:

```bash
agent-browser find text "Projects" click && \
agent-browser wait --load networkidle && \
agent-browser snapshot -i
```

Sidenav items: "Dashboard", "Projects", "Subcontractors", "Bids", "Invoices", "Messages"

## Notes

- Always end navigation with `snapshot -i` so you can see what's on screen
- If the page redirects to `/login`, the session expired — re-run login procedure
- For detail pages, you need a valid ID from the database
