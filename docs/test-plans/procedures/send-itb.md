---
name: send-itb
description: Walk through the ITB (Invitation to Bid) stepper to send bid invitations
produces: ITB sent to selected subcontractors for a project scope
---

## Commands

### Step 1: Open the stepper

```bash
AB=./node_modules/.bin/agent-browser && \
$AB open http://localhost:4200/bids/invite && \
$AB wait --load networkidle && \
$AB snapshot -i
```

### Step 2: Select Project & Scope

The first step has "Project" and "Scope / Trade" dropdowns. These are mat-selects.

```bash
AB=./node_modules/.bin/agent-browser && $AB snapshot -i
```

Find the "Project" dropdown ref, click to open it, then click an option from the panel. After selecting a project, the "Scope / Trade" dropdown populates.

```bash
AB=./node_modules/.bin/agent-browser && \
$AB click @projectRef && \
$AB wait 300 && \
$AB snapshot -i
```

Click a project option, then:

```bash
AB=./node_modules/.bin/agent-browser && \
$AB click @scopeRef && \
$AB wait 300 && \
$AB snapshot -i
```

Click a scope option, then click "Next":

```bash
AB=./node_modules/.bin/agent-browser && \
$AB find text "Next" click && \
$AB wait 500 && \
$AB snapshot -i
```

### Step 3: Select Subcontractors

Check some subcontractors from the list, or use "Select All":

```bash
AB=./node_modules/.bin/agent-browser && \
$AB find text "Select All" click && \
$AB find text "Next" click && \
$AB wait 500 && \
$AB snapshot -i
```

### Step 4: Review & Send

Review the summary, optionally add notes, then send:

```bash
AB=./node_modules/.bin/agent-browser && $AB snapshot -i
```

The send button text includes the count, e.g., "Send 3 Invitation(s)". Find and click it:

```bash
AB=./node_modules/.bin/agent-browser && \
$AB find text "Send" click && \
$AB wait 1000
```

## Notes

- Always use repo-local binary: `AB=./node_modules/.bin/agent-browser`
- This is the most complex workflow — 3 stepper steps with interdependent dropdowns
- Mat-select dropdowns require click-to-open then click-option (not `find label ... fill`)
- The stepper is linear — can't skip steps
- Subcontractors already invited for the same scope are disabled with "Already invited" badge
- After sending, a success notification appears
- The stepper can be fragile — snapshot between steps to stay oriented
