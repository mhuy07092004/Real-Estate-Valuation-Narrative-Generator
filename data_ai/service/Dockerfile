# syntax=docker/dockerfile:1
#
# Build context is the REPO ROOT, not data_ai/service/ — this Dockerfile
# needs to reach data_ai/*.csv and data_ai/model/train_price_model.py, which
# sit outside data_ai/service/. Build with:
#   docker build -f data_ai/service/Dockerfile -t <image> .   (run from the repo root)
#
# Same pattern as backend/Dockerfile: bake the trained model into the image
# at build time (one training run per build, not per container start), so
# the running container only ever loads pre-built artifacts.

FROM python:3.11-slim
WORKDIR /app

COPY data_ai/service/requirements.txt ./service-requirements.txt
RUN pip install --no-cache-dir -r service-requirements.txt

# Training script's inputs: the two source CSVs, plus the script itself.
COPY data_ai/bronze_listings.csv /data_ai/bronze_listings.csv
COPY data_ai/domain_suburb_insights.csv /data_ai/domain_suburb_insights.csv
COPY data_ai/model/train_price_model.py /data_ai/model/train_price_model.py

# Bake the model + preprocessing artifacts into the image (needs network
# access at build time for the Australian postcode lookup CSV).
RUN python /data_ai/model/train_price_model.py

COPY data_ai/service/main.py ./main.py

ENV MODEL_DIR=/data_ai/model
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
