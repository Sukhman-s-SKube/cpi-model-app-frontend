import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { HorizonMonths } from '../../types/model';
import {
  fetchAllCurrentModels,
  fetchModelHistory,
  pollTrainingTask,
  submitTraining,
} from './modelsSlice';

const horizons: HorizonMonths[] = [1, 3, 6, 12];

export function TrainForm() {
  const dispatch = useAppDispatch();
  const selectedHistoryHorizon = useAppSelector((state) => state.models.selectedHistoryHorizon);
  const training = useAppSelector((state) => state.models.training);
  const pollAbortRef = useRef<AbortController | null>(null);

  const [horizon, setHorizon] = useState<HorizonMonths>(3);
  const [start, setStart] = useState('2015-01-01');
  const [end, setEnd] = useState('2024-12-31');
  const [preset, setPreset] = useState('balanced');
  const [modelVersion, setModelVersion] = useState('');

  useEffect(() => {
    return () => {
      pollAbortRef.current?.abort();
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const action = await dispatch(
      submitTraining({
        horizon_months: horizon,
        training_start_date: start,
        training_end_date: end,
        preset,
        ...(modelVersion.trim() ? { model_version: modelVersion.trim() } : {}),
      }),
    );

    if (submitTraining.fulfilled.match(action)) {
      pollAbortRef.current?.abort();
      const controller = new AbortController();
      pollAbortRef.current = controller;
      dispatch(pollTrainingTask({ taskId: action.payload.task_id, signal: controller.signal }));
    }
  }

  useEffect(() => {
    if (training.task.state === 'SUCCESS') {
      dispatch(fetchAllCurrentModels());
      dispatch(fetchModelHistory({ horizon: selectedHistoryHorizon, limit: 20 }));
    }
  }, [dispatch, selectedHistoryHorizon, training.task.state]);

  return (
    <section className="card">
      <div className="card-header">
        <h3>Train Model</h3>
      </div>

      <form className="form-grid" onSubmit={onSubmit}>
        <div className="form-row">
          <label>Horizon</label>
          <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value) as HorizonMonths)}>
            {horizons.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>Training Start</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
        </div>

        <div className="form-row">
          <label>Training End</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </div>

        <div className="form-row">
          <label>Preset</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value)}>
            <option value="fast">fast</option>
            <option value="balanced">balanced</option>
            <option value="thorough">thorough</option>
          </select>
        </div>

        <div className="form-row">
          <label>Model Version (optional override)</label>
          <input
            value={modelVersion}
            onChange={(e) => setModelVersion(e.target.value)}
            placeholder="Leave blank to auto-generate"
          />
        </div>

        <button className="button" type="submit" disabled={training.submission.loading}>
          {training.submission.loading ? 'Submitting...' : 'Start Training'}
        </button>
      </form>

      {training.submission.task_id && (
        <div className="inline-status">
          Task <span className="mono">{training.submission.task_id}</span> - {training.task.state || 'PENDING'}
        </div>
      )}
      {training.submission.model_version && (
        <div className="inline-status">
          Model Version: <span className="mono">{training.submission.model_version}</span>
        </div>
      )}
      {training.submission.error && <div className="error-state">{training.submission.error}</div>}
      {training.task.error && <div className="error-state">{training.task.error}</div>}
    </section>
  );
}
