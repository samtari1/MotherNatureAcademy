# Mother Nature Academy website

Next.js, FastAPI, and PostgreSQL website. The VPS deployment runs the app with systemd behind Apache; Docker is not required.

## Run locally on macOS without Docker

Run `./setup.sh` once from the project directory. It installs the Node and Python packages, prepares a local PostgreSQL database, and writes its credentials to the ignored `backend/.env` file. If PostgreSQL is missing and Homebrew is available, the script asks before installing PostgreSQL 16. It leaves SMTP disabled, so local form submissions are saved locally and do not send email.

Then run `./start.sh`. Open `http://localhost:3000` to use the website. The API health endpoint is `http://localhost:8000/health`; press Ctrl+C in the script's terminal to stop both services. Setup and start scripts are for macOS development only and do not update the VPS.

## Deploy on a VPS

Apache stays on ports 80 and 443. Next.js listens on `127.0.0.1:3000`, FastAPI on `127.0.0.1:8000`, and PostgreSQL remains private. Apache proxies `/api/`, `/health`, and `/media/` to FastAPI, then other requests to Next.js using `deploy/apache-mothernatureacademy.conf`.

### Clone and prepare

SSH to the server, install Git, Node.js, Python, PostgreSQL, and Apache, then:

```sh
sudo mkdir -p /opt/mothernatureacademy
sudo chown "$USER":"$USER" /opt/mothernatureacademy
git clone https://github.com/samtari1/MotherNatureAcademy.git /opt/mothernatureacademy
cd /opt/mothernatureacademy
```

For a private repo, set up SSH authentication on the VPS. Do not put a GitHub token in the URL.

Create the private root environment file:

```sh
printf 'POSTGRES_PASSWORD=%s\nNEXT_PUBLIC_API_URL=/\n' "$(openssl rand -hex 32)" > .env
chmod 600 .env
```

Create the backend environment file:

```sh
cp backend/.env.example backend/.env
chmod 600 backend/.env
```

Edit `backend/.env` with a secure editor. Set `DATABASE_URL` to `postgresql+psycopg://mna_user:YOUR_SAME_POSTGRES_PASSWORD@db:5432/mna`, set `ALLOWED_ORIGINS` to the production HTTPS origins, and enter the SMTP host, user, password, and authorized sender issued by the email provider. Never commit these secret files.

### Build and start the applications

```sh
./backend/.venv/bin/pip install -r backend/requirements.txt
npm ci
NEXT_PUBLIC_API_URL=/ npm run build
sudo systemctl restart mna-api mna-web
sudo systemctl status mna-api mna-web --no-pager
curl -fsS http://127.0.0.1:3000/ >/dev/null
curl -fsS http://127.0.0.1:8000/health
```

Do not open port 5432 to the Internet. PostgreSQL should accept local connections only.

### Configure Apache and HTTPS

Enable `proxy`, `proxy_http`, `proxy_wstunnel`, `rewrite`, `headers`, and `ssl` modules using the commands for your distribution. Obtain a TLS certificate for the site with your existing certificate manager. Copy `deploy/apache-mothernatureacademy.conf` into the Apache virtual-host directory, verify certificate paths, enable the site, run `apachectl configtest`, and reload Apache. The supplied example redirects HTTP to HTTPS and sends `/api/` and `/health` to FastAPI, other paths to Next.js.

Allow inbound TCP ports 80 and 443 through the VPS firewall. Verify the site, API health, and form over HTTPS. Submitting a test inquiry creates a real database record and may send an email.

### Preview and GoDaddy DNS

To preview, configure an Apache virtual host and certificate for `new.mothernatureacademy.com` and point only that subdomain's A record to the VPS. Keep the existing `@` and `www` website records on GoDaddy until launch. For cutover, point `@` to the VPS and `www` to the root domain or VPS. Preserve MX, SPF, DKIM, DMARC, and all other mail records so GoDaddy email continues working.

### Pull new code and redeploy

After changes are pushed to GitHub, SSH to the VPS and run:

```sh
cd /opt/mothernatureacademy
git pull --ff-only origin main
./updateServer.sh
```

Replace `main` if the repository uses another default branch. View logs with `journalctl -u mna-api -u mna-web -n 100 --no-pager`.

## Email and inquiry handling

The backend stores each inquiry before attempting email notification. Configure authenticated SMTP using provider-authorized values in `backend/.env`. If delivery fails, the inquiry remains in PostgreSQL.

## Website admin

Open `/admin` and sign in with the username and password configured for the admin account. The admin page can publish/edit/delete News posts and policy sections, upload and hide/delete campus photos, add/hide/delete YouTube videos, and update the school year, hours, campus location, tuition, and registration fee. Public pages read these values from the API. Uploaded media is saved in the ignored `media/` directory, so keep that directory in server backups.

The `/policies` page presents family-facing summaries seeded from the legacy handbook. Edit or unpublish sections in Admin → Policies; families can use Print / Save as PDF to produce a current copy. The old PDF is not copied to the public site because it contains superseded tuition and staff contact details.

Academic calendars are managed from Admin → Calendar. Each school year can have its own dates, notes, publication status, and current-year setting. Keep past years published to make them available in the archive selector on `/calendar`. The initial data is seeded from the calendar documents in `legacyWebsite` and persists in PostgreSQL; later edits are stored in the database.

On a local macOS environment, `./setup.sh` prompts once for an admin username and password, stores a password hash and session secret in the ignored `backend/.env`, and keeps SMTP disabled. Use `./start.sh` and visit `http://localhost:3000/admin`.

For a VPS already configured without Docker, set up the same admin credentials in the server's private environment file:

```sh
cd /var/www/mothernatureacademy/backend
./.venv/bin/python -m app.admin_setup
```

Keep `/admin` restricted to trusted administrators. Set `ADMIN_COOKIE_SECURE=true` in the VPS `backend/.env` because the production site is served over HTTPS. The application creates the content tables and starter settings when the API starts. Apache must proxy `/media/` to FastAPI as well as `/api/` and `/health`; the included Apache sample has those routes.

## Before public launch

- Confirm current tuition, fee, calendar, enrollment availability, and contact details.
- Replace temporary Unsplash stock photos with academy-approved images.
- Confirm form fields, recipient, privacy and retention policy. Do not collect sensitive child health or personal data through the public inquiry form.
- Set up IP-aware rate limiting, monitoring, off-server database backups, and a tested restore.
- Keep operating system and container images updated; protect and rotate secrets.

## Pages

`/`, `/program`, `/curriculum`, `/campus`, `/hours`, `/calendar`, `/policies`, `/news`, `/contact`, `/register`, and `/admin`. Legacy `.html` paths redirect to the corresponding new routes.
