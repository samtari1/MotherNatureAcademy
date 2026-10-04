#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
info() { printf '\n%s\n' "$*"; }

[[ "$(uname -s)" == "Darwin" ]] || fail "This local setup script is for macOS. It will not change a VPS environment."
command -v node >/dev/null 2>&1 || fail "Node.js is required. Install Node.js 20 or later, then rerun ./setup.sh."
command -v npm >/dev/null 2>&1 || fail "npm is required. Install Node.js with npm, then rerun ./setup.sh."
command -v python3 >/dev/null 2>&1 || fail "Python 3 is required. Install Python 3.12 or later, then rerun ./setup.sh."
command -v openssl >/dev/null 2>&1 || fail "openssl is required to create a local database password."

PYTHON_BIN="$(command -v python3.12 || command -v python3)"
PYTHON_MINOR="$($PYTHON_BIN -c 'import sys; print(sys.version_info[0] * 100 + sys.version_info[1])')"
[[ "$PYTHON_MINOR" -ge 310 ]] || fail "Python 3.10 or later is required; found $($PYTHON_BIN --version)."

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
[[ "$NODE_MAJOR" -ge 20 ]] || fail "Node.js 20 or later is recommended; found $(node --version)."

BREW="$(command -v brew || true)"
if [[ -z "$BREW" ]]; then
  for candidate in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [[ -x "$candidate" ]]; then BREW="$candidate"; break; fi
  done
fi

if ! command -v psql >/dev/null 2>&1 && [[ -n "$BREW" ]]; then
  for candidate in /opt/homebrew/bin/psql /usr/local/bin/psql; do
    if [[ -x "$candidate" ]]; then PATH="$(dirname "$candidate"):$PATH"; export PATH; break; fi
  done
fi

if ! command -v psql >/dev/null 2>&1; then
  [[ -n "$BREW" ]] || fail "PostgreSQL is not installed and Homebrew was not found. Install PostgreSQL, or install Homebrew and rerun this script."
  printf 'PostgreSQL is not installed. Install PostgreSQL 16 with Homebrew now? [y/N] '
  read -r answer
  [[ "$answer" == "y" || "$answer" == "Y" ]] || fail "Install PostgreSQL 16, then rerun ./setup.sh."
  "$BREW" install postgresql@16
  PG_PREFIX="$("$BREW" --prefix postgresql@16)"
  PATH="$PG_PREFIX/bin:$PATH"
  export PATH
fi

if ! psql -d postgres -Atqc 'SELECT 1' >/dev/null 2>&1; then
  if [[ -n "$BREW" ]]; then
    FORMULA=""
    for formula in postgresql@18 postgresql@17 postgresql@16 postgresql@15 postgresql@14 postgresql; do
      if "$BREW" list --formula "$formula" >/dev/null 2>&1; then FORMULA="$formula"; break; fi
    done
    [[ -n "$FORMULA" ]] && "$BREW" services start "$FORMULA" >/dev/null || true
  fi
fi

psql -d postgres -Atqc 'SELECT 1' >/dev/null 2>&1 || fail "Cannot connect to local PostgreSQL. Start your PostgreSQL service and confirm that 'psql -d postgres' works, then rerun ./setup.sh."

if [[ ! -d backend/.venv ]]; then
  info "Creating backend Python environment"
  "$PYTHON_BIN" -m venv backend/.venv
fi

info "Installing Python packages"
backend/.venv/bin/python -m pip install --upgrade pip
backend/.venv/bin/pip install -r backend/requirements.txt

info "Installing Node packages"
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

if [[ ! -f backend/.env ]]; then cp backend/.env.example backend/.env; fi
chmod 600 backend/.env

# Rotate the local-only database credential each time setup is run. The generated
# password is hexadecimal, so it needs no URL encoding or shell/SQL escaping.
DB_PASSWORD="$(openssl rand -hex 24)"
if psql -d postgres -Atqc "SELECT 1 FROM pg_roles WHERE rolname='mna_local'" | grep -qx '1'; then
  psql -d postgres -v ON_ERROR_STOP=1 -c "ALTER ROLE mna_local WITH LOGIN PASSWORD '$DB_PASSWORD'" >/dev/null
else
  psql -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE mna_local WITH LOGIN PASSWORD '$DB_PASSWORD'" >/dev/null
fi
if psql -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname='mna_local'" | grep -qx '1'; then
  psql -d postgres -v ON_ERROR_STOP=1 -c 'ALTER DATABASE mna_local OWNER TO mna_local' >/dev/null
else
  psql -d postgres -v ON_ERROR_STOP=1 -c 'CREATE DATABASE mna_local OWNER mna_local' >/dev/null
fi

set_local_env() {
  local key="$1" value="$2"
  if grep -q "^${key}=" backend/.env; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" backend/.env
  else
    printf '%s=%s\n' "$key" "$value" >> backend/.env
  fi
}

set_local_env DATABASE_URL "postgresql+psycopg://mna_local:${DB_PASSWORD}@localhost:5432/mna_local"
set_local_env ALLOWED_ORIGINS "http://localhost:3000,http://127.0.0.1:3000"
# Keep local submissions in the local database; SMTP remains disabled because the password is blank.
set_local_env SMTP_HOST "p3plzcpnl504528.prod.phx3.secureserver.net"
set_local_env SMTP_USER "notification@mothernatureacademy.com"
set_local_env SMTP_PASSWORD ""
set_local_env SMTP_FROM "notification@mothernatureacademy.com"
set_local_env NOTIFICATION_EMAIL "Laura@MotherNatureAcademy.com"
set_local_env SMTP_PORT "465"
set_local_env SMTP_STARTTLS "false"
if ! grep -q '^SMTP_CONFIG_ENCRYPTION_KEY=.' backend/.env; then
  SMTP_CONFIG_ENCRYPTION_KEY="$(backend/.venv/bin/python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')"
  set_local_env SMTP_CONFIG_ENCRYPTION_KEY "$SMTP_CONFIG_ENCRYPTION_KEY"
  unset SMTP_CONFIG_ENCRYPTION_KEY
fi
set_local_env ADMIN_COOKIE_SECURE "false"
chmod 600 backend/.env
unset DB_PASSWORD

if ! grep -q '^ADMIN_PASSWORD_HASH=.' backend/.env || ! grep -q '^ADMIN_SESSION_SECRET=.' backend/.env; then
  info "Create a private admin login"
  (cd backend && .venv/bin/python -m app.admin_setup)
fi

info "Local setup is ready. Run ./start.sh to launch the website and API."
printf 'The local registration form will save to PostgreSQL and will not send email (SMTP is disabled locally).\n'
