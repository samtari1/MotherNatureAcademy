# Mother Nature Academy website

A Next.js site with a FastAPI inquiry service and PostgreSQL storage, packaged for a VPS with Docker Compose and Caddy.

## Local preview

Requirements: Node.js 20+, Python 3.12+ (or Docker Compose).

```sh
npm install
npm run dev
```

Run the API separately:

```sh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The API needs a PostgreSQL database. For a quick local stack, configure both environment files and use Docker Compose as described below. `NEXT_PUBLIC_API_URL` should point to the API (for example `http://localhost:8000` in local development, `/`-relative API routing via a same-origin proxy in production).

## VPS deployment

1. Install Docker Engine and the Docker Compose plugin on the VPS.
2. Copy this repository to the VPS and create a root `.env` based on `.env.example`. Set a long unique `POSTGRES_PASSWORD`, `SITE_DOMAIN`, and the public API base path.
3. Copy `backend/.env.example` to `backend/.env`. Set `DATABASE_URL=postgresql+psycopg://mna_user:YOUR_PASSWORD@db:5432/mna`, the allowed web origin, notification recipient, and SMTP details. Do not commit either env file.
4. The default `NEXT_PUBLIC_API_URL=/` uses the same-origin `/api/inquiries` route. The Caddy proxy routes `/api/*` to FastAPI and the other paths to Next.js. Rebuild the frontend if changing this public build argument.
5. Set `SITE_DOMAIN=mothernatureacademy.com` and run `docker compose up -d --build`.
6. Configure the firewall to allow inbound TCP 80 and 443, and test HTTPS, the inquiry flow, mail delivery, backups, and restore before switching production DNS.

Caddy obtains and renews TLS automatically once the domain resolves to the VPS and ports 80/443 are reachable. To preview, use a separate subdomain such as `new.mothernatureacademy.com`; keep the GoDaddy `@` and `www` records unchanged until the replacement is approved.

### GoDaddy DNS and mail

At launch, change only the web routing records: point the apex `@` A record to the VPS address, then update `www` to resolve to the apex (or point it to the VPS). Preserve MX, SPF, DKIM, DMARC, and mail-related records exactly as required by the current email provider. Existing screenshots showed a `new` host record directed to a different IP, but did not show the MX or TXT records; verify the full live zone before any DNS edits. Keeping the old shared-hosting plan does not itself change DNS or mailbox service.

### Email configuration

Use the current email service's authenticated SMTP settings or a transactional email provider. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` in `backend/.env`. `SMTP_FROM` must be an address authorized by that provider; do not assume a mailbox password or relay host will work as an SMTP sender. The API stores the inquiry first and records successful notification delivery. If email fails or is not configured, the form submission is still stored in PostgreSQL, but this starter has no admin dashboard or automatic retry queue. Add monitoring and a secure inbox/CRM workflow before relying on it for live enrollment.

## Information to confirm before production

- Current tuition and annual registration fee. Values on the hours page reflect public search-indexed content and may be out of date.
- Current calendar and enrollment availability.
- Correct public contact details, mailing address, and approved use of names/photos.
- The inquiry form fields, privacy/retention policy, and preferred notification recipient.
- Whether full enrollment documents, health details, payments, or agreements belong in a later secure enrollment process. Do not collect sensitive child information in this public inquiry form.

## Important production work

- Replace `Base.metadata.create_all` with Alembic migrations as the schema evolves.
- Add a proper shared rate limiter (for example at Caddy or with Redis), bot filtering, and monitoring.
- Back up PostgreSQL off-server on a schedule, restrict access to the backup, and rehearse a restore.
- Restrict database/network access, keep system and container images patched, and rotate secrets if exposed.
- Add a password-protected admin interface or another secure workflow to review stored inquiries. Database submissions contain parent and child-related information and should be treated as private.
- Use current, academy-owned campus and classroom imagery. The initial design currently uses temporary stock photos from Unsplash; replace them with approved images before public launch.

## Existing page mapping

- `/` — home
- `/program` — existing outdoor preschool program page
- `/curriculum` — curriculum and learning areas
- `/campus` — campus and outdoor activity spaces
- `/hours` — hours, tuition, registration fee, calendar note
- `/contact` — contact information
- `/register` — new inquiry form

Legacy `.html` URLs should redirect to the corresponding new paths at launch (for example `preschoolprogram.html` → `/program`, `hours.html` → `/hours`, `contact.html` → `/contact`). Add the full redirect list after confirming all live site paths and any search traffic.
