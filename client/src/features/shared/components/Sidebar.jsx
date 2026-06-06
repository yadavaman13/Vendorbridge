import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import '../styles/sidebar.scss';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Vendors', path: '/vendors' },
    { label: "RFQ's", path: '/rfqs' },
    { label: 'Quotations', path: '/quotations' },
    { label: 'Approvals', path: '/approvals' },
    { label: 'Purchase orders', path: '/purchase-orders' },
    { label: 'Invoices', path: '/invoices' },
    { label: 'Reports', path: '/reports' },
    { label: 'Activity', path: '/activity' },
  ];

  const handleNav = (path) => {
    navigate(path);
  };

  return (
    <aside className="vb-sidebar" aria-label="Main navigation">
      <ul className="vb-sidebar__list">
        {items.map((it) => {
          const isActive = location?.pathname === it.path;
          return (
            <li key={it.path} className="vb-sidebar__item">
              <button
                type="button"
                className={`vb-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(it.path)}
              >
                {it.label}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;
