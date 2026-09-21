# Infra (Terraform)

Provisions the Cloud SQL Postgres instance for the backend's migration off
Render/SQLite onto GCP. This is the first piece of a larger migration —
Cloud SQL is live and the backend's schema has been migrated onto it (see
"Status" below); Cloud Run + Cloud Storage are still separate, later steps.
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
- ⬜ Cloud Run service (backend not yet deployed here — still on Render)
- ⬜ Cloud Storage bucket for ingestion datasets

## What this creates

- A Cloud SQL for PostgreSQL instance (`google_sql_database_instance`)
- One database inside it (`google_sql_database`)
- An app-specific Postgres user, separate from the instance's root user
  (`google_sql_user`)
- A randomly generated password for that user (`random_password`)
- Enables the Cloud SQL Admin API on the project, if not already on

It does **not** create Cloud Run, Cloud Storage, or touch the existing
Render deployment — those are separate, later steps.

## Prerequisites

1. **Terraform** ≥ 1.5 — https://developer.hashicorp.com/terraform/install
2. **Google Cloud CLI** (`gcloud`) — https://cloud.google.com/sdk/docs/install
3. Authenticate `gcloud` with an account that has editor access to the
   `csit321-508209` project (or whichever project you point `var.project_id`
   at):
   ```bash
   gcloud auth login
   gcloud auth application-default login
   gcloud config set project csit321-508209
   ```
   Terraform's `google` provider picks up these application-default
   credentials automatically — no separate service-account key needed for
   local use.

## Usage

```bash
cd infra/terraform
terraform init     # downloads the google/random provider plugins
terraform plan      # shows exactly what would be created — review before applying
terraform apply     # creates the resources; type "yes" to confirm
```

To see connection details after applying:

```bash
terraform output instance_connection_name   # project:region:instance, for Cloud Run's Cloud SQL connector
terraform output public_ip_address          # for connecting directly (psql, Prisma) before Cloud Run exists
terraform output -raw database_url          # full connection string — marked sensitive, so use -raw to print it
```

`database_url` is exactly what `backend/prisma/schema.prisma`'s
`DATABASE_URL` env var expects — the schema's `datasource` provider is
already `postgresql` (see "Status" above).

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

## Loading data into a fresh instance

Only needed after creating a brand-new instance (or after `terraform destroy` + `apply`) — the shared instance already has all of this. With your IP allowlisted and `backend/.env`'s `DATABASE_URL` pointing at the instance, run from `backend/`:

1. `npx prisma migrate deploy` — creates the schema
2. `npm run prisma:seed` — roles + demo user
3. `npx tsx scripts/ingest-bronze-listings.ts` — properties + comparable sales
4. `npx tsx scripts/build-suburb-market-intelligence.ts` — per-suburb market rows
5. `npx tsx scripts/load-external-market-data.ts` — enrich market rows (must run after step 4)

Details on each script: [`backend/README.md`](../../backend/README.md#data-import).

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
| `region` | `australia-southeast1` | Sydney — closest to the team; match this to wherever Cloud Run ends up living |
| `db_instance_name` | `relaive-db` | Shown in the GCP console |
| `db_name` | `relaive` | The actual database/schema name |
| `db_tier` | `db-f1-micro` | Smallest shared-core tier — resize later via this var if the app outgrows it |
| `authorized_ips` | `[]` | IPv4 addresses (CIDR, e.g. `1.2.3.4/32`) allowed to connect directly — see "Connecting from your local machine" above. Set via `terraform.tfvars`, not `-var` (PowerShell quoting issues) |

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
it**, and don't commit it to git (see `.gitignore` below): it contains the
database password in plaintext. If multiple people will run `apply` against
this same Cloud SQL instance, move to a remote backend (e.g. a GCS bucket)
instead of each person holding their own local state file — ask before doing
this solo, since switching backends after the fact requires a
`terraform init -migrate-state` step everyone needs to be aware of.

A `.gitignore` in this folder should already exclude:
```
.terraform/
*.tfstate
*.tfstate.*
*.tfvars
```

## Tearing it down

```bash
terraform destroy
```

`deletion_protection = false` on the instance (see `main.tf`) means this
will actually delete the database and all its data — confirm nothing
important is stored there first. This flag exists so a dev/course-project
instance can be cleanly torn down; flip it to `true` before this ever holds
real production data.

## Next steps (not yet in this folder)

- Cloud Run service definition for the backend
- Cloud Storage bucket for ingestion datasets
- Before redeploying the backend on Render with the new image: set a real
  `DATABASE_URL` env var there (the old image hardcoded it, so Render never
  needed one before), and add Render's outbound IPs to `authorized_ips`
- Cutting the deployed backend over from Render to Cloud Run once verified,
  ideally tested in parallel before touching the live Render deployment
