#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# PlanHub Education — Idempotent Task Runner
#
# Executes docs/init/00-*.md through docs/init/15-*.md sequentially using
# claude -p. Each completed task is committed with [Task XX] in the message.
# On re-run, already-committed tasks are skipped.
#
# Usage:  bash run-tasks.sh
# Stop:   Ctrl+C (clean exit, no partial commits)
# Resume: bash run-tasks.sh  (skips completed tasks automatically)
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --- Task definitions: number|filename|title ---
TASKS=(
  "00|00-dev-environment-setup.md|Dev Environment Setup"
  "01|01-laravel-backend-scaffolding.md|Initialize Laravel Backend"
  "02|02-angular-frontend-scaffolding.md|Initialize Angular Frontend"
  "03|03-database-schema-models-seeds.md|Database Schema, Models & Seed Data"
  "04|04-authentication-full-stack.md|Authentication (Full Stack)"
  "05|05-app-shell-navigation-dashboard.md|App Shell, Navigation & Dashboard"
  "06|06-projects-api.md|Projects Backend API"
  "07|07-projects-frontend.md|Projects Frontend (List + Detail)"
  "08|08-subcontractors-full-stack.md|Subcontractors (Full Stack)"
  "09|09-bidding-api.md|Bidding Backend API"
  "10|10-bidding-frontend.md|Bidding Frontend (ITBs + Review)"
  "11|11-invoices-full-stack.md|Invoices (Full Stack)"
  "12|12-messages-full-stack.md|Messages (Full Stack)"
  "13|13-activity-log-integration.md|Activity Log & Cross-Feature Integration"
  "14|14-error-handling-polish.md|Error Handling, Loading States & Polish"
  "15|15-readme-final-verification.md|README & Final Verification"
)

# --- State tracking ---
INTERRUPTED=false
COMPLETED=()
SKIPPED=()
FAILED=""

# --- Ctrl+C handler ---
cleanup() {
  INTERRUPTED=true
  echo ""
  echo "============================================"
  echo "  Interrupted! No partial commit was made."
  echo "============================================"
  print_summary
  exit 130
}
trap cleanup SIGINT SIGTERM

# --- Summary printer ---
print_summary() {
  echo ""
  echo "============================================"
  echo "  Task Execution Summary"
  echo "============================================"
  if [ ${#SKIPPED[@]} -gt 0 ]; then
    echo ""
    echo "  Skipped (already committed):"
    for s in "${SKIPPED[@]}"; do
      echo "    - $s"
    done
  fi
  if [ ${#COMPLETED[@]} -gt 0 ]; then
    echo ""
    echo "  Completed this run:"
    for c in "${COMPLETED[@]}"; do
      echo "    + $c"
    done
  fi
  if [ -n "$FAILED" ]; then
    echo ""
    echo "  Failed:"
    echo "    ! $FAILED"
  fi
  remaining=$(( ${#TASKS[@]} - ${#SKIPPED[@]} - ${#COMPLETED[@]} - ([ -n "$FAILED" ] && echo 1 || echo 0) ))
  if [ "$remaining" -gt 0 ] && [ -z "$FAILED" ] && [ "$INTERRUPTED" = true ]; then
    echo ""
    echo "  Remaining: $remaining task(s)"
  fi
  echo "============================================"
}

# --- Initialize git repo if needed ---
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init
  git add -A
  git commit -m "Initial commit: project docs and task files"
  echo ""
fi

# --- Main loop ---
echo "============================================"
echo "  PlanHub Education — Task Runner"
echo "  ${#TASKS[@]} tasks to process"
echo "  Ctrl+C to stop cleanly"
echo "============================================"
echo ""

for task_entry in "${TASKS[@]}"; do
  IFS='|' read -r num filename title <<< "$task_entry"

  task_tag="[Task $num]"
  task_file="docs/init/$filename"
  display="$task_tag $title"

  # --- Idempotency check: look for [Task XX] in git log ---
  if git log --oneline --all 2>/dev/null | grep -qF "$task_tag"; then
    echo "SKIP  $display (already committed)"
    SKIPPED+=("$display")
    continue
  fi

  # --- Verify task file exists ---
  if [ ! -f "$task_file" ]; then
    echo "ERROR $display — file not found: $task_file"
    FAILED="$display (file not found)"
    break
  fi

  echo ""
  echo "--------------------------------------------"
  echo "START $display"
  echo "      File: $task_file"
  echo "--------------------------------------------"
  echo ""

  # --- Run claude -p ---
  if ! claude -p --dangerously-skip-permissions "You have a CLAUDE.md file in the project root with full project context — read it first. Then read and execute ALL instructions in the file: $task_file"; then
    echo ""
    echo "ERROR $display — claude -p exited with non-zero status"
    FAILED="$display (claude -p failed)"
    break
  fi

  # --- Commit changes ---
  echo ""
  echo "Committing: $task_tag $title"
  git add -A
  if git diff --cached --quiet; then
    echo "WARN  No changes to commit for $display (task may have been a no-op)"
    COMPLETED+=("$display (no changes)")
  else
    git commit -m "$(cat <<EOF
$task_tag $title

Executed via run-tasks.sh using claude -p.
Task file: $task_file
EOF
)"
    COMPLETED+=("$display")
  fi

  echo "DONE  $display"
done

# --- Final summary ---
print_summary
