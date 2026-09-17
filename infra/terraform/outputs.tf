# Format: project:region:instance — this is what Cloud Run's built-in Cloud
# SQL connector needs later, NOT a normal hostname/IP.
output "instance_connection_name" {
  description = "Used by Cloud Run's Cloud SQL connector (project:region:instance)"
  value       = google_sql_database_instance.relaive.connection_name
}

# The instance's public IP — needed only for connecting directly from your
# laptop (e.g. via `psql` or Prisma) before Cloud Run is set up.
output "public_ip_address" {
  value = google_sql_database_instance.relaive.public_ip_address
}

# Ready-to-use DATABASE_URL for Prisma's schema.prisma datasource. Marked
# sensitive so `terraform apply`'s output doesn't print it in plain text —
# retrieve it explicitly with `terraform output -raw database_url` instead.
output "database_url" {
  description = "For local testing via Cloud SQL Auth Proxy or direct public IP"
  value       = "postgresql://${google_sql_user.app.name}:${random_password.db_password.result}@${google_sql_database_instance.relaive.public_ip_address}:5432/${google_sql_database.relaive.name}"
  sensitive   = true
}
