# Task 01 — Initialize Laravel Backend

## Objective

Create a new Laravel 11 project in `backend/`, configure it to use SQLite as the database, configure the bundled Laravel Sanctum for SPA authentication, and set up CORS to allow requests from the Angular dev server at `http://localhost:4200`.

## Prerequisites

- None (first task)
- PHP 8.2+ and Composer must be installed on the system

## Steps

### 1. Create the Laravel 11 project

```bash
cd /home/mike/Development/planhub-education
composer create-project laravel/laravel:^11.0 backend
```

### 2. Verify SQLite configuration

Laravel 11 defaults to SQLite. Verify `backend/.env` has:

```
DB_CONNECTION=sqlite
```

Remove or comment out `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` lines if present.

Ensure the SQLite database file exists:

```bash
touch backend/database/database.sqlite
```

### 3. Update application settings in `.env`

```
APP_NAME=PlanHub
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:4200
SESSION_DRIVER=database
```

### 4. Configure Laravel Sanctum

Sanctum is bundled by default in Laravel 11. Verify the config exists at `config/sanctum.php`.

Update `.env` to add:

```
SANCTUM_STATEFUL_DOMAINS=localhost:4200,localhost
```

### 5. Configure CORS

In Laravel 11, CORS is handled via `config/cors.php`. Update it with:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],
'allowed_origins' => ['http://localhost:4200'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

If `config/cors.php` does not exist, configure CORS via middleware in `bootstrap/app.php`.

### 6. Configure session for SPA auth

Ensure the session table migration exists and the session driver is set to `database`:

```bash
php artisan session:table  # if migration doesn't exist
php artisan migrate
```

### 7. Configure middleware for Sanctum SPA

In Laravel 11, middleware is configured in `bootstrap/app.php` (there is no `app/Http/Kernel.php`). Ensure the `EnsureFrontendRequestsAreStateful` middleware is applied to the `api` middleware group. Sanctum's service provider handles this automatically in Laravel 11, but verify it's working.

### 8. Verify the setup

```bash
cd backend
php artisan serve &
# In another terminal or via curl:
curl -s http://localhost:8000/api/user -w "\n%{http_code}"
# Should return 401 (unauthenticated) — this confirms the API is running
```

Stop the server after verification.

## Files Created/Modified

- `backend/` — Entire Laravel 11 project directory
- `backend/.env` — SQLite, app name, Sanctum, session config
- `backend/config/sanctum.php` — Stateful domains
- `backend/config/cors.php` — CORS settings for Angular dev server
- `backend/bootstrap/app.php` — Middleware configuration
- `backend/database/database.sqlite` — Empty SQLite database

## Acceptance Criteria

1. `cd backend && php artisan serve` starts without errors on port 8000
2. `curl http://localhost:8000/api/user` returns a 401 JSON response
3. `curl http://localhost:8000/sanctum/csrf-cookie -v` returns a 204 with a `Set-Cookie` header containing `XSRF-TOKEN`
4. SQLite database file exists at `backend/database/database.sqlite`
5. `php artisan migrate` runs successfully (creates session table and any default tables)
