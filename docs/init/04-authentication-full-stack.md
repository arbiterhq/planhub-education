# Task 04 — Authentication (Full Stack)

## Objective

Implement cookie-based SPA authentication using Laravel Sanctum on the backend and Angular services/guards on the frontend. Users can log in with email/password, and all API routes are protected.

## Prerequisites

- Task 01 complete (Laravel with Sanctum configured)
- Task 02 complete (Angular with HttpClient and proxy configured)
- Task 03 complete (Users table seeded with login credentials)

## Steps

### Backend (Laravel)

#### 1. Create AuthController

Create `backend/app/Http/Controllers/AuthController.php`:

```php
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $request->session()->regenerate();

        $user = Auth::user()->load('company');

        return response()->json([
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out']);
    }

    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('company'),
        ]);
    }
}
```

#### 2. Define auth routes

In Laravel 11, session-based auth routes go in `routes/web.php`:


```php
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
```

In `routes/api.php`:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    // All future API routes go inside this group
});
```

#### 3. Verify backend auth flow

Test with curl:

```bash
# 1. Get CSRF cookie
curl -c cookies.txt http://localhost:8000/sanctum/csrf-cookie

# 2. Login
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: <token-from-cookie>" \
  -d '{"email":"admin@apexconstruction.com","password":"password"}'

# 3. Get authenticated user
curl -b cookies.txt http://localhost:8000/api/user
```

### Frontend (Angular)

#### 4. Create TypeScript interfaces

Create `frontend/src/app/shared/models/user.model.ts`:

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'gc_admin' | 'gc_member' | 'sub_admin' | 'sub_member';
  phone: string | null;
  job_title: string | null;
  company_id: number;
  company: Company;
}

export interface Company {
  id: number;
  name: string;
  type: 'general_contractor' | 'subcontractor';
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  license_number: string | null;
  established_year: number | null;
  employee_count: number | null;
}
```

#### 5. Create AuthService

Create `frontend/src/app/core/auth/auth.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor(private http: HttpClient) {}

  /** Fetch CSRF cookie from Sanctum before login */
  getCsrfCookie(): Observable<void> {
    return this.http.get<void>('/sanctum/csrf-cookie');
  }

  /** Login with email/password */
  login(email: string, password: string): Observable<{ user: User }> {
    return this.getCsrfCookie().pipe(
      switchMap(() => this.http.post<{ user: User }>('/login', { email, password }, { withCredentials: true })),
      tap(response => this.currentUserSignal.set(response.user))
    );
  }

  /** Logout and clear user state */
  logout(): Observable<void> {
    return this.http.post<void>('/logout', {}, { withCredentials: true }).pipe(
      tap(() => this.currentUserSignal.set(null))
    );
  }

  /** Fetch the current authenticated user (used on app init) */
  fetchUser(): Observable<User | null> {
    return this.http.get<{ user: User }>('/api/user', { withCredentials: true }).pipe(
      tap(response => this.currentUserSignal.set(response.user)),
      map(response => response.user),
      catchError(() => {
        this.currentUserSignal.set(null);
        return of(null);
      })
    );
  }
}
```

#### 6. Create auth guard

Create `frontend/src/app/core/auth/auth.guard.ts`:

```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Try to fetch user (handles page refresh with existing session)
  return authService.fetchUser().pipe(
    map(user => {
      if (user) return true;
      return router.createUrlTree(['/login']);
    })
  );
};
```

#### 7. Create HTTP interceptor

Create `frontend/src/app/core/auth/auth.interceptor.ts`:

A functional interceptor that:
- Adds `withCredentials: true` to all requests
- Adds `Accept: application/json` header
- Catches 401 responses and redirects to `/login`

Register it in `app.config.ts` using `withInterceptors([authInterceptor])`.

#### 8. Build the login page

Replace the placeholder `frontend/src/app/features/login/login.component.ts` with a full login component:

- Angular Material card centered on page
- "PlanHub" heading and "Sign in to your account" subheading
- `mat-form-field` for email input (type=email, required)
- `mat-form-field` for password input (type=password, required)
- "Sign In" button (`mat-raised-button`, color=primary)
- Error message display area (for invalid credentials)
- Hint text at the bottom: "Demo: admin@apexconstruction.com / password"
- Uses reactive forms (`FormGroup` with validators)
- On submit: calls `AuthService.login()`, on success navigates to `/dashboard`
- Loading state: disable button and show spinner during login request
- Full-page centered layout with a subtle background color

#### 9. Update route configuration

Update `frontend/src/app/app.routes.ts`:
- Add `canActivate: [authGuard]` to the parent route for authenticated pages
- Login route should redirect to `/dashboard` if already authenticated (use a `loginGuard` or check in the login component)

#### 10. Verify the full auth flow

1. Start Laravel: `cd backend && php artisan serve`
2. Start Angular: `cd frontend && ng serve`
3. Navigate to `http://localhost:4200` — should redirect to `/login`
4. Enter `admin@apexconstruction.com` / `password` — should redirect to `/dashboard`
5. Refresh the page — should stay on `/dashboard` (session persists)
6. Navigate to `/login` while authenticated — should redirect to `/dashboard`

## Files Created/Modified

### Backend
- `backend/app/Http/Controllers/AuthController.php`
- `backend/routes/web.php` — Login/logout routes
- `backend/routes/api.php` — Authenticated user route

### Frontend
- `frontend/src/app/shared/models/user.model.ts` — TypeScript interfaces
- `frontend/src/app/core/auth/auth.service.ts` — Authentication service
- `frontend/src/app/core/auth/auth.guard.ts` — Route guard
- `frontend/src/app/core/auth/auth.interceptor.ts` — HTTP interceptor
- `frontend/src/app/features/login/login.component.ts` — Login page (full rewrite)
- `frontend/src/app/app.routes.ts` — Updated with guards
- `frontend/src/app/app.config.ts` — Updated with interceptor

## Acceptance Criteria

1. Unauthenticated users are redirected to `/login`
2. Login with `admin@apexconstruction.com` / `password` succeeds and redirects to `/dashboard`
3. Login with wrong credentials shows an error message
4. After login, `GET /api/user` returns the user with company data
5. Page refresh after login maintains the session (no re-login required)
6. Logout clears the session and redirects to `/login`
7. The login page shows a hint with demo credentials
