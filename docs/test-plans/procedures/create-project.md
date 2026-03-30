---
name: create-project
description: Create a test project via the New Project dialog
produces: A new project named "E2E Test Project" in the projects table
---

## Commands

### Step 1: Open the dialog

```bash
agent-browser open http://localhost:4200/projects && \
agent-browser wait --load networkidle && \
agent-browser find text "New Project" click && \
agent-browser wait 500
```

### Step 2: Fill the form and save

```bash
agent-browser snapshot -i
```

Then fill using refs from the snapshot (dialog field order: Project Name, Project Type, Status, Address, City, State, Zip, Estimated Budget, dates, Description):

```bash
agent-browser find label "Project Name" fill "E2E Test Project" && \
agent-browser find label "City" fill "Austin" && \
agent-browser find label "State" fill "TX" && \
agent-browser find label "Estimated Budget" fill "5000000" && \
agent-browser find text "Save" click && \
agent-browser wait 1000
```

### Step 3: Verify

```bash
agent-browser snapshot -i
```

Look for "E2E Test Project" in the snapshot output and a success toast.

## Notes

- The Project Type and Status dropdowns are mat-selects — may need `snapshot -i` to get refs, then `agent-browser select @ref "Commercial Office"` etc.
- Mat-select dropdowns don't work with `find label` for selection — you need to click to open, then click the option.
- Clean up with reset-db if you don't want the test project to persist.
- Adapt field values as needed — these are just defaults for quick testing.
