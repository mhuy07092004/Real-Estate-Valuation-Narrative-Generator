# data_ai

Everything AI and data related, in four independent parts:

1. **Data collection** — scrapers that produce the CSVs the backend imports into its database.
2. **Narrative dataset** — the 300 role-conditioned example reports used to fine-tune a language model.
3. **Price-prediction model and service** — a scikit-learn model behind a small FastAPI service the backend calls.
4. **Narrative model (Vertex AI)** — fine-tune Gemma 2 2B with LoRA, merge it, serve it from a Vertex AI endpoint, and score it.

Each part below is a numbered list of commands, with **Local** and **Deployed** variants where they differ. Commands are PowerShell from the repo root unless noted.

## Folder map

| Path | What's there |
| --- | --- |
| `ingestion/`, `run_full_scrape.py` | Scrapers (listings, Domain, SQM, ABS) and the orchestrator that runs them for every suburb in the database |
| `scripts/` | `split_narrative_dataset.py`, `prepare_finetune_dataset.py` (dataset pipeline) and one-off `probe_*.py` scraper probes |
| `docs/fixtures/` | The dataset files at each stage; `docs/scp425_plan.md` is the current dataset design |
| `model/`, `service/`, `notebooks/` | Price model training script, its FastAPI service and Dockerfile, and the exploratory notebook |
| `training/` | Vertex AI trainer package (`finetune_gemma.py`, `merge_adapter.py`); job config YAMLs are **gitignored** (they hold a Hugging Face token) |
| `eval/` | `generate_baseline.py` (run a deployed model on the test prompts) and `score_rouge.py` |
| Root CSVs | Scraper outputs: `bronze_listings.csv`, `domain_suburb_insights.csv`, `abs_*.csv`, `sqm_vacancy_rate_raw.csv` |
| `narrative_training_pairs.jsonl` | The hand-authored narratives paired with real property data |
| `Relaive_AI_Data_Service_Backlog.md`, `docs/scp419_plan.md`, `docs/gcp_provisioning_plan.md` | Historical planning docs — don't follow them |

## 1. Collect data (local)

**Prerequisites:** Python 3.11, Chrome (the scrapers drive it), network access, and your machine allow-listed on Cloud SQL (the orchestrator reads the suburb list from the database).

1. Set up the environment:
   ```powershell
   cd data_ai
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
2. Scrape one source, or everything:
   ```powershell
   python ingestion/domain_suburb_insights_ingest.py     # one source
   python run_full_scrape.py                              # all suburbs, sequentially
   ```
   None of the scrapers can resume: re-running without clearing their output silently duplicates rows. The orchestrator clears each output CSV first.
3. **Hand-off to the database:** the CSVs are imported by scripts in `backend/scripts/` — the exact commands are in [`../backend/README.md`](../backend/README.md#database-steps). Nothing in `data_ai/` writes to the database directly.

## 2. Build the narrative dataset (local)

1. From `backend/`, export real property inputs (300 rows, 75 per role):
   ```powershell
   cd ..\backend
   npx tsx scripts/export-narrative-training-inputs.ts       # writes data_ai/docs/fixtures/narrative_dataset_inputs.jsonl
   ```
2. `narrative_training_pairs.jsonl` pairs each row with a hand-written narrative grounded only in that row's numbers. It's already in the repo; regenerate it only if the inputs change.
3. Split (fixed seed 42, stratified 80/10/10 by role) and format as chat examples:
   ```powershell
   cd ..\data_ai
   python scripts/split_narrative_dataset.py          # → docs/fixtures/narrative_training_pairs.{train,val,test}.jsonl
   python scripts/prepare_finetune_dataset.py         # → docs/fixtures/finetune_ready/{train,val,test}.jsonl  (240 / 28 / 32 rows)
   ```

## 3. Price-prediction model and service

A RandomForest trained from `bronze_listings.csv` + `domain_suburb_insights.csv`, served by FastAPI (`POST /` or `POST /predict`, `GET /health`). The backend calls it through `ML_PRICE_PREDICTION_URL`.

### Local
1. Train (needs network once, for the Australian postcode lookup CSV):
   ```powershell
   cd data_ai
   python model/train_price_model.py       # writes model/price_model.joblib + preprocessing.joblib (gitignored)
   ```
2. Run the service:
   ```powershell
   cd service
   pip install -r requirements.txt
   uvicorn main:app --port 8000
   ```
3. **Verify:**
   ```powershell
   curl.exe http://localhost:8000/health
   curl.exe -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d '{\"suburb\":\"Bonnyrigg\",\"state\":\"NSW\",\"postcode\":\"2177\",\"propertyType\":\"House\",\"bedrooms\":3,\"bathrooms\":2,\"landSizeSqm\":430}'
   ```
4. Point a local backend at it: `ML_PRICE_PREDICTION_URL=http://localhost:8000/predict` in `backend/.env`.

### Deployed (Docker → Docker Hub → Render)
The image trains the model at build time, so the running container only loads finished files. CI (`docker-deploy-ai.yml`) builds and pushes it on pushes to `main` touching `data_ai/service|model/**` or `data_ai/*.csv`. Manually, from the repo root:
```powershell
docker build -f data_ai/service/Dockerfile -t <dockerhub-user>/relaive-ai-service:latest .
docker push <dockerhub-user>/relaive-ai-service:latest
```
Render: new **Web Service → Existing Image** `docker.io/<dockerhub-user>/relaive-ai-service:latest`, health check path `/health`. No variables are required; set `ML_API_KEY` only to require a bearer token (then set the same value as `ML_PRICE_PREDICTION_API_KEY` on the backend). Then set `ML_PRICE_PREDICTION_URL` on the backend (Render's env tab, or `backend_env` in `infra/terraform/variables.tf` for Cloud Run). Render's free tier sleeps after ~15 minutes idle, so the first prediction after a gap is slow. The live service is `https://relaive-ai-service-latest.onrender.com`.

## 4. Narrative model on Vertex AI

Fine-tune Gemma 2 2B-it with LoRA → merge → serve on a Vertex AI endpoint → score against the untrained baseline → connect the backend. **Train in Sydney, serve in `us-central1`.** Project `csit321-508209` (number `393439107077`).

### 4.0 Before you start
| | `australia-southeast1` (Sydney) | `us-central1` |
|---|---|---|
| Train on a T4 | works, but the Vertex *training* T4 quota starts at **0** — request 1 (Console → **IAM & Admin → Quotas**, filter `Custom model training Nvidia T4 GPUs`) | quota already 1 |
| Serve on a T4 | the server **crashes** (see step 8) | same |
| Serve on an L4 | **not offered in any zone** | works, serving quota 2 |

The only runtime data sent to the US endpoint is the report prompt (subject address and features, estimated value, growth figure, up to five comparable sales) — no client names or emails.

You also need: `gcloud` logged in (`gcloud auth login` and `gcloud auth application-default login`), a Hugging Face token whose account accepted the Gemma licence, and Docker isn't needed. Check the real Vertex quotas (not the Compute Engine table):
```powershell
$tok = gcloud auth print-access-token
$h = @{ Authorization = "Bearer $tok"; "x-goog-user-project" = "csit321-508209" }
(Invoke-RestMethod -Headers $h -Uri "https://serviceusage.googleapis.com/v1beta1/projects/csit321-508209/services/aiplatform.googleapis.com/consumerQuotaMetrics?pageSize=500").metrics |
  Where-Object { $_.metric -match "custom_model_(training|serving)_nvidia_(t4|l4)_gpus$" }
```
Variables used below:
```powershell
$P="csit321-508209"; $R="australia-southeast1"; $B="gs://csit321-508209-training"
$US="us-central1";   $USB="gs://csit321-508209-training-us"
```

### 4.1 Bucket and dataset (Sydney)
```powershell
gcloud storage buckets create $B --location=$R --project=$P --uniform-bucket-level-access
gcloud storage cp data_ai\docs\fixtures\finetune_ready\train.jsonl data_ai\docs\fixtures\finetune_ready\val.jsonl "$B/training-data/"
```
The bucket must be in the region where training runs, or the job fails writing its output.

### 4.2 Package the trainer
```powershell
cd data_ai\training
python setup.py sdist --formats=gztar          # the "no README" warning is harmless
gcloud storage cp dist\trainer-0.1.tar.gz "$B/training-code/"
```

### 4.3 Job configs (gitignored — they contain your token)
`job_config.yaml` (training) — the merge config is the same shape with `pythonModule: trainer.merge_adapter` and `--adapter-dir` / `--output-dir` args:
```yaml
baseOutputDirectory:
  outputUriPrefix: gs://csit321-508209-training/models/gemma-2b-lora-run1
workerPoolSpecs:
  - machineSpec: { machineType: n1-standard-8, acceleratorType: NVIDIA_TESLA_T4, acceleratorCount: 1 }
    replicaCount: 1
    pythonPackageSpec:
      executorImageUri: us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-3.py310:latest
      packageUris: [gs://csit321-508209-training/training-code/trainer-0.1.tar.gz]
      pythonModule: trainer.finetune_gemma
      args:
        - --train-file=gs://csit321-508209-training/training-data/train.jsonl
        - --val-file=gs://csit321-508209-training/training-data/val.jsonl
      env:
        - { name: HF_TOKEN, value: "hf_..." }
        - { name: USE_TORCH_XLA, value: "0" }
```
`.gitignore` covers `data_ai/training/*job_config*.yaml`.

### 4.4 Smoke test first (5 rows, 1 epoch)
Four full runs failed before one worked, so prove the pipeline cheaply. Build the config from the real one:
```powershell
(Get-Content job_config.yaml) `
  -replace 'models/gemma-2b-lora-run1','models/gemma-2b-lora-smoke' `
  -replace 'train\.jsonl','train_smoke.jsonl' `
  -replace 'val\.jsonl','val_smoke.jsonl' `
  -replace '(- --val-file=.*)',"`$1`n        - --epochs=1" | Set-Content job_config_smoke.yaml -Encoding ascii
gcloud storage cp ..\docs\fixtures\finetune_ready\train_smoke.jsonl ..\docs\fixtures\finetune_ready\val_smoke.jsonl "$B/training-data/"
gcloud ai custom-jobs create --region=$R --project=$P --display-name=gemma-2b-lora-smoke --config=job_config_smoke.yaml
$job = gcloud ai custom-jobs list --region=$R --project=$P --limit=1 --format="value(name.basename())"
gcloud ai custom-jobs stream-logs $job --region=$R
gcloud storage ls -r "$B/models/gemma-2b-lora-smoke/model/"        # adapter_model.safetensors MUST be listed
```
The red `ERROR` lines are progress bars on stderr, not failures. A clean exit code alone proves nothing — check the files exist.

### 4.5 Full training (about 50 minutes, 90 steps)
```powershell
gcloud ai custom-jobs create --region=$R --project=$P --display-name=gemma-2b-lora-run1 --config=job_config.yaml
gcloud ai custom-jobs stream-logs $job --region=$R
gcloud storage ls -r "$B/models/gemma-2b-lora-run1/model/"         # adapter (~25 MB) + checkpoint-30/60/90
```
Loss history is in `.../checkpoint-90/trainer_state.json`. Back up the adapter before any teardown — it's the only irreplaceable artefact:
```powershell
New-Item -ItemType Directory -Force D:\relaive\adapter-run1-backup | Out-Null
gcloud storage cp -r "$B/models/gemma-2b-lora-run1/model" D:\relaive\adapter-run1-backup
```

### 4.6 Merge the adapter into the base model
Set `--adapter-dir` in `merge_job_config.yaml` to `$B/models/gemma-2b-lora-run1/model` and `--output-dir` to `$B/models/gemma-2b-lora-merged`, then:
```powershell
gcloud ai custom-jobs create --region=$R --project=$P --display-name=gemma-2b-lora-merge --config=merge_job_config.yaml
gcloud storage ls --long "$B/models/gemma-2b-lora-merged/"        # 10 objects, ~4.9 GiB
```

### 4.7 Copy to the serving region and grant read access
```powershell
gcloud storage buckets create $USB --location=$US --project=$P --uniform-bucket-level-access
gcloud storage cp -r "$B/models/gemma-2b-lora-merged" "$USB/models/"
gcloud storage buckets add-iam-policy-binding $USB --member="serviceAccount:custom-online-prediction@kcb4e60809cc839b7-tp.iam.gserviceaccount.com" --role=roles/storage.objectViewer
```
**The serving service account is different in every region.** For `csit321-508209`: `us-central1` is `…@kcb4e60809cc839b7-tp…`, Sydney is `…@x45828b49f00b4b50-tp…`. Without the grant, the deploy runs 10–25 minutes and then fails with `does not have storage.objects.list access`. For another region, read the account name from the failed deploy's log.

### 4.8 Upload, create the endpoint, deploy (billing starts)
Serve on an **L4**. A T4 can't run Gemma 2 in this container: XFormers "does not support attention logits soft capping", and forcing FlashInfer fails with "FlashAttention only supports Ampere GPUs or newer".
```powershell
gcloud ai models upload --region=$US --project=$P --display-name=relaive-gemma2-2b-ft `
  --container-image-uri=us-docker.pkg.dev/vertex-ai/vertex-vision-model-garden-dockers/pytorch-vllm-serve:20250114_0916_RC00_maas `
  --container-args="python,-m,vllm.entrypoints.api_server,--host=0.0.0.0,--port=8080,--model=$USB/models/gemma-2b-lora-merged,--tensor-parallel-size=1,--swap-space=16,--gpu-memory-utilization=0.95,--max-num-seqs=256" `
  --container-ports=8080 --container-health-route=/ping --container-predict-route=/generate
gcloud ai models list --region=$US --project=$P                    # note MODEL_ID

gcloud ai endpoints create --region=$US --project=$P --display-name=persistent-endpoint
gcloud ai endpoints list --region=$US --project=$P                 # note ENDPOINT_ID

gcloud ai endpoints deploy-model <ENDPOINT_ID> --region=$US --project=$P --model=<MODEL_ID> `
  --display-name=relaive-gemma-ft --machine-type=g2-standard-12 --accelerator="type=nvidia-l4,count=1" --traffic-split=0=100
```
The endpoint is created **once** and kept (its ID stays stable; an empty one is free). Only the deployed model bills, at about $1–2 an hour. Deploying takes about 10–25 minutes.

**If a deploy fails.** `gcloud` gives up after 30 minutes with "has not finished in 1800 seconds" even if the operation is still running, and its own error is just "Model server exited unexpectedly". Read the real state and the server log (use the project **id** in `--project`):
```powershell
$tok = gcloud auth print-access-token
Invoke-RestMethod -Headers @{Authorization="Bearer $tok"} -Uri "https://$US-aiplatform.googleapis.com/v1beta1/projects/393439107077/locations/$US/endpoints/<ENDPOINT_ID>/operations?pageSize=1"
gcloud logging read 'resource.type="aiplatform.googleapis.com/Endpoint" AND resource.labels.endpoint_id="<ENDPOINT_ID>" AND resource.labels.location="us-central1"' --project=$P --limit=300 --freshness=45m --order=asc --format="value(timestamp.date('%H:%M:%S'),textPayload)"
```

### 4.9 Test the endpoint
```powershell
$ID="<ENDPOINT_ID>"; $tok = gcloud auth print-access-token
Set-Content "$env:TEMP\req.json" '{"instances":[{"@requestFormat":"chatCompletions","messages":[{"role":"user","content":"Write one sentence about a 3 bed house in Bonnyrigg NSW."}],"max_tokens":60}]}' -Encoding ascii
curl.exe -s -H "Authorization: Bearer $tok" -H "Content-Type: application/json" -d "@$env:TEMP\req.json" "https://$US-aiplatform.googleapis.com/v1/projects/393439107077/locations/$US/endpoints/${ID}:predict"
```
(`${ID}:predict` — PowerShell needs the braces — and `curl.exe`, because plain `curl` is an alias.) Expect HTTP 200 with the text at `predictions[0][0].message.content`.

### 4.10 Score against the baseline
`generate_baseline.py` reads `VERTEX_REGION`, `VERTEX_ENDPOINT_ID` and `EVAL_OUTPUT` from the environment. **Always set `EVAL_OUTPUT`** — its default is the recorded baseline file.
```powershell
pip install rouge-score
cd D:\relaive\Real-Estate-Valuation-Narrative-Generator\data_ai
$env:VERTEX_REGION="us-central1"; $env:VERTEX_ENDPOINT_ID="<ENDPOINT_ID>"; $env:EVAL_OUTPUT="test_finetuned_gemma2b.jsonl"
python eval\generate_baseline.py                      # 32 prompts, a few minutes
$F="docs\fixtures\finetune_ready"
python eval\score_rouge.py "$F\test_baseline_gemma2b.jsonl"  --label baseline
python eval\score_rouge.py "$F\test_finetuned_gemma2b.jsonl" --label finetuned
```

| | ROUGE-L f-measure | avg words |
|---|---|---|
| Baseline (Gemma 2 2B-it, zero-shot) | **0.2206** | 178 (rambles, adds markdown) |
| Fine-tuned (`gemma-2b-lora-run1`, loss 1.53 → 0.53) | **0.7214** | 76 (reference 83) |

Read this with care: the training and test properties are disjoint (no leakage), and an inspected sample showed the "unsupported" figures were only rounding — but ROUGE-L rewards matching the formulaic reference wording, and it doesn't prove the values are right or that the model generalises to the backend's shorter live prompt.

### 4.11 Connect the backend
1. **Local:** set `VERTEX_PROJECT_ID=393439107077`, `VERTEX_REGION=us-central1`, `VERTEX_ENDPOINT_ID=<ENDPOINT_ID>` in `backend/.env` and restart. Your own `gcloud auth application-default login` is the credential.
2. **Cloud Run:** put the same three values in the `backend_env` defaults in `infra/terraform/variables.tf` (not in `terraform.tfvars` — that replaces the whole map), make sure `cloud_run.tf` grants the service account `roles/aiplatform.user`, then `terraform plan` and `terraform apply`. A brand-new grant can return a 403 for a couple of minutes.
3. **Render:** not possible — no Google credentials, and the organisation policy `iam.disableServiceAccountKeyCreation` forbids service-account keys. Render falls back to templated text.
4. **Verify** with an authenticated call to `/api/appraisal/executive-summary?address=…` and check the logs for `[vertex-narrative]` warnings — the fallback is silent.

If the endpoint is ever recreated, update `VERTEX_ENDPOINT_ID` in `variables.tf` and `backend/.env`.

### 4.12 Stop the billing / tear down
```powershell
gcloud ai endpoints describe <ENDPOINT_ID> --region=$US --project=$P --format="value(deployedModels)"   # what is deployed
gcloud ai endpoints undeploy-model <ENDPOINT_ID> --region=$US --project=$P --deployed-model-id=<id>      # stops the charges; endpoint stays
```
Undeploy when you're not using it — the backend falls back to templated text automatically. To remove everything: also `gcloud ai endpoints delete`, `gcloud ai models delete`, and delete the buckets (keep the adapter backup first). Verify with `gcloud ai endpoints list`, `gcloud ai models list` and `gcloud storage buckets list`.

### If training or serving fails
- **No adapter files after a "successful" job:** `baseOutputDirectory` was missing — without it the model is silently discarded.
- **Writing to `gs://…` with plain file I/O creates a bogus local path:** Vertex mounts buckets at `/gcs/<bucket>/…`; the trainer converts `gs://` to `/gcs/` (only `datasets.load_dataset` reads `gs://` directly).
- **Out-of-memory on the T4:** keep `USE_TORCH_XLA=0`, `--batch-size=1 --grad-accum=8`, and `eval_strategy="no"` (already set).
- **Training input reads fine but output fails:** bucket and job are in different regions.
- **Merge finds no adapter:** `--adapter-dir` still points at an old run name.

## Current state (as of 2026-09-21)

| Resource | State |
|---|---|
| `gs://csit321-508209-training` (Sydney): dataset, adapter, merged model | keep — pennies a month |
| `gs://csit321-508209-training-us` (`us-central1`): merged model copy | keep |
| `us-central1` endpoint `365693719107600384`, model `6708156175189278720` | **deployed on an L4 — billing**; undeploy when idle |
| Sydney endpoint `7079678405435719680`, models `3459586948518117376` and `8071272966945505280` | failed T4 attempts; safe to delete |
| Backend wired to the endpoint | Cloud Run and local ✅; Render ❌ |
| Local adapter backup | `D:\relaive\adapter-run1-backup` (outside the repo) |

Known gap: the backend's prompt (`report-content.service.ts`) is a short fixed "real estate agent, Executive Summary only" prompt, while the model was trained on the longer role-specific prompts built by `scripts/prepare_finetune_dataset.py`. Until they match, expect live quality below the score above.
