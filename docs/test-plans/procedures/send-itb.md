---
name: send-itb
description: Walk through the ITB (Invitation to Bid) stepper to send bid invitations
produces: ITB sent to selected subcontractors for a project scope
---

## Commands

### Step 1: Open the stepper

```bash
agent-browser open http://localhost:4200/bids/invite && \
agent-browser wait --load networkidle && \
agent-browser snapshot -i
```

### Step 2: Select Project & Scope

The first step has "Project" and "Scope / Trade" dropdowns. These are mat-selects.

```bash
agent-browser snapshot -i
```

Find the "Project" dropdown ref, click to open it, then click an option from the panel. After selecting a project, the "Scope / Trade" dropdown populates.

```bash
agent-browser click @projectRef && \
agent-browser wait 300 && \
agent-browser snapshot -i
```

Click a project option, then:

```bash
agent-browser click @scopeRef && \
agent-browser wait 300 && \
agent-browser snapshot -i
```

Click a scope option, then click "Next":

```bash
agent-browser find text "Next" click && \
agent-browser wait 500 && \
agent-browser snapshot -i
```

### Step 3: Select Subcontractors

Check some subcontractors from the list, or use "Select All":

```bash
agent-browser find text "Select All" click && \
agent-browser find text "Next" click && \
agent-browser wait 500 && \
agent-browser snapshot -i
```

### Step 4: Review & Send

Review the summary, optionally add notes, then send:

```bash
agent-browser snapshot -i
```

The send button text includes the count, e.g., "Send 3 Invitation(s)". Find and click it:

```bash
agent-browser find text "Send" click && \
agent-browser wait 1000
```

## Notes

- This is the most complex workflow — 3 stepper steps with interdependent dropdowns
- Mat-select dropdowns require click-to-open then click-option (not `find label ... fill`)
- The stepper is linear — can't skip steps
- Subcontractors already invited for the same scope are disabled with "Already invited" badge
- After sending, a success notification appears
- The stepper can be fragile — snapshot between steps to stay oriented
