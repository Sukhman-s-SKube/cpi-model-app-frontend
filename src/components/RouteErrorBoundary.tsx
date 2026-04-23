import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred while rendering this page.';

  if (isRouteErrorResponse(error)) {
    title = `Request Error (${error.status})`;
    message = typeof error.data === 'string' ? error.data : error.statusText;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="app-content">
      <section className="card">
        <h2>{title}</h2>
        <p style={{ marginTop: '0.5rem', color: '#475569' }}>{message}</p>
      </section>
    </div>
  );
}
