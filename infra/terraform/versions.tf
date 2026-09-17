terraform {
  required_version = ">= 1.5" # minimum Terraform CLI version this config is written against

  required_providers {
    google = {
      source  = "hashicorp/google" # official GCP provider — lets Terraform manage Cloud SQL, IAM, etc.
      version = "~> 6.0"           # pin to the 6.x line; avoids surprise breaking changes from a major bump
    }
    random = {
      source  = "hashicorp/random" # used to generate the DB password without hardcoding one
      version = "~> 3.6"
    }
  }
}

provider "google" {
  project = var.project_id # which GCP project all resources below get created in
  region  = var.region     # default region for resources that don't specify their own
}
