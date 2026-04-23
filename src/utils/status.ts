import { TaskState } from '../types/task';

export type FriendlyTaskStatus = 'Queued' | 'Running on remote worker' | 'Completed' | 'Failed';

export function mapTaskStateToFriendly(state?: TaskState): FriendlyTaskStatus {
  if (state === 'SUCCESS') return 'Completed';
  if (state === 'FAILURE') return 'Failed';
  if (state === 'STARTED') return 'Running on remote worker';
  return 'Queued';
}

export function badgeClassFromTaskState(state?: TaskState): string {
  if (state === 'SUCCESS') return 'badge badge-success';
  if (state === 'FAILURE') return 'badge badge-danger';
  if (state === 'STARTED') return 'badge badge-info';
  return 'badge badge-warning';
}

export function badgeClassFromModelStatus(status?: string): string {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'ready') return 'badge badge-success';
  if (normalized === 'failed') return 'badge badge-danger';
  if (normalized === 'training' || normalized === 'queued') return 'badge badge-warning';
  return 'badge badge-muted';
}
