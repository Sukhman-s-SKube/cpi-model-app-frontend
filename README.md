# BoC CPI Forecasting Frontend

React + Redux Toolkit + TypeScript frontend for a distributed CPI forecasting system.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure API base URL:

```bash
cp .env.example .env
```

Set `VITE_API_BASE_URL` to your Flask backend (example: `http://localhost:5000`).

3. Run development server:

```bash
npm run dev
```

4. Open the app in your browser at the Vite URL shown in terminal (typically `http://localhost:5173`).

## Routes

- `/forecast` (default)
- `/models`
- `/history`

## Structure and Data Flow

- `src/services/apiClient.ts`
  - Single HTTP client that unwraps backend envelopes: `{ ok: true, data: ... }`.
  - All backend requests are centralized here.
- `src/services/polling.ts`
  - Shared polling utility used for async task monitoring.
- `src/features/forecast/forecastSlice.ts`
  - Handles prediction submission (`POST /api/predict`) and task polling (`GET /api/tasks/<task_id>`).
  - Preserves last successful prediction result until a newer one finishes.
- `src/features/models/modelsSlice.ts`
  - Handles current model registry view (`GET /api/models/current/<horizon>`) and model history (`GET /api/models/history/<horizon>`).
  - Includes training and evaluation job submission + polling flows.
- `src/features/history/historySlice.ts`
  - Handles prediction history (`GET /api/predictions/history`) and evaluation history by model (`GET /api/evals/history/<model_version>`).

Redux store domains:

- `forecast`: prediction form, submission, task state, latest result
- `models`: current model metadata, model history, evaluation job state
- `history`: prediction history filters/table, eval history panel

## Demo Flow

1. Start on **Forecast**.
2. Submit prediction (current model or explicit model version).
3. Show queued -> running -> completed states in task card.
4. Highlight prediction result card.
5. Move to **Models** to launch **Train Model**, inspect current model by horizon, and view model history.
6. Move to **History** for prediction logs and click model version eval history.

## Notes

- Frontend talks only to Flask backend over HTTP.
- No direct assumptions about Celery/Redis/ClickHouse/S3 internals.
- Paginated backend responses with `data.items` are normalized in the API client.
- Designed for a clean 2-3 minute internal demo.
