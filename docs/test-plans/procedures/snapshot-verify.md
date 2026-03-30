---
name: snapshot-verify
description: Quick page health check patterns
produces: Diagnostic output about current page state
---

## Quick Health Check (1 bash call)

```bash
agent-browser get url && agent-browser get title && agent-browser snapshot -ic
```

Reports: current URL, page title, compact interactive element tree.

## Verify Specific Conditions

**Check URL:**
```bash
agent-browser get url
```

**Check page title:**
```bash
agent-browser get title
```

**Check if element exists by text:**
```bash
agent-browser snapshot -i
```
Then search the output for the expected text.

**Check element text content:**
```bash
agent-browser get text @ref
```

**Screenshot for evidence:**
```bash
agent-browser screenshot
```

**Full-page screenshot:**
```bash
agent-browser screenshot --full
```

**Annotated screenshot (numbered element labels):**
```bash
agent-browser screenshot --annotate
```

## Failure Pattern

When something looks wrong:
1. `agent-browser screenshot` — capture what the page looks like
2. `agent-browser snapshot -i` — get the element tree for debugging
3. Report the URL, what you expected, and what you found
4. Include the screenshot path so the user can inspect visually

## Notes

- `snapshot -ic` = interactive + compact (less output, faster to scan)
- `snapshot -i` = full interactive tree (more detail when debugging)
- Screenshots go to a temp directory by default; include the path in your report
