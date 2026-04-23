import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { formatDateTime } from '../../utils/format';
import { badgeClassFromModelStatus } from '../../utils/status';
import { HorizonMonths } from '../../types/model';
import { fetchModelHistory, setSelectedHistoryHorizon } from './modelsSlice';

const horizons: HorizonMonths[] = [1, 3, 6, 12];

export function ModelHistoryTable() {
  const dispatch = useAppDispatch();
  const selectedHorizon = useAppSelector((state) => state.models.selectedHistoryHorizon);
  const modelHistory = useAppSelector((state) => state.models.historyByHorizon[selectedHorizon]);

  return (
    <section className="card">
      <div className="card-header with-controls">
        <h3>Model History</h3>
        <div className="inline-controls">
          <select
            value={selectedHorizon}
            onChange={(e) => dispatch(setSelectedHistoryHorizon(Number(e.target.value) as HorizonMonths))}
          >
            {horizons.map((h) => (
              <option key={h} value={h}>
                {h} months
              </option>
            ))}
          </select>
          <button
            className="button"
            onClick={() => dispatch(fetchModelHistory({ horizon: selectedHorizon, limit: 20 }))}
          >
            Refresh
          </button>
        </div>
      </div>

      {modelHistory.loading && <div className="loading-state">Loading model history...</div>}
      {modelHistory.error && <div className="error-state">{modelHistory.error}</div>}

      {!modelHistory.loading && !modelHistory.error && modelHistory.rows.length === 0 && (
        <div className="empty-state">No model history available for this horizon.</div>
      )}

      {modelHistory.rows.length > 0 && (
        <div className="table-wrap model-history-scroll">
          <table>
            <thead>
              <tr>
                <th>Model Version</th>
                <th>Horizon</th>
                <th>Trained At</th>
                <th>Status</th>
                <th>Artifact S3 Key</th>
                <th>Metrics</th>
              </tr>
            </thead>
            <tbody>
              {modelHistory.rows.map((row) => (
                <tr key={row.model_version}>
                  <td className="mono">{row.model_version}</td>
                  <td>{row.horizon_months}</td>
                  <td>{formatDateTime(row.trained_at || row.created_at)}</td>
                  <td>
                    <span className={badgeClassFromModelStatus(row.status)}>{row.status}</span>
                  </td>
                  <td className="mono">{row.artifact_s3_key || row.s3_key || '-'}</td>
                  <td>
                    {row.metrics ? <pre className="inline-json">{JSON.stringify(row.metrics, null, 2)}</pre> : null}
                    {!row.metrics && (row.rmse !== undefined || row.mae !== undefined || row.r2 !== undefined) ? (
                      <pre className="inline-json">
                        {JSON.stringify({ rmse: row.rmse, mae: row.mae, r2: row.r2 }, null, 2)}
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
    </section>
  );
}
