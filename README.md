# Mother Nature Academy website

Next.js, FastAPI, and PostgreSQL website. The VPS deployment runs the app with systemd behind Apache; Docker is not required.

## Run locally on macOS without Docker

Run `./setup.sh` once from the project directory. It installs the Node and Python packages, prepares a local PostgreSQL database, and writes its credentials to the ignored `backend/.env` file. If PostgreSQL is missing and Homebrew is available, the script asks before installing PostgreSQL 16. It pre-fills the public GoDaddy SMTP server details but leaves the mailbox password blank, so SMTP is disabled by default. Settings later saved in the local admin are stored in the local database.

Then run `./start.sh`. Open `http://localhost:3000` to use the website. The API health endpoint is `http://localhost:8000/health`; press Ctrl+C in the script's terminal to stop both services. Setup and start scripts are for macOS development only and do not update the VPS.

After pulling a version that adds a new environment setting, rerun `./setup.sh` so the ignored local `backend/.env` receives any newly required key. Existing encryption keys are preserved; do not replace them if the database already contains encrypted data.

## Deploy on a VPS

Apache stays on ports 80 and 443. Next.js listens on `127.0.0.1:3000`, FastAPI on `127.0.0.1:8000`, and PostgreSQL remains private. Apache proxies `/api/`, `/health`, and `/media/` to FastAPI, then other requests to Next.js using `deploy/apache-mothernatureacademy.conf`.

### Clone and prepare

These instructions describe the current no-Docker deployment on Ubuntu 24.04. The deployment script uses the fixed path `/var/www/mothernatureacademy`; keep that path or update `APP_DIR` in `updateServer.sh` before using a different one. Install Git, Node.js 20 or later, Python 3.12, PostgreSQL, Apache, and `python3-venv`. The deployment script must run as root, so open a root shell before cloning and preparing the checkout:

```sh
sudo -i
git clone https://github.com/samtari1/MotherNatureAcademy.git /var/www/mothernatureacademy
cd /var/www/mothernatureacademy
```

If the repository is private, configure GitHub SSH authentication for root, which will run `git pull`; never put a GitHub token in the URL. If the checkout was created by another account, configure root's Git safe-directory once with `git config --global --add safe.directory /var/www/mothernatureacademy`.

Create a dedicated local PostgreSQL role and database. Generate a password with letters and digits only (for example, run `openssl rand -hex 32` and keep the output private), and use the same value for the role password and `DATABASE_URL` below. Open PostgreSQL as its administrative account:

```sh
sudo -u postgres psql
```

At the `postgres=#` prompt, create the role, securely set its password with `\password` (enter the generated password twice), create the database, then exit with `\q`:

```sql
CREATE ROLE mna_user WITH LOGIN;
\password mna_user
CREATE DATABASE mna OWNER mna_user;
```

Do not expose PostgreSQL port 5432 to the Internet. The app connects over localhost; the `db` hostname is only used by the optional Docker Compose configuration. The root `.env` and `POSTGRES_PASSWORD` are for Docker Compose and are not required for this systemd deployment.

Create a private backend environment file and Python virtual environment:

```sh
cp backend/.env.example backend/.env
chmod 600 backend/.env
python3 -m venv backend/.venv
```

Edit `backend/.env` with a secure editor. Set `DATABASE_URL` to `postgresql+psycopg://mna_user:YOUR_SAME_POSTGRES_PASSWORD@127.0.0.1:5432/mna`, `ALLOWED_ORIGINS` to the exact public HTTPS origins, and enter SMTP details supplied by the email provider. Set `ADMIN_COOKIE_SECURE=true` on the HTTPS VPS. Keep both `SMTP_CONFIG_ENCRYPTION_KEY` and `REGISTRATION_DATA_ENCRYPTION_KEY` stable and private. They encrypt saved SMTP passwords and the sensitive child health details submitted on registration applications; `updateServer.sh` creates missing keys on first run. Back up both keys separately and securely, because losing the registration key makes stored health details unreadable. Never commit `backend/.env` or share it in support messages. GoDaddy email uses its own mail host and DNS records; changing the website A records does not require changing MX, SPF, DKIM, or DMARC records.

### Build and start the applications

```sh
./backend/.venv/bin/pip install -r backend/requirements.txt
npm ci
NEXT_PUBLIC_API_URL=/ npm run build
systemctl restart mna-api mna-web
systemctl status mna-api mna-web --no-pager
curl -fsS http://127.0.0.1:3000/ >/dev/null
curl -fsS http://127.0.0.1:8000/health
```

The first `systemctl` commands work only after the `mna-api` and `mna-web` systemd unit files have been installed and configured to run the API and Next.js on `127.0.0.1:8000` and `127.0.0.1:3000`. These host-level unit files are not stored in this Git repository. Before replacing or rebuilding a working VPS, save their definitions with `systemctl cat mna-api mna-web` and keep them in a secure server-setup record. Ensure the API service user can read the application and `backend/.env`, and can write to the `media/` directory; `updateServer.sh` sets the media directory's owner based on the API service. Keep both app ports private behind Apache.

The API creates missing database tables and starter content on first start. It also applies the additive migration for the encrypted registration details column. SQLAlchemy `create_all` does not update other existing table definitions, so back up the database before deploying model changes and apply any required schema migration before updating the app.

### Configure Apache and HTTPS

Point the domain's A records to the VPS and allow inbound TCP ports 80 and 443. First bring up a working HTTP-only Apache virtual host so Let's Encrypt can validate the domain; then obtain the certificate with Certbot or your certificate manager. Enable `proxy`, `proxy_http`, `proxy_wstunnel`, `rewrite`, `headers`, and `ssl` modules using the commands for your distribution. Copy `deploy/apache-mothernatureacademy.conf` into the Apache virtual-host directory, confirm its `ServerName`, aliases, certificate paths, and the Next.js/FastAPI proxy ports, then run `apachectl configtest` and reload Apache. The sample redirects HTTP to HTTPS and proxies `/api/`, `/health`, and `/media/` to FastAPI and all other requests to Next.js.

Allow inbound TCP ports 80 and 443 through the VPS firewall. Verify the site, API health, and form over HTTPS. Submitting a test inquiry creates a real database record and may send an email.

### Preview and GoDaddy DNS

To preview, configure an Apache virtual host and certificate for `new.mothernatureacademy.com` and point only that subdomain's A record to the VPS. Keep the existing `@` and `www` website records on GoDaddy until launch. For cutover, point `@` to the VPS and `www` to the root domain or VPS. Preserve MX, SPF, DKIM, DMARC, and all other mail records so GoDaddy email continues working.

### Pull new code and redeploy

After changes are pushed to GitHub, SSH to the VPS and run as root (or use `sudo`):

```sh
cd /var/www/mothernatureacademy
sudo ./updateServer.sh
```

Replace `main` if the repository uses another default branch. View logs with `journalctl -u mna-api -u mna-web -n 100 --no-pager`.

## Email and inquiry handling

The backend stores each inquiry and registration application before attempting email notification. SMTP settings can be changed by a signed-in administrator under **Admin → Email**. Until an admin saves settings, the API reads the SMTP configuration from `backend/.env`. After saving, the SMTP host, port, username, sender, recipient, and STARTTLS choice are stored in PostgreSQL; a newly entered SMTP password is encrypted in the `mail_configuration` table. A blank password keeps the existing saved password, or falls back to `SMTP_PASSWORD` in `backend/.env` if none has been saved. The registration form's child health details are encrypted in PostgreSQL, returned only by the authenticated application-detail endpoint, and are never included in the SMTP email. Payment account information is not collected online. If email delivery fails, the application remains in PostgreSQL and can be viewed in Admin → Applications.

## Website admin

Open `/admin` and sign in with the username and password configured for the admin account. Under **Applications**, administrators can review each submission, including its decrypted health details, and permanently delete an application. The admin can also publish/edit/delete News posts and policy sections, upload and hide/delete campus photos, add/hide/delete YouTube videos, and update the school year, hours, campus location, tuition, registration fee, public contact information, and SMTP settings. Public pages read these values from the API. Uploaded media is saved in the ignored `media/` directory, so keep that directory in server backups.

The `/policies` page presents family-facing summaries seeded from the legacy handbook. Edit or unpublish sections in Admin → Policies; families can use Print / Save as PDF to produce a current copy. The old PDF is not copied to the public site because it contains superseded tuition and staff contact details.

Academic calendars are managed from Admin → Calendar. Each school year can have its own dates, notes, publication status, and current-year setting. Keep past years published to make them available in the archive selector on `/calendar`. The initial data is seeded from the calendar documents in `legacyWebsite` and persists in PostgreSQL; later edits are stored in the database.

On a local macOS environment, `./setup.sh` prompts once for an admin username and password, stores a password hash and session secret in the ignored `backend/.env`, and keeps SMTP disabled. Use `./start.sh` and visit `http://localhost:3000/admin`.

For a VPS already configured without Docker, set up the same admin credentials in the server's private environment file:

```sh
cd /var/www/mothernatureacademy/backend
./.venv/bin/python -m app.admin_setup
```

The setup tool prompts for a username and password, saves only a password hash, and generates a new admin session secret. It replaces any existing admin credentials in `backend/.env`. After it finishes on the VPS, edit that file and set `ADMIN_COOKIE_SECURE=true` (the setup tool defaults this setting to `false`, which is intended for local HTTP development), then restart the API:

```sh
nano /var/www/mothernatureacademy/backend/.env
systemctl restart mna-api
systemctl status mna-api --no-pager
```

To change the username or password later, run `./.venv/bin/python -m app.admin_setup` again from `/var/www/mothernatureacademy/backend`, enter the new credentials, restore `ADMIN_COOKIE_SECURE=true` in `backend/.env`, and restart `mna-api`. The tool also rotates the session secret, so existing admin sessions are invalidated and administrators must sign in again. Keep `/admin` restricted to trusted administrators. The application creates the content tables and starter settings when the API starts. Apache must proxy `/media/` to FastAPI as well as `/api/` and `/health`; the included Apache sample has those routes.

## Before public launch

- Confirm current tuition, fee, calendar, enrollment availability, and contact details.
- Replace temporary Unsplash stock photos with academy-approved images.
- Confirm form fields, recipient, privacy and retention policy. Do not collect sensitive child health information through the public inquiry form; the encrypted health section is limited to registration applications.
- Set up IP-aware rate limiting, monitoring, off-server database backups, and a tested restore.
- Keep the operating system and Node/Python dependencies updated; protect and rotate secrets.
- Back up PostgreSQL and `media/` together. The database contains families' registration details; encrypt backup files, restrict access, set a retention period, and verify restore steps before relying on the backups.
- Deleting an application in Admin removes it from the live database; copies may remain in backups until those backup sets expire under the retention schedule.
- Preserve the Apache virtual-host files, systemd unit files, DNS/mail records, and private environment files in the server migration plan. Recreate them on the replacement VPS; they are not all part of the Git repository.

## Pages

`/`, `/program`, `/curriculum`, `/campus`, `/hours`, `/calendar`, `/policies`, `/news`, `/contact`, `/register`, and `/admin`. Legacy `.html` paths redirect to the corresponding new routes.
