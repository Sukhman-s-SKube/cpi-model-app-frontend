import { NavLink } from 'react-router-dom';

const links = [
  { to: '/forecast', label: 'Forecast' },
  { to: '/models', label: 'Models' },
  { to: '/history', label: 'History' },
];

export function Navbar() {
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <div className="brand">BoC CPI Forecasting</div>
        <nav className="nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
