# Turns on the Cloud SQL Admin API for this project — required before any
# google_sql_database_instance resource can be created; a fresh GCP project
# doesn't have this enabled by default.
resource "google_project_service" "sqladmin" {
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false # keep the API enabled even if this resource is destroyed later
}

# Generates a random database password so nothing gets hardcoded in the repo
# or typed by hand — Terraform stores it in state, and we read it back via
# the database_url output below.
resource "random_password" "db_password" {
  length  = 24
  special = false # avoid characters (e.g. @, /, :) that would need escaping inside a connection-string URL
}

# The actual Postgres server. One instance can hold several databases, but
# we only need one (relaive) for this project.
resource "google_sql_database_instance" "relaive" {
  name             = var.db_instance_name # server name, shown in the GCP console
  database_version = "POSTGRES_16"        # matches what we'll target in schema.prisma's datasource
  region           = var.region

  depends_on = [google_project_service.sqladmin] # don't try to create the instance before the API is on

  settings {
    tier = var.db_tier # CPU/RAM size — see variables.tf for why db-f1-micro

    # New Cloud SQL instances default to "Enterprise Plus" edition, which
    # dropped shared-core tiers like db-f1-micro (400 error otherwise:
    # "Invalid Tier for ENTERPRISE_PLUS Edition"). The older "Enterprise"
    # edition still supports it and is plenty for this project's scale.
    edition = "ENTERPRISE"

    backup_configuration {
      enabled = true # daily automated backups — cheap insurance once real report/user data lives here
    }

    ip_configuration {
      ipv4_enabled = true

      dynamic "authorized_networks" {
        for_each = var.authorized_ips
        content {
          name  = "allowed-${authorized_networks.key}"
          value = authorized_networks.value
        }
      }
    }
  }

  # Course-project/dev instance — allow `terraform destroy` to actually
  # delete it. On a real production database you'd flip this to true so a
  # stray `destroy` can't wipe live data by accident.
  deletion_protection = false
}

# The actual database (schema) inside the instance that the backend connects to.
resource "google_sql_database" "relaive" {
  name     = var.db_name
  instance = google_sql_database_instance.relaive.name
}

# The Postgres user Prisma will authenticate as. Kept separate from the
# instance's default root/postgres superuser — the app only gets access to
# its own database, not admin control over the whole server.
resource "google_sql_user" "app" {
  name     = "relaive_app"
  instance = google_sql_database_instance.relaive.name
  password = random_password.db_password.result
}
