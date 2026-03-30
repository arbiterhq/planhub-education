# Agent-Browser CLI vs Chrome DevTools MCP: Why Skills Beat MCP for Browser Automation

## The Problem

After making code changes, you want Claude to quickly verify the app still works. The browser automation tool you choose determines whether this takes 15 seconds or 5 minutes.

This project has both approaches configured:
- **Chrome DevTools MCP** — 30 browser tools exposed via Model Context Protocol
- **agent-browser CLI** — a shell command wrapped in a Claude Code skill

They both drive Chrome. The difference is *how Claude talks to them*, and that difference is enormous.

## The Core Issue: MCP Tools Are Individual Tool Calls

Every MCP tool invocation is a full round-trip: Claude generates a tool call, the system executes it, Claude reads the result, then decides what to do next. For browser automation, a simple login flow looks like this:

### MCP Approach (Chrome DevTools)

```
Tool call 1: mcp__chrome-devtools__navigate_page({ url: "http://localhost:4200/" })
  → Claude reads result, decides next step
Tool call 2: mcp__chrome-devtools__wait_for({ selector: "input[type=email]" })
  → Claude reads result, decides next step
Tool call 3: mcp__chrome-devtools__fill({ selector: "input[type=email]", value: "admin@..." })
  → Claude reads result, decides next step
Tool call 4: mcp__chrome-devtools__fill({ selector: "input[type=password]", value: "password" })
  → Claude reads result, decides next step
Tool call 5: mcp__chrome-devtools__click({ selector: "button[type=submit]" })
  → Claude reads result, decides next step
Tool call 6: mcp__chrome-devtools__wait_for({ selector: ".dashboard" })
  → Claude reads result, decides next step
Tool call 7: mcp__chrome-devtools__take_screenshot()
  → Claude reads result
```

**7 tool calls, 7 round-trips, 7 decision points.** Each round-trip includes Claude generating tokens, the MCP server processing the command, and Claude analyzing the result before proceeding. The actual browser operations take milliseconds — the overhead is in the LLM inference between each step.

### Skill + CLI Approach (agent-browser)

```
Tool call 1: Bash("AB=./node_modules/.bin/agent-browser && \
  $AB open http://localhost:4200/ && \
  $AB wait --load networkidle && \
  $AB find label 'Email' fill 'admin@apexconstruction.com' && \
  $AB find label 'Password' fill 'password' && \
  $AB find text 'Sign In' click && \
  $AB wait --load networkidle")
```

**1 tool call, 1 round-trip.** The entire login sequence executes as a single shell command chain. Claude doesn't need to see intermediate results — it already knows what the login form looks like (the skill told it), so it can fire the whole sequence blind.

## Why This Matters: Real Numbers

During our smoke test of the PlanHub app, we did:
1. Fresh login
2. Dashboard health check
3. Search projects (2 different queries)
4. Navigate into a project detail
5. Check the Scopes tab

**With agent-browser skill: 5 bash calls, ~15 seconds**

The same flow via MCP would require roughly:
- Login: 7 calls
- Dashboard check: 3 calls (navigate, wait, screenshot)
- Project search x2: 6 calls each (navigate, wait, fill search, wait, read results, screenshot)
- Project detail: 3 calls (click, wait, screenshot)
- Tab switch: 3 calls (click tab, wait, screenshot)

**With MCP: ~28 tool calls, ~3-5 minutes**

The bottleneck isn't the browser — it's the LLM round-trips between each step.

## Skills vs MCP: The Architectural Difference

### MCP: Tool-per-action

MCP exposes atomic operations. Each `click`, `fill`, `navigate`, `screenshot` is a separate tool in Claude's tool list. Claude must:

1. Decide which tool to call
2. Generate the tool call with parameters
3. Wait for execution
4. Read the result
5. Decide the next tool call
6. Repeat

This is powerful for *exploratory* work — when Claude doesn't know what's on the page and needs to react to each result. But for *known workflows* (login, navigation, form submission), the per-action granularity is pure overhead.

### Skills: Knowledge + Composition

A skill is a markdown document that teaches Claude *what it already knows*. The e2e-test skill contains:

- **Pre-computed chains** — the login sequence is written out as a bash one-liner. Claude doesn't need to figure it out each time.
- **UI element reference** — field labels, button text, page structure. Claude doesn't need to snapshot-and-discover before every interaction.
- **Composable building blocks** — login, navigate, verify, create-project are all single-call operations that Claude can chain in any order.
- **Domain knowledge** — the proxy caveat (don't navigate to `/login` directly), the `find` vs `snapshot` tradeoff, when to use `@refs` vs semantic locators.

The skill makes Claude *faster* by eliminating the thinking time between steps. It's the difference between a chef who knows a recipe by heart and one who has to look up each step.

### The Composition Advantage

Skills compose with each other in ways MCP tools cannot. Consider this scenario:

> "I just changed the project form validation. Test that it works, and if it doesn't, look at the code and fix it."

With the e2e-test skill, Claude can:
1. **Login + navigate** (1 bash call via e2e-test building blocks)
2. **Open the create dialog and try invalid inputs** (2-3 bash calls, improvised)
3. **If validation is broken**: read the Angular component code, the Laravel form request, fix the bug
4. **Re-test** (reuse the same building blocks, 2-3 more bash calls)

The skill seamlessly transitions between browser automation and code editing because both happen through the same interface (Claude's tool calls). MCP tools are isolated — they can drive the browser, but they can't read your source code or edit files.

Now imagine composing with *other* skills:

- **e2e-test + tdpf (Test-Document-Plan-Fix)**: Systematic debugging cycle where the browser test *is* the test step, and Claude iterates between testing and fixing
- **e2e-test + mods-llm**: Ask a second LLM for a code review while running browser tests in parallel
- **e2e-test + agent-browser**: The e2e-test skill *wraps* agent-browser with PlanHub-specific knowledge, adding a domain layer on top of a generic tool

MCP tools are leaves in the execution tree. Skills are nodes that can branch, compose, and delegate.

## When MCP Is Still Better

MCP isn't obsolete — it serves different use cases:

| Use Case | Better Tool | Why |
|----------|-------------|-----|
| **Known workflows** (login, navigation, form submission) | Skill + CLI | Pre-computed chains eliminate round-trips |
| **Exploratory testing** (what's on this page?) | MCP or CLI snapshot | Need to react to unknown content |
| **Performance profiling** | MCP | `lighthouse_audit`, `performance_start_trace` are specialized |
| **Network inspection** | MCP | `list_network_requests`, `get_network_request` have rich output |
| **Console debugging** | MCP | `list_console_messages` captures JS errors |
| **Pixel-level verification** | MCP | `take_screenshot` with specific viewports |

The Chrome DevTools MCP shines for *diagnostic* work — inspecting network requests, reading console errors, running Lighthouse audits. These are inherently single-shot operations where the per-call overhead doesn't matter.

The agent-browser skill shines for *operational* work — navigating, interacting, verifying. These are sequences where every round-trip you eliminate is time saved.

## The Meta-Lesson: Teach the Agent, Don't Add More Tools

The instinct when building AI-assisted workflows is to add more tools. Need browser automation? Add 30 MCP tools. Need database access? Add 10 more. Need deployment? 15 more.

But Claude already has `Bash`. It can run any CLI tool. The bottleneck isn't capability — it's *knowledge*. Claude doesn't know your app's login form has fields labeled "Email" and "Password". It doesn't know that `/login` is proxied to the backend. It doesn't know that `mat-select` dropdowns need click-to-open-then-click-option.

A skill file teaches Claude these things *once*, and then Claude can act autonomously with minimal round-trips. The skill doesn't add new capabilities — it adds *judgment* about when and how to use existing capabilities.

This is fundamentally different from MCP, which adds capabilities but no judgment. MCP gives Claude a `click` tool but doesn't tell it *what to click*. The skill says: "here's the login form, here's the chain, run it as one command."

## Summary

| Dimension | MCP (Chrome DevTools) | Skill (agent-browser e2e-test) |
|-----------|----------------------|-------------------------------|
| Tool calls per login | ~7 | 1 |
| Round-trips per smoke test | ~28 | ~5 |
| Wall time for smoke test | 3-5 min | ~15 sec |
| Pre-loaded domain knowledge | None | Full UI map, field labels, caveats |
| Composability with other skills | Limited | Native |
| Code editing integration | Separate workflow | Same conversation |
| Exploratory capability | Strong | Strong (via `snapshot`) |
| Diagnostic depth | Deep (network, console, perf) | Shallow (screenshot, text) |

**Use MCP for diagnostics. Use skills for operations. Teach the agent instead of adding more tools.**
