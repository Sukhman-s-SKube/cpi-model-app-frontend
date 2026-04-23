import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  setForecastHorizon,
  setForecastModelMode,
  setForecastModelVersion,
  submitPrediction,
} from './forecastSlice';
import { fetchModelHistory } from '../models/modelsSlice';
import { HorizonMonths } from '../../types/model';

const horizons: HorizonMonths[] = [1, 3, 6, 12];

interface PredictionFormProps {
  onTaskCreated: (taskId: string) => void;
}

export function PredictionForm({ onTaskCreated }: PredictionFormProps) {
  const dispatch = useAppDispatch();
  const forecast = useAppSelector((state) => state.forecast);
  const models = useAppSelector((state) => state.models.historyByHorizon[forecast.form.horizon_months]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (forecast.form.modelMode === 'explicit') {
      dispatch(fetchModelHistory({ horizon: forecast.form.horizon_months, limit: 20 }));
    }
  }, [dispatch, forecast.form.horizon_months, forecast.form.modelMode]);

  const availableModels = useMemo(
    () => (Array.isArray(models?.rows) ? models.rows : []),
    [models?.rows],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const payload =
      forecast.form.modelMode === 'current'
        ? {
            horizon_months: forecast.form.horizon_months,
            selection_policy: 'current' as const,
          }
        : {
            horizon_months: forecast.form.horizon_months,
            selection_policy: 'explicit' as const,
            model_version: forecast.form.model_version,
          };

    const action = await dispatch(submitPrediction(payload));
    setSubmitting(false);

    if (submitPrediction.fulfilled.match(action)) {
      onTaskCreated(action.payload.task_id);
    }
  }

  return (
    <form className="card form-grid" onSubmit={onSubmit}>
      <div className="form-row">
        <label htmlFor="horizon">Horizon (months)</label>
        <select
          id="horizon"
          value={forecast.form.horizon_months}
          onChange={(e) => {
            dispatch(setForecastHorizon(Number(e.target.value) as HorizonMonths));
            dispatch(setForecastModelVersion(''));
          }}
        >
          {horizons.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Model Selection</label>
        <div className="radio-row">
          <label>
            <input
              type="radio"
              checked={forecast.form.modelMode === 'current'}
              onChange={() => dispatch(setForecastModelMode('current'))}
            />
            Current active model
          </label>
          <label>
            <input
              type="radio"
              checked={forecast.form.modelMode === 'explicit'}
              onChange={() => dispatch(setForecastModelMode('explicit'))}
            />
            Explicit model version
          </label>
        </div>
      </div>

      {forecast.form.modelMode === 'explicit' && (
        <div className="form-row">
          <label htmlFor="modelVersion">Model Version</label>
          <select
            id="modelVersion"
            value={forecast.form.model_version}
            onChange={(e) => dispatch(setForecastModelVersion(e.target.value))}
            required
          >
            <option value="">Select model version</option>
            {availableModels.map((model) => (
              <option key={model.model_version} value={model.model_version}>
                {model.model_version}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        className="button button-primary"
        type="submit"
        disabled={submitting || forecast.submission.loading || (forecast.form.modelMode === 'explicit' && !forecast.form.model_version)}
      >
        {submitting || forecast.submission.loading ? 'Submitting...' : 'Generate Forecast'}
      </button>

      {forecast.submission.error && <div className="error-state">{forecast.submission.error}</div>}
    </form>
  );
}
