---
name: login
description: Authenticate as Apex Construction admin, lands on /dashboard
produces: Authenticated browser session on /dashboard
---

## Commands

```bash
agent-browser open http://localhost:4200/login && \
agent-browser wait --load networkidle && \
agent-browser find label "Email" fill "admin@apexconstruction.com" && \
agent-browser find label "Password" fill "password" && \
agent-browser find text "Sign In" click && \
agent-browser wait --url "**/dashboard"
```

## Notes

- Uses semantic locators — no snapshot needed, runs as 1 bash call
- Credentials: `admin@apexconstruction.com` / `password`
- If already logged in, just navigate to `/dashboard` directly instead
- Check with `agent-browser get url` — if it contains `/dashboard`, skip login
