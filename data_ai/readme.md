
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

docker exec -i relaive-ai-db psql -U relaive -d relaive_ai < database/ddl/002_bronze_ingestion_schema.sql

docker exec -it relaive-ai-db psql -U relaive -d relaive_ai

## Install Python deps
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

## Seed data
python .\scripts\seed_prototype_data.py

## Clear seed data
python .\scripts\seed_prototype_data.py --clear

## Run mock api

uvicorn app:app --reload --host 0.0.0.0 --port 8000

curl "http://localhost:8000/v1/properties/comparables?address=10%20Bourke%20Street,%20Surry%20Hills%20NSW%202010"
curl "http://localhost:8000/v1/suburbs/Surry%20Hills/intelligence"
curl -X POST http://localhost:8000/v1/properties/analyze \
  -H "Content-Type: application/json" \
  -d '{"address":"10 Bourke Street, Surry Hills NSW 2010","property_type":"house","bedrooms":3,"bathrooms":2,"parking":2,"land_size_sqm":420,"zoning":"residential"}'

curl -X POST http://localhost:8000/v1/reports/generate-narrative \
  -H "Content-Type: application/json" \
  -d '{"property_id":"test","address":"10 Bourke Street, Surry Hills NSW 2010","template_type":"vendor_appraisal","buyer_purpose":"family"}'