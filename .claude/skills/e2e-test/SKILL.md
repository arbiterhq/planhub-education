---
name: e2e-test
description: Quick browser-based testing of the PlanHub app using agent-browser. Trigger when the user says "test this", "verify the app", "check if X works", "smoke test", "test what we changed", or after completing a code change.
allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(cd backend*), Read, Write, Glob
---

# E2E Testing with Agent-Browser

You have composable building blocks for testing PlanHub via the real browser. Use them to quickly get into the right state, then improvise based on what the user asked.

**Philosophy**: Login fast, navigate fast, then spend your time on the actual testing. Adapt to what you see on screen — don't follow rigid scripts.

## Core Chains (memorize these)

### Login (1 bash call)

```bash
agent-browser open http://localhost:4200/login && \
agent-browser wait --load networkidle && \
agent-browser find label "Email" fill "admin@apexconstruction.com" && \
agent-browser find label "Password" fill "password" && \
agent-browser find text "Sign In" click && \
agent-browser wait --url "**/dashboard"
```

### Navigate to any page (1 bash call)

Replace `{page}` with: `dashboard`, `projects`, `subcontractors`, `bids`, `bids/invite`, `invoices`, `messages`

```bash
agent-browser open http://localhost:4200/{page} && \
agent-browser wait --load networkidle && \
agent-browser snapshot -i
```

### Quick page health check (1 bash call)

```bash
agent-browser get url && agent-browser get title && agent-browser snapshot -ic
```

## Speed Rules

1. **Use `find` for known elements** — `find label "Email" fill "x"` is one call, no snapshot needed
2. **Use `snapshot -i` when exploring** — when you need to see what's on the page
3. **Chain with `&&`** — batch 5-8 commands per bash call
4. **Suppress noise** — redirect intermediate output: `agent-browser open URL >/dev/null 2>&1 && ...`
5. **Screenshot on failure** — `agent-browser screenshot` captures evidence

## Semantic Locators Quick Reference

```bash
agent-browser find label "Email" fill "value"          # mat-form-field label
agent-browser find text "Sign In" click                # button/link text
agent-browser find placeholder "Search by name…" fill "query"  # placeholder text
agent-browser find role button click --name "Save"     # ARIA role + name
```

## Testing Protocol

When the user asks you to test something:

1. **Login** — run the login chain (1 call). Skip if already logged in (check with `agent-browser get url`).
2. **Navigate** — go to the relevant page (1 call, snapshot at end).
3. **Read the snapshot** — understand what's on screen from the accessibility tree.
4. **Improvise** — interact with the page based on what the user asked. Use `find` for known elements, `@refs` from snapshots for discovered ones.
5. **Verify** — check that things look right. Use `get text`, `get url`, `get title`, `snapshot`.
6. **Report** — tell the user what you found. Screenshot failures.

Don't follow a rigid checklist. Adapt to what you see. If a button moved or was renamed, figure it out from the snapshot.

## Known UI Elements

### Login Page (`/login`)
- Labels: "Email", "Password"
- Button: "Sign In" / "Signing in..."
- Hint: "Demo: admin@apexconstruction.com / password"

### Layout (toolbar + sidenav, visible on all pages after login)
- Sidenav items: "Dashboard", "Projects", "Subcontractors", "Bids", "Invoices", "Messages"
- Toolbar: company name "Apex Construction Group", user name, "Logout" button

### Dashboard (`/dashboard`)
- KPI cards: "Projects", "Active Bids", "Open Invoices", "Messages"
- Sections: "Recent Activity", "Upcoming Bid Deadlines"

### Projects (`/projects`)
- Filters: "Search projects" (placeholder "Search by name…"), "Status" dropdown
- Button: "New Project"
- Table columns: Name, Type, Status, Budget, Bid Due, Scopes
- Row menu: "View", "Edit", "Delete"

### Project Dialog (create/edit)
- Title: "New Project" / "Edit Project"
- Fields: "Project Name", "Project Type", "Status", "Address", "City", "State", "Zip", "Estimated Budget", "Start Date", "End Date", "Bid Due Date", "Description"
- Buttons: "Cancel", "Save" / "Saving…"

### Project Detail (`/projects/:id`)
- Tabs: "Overview", "Scopes", "Bids", "Contracts", "Invoices"
- Buttons: "Edit Project", "Add Scope"
- Back: "Projects" link

### Subcontractors (`/subcontractors`)
- Card grid with name, trades, location, win rate

### Bids (`/bids`)
- Table with filters

### Send ITB (`/bids/invite`)
- 3-step stepper: "Select Project & Scope" → "Select Subcontractors" → "Review & Send"
- Step 1: "Project" dropdown, "Scope / Trade" dropdown
- Step 2: "Search subcontractors" field, "Select All" / "Deselect All" buttons
- Step 3: "Notes (optional)" textarea, "Send X Invitation(s)" button

### Invoices (`/invoices`)
- Table with approval/payment workflow

### Messages (`/messages`)
- Two-panel inbox/sent/thread view

## Procedures Library

Additional building blocks live in `docs/test-plans/procedures/*.md`. Glob that directory to see what's available. Each file has a `Commands` section with a copy-pasteable bash chain.

**To add a new procedure**: Create a file in `docs/test-plans/procedures/` with this format:

```markdown
---
name: procedure-name
description: What it does
produces: What state the browser is in after running this
---

## Commands

(bash chain here)

## Notes

(any caveats)
```

Add a procedure when you discover a multi-step pattern that would be useful next time. Keep it minimal.

## Database Reset

If tests need a clean state:

```bash
cd backend && php artisan migrate:fresh --seed
```

This resets to the default seed data (8 projects, 18 subcontractors, bids, contracts, invoices, messages).
