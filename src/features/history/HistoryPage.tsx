import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { PageHeader } from '../../components/PageHeader';
import { HorizonMonths } from '../../types/model';
import { EvalHistoryPanel } from './EvalHistoryPanel';
import { fetchPredictionHistory, setHistoryHorizon } from './historySlice';
import { PredictionHistoryTable } from './PredictionHistoryTable';

const horizons: HorizonMonths[] = [1, 3, 6, 12];

export function HistoryPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.history.filters);

  useEffect(() => {
    dispatch(fetchPredictionHistory({ horizon: filters.horizon_months, limit: filters.limit }));
  }, [dispatch, filters.horizon_months, filters.limit]);

  return (
    <section className="page-stack">
      <PageHeader
        title="History"
        subtitle="Review recent predictions and drill into model evaluation history for any model version."
        rightContent={
          <select
            value={filters.horizon_months}
            onChange={(e) => dispatch(setHistoryHorizon(Number(e.target.value) as HorizonMonths))}
          >
            {horizons.map((h) => (
              <option value={h} key={h}>
                {h} months
              </option>
            ))}
          </select>
        }
      />
      <PredictionHistoryTable />
      <EvalHistoryPanel />
    </section>
  );
}
