export type HorizonMonths = 1 | 3 | 6 | 12;

export interface ModelMetadata {
  model_version: string;
  trained_at: string | null;
  horizon_months: HorizonMonths;
  s3_key?: string;
  model_s3_key?: string;
  artifact_s3_key?: string;
  status: string;
  metrics?: Record<string, number | string>;
}

export interface ModelHistoryRow {
  model_version: string;
  horizon_months: HorizonMonths;
  training_start_date?: string;
  training_end_date?: string;
  preset?: string;
  trained_at?: string | null;
  train_rows?: number;
  val_rows?: number;
  rmse?: number;
  mae?: number;
  r2?: number;
  metrics?: Record<string, number | string>;
  s3_key?: string;
  artifact_s3_key?: string;
  status?: string;
  created_at?: string;
}
