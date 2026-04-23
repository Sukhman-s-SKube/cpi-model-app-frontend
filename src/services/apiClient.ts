import {
  EvaluateRequest,
  EvaluateSubmission,
  PredictRequest,
  PredictSubmission,
  TrainRequest,
  TrainSubmission,
} from '../types/api';
import { HorizonMonths, ModelHistoryRow, ModelMetadata } from '../types/model';
import { EvalHistoryRow, PredictionHistoryRow } from '../types/prediction';
import { TaskStatusResponse } from '../types/task';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `Request failed: ${response.status}`;
    throw new ApiError(message, response.status);
  }

  if (!payload || payload.ok !== true) {
    const message = payload?.error?.message || 'API response is malformed';
    throw new ApiError(message, response.status);
  }

  return payload.data as T;
}

function unwrapItems<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: T[] }).items;
  }

  return [];
}

export const apiClient = {
  predict: (body: PredictRequest) =>
    request<PredictSubmission>('/api/predict', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  train: (body: TrainRequest) =>
    request<TrainSubmission>('/api/train', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  evaluate: (body: EvaluateRequest) =>
    request<EvaluateSubmission>('/api/evaluate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getTaskStatus: <T = unknown>(taskId: string) =>
    request<TaskStatusResponse<T>>(`/api/tasks/${encodeURIComponent(taskId)}`),

  getCurrentModel: (horizon: HorizonMonths) => request<ModelMetadata>(`/api/models/current/${horizon}`),

  getModelHistory: async (horizon: HorizonMonths, limit = 20) =>
    unwrapItems<ModelHistoryRow>(await request<unknown>(`/api/models/history/${horizon}?limit=${limit}`)),

  getPredictionHistory: async (horizon: HorizonMonths, limit = 20) =>
    unwrapItems<PredictionHistoryRow>(
      await request<unknown>(`/api/predictions/history?horizon_months=${horizon}&limit=${limit}`),
    ),

  getEvalHistory: async (modelVersion: string, limit = 20) =>
    unwrapItems<EvalHistoryRow>(
      await request<unknown>(`/api/evals/history/${encodeURIComponent(modelVersion)}?limit=${limit}`),
    ),
};

export { ApiError };
