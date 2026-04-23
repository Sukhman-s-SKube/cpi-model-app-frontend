import { useAppSelector } from '../../app/hooks';
import { formatCpi, formatDateTime, formatNumber } from '../../utils/format';

export function PredictionResultCard() {
  const result = useAppSelector((state) => state.forecast.latestResult);

  if (!result) {
    return <div className="card empty-state">No completed forecast yet. Submit a prediction to view results.</div>;
  }

  const predicted = result.predicted_cpi ?? result.predicted_value;
  const currentCpi = result.current_cpi ?? result.current_cpi_level;

  return (
    <section className="card highlight-card">
      <div className="card-header">
        <h3>Latest Forecast Result</h3>
      </div>

      <div className="result-main">
        <span className="result-label">Predicted CPI</span>
        <span className="result-value">{formatCpi(predicted)}</span>
      </div>

      <div className="kv-grid">
        <div>
          <span className="key">Lower Bound</span>
          <span className="value">{formatNumber(result.lower_bound)}</span>
        </div>
        <div>
          <span className="key">Upper Bound</span>
          <span className="value">{formatNumber(result.upper_bound)}</span>
        </div>
        <div>
          <span className="key">Current CPI</span>
          <span className="value">{formatCpi(currentCpi)}</span>
        </div>
        <div>
          <span className="key">Horizon</span>
          <span className="value">{result.horizon_months} months</span>
        </div>
        <div>
          <span className="key">Model Version</span>
          <span className="value mono">{result.model_version || '-'}</span>
        </div>
        <div>
          <span className="key">Generated</span>
          <span className="value">{formatDateTime(result.generated_at)}</span>
        </div>
      </div>
    </section>
  );
}
