---
name: open-project-detail
description: Navigate into a project's detail page from the project list
produces: Browser on /projects/:id with detail view and tabs visible
---

## Commands

### Option A: Click first project in the list

```bash
agent-browser open http://localhost:4200/projects && \
agent-browser wait --load networkidle && \
agent-browser snapshot -i
```

Then find the first project row in the snapshot and click it. The table rows are clickable — clicking the name navigates to the detail page.

```bash
agent-browser click @ref && \
agent-browser wait --load networkidle && \
agent-browser snapshot -i
```

### Option B: Navigate directly by ID (if you know it)

```bash
agent-browser open http://localhost:4200/projects/1 && \
agent-browser wait --load networkidle && \
agent-browser snapshot -i
```

## What You'll See

- Project name as heading
- Status chip (colored)
- "Edit Project" button
- Tabs: "Overview", "Scopes", "Bids", "Contracts", "Invoices"
- Breadcrumb: "Projects" link for back navigation

## Switching Tabs

```bash
agent-browser find text "Scopes" click && agent-browser wait 500 && agent-browser snapshot -i
```

Replace "Scopes" with: "Overview", "Bids", "Contracts", "Invoices"

## Notes

- The project list table rows are clickable — clicking anywhere in the row navigates to detail
- Default tab is "Overview"
- Tab content loads lazily — wait briefly after switching
