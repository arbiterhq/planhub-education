---
name: create-project
description: Create a test project via the New Project dialog
produces: A new project named "E2E Test Project" in the projects table
---

## Commands

### Step 1: Open the dialog

```bash
AB=./node_modules/.bin/agent-browser && \
$AB open http://localhost:4200/projects && \
$AB wait --load networkidle && \
$AB find text "New Project" click && \
$AB wait 500
```

### Step 2: Fill the form and save

```bash
AB=./node_modules/.bin/agent-browser && \
$AB snapshot -i
```

Then fill using refs from the snapshot (dialog field order: Project Name, Project Type, Status, Address, City, State, Zip, Estimated Budget, dates, Description):

```bash
AB=./node_modules/.bin/agent-browser && \
$AB find label "Project Name" fill "E2E Test Project" && \
$AB find label "City" fill "Austin" && \
$AB find label "State" fill "TX" && \
$AB find label "Estimated Budget" fill "5000000" && \
$AB find text "Save" click && \
$AB wait 1000
```

### Step 3: Verify

```bash
AB=./node_modules/.bin/agent-browser && $AB snapshot -i
```

Look for "E2E Test Project" in the snapshot output and a success toast.

## Notes

- Always use repo-local binary: `AB=./node_modules/.bin/agent-browser`
- The Project Type and Status dropdowns are mat-selects — may need `snapshot -i` to get refs, then `$AB select @ref "Commercial Office"` etc.
- Mat-select dropdowns don't work with `find label` for selection — you need to click to open, then click the option.
- Clean up with reset-db if you don't want the test project to persist.
- Adapt field values as needed — these are just defaults for quick testing.
