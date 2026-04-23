import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { closeEvalHistory } from './historySlice';
import { formatDateTime } from '../../utils/format';

export function EvalHistoryPanel() {
  const dispatch = useAppDispatch();
  const evalHistory = useAppSelector((state) => state.history.evalHistory);

  if (!evalHistory.isOpen) {
    return null;
  }

  return (
    <div className="panel card">
      <div className="card-header with-controls">
        <h3>Evaluation History: {evalHistory.modelVersion}</h3>
        <button className="button button-small" onClick={() => dispatch(closeEvalHistory())}>
          Close
        </button>
      </div>

      {evalHistory.loading && <div className="loading-state">Loading evaluation history...</div>}
      {evalHistory.error && <div className="error-state">{evalHistory.error}</div>}

      {!evalHistory.loading && !evalHistory.error && evalHistory.rows.length === 0 && (
        <div className="empty-state">No evaluation runs found for this model.</div>
      )}

      {evalHistory.rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Model Version</th>
                <th>Window</th>
                <th>Created</th>
                <th>Metrics</th>
              </tr>
            </thead>
            <tbody>
              {evalHistory.rows.map((row, index) => (
                <tr key={`${row.model_version}-${row.created_at || index}`}>
                  <td className="mono">{row.model_version}</td>
                  <td>
                    {row.evaluation_start_date || '-'} to {row.evaluation_end_date || '-'}
                  </td>
                  <td>{formatDateTime(row.evaluated_at || row.created_at || row.generated_at)}</td>
                  <td>
                    {row.metrics ? <pre className="inline-json">{JSON.stringify(row.metrics, null, 2)}</pre> : null}
                    {!row.metrics && (row.rmse !== undefined || row.mae !== undefined || row.r2 !== undefined) ? (
                      <pre className="inline-json">
                        {JSON.stringify({ rmse: row.rmse, mae: row.mae, r2: row.r2, notes: row.notes }, null, 2)}
                      </pre>
                    ) : null}
                    {!row.metrics && row.rmse === undefined && row.mae === undefined && row.r2 === undefined
                      ? '-'
                      : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
