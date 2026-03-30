---
name: snapshot-verify
description: Quick page health check patterns
produces: Diagnostic output about current page state
---

## Quick Health Check (1 bash call)

```bash
AB=./node_modules/.bin/agent-browser && \
$AB get url && $AB get title && $AB snapshot -ic
```

Reports: current URL, page title, compact interactive element tree.

## Verify Specific Conditions

```bash
AB=./node_modules/.bin/agent-browser

# Check URL
$AB get url

# Check page title
$AB get title

# Check if element exists (search snapshot output for expected text)
$AB snapshot -i

# Check element text content
$AB get text @ref

# Screenshot for evidence
$AB screenshot

# Full-page screenshot
$AB screenshot --full

# Annotated screenshot (numbered element labels)
$AB screenshot --annotate
```

## Failure Pattern

When something looks wrong:
1. `$AB screenshot` — capture what the page looks like
2. `$AB snapshot -i` — get the element tree for debugging
3. Report the URL, what you expected, and what you found
4. Include the screenshot path so the user can inspect visually

## Notes

- Always use repo-local binary: `AB=./node_modules/.bin/agent-browser`
- `snapshot -ic` = interactive + compact (less output, faster to scan)
- `snapshot -i` = full interactive tree (more detail when debugging)
- Screenshots go to `~/.agent-browser/tmp/screenshots/` by default; include the path in your report
