import { FormEvent, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { HorizonMonths } from '../../types/model';
import { fetchModelHistory, pollEvaluationTask, submitEvaluation } from './modelsSlice';

const horizons: HorizonMonths[] = [1, 3, 6, 12];

export function EvaluateForm() {
  const dispatch = useAppDispatch();
  const evaluation = useAppSelector((state) => state.models.evaluation);
  const pollAbortRef = useRef<AbortController | null>(null);

  const [horizon, setHorizon] = useState<HorizonMonths>(3);
  const [start, setStart] = useState('2024-01-01');
  const [end, setEnd] = useState('2024-12-31');
  const [mode, setMode] = useState<'current' | 'version'>('current');
  const [modelVersion, setModelVersion] = useState('');
  const historyRows = useAppSelector((state) => state.models.historyByHorizon[horizon].rows);

  function handleHorizonChange(nextHorizon: HorizonMonths) {
    setHorizon(nextHorizon);
    dispatch(fetchModelHistory({ horizon: nextHorizon, limit: 20 }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload =
      mode === 'current'
        ? {
            horizon_months: horizon,
            evaluation_start_date: start,
            evaluation_end_date: end,
            selection_policy: 'current' as const,
          }
        : {
            horizon_months: horizon,
            evaluation_start_date: start,
            evaluation_end_date: end,
            selection_policy: 'explicit' as const,
            model_version: modelVersion,
          };

    const action = await dispatch(submitEvaluation(payload));
    if (submitEvaluation.fulfilled.match(action)) {
      pollAbortRef.current?.abort();
      const controller = new AbortController();
      pollAbortRef.current = controller;
      dispatch(pollEvaluationTask({ taskId: action.payload.task_id, signal: controller.signal }));
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <h3>Run Evaluation (Optional)</h3>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <div className="form-row">
          <label>Horizon</label>
          <select
            value={horizon}
            onChange={(e) => handleHorizonChange(Number(e.target.value) as HorizonMonths)}
          >
            {horizons.map((h) => (
              <option value={h} key={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Evaluation Start</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Evaluation End</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Model Selection</label>
          <div className="radio-row">
            <label>
              <input type="radio" checked={mode === 'current'} onChange={() => setMode('current')} />
              Current
            </label>
            <label>
              <input type="radio" checked={mode === 'version'} onChange={() => setMode('version')} />
              Explicit Version
            </label>
          </div>
        </div>
        {mode === 'version' && (
          <div className="form-row">
            <label>Model Version</label>
            <input
              list="eval-model-versions"
              value={modelVersion}
              onChange={(e) => setModelVersion(e.target.value)}
              placeholder="Enter model version"
              required
            />
            <datalist id="eval-model-versions">
              {historyRows.map((row) => (
                <option key={row.model_version} value={row.model_version} />
              ))}
            </datalist>
          </div>
        )}

        <button className="button" type="submit" disabled={evaluation.submission.loading}>
          {evaluation.submission.loading ? 'Submitting...' : 'Run Evaluation'}
        </button>
      </form>

      {evaluation.submission.task_id && (
        <div className="inline-status">
          Task <span className="mono">{evaluation.submission.task_id}</span> - {evaluation.task.state || 'PENDING'}
        </div>
      )}
      {evaluation.submission.error && <div className="error-state">{evaluation.submission.error}</div>}
      {evaluation.task.error && <div className="error-state">{evaluation.task.error}</div>}
    </section>
  );
}
