import React from 'react';
import { Outlet, Link } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import Logout from '../../auth/components/LogoutButton';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';

const RootLayout = () => {
    const { user } = useAuth();

    return (
        <div className="vb-app-layout">
            <header className="vb-header" aria-label="Main header">
                <div className="vb-header__brand">
                    <Link to="/" className="vb-header__logo">VendorBridge</Link>
                </div>
                <div className="vb-header__user-menu">
                    <div className="vb-header__profile">
                        <span className="vb-header__avatar" aria-hidden="true">
                            {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
                        </span>
                        <div className="vb-header__user-details">
                            <span className="vb-header__username">{user?.name || user?.email}</span>
                            <span className="vb-header__user-role">{user?.role?.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <Logout />
                </div>
            </header>
            <div className="vb-app-body">
                {user?.role === 'ADMIN' ? <AdminSidebar /> : <Sidebar />}
                <main className="vb-main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default RootLayout;
