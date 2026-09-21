# Enables the Cloud Run API — same pattern as sqladmin.googleapis.com in main.tf.
resource "google_project_service" "run" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

# Lets Cloud Run's runtime identity connect to Cloud SQL via the built-in
# connector (Unix socket at /cloudsql/<connection_name>) instead of a public
# IP + allowlist, which doesn't work here since Cloud Run's outbound IP
# isn't fixed/predictable the way a home/office IP is.
resource "google_project_iam_member" "cloud_run_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  # Cloud Run's default runtime service account when none is explicitly set.
  member = "serviceAccount:${data.google_project.current.number}-compute@developer.gserviceaccount.com"
}

data "google_project" "current" {
  project_id = var.project_id
}

resource "google_cloud_run_v2_service" "backend" {
  name     = "relaive-backend"
  location = var.region

  # Wait for the IAM grant, not just the API enablement — without this,
  # Terraform can create the service before the runtime service account has
  # cloudsql.client, and the container fails to start (it can't reach Cloud
  # SQL to run its boot-time `prisma migrate deploy`), which surfaces as a
  # confusing "container failed to listen on PORT" timeout instead of the
  # real IAM cause.
  depends_on = [google_project_service.run, google_project_iam_member.cloud_run_sql_client]

  # Dev/course-project service — allow `terraform destroy` to actually
  # delete it, same reasoning as the Cloud SQL instance's own override.
  deletion_protection = false

  template {
    containers {
      image = var.backend_image
      ports {
        container_port = 4000
      }

      # Non-secret config — same list Render currently needs, minus
      # DATABASE_URL (built below from the Cloud SQL socket path, not a
      # plain var) and anything that's a real secret (see backend_secrets).
      dynamic "env" {
        for_each = var.backend_env
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.backend_secrets
        content {
          name  = env.key
          value = env.value
        }
      }

      env {
        name  = "DATABASE_URL"
        value = "postgresql://relaive_app:${random_password.db_password.result}@localhost/relaive?host=/cloudsql/${google_sql_database_instance.relaive.connection_name}"
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.relaive.connection_name]
      }
    }
  }
}

# Public API — same as Render today, no auth required to reach it (the app
# has its own JWT-based auth layer on top).
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
