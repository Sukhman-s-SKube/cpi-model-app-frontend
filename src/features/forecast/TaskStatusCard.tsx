import { useAppSelector } from '../../app/hooks';
import { badgeClassFromTaskState, mapTaskStateToFriendly } from '../../utils/status';

export function TaskStatusCard() {
  const { submission, task } = useAppSelector((state) => state.forecast);

  if (!submission.task_id) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3>Async Task Status</h3>
        <span className={badgeClassFromTaskState(task.state)}>{mapTaskStateToFriendly(task.state)}</span>
      </div>
      <div className="kv-grid">
        <div>
          <span className="key">Task ID</span>
          <span className="value mono">{submission.task_id}</span>
        </div>
        <div>
          <span className="key">Prediction ID</span>
          <span className="value mono">{submission.prediction_id || '-'}</span>
        </div>
        <div>
          <span className="key">Backend Status</span>
          <span className="value">{task.state || submission.status || 'queued'}</span>
        </div>
      </div>
      {task.error && <div className="error-state">{task.error}</div>}
    </div>
  );
}
