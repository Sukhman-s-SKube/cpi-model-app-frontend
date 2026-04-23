import { HorizonMonths } from './model';

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export interface PredictRequest {
  horizon_months: HorizonMonths;
  selection_policy?: 'current' | 'best' | 'explicit';
  model_version?: string;
}

export interface PredictSubmission {
  task_id: string;
  prediction_id?: string;
  status: string;
}

export interface TrainRequest {
  horizon_months: HorizonMonths;
  training_start_date: string;
  training_end_date: string;
  preset: 'fast' | 'balanced' | 'thorough' | string;
  model_version?: string;
}

export interface TrainSubmission {
  task_id: string;
  model_version?: string;
  status: string;
}

export interface EvaluateRequestByPolicy {
  horizon_months: HorizonMonths;
  evaluation_start_date: string;
  evaluation_end_date: string;
  selection_policy: 'current' | 'best';
}

export interface EvaluateRequestByVersion {
  horizon_months: HorizonMonths;
  evaluation_start_date: string;
  evaluation_end_date: string;
  selection_policy: 'explicit';
  model_version: string;
}

export type EvaluateRequest = EvaluateRequestByPolicy | EvaluateRequestByVersion;

export interface EvaluateSubmission {
  task_id: string;
  status: string;
}
