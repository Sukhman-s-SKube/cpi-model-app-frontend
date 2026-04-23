import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { PageHeader } from '../../components/PageHeader';
import { CurrentModelsGrid } from './CurrentModelsGrid';
import { EvaluateForm } from './EvaluateForm';
import { ModelHistoryTable } from './ModelHistoryTable';
import { TrainForm } from './TrainForm';
import { fetchAllCurrentModels, fetchModelHistory } from './modelsSlice';

export function ModelsPage() {
  const dispatch = useAppDispatch();
  const selectedHorizon = useAppSelector((state) => state.models.selectedHistoryHorizon);

  useEffect(() => {
    dispatch(fetchAllCurrentModels());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchModelHistory({ horizon: selectedHorizon, limit: 20 }));
  }, [dispatch, selectedHorizon]);

  return (
    <section className="page-stack">
      <PageHeader
        title="Models"
        subtitle="Inspect active models by horizon and model registry history for demo and debugging."
      />
      <CurrentModelsGrid />
      <TrainForm />
      <ModelHistoryTable />
      <EvaluateForm />
    </section>
  );
}
