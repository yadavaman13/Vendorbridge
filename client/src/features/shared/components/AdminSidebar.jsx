import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import '../styles/admin-sidebar.scss';

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const items = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Vendors', path: '/vendors' },
        { label: 'Manage users', path: '/users' },
    ];

    const handleNav = (path) => {
        navigate(path);
    };

    return (
        <aside className="vb-admin-sidebar" aria-label="Admin navigation">
            <div className="vb-admin-sidebar__brand">
                <span>Admin</span>
                <p>{user?.name || 'VendorBridge'}</p>
            </div>
            <ul className="vb-admin-sidebar__list">
                {items.map((item) => {
                    const isActive = location?.pathname === item.path;
                    return (
                        <li key={item.path} className="vb-admin-sidebar__item">
                            <button
                                type="button"
                                className={`vb-admin-sidebar__link ${isActive ? 'active' : ''}`}
                                onClick={() => handleNav(item.path)}
                            >
                                <span>{item.label}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
};

export default AdminSidebar;
