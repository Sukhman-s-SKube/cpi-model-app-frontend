import { PropsWithChildren } from 'react';
import { Navbar } from './Navbar';

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">{children}</main>
    </div>
  );
}
