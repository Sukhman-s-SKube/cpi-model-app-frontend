import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { formatDateTime, formatNumber } from '../../utils/format';
import { fetchEvalHistory } from './historySlice';

export function PredictionHistoryTable() {
  const dispatch = useAppDispatch();
  const predictions = useAppSelector((state) => state.history.predictions);
  const rows = Array.isArray(predictions.rows) ? predictions.rows : [];

  if (predictions.loading) {
    return <div className="loading-state">Loading prediction history...</div>;
  }

  if (predictions.error) {
    return <div className="error-state">{predictions.error}</div>;
  }

  if (rows.length === 0) {
    return <div className="empty-state">No prediction history available for this filter.</div>;
  }

  return (
    <div className="table-wrap card">
      <table>
        <thead>
          <tr>
            <th>Prediction ID</th>
            <th>Model Version</th>
            <th>Horizon</th>
            <th>Generated</th>
            <th>Predicted Value</th>
            <th>Lower Bound</th>
            <th>Upper Bound</th>
            <th>Eval History</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.prediction_id}>
              <td className="mono">{row.prediction_id}</td>
              <td className="mono">{row.model_version}</td>
              <td>{row.horizon_months}</td>
              <td>{formatDateTime(row.generated_at)}</td>
              <td>{formatNumber(row.predicted_value ?? row.predicted_cpi)}</td>
              <td>{formatNumber(row.lower_bound)}</td>
              <td>{formatNumber(row.upper_bound)}</td>
              <td>
                <button
                  className="button button-small"
                  onClick={() => dispatch(fetchEvalHistory({ modelVersion: row.model_version, limit: 20 }))}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
