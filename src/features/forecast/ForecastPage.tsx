import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { PageHeader } from '../../components/PageHeader';
import { PredictionForm } from './PredictionForm';
import { PredictionResultCard } from './PredictionResultCard';
import { TaskStatusCard } from './TaskStatusCard';
import { pollTaskUntilFinished } from './forecastSlice';

export function ForecastPage() {
  const dispatch = useAppDispatch();
  const pollAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      pollAbortRef.current?.abort();
    };
  }, []);

  function handleTaskCreated(taskId: string) {
    pollAbortRef.current?.abort();
    const controller = new AbortController();
    pollAbortRef.current = controller;
    dispatch(pollTaskUntilFinished({ taskId, signal: controller.signal }));
  }

  return (
    <section className="page-stack">
      <PageHeader
        title="Forecast"
        subtitle="Submit prediction requests and monitor asynchronous execution on the remote worker."
      />
      <PredictionForm onTaskCreated={handleTaskCreated} />
      <TaskStatusCard />
      <PredictionResultCard />
    </section>
  );
}
