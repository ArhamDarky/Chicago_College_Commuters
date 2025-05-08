// src/components/Layout.jsx
import { Link, Outlet } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  return (
    <>
      <nav className="top-nav">
        <div className="nav-left">
          <span className="nav-logo">Chicago Commuters</span>
        </div>
        <div className="nav-right">
          <Link to="/">CTA Tracker</Link>
          <Link to="/metra">Metra</Link>
          <Link to="/about">About</Link>
        </div>
      </nav>

      {/* Wrap page content in its own container */}
      <div className="page-content">
        <Outlet />
      </div>
    </>
  );
}

