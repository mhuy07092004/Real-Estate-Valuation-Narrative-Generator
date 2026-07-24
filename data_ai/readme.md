
---

## Short version for your team

If you want a smaller starter note, use this:

```md
# Local DB + Seed Setup

## Start DB
cd data_ai
docker compose up -d postgres

## Apply schema
docker exec -i relaive-ai-db psql -U relaive -d relaive_ai < database/ddl/001_serving_schema.sql

docker exec -it relaive-ai-db psql -U relaive -d relaive_ai

## Install Python deps
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

## Seed data
python .\scripts\seed_prototype_data.py

## Clear seed data
python .\scripts\seed_prototype_data.py --clear