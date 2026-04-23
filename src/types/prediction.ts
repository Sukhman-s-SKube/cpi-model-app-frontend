import { HorizonMonths } from './model';

export interface PredictionResult {
  prediction_id?: string;
  predicted_cpi?: number;
  predicted_value?: number;
  lower_bound?: number;
  upper_bound?: number;
  current_cpi?: number;
  current_cpi_level?: number;
  horizon_months: HorizonMonths;
  model_version: string;
  generated_at: string;
  [key: string]: unknown;
}

export interface PredictionHistoryRow {
  prediction_id: string;
  model_version: string;
  horizon_months: HorizonMonths;
  generated_at: string;
  selection_policy?: 'current' | 'best' | 'explicit' | string;
  status?: string;
  predicted_value?: number;
  predicted_cpi?: number;
  lower_bound?: number;
  upper_bound?: number;
  [key: string]: unknown;
}

export interface EvalHistoryRow {
  eval_id?: string;
  model_version: string;
  horizon_months?: HorizonMonths;
  evaluated_at?: string;
  evaluation_start_date?: string;
  evaluation_end_date?: string;
  created_at?: string;
  generated_at?: string;
  rmse?: number;
  mae?: number;
  r2?: number;
  notes?: string | null;
  metrics?: Record<string, number | string>;
  [key: string]: unknown;
}
