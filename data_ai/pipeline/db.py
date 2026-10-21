# Author: The Long Tran
"""Shared database connection for the medallion pipeline scripts.

Reads DATABASE_URL from the environment, falling back to backend/.env so the
pipeline talks to the same Cloud SQL database as the app without a second
place to keep the credential.
"""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import psycopg
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def database_url() -> str:
    load_dotenv(REPO_ROOT / "backend" / ".env")
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL is not set (and backend/.env has none).")

    # Prisma-style URLs carry `?schema=public`, which libpq rejects.
    parts = urlsplit(url)
    query = [(k, v) for k, v in parse_qsl(parts.query) if k != "schema"]
    return urlunsplit(parts._replace(query=urlencode(query)))


def connect() -> psycopg.Connection:
    return psycopg.connect(database_url())
