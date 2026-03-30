#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# Use the repo-local pm2 from node_modules
PM2="./node_modules/.bin/pm2"
if [[ ! -x "$PM2" ]]; then
  echo "pm2 not found. Run 'npm install' from the repo root." >&2
  exit 1
fi

usage() {
  cat <<EOF
Usage: ./dev.sh <command>

Commands:
  start       Start backend + frontend (skip if already running)
  stop        Stop all services
  restart     Restart all services
  status      Show service status
  logs        Tail logs from all services
  logs:back   Tail backend logs only
  logs:front  Tail frontend logs only
  reset-db    Run migrate:fresh --seed on the backend
EOF
}

case "${1:-}" in
  start)
    # Delete stale processes before starting to avoid duplicates
    $PM2 delete ecosystem.config.cjs 2>/dev/null || true
    $PM2 start ecosystem.config.cjs
    echo ""
    $PM2 status
    echo ""
    echo "Backend:  http://localhost:8000"
    echo "Frontend: http://localhost:4200"
    ;;
  stop)
    $PM2 delete ecosystem.config.cjs
    ;;
  restart)
    $PM2 restart ecosystem.config.cjs
    ;;
  status)
    $PM2 status
    ;;
  logs)
    $PM2 logs --lines 50
    ;;
  logs:back)
    $PM2 logs backend --lines 50
    ;;
  logs:front)
    $PM2 logs frontend --lines 50
    ;;
  reset-db)
    cd backend && php artisan migrate:fresh --seed
    ;;
  *)
    usage
    exit 1
    ;;
esac
