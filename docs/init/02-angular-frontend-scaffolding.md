# Task 02 — Initialize Angular Frontend

## Objective

Create a new Angular 18 project in `frontend/`, install Angular Material 18, configure a dev proxy to forward API requests to the Laravel backend, and set up a minimal application shell.

## Prerequisites

- Node.js 18+ and npm installed
- Task 01 not strictly required, but the proxy config targets the Laravel server at `localhost:8000`

## Steps

### 1. Create the Angular project

```bash
cd /home/mike/Development/planhub-education
npx @angular/cli@18 new frontend --routing --style=scss --ssr=false --standalone
```

Options explained:
- `--routing` — Sets up the Angular Router
- `--style=scss` — Use SCSS for stylesheets
- `--ssr=false` — No server-side rendering (SPA only)
- `--standalone` — Use standalone components (no NgModules)

### 2. Install Angular Material 18

```bash
cd frontend
npx ng add @angular/material@18 --theme=custom --animations=enabled --typography=true
```

When prompted:
- Choose **custom** theme (we'll define our own construction-themed palette)
- Enable **animations**
- Set up **global typography** styles

### 3. Configure the API proxy

Create `frontend/proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true
  },
  "/sanctum": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true
  },
  "/login": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true
  },
  "/logout": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true
  }
}
```

Update `angular.json` to use the proxy in the `serve` configuration:

```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### 4. Configure HttpClient for Sanctum

Update `frontend/src/app/app.config.ts` to provide `HttpClient` with credentials support:

```typescript
import { provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      })
    ),
  ]
};
```

### 5. Set up the frontend directory structure

Create the following directories under `frontend/src/app/`:

```
src/app/
├── core/           # Singleton services, guards, interceptors
│   ├── auth/       # Auth service, guard, interceptor
│   └── services/   # Shared API services
├── features/       # Feature areas (lazy-loaded routes)
│   ├── dashboard/
│   ├── projects/
│   ├── subcontractors/
│   ├── bids/
│   ├── invoices/
│   └── messages/
├── shared/         # Shared components, models, pipes
│   ├── components/
│   └── models/
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

### 6. Set up base routing structure

Update `frontend/src/app/app.routes.ts` with placeholder routes:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    // Will be wrapped with layout component and auth guard in Task 04/05
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'projects', loadComponent: () => import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent) },
      { path: 'projects/:id', loadComponent: () => import('./features/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) },
      { path: 'subcontractors', loadComponent: () => import('./features/subcontractors/subcontractor-list/subcontractor-list.component').then(m => m.SubcontractorListComponent) },
      { path: 'subcontractors/:id', loadComponent: () => import('./features/subcontractors/subcontractor-detail/subcontractor-detail.component').then(m => m.SubcontractorDetailComponent) },
      { path: 'bids', loadComponent: () => import('./features/bids/bid-list/bid-list.component').then(m => m.BidListComponent) },
      { path: 'bids/invite', loadComponent: () => import('./features/bids/send-itb/send-itb.component').then(m => m.SendItbComponent) },
      { path: 'invoices', loadComponent: () => import('./features/invoices/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent) },
      { path: 'messages', loadComponent: () => import('./features/messages/message-list/message-list.component').then(m => m.MessageListComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },
  { path: '**', redirectTo: 'dashboard' },
];
```

### 7. Create placeholder components

For each route above, create a minimal standalone component so the app compiles. Each component just needs:

```typescript
@Component({
  selector: 'app-feature-name',
  standalone: true,
  template: '<p>Feature Name — Coming Soon</p>',
})
export class FeatureNameComponent {}
```

Create placeholder components for:
- `features/login/login.component.ts`
- `features/dashboard/dashboard.component.ts`
- `features/projects/project-list/project-list.component.ts`
- `features/projects/project-detail/project-detail.component.ts`
- `features/subcontractors/subcontractor-list/subcontractor-list.component.ts`
- `features/subcontractors/subcontractor-detail/subcontractor-detail.component.ts`
- `features/bids/bid-list/bid-list.component.ts`
- `features/bids/send-itb/send-itb.component.ts`
- `features/invoices/invoice-list/invoice-list.component.ts`
- `features/messages/message-list/message-list.component.ts`

### 8. Clean up default content

Replace the default content in `app.component.ts`:

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: [':host { display: block; height: 100vh; }'],
})
export class AppComponent {}
```

### 9. Verify the setup

```bash
cd frontend
ng serve
```

Navigate to `http://localhost:4200` — should display "Dashboard — Coming Soon" (or redirect to dashboard).
Navigate to `http://localhost:4200/login` — should display "Login — Coming Soon".

## Files Created/Modified

- `frontend/` — Entire Angular project directory
- `frontend/proxy.conf.json` — API proxy configuration
- `frontend/angular.json` — Proxy config reference in serve options
- `frontend/src/app/app.config.ts` — HttpClient with XSRF config
- `frontend/src/app/app.routes.ts` — Full route structure with lazy loading
- `frontend/src/app/app.component.ts` — Minimal root component
- `frontend/src/app/features/*/` — Placeholder components for all routes
- `frontend/src/app/core/` — Empty directory structure
- `frontend/src/app/shared/` — Empty directory structure

## Acceptance Criteria

1. `cd frontend && ng serve` compiles without errors
2. `http://localhost:4200` loads and shows placeholder content
3. All routes are accessible without errors (`/login`, `/dashboard`, `/projects`, `/subcontractors`, `/bids`, `/invoices`, `/messages`)
4. Angular Material is installed (verify `@angular/material` in `package.json`)
5. Proxy config exists and targets `localhost:8000`
