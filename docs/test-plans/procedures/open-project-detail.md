---
name: open-project-detail
description: Navigate into a project's detail page from the project list
produces: Browser on /projects/:id with detail view and tabs visible
---

## Commands

### Option A: Click first project in the list

```bash
AB=./node_modules/.bin/agent-browser && \
$AB open http://localhost:4200/projects && \
$AB wait --load networkidle && \
$AB snapshot -i
```

Then find the first project row in the snapshot and click it. The table rows are clickable — clicking the name navigates to the detail page.

```bash
AB=./node_modules/.bin/agent-browser && \
$AB click @ref && \
$AB wait --load networkidle && \
$AB snapshot -i
```

### Option B: Navigate directly by ID (if you know it)

```bash
AB=./node_modules/.bin/agent-browser && \
$AB open http://localhost:4200/projects/1 && \
$AB wait --load networkidle && \
$AB snapshot -i
```

## What You'll See

- Project name as heading
- Status chip (colored)
- "Edit Project" button
- Tabs: "Overview", "Scopes", "Bids", "Contracts", "Invoices"
- Breadcrumb: "Projects" link for back navigation

## Switching Tabs

```bash
AB=./node_modules/.bin/agent-browser && \
$AB find text "Scopes" click && $AB wait 500 && $AB snapshot -i
```

Replace "Scopes" with: "Overview", "Bids", "Contracts", "Invoices"

## Notes

- Always use repo-local binary: `AB=./node_modules/.bin/agent-browser`
- The project list table rows are clickable — clicking anywhere in the row navigates to detail
- Default tab is "Overview"
- Tab content loads lazily — wait briefly after switching
