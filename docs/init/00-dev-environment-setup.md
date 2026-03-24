# Task 00 — Dev Environment Setup

## Objective

Install PHP 8.3, required PHP extensions, and Composer on this Ubuntu 24.04 (WSL2) machine. Node.js and npm are already installed. This task prepares the system for Laravel 11 and Angular 18 development.

## Prerequisites

- None (first task — sets up the dev environment for everything else)
- sudo is passwordless on this machine

## Current State

Already installed:
- Node.js v24.x (via Proto)
- npm 11.x
- Git 2.43.x

Not installed:
- PHP (any version)
- Composer
- PHP extensions

## Steps

### 1. Update apt package index

```bash
sudo apt-get update
```

### 2. Install PHP 8.3 and required extensions

Ubuntu 24.04 ships PHP 8.3 in its default repos.

```bash
sudo apt-get install -y \
  php8.3 \
  php8.3-sqlite3 \
  php8.3-mbstring \
  php8.3-xml \
  php8.3-curl \
  php8.3-bcmath \
  php8.3-zip \
  php8.3-readline
```

What each extension is for:
- `php8.3` — PHP CLI and core (includes tokenizer, ctype, fileinfo, openssl, phar, filter, hash, pcre, session)
- `php8.3-sqlite3` — PDO SQLite driver (our database)
- `php8.3-mbstring` — multibyte string handling (Laravel requirement)
- `php8.3-xml` — DOM, SimpleXML, XMLReader/Writer (Laravel requirement)
- `php8.3-curl` — HTTP client support (Laravel requirement)
- `php8.3-bcmath` — precision math (used by some Laravel features)
- `php8.3-zip` — archive handling (required by Composer for package extraction)
- `php8.3-readline` — interactive shell support (for `php artisan tinker`)

### 3. Verify PHP installation

```bash
php --version
# Expected: PHP 8.3.x
```

### 4. Verify required extensions are loaded

```bash
php -m
```

Confirm these modules appear in the output:
- `bcmath`
- `curl`
- `ctype`
- `dom`
- `fileinfo`
- `mbstring`
- `openssl`
- `pdo_sqlite`
- `sqlite3`
- `tokenizer`
- `xml`
- `zip`

### 5. Install Composer

Use the official Composer installer:

```bash
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
```

### 6. Verify Composer installation

```bash
composer --version
# Expected: Composer version 2.x.x
```

### 7. Verify Node.js and npm (already installed)

```bash
node --version
# Expected: v24.x.x

npm --version
# Expected: 11.x.x
```

### 8. Verify Angular CLI is usable via npx

```bash
npx @angular/cli@18 version
```

This should download (if first run) and display the Angular CLI version. No global install is needed.

## What We Are NOT Installing

- **xdebug** — Not needed for this demo app
- **nginx / Apache** — Using Laravel's built-in dev server (`php artisan serve`)
- **MySQL / PostgreSQL** — Using SQLite (zero config)
- **Global Angular CLI** — Using `npx @angular/cli@18` instead

## Files Created/Modified

No project files are created or modified by this task — it only installs system-level packages.

## Acceptance Criteria

1. `php --version` outputs PHP 8.3.x
2. `php -m` includes: pdo_sqlite, sqlite3, mbstring, xml, curl, bcmath, zip, tokenizer, ctype, fileinfo, openssl, dom
3. `composer --version` outputs Composer 2.x.x
4. `node --version` outputs v24.x.x
5. `npm --version` outputs 11.x.x
