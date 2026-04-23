export type TaskState = 'PENDING' | 'STARTED' | 'RETRY' | 'SUCCESS' | 'FAILURE';

export interface TaskStatusResponse<T = unknown> {
  task_id: string;
  state: TaskState;
  result?: T;
  meta?: Record<string, unknown>;
  error?: {
    type?: string;
    code?: string;
    message?: string;
    details?: unknown;
  };
}
