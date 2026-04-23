import { Navigate, createBrowserRouter } from 'react-router-dom';
import { App } from '../App';
import { RouteErrorBoundary } from '../components/RouteErrorBoundary';
import { ForecastPage } from '../features/forecast/ForecastPage';
import { HistoryPage } from '../features/history/HistoryPage';
import { ModelsPage } from '../features/models/ModelsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/forecast" replace /> },
      { path: '/forecast', element: <ForecastPage /> },
      { path: '/models', element: <ModelsPage /> },
      { path: '/history', element: <HistoryPage /> },
    ],
  },
]);
