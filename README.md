# BoC CPI Forecasting Frontend

React + Redux Toolkit + TypeScript application for operating and demoing the distributed Canadian CPI forecasting system. The frontend talks only to the Flask orchestration backend over HTTP, supports async job flows (train/evaluate/predict), exposes model + prediction history views, and includes everything needed to build, containerize, and deploy to Kubernetes via GitHub Actions.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Backend API Contract Used by Frontend](#backend-api-contract-used-by-frontend)
- [Docker](#docker)
- [Kubernetes Manifests](#kubernetes-manifests)
- [CI/CD Workflow](#cicd-workflow)
- [Calling the Workflow](#calling-the-workflow)
- [Inputs](#inputs)
- [Secrets](#secrets)
- [How the Workflow Works](#how-the-workflow-works)
- [Example Invocation](#example-invocation)
- [Requirements](#requirements)
- [Troubleshooting](#troubleshooting)

## Features
- Forecast-first internal UX with clear async task states (Queued, Running on remote worker, Completed, Failed).
- Prediction workflow supports model selection policies: `current`, `best`, and `explicit` model version.
- Training and evaluation submission flows with task polling against `/api/tasks/{task_id}`.
- Model registry visibility by horizon (1, 3, 6, 12): current model + historical runs.
- Prediction history table with horizon filtering and drill-in evaluation history by model version.
- Runtime-configurable API base URL in containers/Kubernetes via `VITE_API_BASE_URL` (no image rebuild required).
- Container + Kubernetes ready: multi-stage Dockerfile and templated manifests in `k8s/` with `IMAGE_PLACEHOLDER` replacement in CI.

## Architecture
- `src/services/apiClient.ts`
  - Central HTTP client that unwraps `{ ok: true, data: ... }` envelopes.
  - Normalizes paginated backend responses (`data.items`) for history endpoints.
- `src/services/polling.ts`
  - Shared polling utility used by forecast/train/evaluate task tracking.
- `src/features/forecast/*`
  - Forecast submission, task monitoring, and highlighted result rendering.
- `src/features/models/*`
  - Current model cards, model history table, train form, and evaluate form.
- `src/features/history/*`
  - Prediction history grid and eval-history side panel.
- `src/app/store.ts`
  - Redux Toolkit store with domain slices for `forecast`, `models`, and `history`.
- `public/app-config.js`
  - Runtime configuration shim consumed by the API client.

## Local Development
1. Install prerequisites: Node.js 20+ and npm.
2. Install dependencies:

```bash
npm install
```

3. Configure environment:

```bash
cp .env.example .env
```

Set `VITE_API_BASE_URL` to your Flask backend URL (example: `http://localhost:5000`).

4. Run the app:

```bash
npm run dev
```

5. Open the app at the Vite URL (typically `http://localhost:5173`).

6. Optional production build check:

```bash
npm run build
```

## Environment Variables
| Name | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes (for non-localhost backends) | `http://localhost:5000` | Base URL used by frontend when calling Flask API endpoints. |

Runtime resolution order in containerized deployments:
1. `window.__APP_CONFIG__.VITE_API_BASE_URL` (generated at container startup from env)
2. `window.__APP_CONFIG__.API_BASE_URL` (legacy fallback)
3. build-time `import.meta.env.VITE_API_BASE_URL`
4. `http://localhost:5000`

## Backend API Contract Used by Frontend
The frontend expects backend routes under `/api` with envelope responses.

| Method | Path | Used For |
|---|---|---|
| `POST` | `/api/predict` | Submit prediction job (`current`, `best`, or `explicit`). |
| `POST` | `/api/train` | Submit model training job. |
| `POST` | `/api/evaluate` | Submit model evaluation job. |
| `GET` | `/api/tasks/{task_id}` | Poll task state/result/error for async jobs. |
| `GET` | `/api/models/current/{horizon_months}` | Fetch active model metadata per horizon. |
| `GET` | `/api/models/history/{horizon_months}?limit=...` | Fetch model registry history (uses `data.items`). |
| `GET` | `/api/predictions/history?horizon_months=...&limit=...` | Fetch prediction history (uses `data.items`). |
| `GET` | `/api/evals/history/{model_version}?limit=...` | Fetch evaluation history for selected model (uses `data.items`). |

Frontend routes:
- `/forecast` (default)
- `/models`
- `/history`

## Docker
Build and run the container image defined in `Dockerfile`:

```bash
docker build -t cpi-model-app-frontend:dev .
docker run --rm -p 8080:80 \
  -e VITE_API_BASE_URL=http://your-backend-host:5000 \
  cpi-model-app-frontend:dev
```

Image behavior:
- Stage 1 builds Vite assets.
- Stage 2 serves static files using `serve` on port `80`.
- Container startup writes `dist/app-config.js` from runtime env (`VITE_API_BASE_URL`) so API target can change per environment without rebuilding.

## Kubernetes Manifests
The `k8s/` directory contains a simple deployment stack:

- `1-namespace.yaml` - namespace `cpi-model-app`
- `2-configmap.yaml` - runtime env injection (`VITE_API_BASE_URL`)
- `3-deployment.yaml` - single-replica Deployment referencing `IMAGE_PLACEHOLDER`
- `4-service.yaml` - LoadBalancer Service exposing port `80`

Apply manually (replace `IMAGE_PLACEHOLDER`):

```bash
kubectl apply -f k8s/1-namespace.yaml
kubectl apply -f k8s/2-configmap.yaml
kubectl set image deployment/cpi-model-app-frontend \
  cpi-model-app-frontend=<registry>/cpi-model-app/cpi-model-app-frontend:<tag> \
  -n cpi-model-app
kubectl apply -f k8s/4-service.yaml
```

## CI/CD Workflow
This repository uses a reusable workflow hosted in `Sukhman-s-SKube/gh-actions`. The local workflow (`.github/workflows/pipeline.yaml`) builds the Docker image, pushes it to Harbor, and deploys manifests in `k8s/`.

## Calling the Workflow
Configured in this repository as:

```yaml
name: cpi-model-app-frontend pipeline

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    uses: Sukhman-s-SKube/gh-actions/.github/workflows/build-deploy.yaml@main
    with:
      IMAGE_NAME:    cpi-model-app/cpi-model-app-frontend
      DOCKERFILE_PATH: ./Dockerfile
      MANIFEST_PATH:  ./k8s
      KUBE_NAMESPACE: cpi-model-app
    secrets:
      HARBOR_URL:      ${{ secrets.HARBOR_URL }}
      HARBOR_USERNAME: ${{ secrets.HARBOR_USERNAME }}
      HARBOR_PASSWORD: ${{ secrets.HARBOR_PASSWORD }}
      KUBE_CONFIG:     ${{ secrets.KUBECONFIG }}
```

## Inputs
| Name | Required | Default | Description |
|---|---|---|---|
| `IMAGE_NAME` | Yes | - | Harbor image repository/name. |
| `DOCKERFILE_PATH` | No | `./Dockerfile` | Dockerfile path for build. |
| `MANIFEST_PATH` | Yes | - | Kubernetes manifest file/directory; supports `IMAGE_PLACEHOLDER` replacement. |
| `KUBE_NAMESPACE` | No | `default` | Namespace passed to deployment step. |
| `EXTRA_BUILD_ARGS` | Depends on reusable workflow policy | - | Additional Docker `--build-arg` key/value pairs when needed. |

## Secrets
| Name | Required | Description |
|---|---|---|
| `HARBOR_URL` | Yes | Harbor registry base URL. |
| `HARBOR_USERNAME` / `HARBOR_PASSWORD` | Yes | Harbor credentials or robot account token. |
| `KUBECONFIG` | Yes | Base64-encoded kubeconfig for target cluster access. |

## How the Workflow Works
1. Checks out repository code.
2. Sets up Docker Buildx.
3. Logs in to Harbor.
4. Builds and tags image (`latest` + commit SHA).
5. Pushes image to Harbor.
6. Configures `kubectl` from provided kubeconfig secret.
7. Replaces `IMAGE_PLACEHOLDER` in manifests with pushed image reference.
8. Applies manifests and waits for rollout completion.

## Example Invocation
Manual release-style invocation (`workflow_dispatch`) using the same reusable workflow:

```yaml
name: Release Frontend

on:
  workflow_dispatch:

jobs:
  release:
    uses: Sukhman-s-SKube/gh-actions/.github/workflows/build-deploy.yaml@main
    with:
      IMAGE_NAME: cpi-model-app/cpi-model-app-frontend
      DOCKERFILE_PATH: ./Dockerfile
      MANIFEST_PATH: ./k8s
      KUBE_NAMESPACE: cpi-model-app
      EXTRA_BUILD_ARGS: SOME_ARG=foo
    secrets:
      HARBOR_URL: ${{ secrets.HARBOR_URL }}
      HARBOR_USERNAME: ${{ secrets.HARBOR_USERNAME }}
      HARBOR_PASSWORD: ${{ secrets.HARBOR_PASSWORD }}
      KUBE_CONFIG: ${{ secrets.KUBECONFIG }}
```

## Requirements
- Node.js 20+ and npm.
- Reachable Flask backend exposing the `/api` endpoints used above.
- Docker (and Buildx for CI/local multi-platform workflows).
- Kubernetes cluster access for deployment (`kubectl` + namespace permissions).
- Harbor (or compatible registry) credentials for push from CI.

## Troubleshooting
- Frontend points to wrong backend in Kubernetes:
  - Check `k8s/2-configmap.yaml` and confirm `VITE_API_BASE_URL` value.
  - Verify pod has env injected: `kubectl describe pod <pod> -n cpi-model-app`.
- Runtime env changes not reflected:
  - Restart rollout so startup regenerates `dist/app-config.js`.
- `predictions.rows.map is not a function`/history shape errors:
  - Confirm backend still returns envelope with `data.items`; API client normalizes this contract.
- API calls failing with CORS/network errors:
  - Verify Flask base URL is reachable from browser/client network path and CORS is enabled.
- Deployment not progressing:
  - Check `kubectl describe deployment cpi-model-app-frontend -n cpi-model-app` for image pull/env/config issues.

Ship it.
