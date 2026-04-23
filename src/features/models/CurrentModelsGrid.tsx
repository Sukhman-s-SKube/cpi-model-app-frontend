import { useAppSelector } from '../../app/hooks';
import { formatDateTime } from '../../utils/format';
import { badgeClassFromModelStatus } from '../../utils/status';
import { HorizonMonths } from '../../types/model';

const horizons: HorizonMonths[] = [1, 3, 6, 12];

export function CurrentModelsGrid() {
  const currentByHorizon = useAppSelector((state) => state.models.currentByHorizon);

  return (
    <section className="card">
      <div className="card-header">
        <h3>Current Active Models</h3>
      </div>
      <div className="current-model-grid">
        {horizons.map((horizon) => {
          const resource = currentByHorizon[horizon];
          const model = resource.data;

          return (
            <div className="sub-card" key={horizon}>
              <h4>{horizon}-Month Horizon</h4>
              {resource.loading && <div className="loading-state">Loading...</div>}
              {resource.error && <div className="error-state">{resource.error}</div>}
              {!resource.loading && !resource.error && !model && <div className="empty-state">No active model</div>}
              {model && (
                <div className="kv-grid">
                  <div>
                    <span className="key">Model Version</span>
                    <span className="value mono">{model.model_version}</span>
                  </div>
                  <div>
                    <span className="key">Trained At</span>
                    <span className="value">{formatDateTime(model.trained_at)}</span>
                  </div>
                  <div>
                    <span className="key">Status</span>
                    <span className={badgeClassFromModelStatus(model.status)}>{model.status}</span>
                  </div>
                  <div>
                    <span className="key">Artifact Key</span>
                    <span className="value mono">
                      {model.model_s3_key || model.s3_key || model.artifact_s3_key || '-'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
