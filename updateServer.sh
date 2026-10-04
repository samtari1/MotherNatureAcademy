#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/var/www/mothernatureacademy"
BRANCH="main"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  printf '\nERROR: %s\n' "$*" >&2
  exit 1
}

[[ "$(id -u)" -eq 0 ]] || fail "Run this script as root (for example: sudo /var/www/mothernatureacademy/updateServer.sh)."
[[ -d "$APP_DIR/.git" ]] || fail "Git repository not found at $APP_DIR."
[[ -x "$APP_DIR/backend/.venv/bin/pip" ]] || fail "Python virtual environment not found. Set up backend/.venv first."
[[ -f "$APP_DIR/backend/.env" ]] || fail "Missing $APP_DIR/backend/.env; refusing to restart the API without its configuration."
cd "$APP_DIR"

CURRENT_BRANCH="$(git branch --show-current)"
[[ "$CURRENT_BRANCH" == "$BRANCH" ]] || fail "Expected branch '$BRANCH', but the checkout is on '$CURRENT_BRANCH'."

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  fail "Tracked files have local changes. Review or commit them before updating."
fi

UNTRACKED_FILES="$(git ls-files --others --exclude-standard | grep -Ev '^(package-lock\.json|\.npm(/.*)?)$' || true)"
if [[ -n "$UNTRACKED_FILES" ]]; then
  fail "Unexpected untracked files exist. Review them before updating: $UNTRACKED_FILES"
fi

log "Fetching origin/$BRANCH"
git fetch origin "$BRANCH"

LOCAL_COMMIT="$(git rev-parse HEAD)"
REMOTE_COMMIT="$(git rev-parse "origin/$BRANCH")"
if [[ "$LOCAL_COMMIT" == "$REMOTE_COMMIT" ]]; then
  log "Already up to date with origin/$BRANCH"
elif git merge-base --is-ancestor HEAD "origin/$BRANCH"; then
  git merge --ff-only "origin/$BRANCH"
else
  fail "Local branch cannot be fast-forwarded to origin/$BRANCH. Resolve the branch history manually."
fi

log "Installing Python dependencies"
backend/.venv/bin/pip install -r backend/requirements.txt

if [[ -f package-lock.json ]]; then
  log "Installing Node dependencies from package-lock.json"
  npm ci
else
  log "No package-lock.json found; installing Node dependencies with npm install"
  npm install
fi

log "Building the Next.js production site"
NEXT_PUBLIC_API_URL=/ npm run build

# Next.js may add a generated reference to .next/types in this tracked helper file.
# The built application does not need that generated edit at runtime.
git restore --worktree -- next-env.d.ts

log "Restarting application services"
systemctl restart mna-api.service mna-web.service

log "Checking application services"
systemctl is-active --quiet mna-api.service || fail "mna-api.service is not active. Check: journalctl -u mna-api -n 100 --no-pager"
systemctl is-active --quiet mna-web.service || fail "mna-web.service is not active. Check: journalctl -u mna-web -n 100 --no-pager"

if ! curl --fail --silent --show-error http://127.0.0.1:8000/health; then
  fail "API health check failed. Check: journalctl -u mna-api -n 100 --no-pager"
fi
printf '\n'
if ! curl --fail --silent --show-error --output /dev/null http://127.0.0.1:3000/; then
  fail "Website health check failed. Check: journalctl -u mna-web -n 100 --no-pager"
fi

log "Update completed successfully"
systemctl --no-pager --full status mna-api.service mna-web.service
