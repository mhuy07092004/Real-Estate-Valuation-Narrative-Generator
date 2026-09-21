variable "project_id" {
  description = "GCP project ID" # the csit321-508209 project Long granted editor access to
  type        = string
  default     = "csit321-508209"
}

variable "region" {
  description = "GCP region for Cloud SQL" # where the actual database server physically runs
  type        = string
  default     = "australia-southeast1" # Sydney — closest to the team, lowest latency for local dev/testing
}

variable "db_instance_name" {
  description = "Cloud SQL instance name" # the server itself (can hold multiple databases)
  type        = string
  default     = "relaive-db"
}

variable "db_name" {
  description = "Database name inside the instance" # the actual schema/database the backend connects to
  type        = string
  default     = "relaive"
}

variable "db_tier" {
  description = "Cloud SQL machine tier" # controls CPU/RAM allocated to the instance, and cost
  type        = string
  default     = "db-f1-micro" # smallest shared-core tier — plenty for this project's current scale
}

variable "authorized_ips" {
  description = "Public IPs allowed to connect directly to Cloud SQL, bypassing the Auth Proxy (e.g. your home/office IP)"
  type        = list(string)
  default     = []
}

variable "backend_image" {
  description = "Full Docker Hub image reference for the backend (e.g. docker.io/<username>/relaive-backend:latest)"
  type        = string
}

variable "backend_env" {
  description = "Non-secret env vars for the Cloud Run backend service"
  type        = map(string)
  default = {
    CORS_ORIGIN             = "https://real-estate-valuation-narrative-gen.vercel.app"
    PUBLIC_APP_URL          = "https://real-estate-valuation-narrative-gen.vercel.app"
    ML_PRICE_PREDICTION_URL = ""
    TRUST_PROXY             = "1"
  }
}

variable "backend_secrets" {
  description = "Secret env vars for the Cloud Run backend service (JWT secrets, SendGrid key, DB password piece, etc.) — set via terraform.tfvars, never committed"
  type        = map(string)
  sensitive   = true
  default     = {}
}
