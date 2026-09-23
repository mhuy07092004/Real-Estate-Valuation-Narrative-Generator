# Infra (Terraform)

Provisions the backend's GCP infrastructure: the Cloud SQL Postgres instance
and the Cloud Run service that serves the API. Both are live (see "Status"
below). Render is still running the same backend image in parallel until the
frontend is cut over. Cloud Storage is a later step.
See `main.tf`/`outputs.tf` comments for what each resource is for.

## Status

- ✅ `relaive-db` Cloud SQL instance created (`australia-southeast1`)
- ✅ `backend/prisma/schema.prisma` switched from `sqlite` to `postgresql`
- ✅ Old SQLite-era migrations deleted (they don't replay against Postgres —
  a fresh baseline migration replaced them: `20260916161727_init_postgres`)
- ✅ Schema migrated and seeded — roles, demo account, and the full
  bronze-listings/market-intelligence ingestion all re-run against this
  instance (33k+ properties/comparable sales, 800+ suburb rows)
- ✅ Local dev's `backend/.env` `DATABASE_URL` now points at this instance
  directly, via the IP allowlist (see below)
- ✅ Cloud Run service `relaive-backend` deployed (`cloud_run.tf`), public, connected to Cloud SQL over the built-in socket
- ✅ Render reaches the same database over the public IP (its outbound ranges are in `authorized_ips`, see "Render's access to the database")
- ⬜ Cut the frontend over from Render to Cloud Run (`VITE_API_BASE_URL` on Vercel), then remove Render's ranges from `authorized_ips`
- ⬜ Cloud Storage bucket for ingestion datasets

## What this creates

- A Cloud SQL for PostgreSQL instance (`google_sql_database_instance`)
- One database inside it (`google_sql_database`)
- An app-specific Postgres user, separate from the instance's root user
  (`google_sql_user`)
- A randomly generated password for that user (`random_password`)
- Enables the Cloud SQL Admin API on the project, if not already on
- A Cloud Run v2 service `relaive-backend` (image from `backend_image`, port 4000, env from `backend_env` and `backend_secrets`, and a `DATABASE_URL` built for the `/cloudsql` socket)
- A public `allUsers` → `roles/run.invoker` binding on that service
- `roles/cloudsql.client` for the default compute service account, so the container can reach the database
- Enables the Cloud Run API

It does **not** create Cloud Storage or touch the Render deployment.

## Prerequisites

1. **Terraform** ≥ 1.5 — https://developer.hashicorp.com/terraform/install
2. **Google Cloud CLI** (`gcloud`) — https://cloud.google.com/sdk/docs/install
3. Authenticate `gcloud` with an account that has **Editor**, **Project IAM
   Admin** (Editor cannot set project IAM, which the `cloudsql.client` grant
   needs) and **Cloud Run Admin** (needed for the public access binding —
   Project IAM Admin alone fails with `403 run.services.setIamPolicy`) on the
   `csit321-508209` project (or whichever project you point `var.project_id`
   at). A project Owner can grant the last two:
   ```bash
   gcloud projects add-iam-policy-binding csit321-508209 --member="user:<you>" --role="roles/resourcemanager.projectIamAdmin"
   gcloud projects add-iam-policy-binding csit321-508209 --member="user:<you>" --role="roles/run.admin"
   ```
   Then log in:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   gcloud config set project csit321-508209
   ```
   Terraform's `google` provider picks up these application-default
   credentials automatically — no separate service-account key needed for
   local use.

## Reproduce everything, start to finish

Numbered steps for a new teammate or a fresh project. Each step is explained
in the section named after it.

1. **Get permissions** (Prerequisites above): Editor + Project IAM Admin + Cloud Run Admin.
2. **Log in:** `gcloud auth login`, `gcloud auth application-default login`, `gcloud config set project csit321-508209`.
3. **Create `infra/terraform/terraform.tfvars`** (gitignored). Every value is yours to supply:
   ```hcl
   authorized_ips = ["<your-ipv4>/32"]                       # curl -4 ifconfig.me
   backend_image  = "docker.io/<dockerhub-user>/relaive-backend:latest"
   backend_secrets = {
     JWT_ACCESS_SECRET      = "<64 random hex chars>"        # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     JWT_REFRESH_SECRET     = "<64 random hex chars>"
     SENDGRID_API_KEY       = "<key>"
     SENDGRID_FROM_EMAIL    = "<verified sender>"
     GOOGLE_MAPS_SERVER_KEY = "<server key>"
     TURNSTILE_SECRET_KEY   = "<key or empty>"
   }
   ```
   Non-secret settings (`CORS_ORIGIN`, `PUBLIC_APP_URL`, `ML_PRICE_PREDICTION_URL`, `TRUST_PROXY`, the `VERTEX_*` values) are defaults in `variables.tf` — edit them there, not in tfvars.
4. **Provision:** `terraform init`, `terraform plan`, `terraform apply` (creates Cloud SQL, the database and user, Cloud Run, IAM).
5. **Load data** into a brand-new database — see "Loading data into a fresh instance".
6. **Verify Cloud Run:** `curl $(terraform output -raw cloud_run_url)/api/health` → `{"status":"ok"}`.
7. **Cut the frontend over** from Render to Cloud Run:
   1. Vercel → Settings → Environment Variables → set `VITE_API_BASE_URL` to the `cloud_run_url` (no trailing slash), then **Redeploy**.
   2. Expect everyone to be signed out once (each backend signs tokens with its own secrets).
   3. Test: sign in, sign up with the emailed code, generate a report, email a report and open its link, address search and map, a price prediction. Read `gcloud run services logs read relaive-backend --region australia-southeast1 --limit 50`.
   4. **Rollback** = put the Render URL back in `VITE_API_BASE_URL` and redeploy.
8. **After you're confident:** suspend the Render service, then delete Render's ranges from `authorized_ips` and `terraform apply` (see "Render's access to the database").
9. **Shipping a new backend version:** CI pushes the image; then `gcloud run services update relaive-backend --region australia-southeast1 --image <same tag>` (see "Cloud Run").
10. **Tear down** when finished: "Tearing it down".

The LLM narrative model has its own pipeline in [`../../data_ai/readme.md`](../../data_ai/readme.md).

## Usage

`terraform plan` needs `backend_image` (it has no default) — set it, and the
secrets, in `terraform.tfvars` (see "Configuration").

```bash
cd infra/terraform
terraform init     # downloads the google/random provider plugins
terraform plan      # shows exactly what would be created — review before applying
terraform apply     # creates the resources; type "yes" to confirm
```

To see connection details after applying:

```bash
terraform output instance_connection_name   # project:region:instance, for Cloud Run's Cloud SQL connector
terraform output public_ip_address          # for connecting directly from your machine or Render (psql, Prisma)
terraform output -raw database_url          # full connection string — marked sensitive, so use -raw to print it
terraform output cloud_run_url              # the public URL of the deployed backend
```

`database_url` uses the public IP and is what local dev and Render put in
`DATABASE_URL`. Cloud Run does **not** use it: it builds its own URL for the
`/cloudsql` socket and runs `prisma migrate deploy` at container start.

## Connecting from your local machine

By default the instance has a public IP but **no `authorized_networks`
configured** — direct connections are rejected outright, password or not.
Add your IPv4 address to `authorized_ips` and Cloud SQL accepts direct
connections from it.

1. Find your public **IPv4** address (Cloud SQL's `authorized_networks`
   doesn't support IPv6):
   ```bash
   curl -4 ifconfig.me
   ```
2. Add it to `infra/terraform/terraform.tfvars` (gitignored — create it if it
   doesn't exist):
   ```hcl
   authorized_ips = ["<your-ip>/32"]
   ```
   (Multiple teammates: one entry per IP in the same list.) **Don't** pass
   this via `-var` on Windows/PowerShell — nested quotes get mangled by
   PowerShell's argument passing to native executables; the `.tfvars` file
   sidesteps that entirely.
3. `terraform plan` then `terraform apply` — the instance updates in place
   (~30s), no downtime.
4. `DATABASE_URL` uses the public IP directly:
   ```
   postgresql://relaive_app:<password>@<public_ip_address>:5432/relaive
   ```

**Trade-offs to know**: anyone who later gets your IP could attempt a
connection to the instance, and if your ISP gives you a dynamic IP, it can
change silently and break the connection until you re-run `apply` with the
new one — check `curl -4 ifconfig.me` again if `DATABASE_URL` suddenly stops
connecting.

**Real workflow change from SQLite**: local dev used to be fully
self-contained (just a file, no external dependency). Now, running the
backend locally requires your IP to be in `authorized_ips`. Anyone else on
the team who wants to run this locally needs their own IP added the same
way.

## Render's access to the database

While Render is still live it connects over the public IP, so its outbound
ranges are in `authorized_ips` next to personal IPs (a /24 is a valid entry):
`74.220.52.0/24` and `74.220.60.0/24` (Render → service → **Connect** →
**Outbound**). **These ranges are shared with other Render customers**, so
port 5432 is open to them and the database password is the only remaining
barrier. Cloud Run needs no allowlist (it uses the socket), so once the
frontend points at Cloud Run, delete both ranges and `terraform apply`.

## Cloud Run

Cloud Run does not re-pull `:latest` by itself. After CI pushes a new image,
deploy a new revision:
```bash
gcloud run services update relaive-backend --region australia-southeast1 --image docker.io/<user>/relaive-backend:latest
```
Check it with `curl <cloud_run_url>/api/health`. If the container won't start,
read its logs: `gcloud run services logs read relaive-backend --region australia-southeast1 --limit 50`.

### Troubleshooting

- **`Error 403: Policy update access denied`** on `cloud_run_sql_client` — you
  lack Project IAM Admin. Without that grant the container can't reach the
  database, so it never listens and Cloud Run reports "container failed to
  start and listen on PORT".
- **`403 run.services.setIamPolicy`** on `public_invoker` — you lack Cloud Run
  Admin (see Prerequisites). The service itself is fine, just private.
- **`cannot destroy service without setting deletion_protection=false`** — a
  failed first create left a tainted service in state with protection on, and
  `apply` can't replace it. Delete it and forget it in state:
  ```bash
  gcloud run services delete relaive-backend --region australia-southeast1 --quiet
  terraform state rm google_cloud_run_v2_service.backend
  terraform apply
  ```
- **`plan` always shows `~ scaling` changing zeros to null** on the Cloud Run
  service — a harmless perpetual diff; ignore it.

## Loading data into a fresh instance

Only needed after creating a brand-new instance (or after `terraform destroy` + `apply`) — the shared instance already has all of this. With your IP allowlisted and `backend/.env`'s `DATABASE_URL` pointing at the instance, run from `backend/`:

1. `npx prisma migrate deploy` — creates the schema
2. `npm run prisma:seed` — roles + demo user
3. `npx tsx scripts/ingest-bronze-listings.ts` — properties + comparable sales
4. `npx tsx scripts/build-suburb-market-intelligence.ts` — per-suburb market rows
5. `npx tsx scripts/load-external-market-data.ts` — enrich market rows (must run after step 4)

Details on each script: [`backend/README.md`](../../backend/README.md#database-steps).

## Configuration

All defaults live in `variables.tf` and are fine for dev/course-project use
as-is. Override any of them with a `terraform.tfvars` file (gitignored — see
below) or `-var` flags, for example:

```bash
terraform apply -var="db_tier=db-g1-small"
```

| Variable | Default | Notes |
|---|---|---|
| `project_id` | `csit321-508209` | The shared GCP project |
| `region` | `australia-southeast1` | Sydney — Cloud SQL and Cloud Run both use it |
| `db_instance_name` | `relaive-db` | Shown in the GCP console |
| `db_name` | `relaive` | The actual database/schema name |
| `db_tier` | `db-f1-micro` | Smallest shared-core tier — resize later via this var if the app outgrows it |
| `authorized_ips` | `[]` | IPv4 addresses (CIDR, e.g. `1.2.3.4/32`) allowed to connect directly — see "Connecting from your local machine" above. Set via `terraform.tfvars`, not `-var` (PowerShell quoting issues) |
| `backend_image` | *(none — required)* | Docker Hub image for Cloud Run, e.g. `docker.io/<user>/relaive-backend:latest` |
| `backend_env` | see `variables.tf` | Non-secret env vars for Cloud Run: `CORS_ORIGIN`, `PUBLIC_APP_URL`, `ML_PRICE_PREDICTION_URL`, `TRUST_PROXY`. Override in `terraform.tfvars` |
| `backend_secrets` | `{}` (sensitive) | Secret env vars, set only in `terraform.tfvars`: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `GOOGLE_MAPS_SERVER_KEY`, `TURNSTILE_SECRET_KEY` |

**Note on tier/edition**: new Cloud SQL instances default to "Enterprise
Plus" edition, which dropped support for shared-core tiers like
`db-f1-micro` — you'll get a `400: Invalid Tier ... for ENTERPRISE_PLUS
Edition` error without it. `main.tf` already sets `edition = "ENTERPRISE"`
in the instance's `settings` block to work around this; if you ever bump
`db_tier` to something in the `db-perf-optimized-*` family, you can likely
drop that override and go back to the default edition.

## State file

`terraform.tfstate` (created after your first `apply`) records exactly what
Terraform created and its current settings — **do not delete or hand-edit
it**, and don't commit it to git: it contains the database password **and
every value in `backend_secrets`** (JWT, SendGrid, Maps keys) in plaintext,
and the `.backup` copies do too. If multiple people will run `apply` against
this same Cloud SQL instance, move to a remote backend (e.g. a GCS bucket)
instead of each person holding their own local state file — ask before doing
this solo, since switching backends after the fact requires a
`terraform init -migrate-state` step everyone needs to be aware of.

The repo root `.gitignore` already excludes these (there is no `.gitignore`
in this folder):
```
infra/terraform/.terraform/
infra/terraform/*.tfstate
infra/terraform/*.tfstate.*
infra/terraform/*.tfvars
```

## Tearing it down

```bash
terraform destroy
```

`deletion_protection = false` on the instance (see `main.tf`) and on the Cloud
Run service means this will actually delete the database and all its data
**and the live API** — confirm nothing important is stored there first. This
flag exists so a dev/course-project instance can be cleanly torn down; flip it
to `true` before this ever holds real production data. The Cloud Run and SQL
Admin APIs stay enabled afterwards.

## Next steps (not yet in this folder)

- Cloud Storage bucket for ingestion datasets
- Cut over: set `VITE_API_BASE_URL` on Vercel to `cloud_run_url`, test, suspend
  Render, then remove Render's ranges from `authorized_ips`
- A workflow step (or documented manual step) that deploys new images to Cloud Run
- (done) The Cloud Run service account has `roles/aiplatform.user` and
  `backend_env` carries the `VERTEX_*` variables for the fine-tuned model
  endpoint (see `data_ai/readme.md`). If that endpoint is recreated, update
  `VERTEX_ENDPOINT_ID` in `variables.tf`.
- Move state to a GCS backend if more than one person will run `apply`
