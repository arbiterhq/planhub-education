---
name: login
description: Authenticate as Apex Construction admin, lands on /dashboard
produces: Authenticated browser session on /dashboard
---

## Commands

```bash
AB=./node_modules/.bin/agent-browser && \
$AB open http://localhost:4200/ && \
$AB wait --load networkidle && \
$AB find label "Email" fill "admin@apexconstruction.com" && \
$AB find label "Password" fill "password" && \
$AB find text "Sign In" click && \
$AB wait --load networkidle
```

## Notes

- Uses repo-local binary via `$AB` variable (never `npx` or global install)
- Opens `/` not `/login` — the proxy forwards `/login` to the backend (POST-only), so we let the Angular auth guard redirect client-side
- Uses `wait --load networkidle` (not `wait --url`) to avoid race conditions where navigation completes before the wait starts
- Uses semantic locators — no snapshot needed, runs as 1 bash call
- Credentials: `admin@apexconstruction.com` / `password`
- If already logged in, just navigate to `/dashboard` directly instead
- Check with `$AB get url` — if it contains `/dashboard`, skip login
