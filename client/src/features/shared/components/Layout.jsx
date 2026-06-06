import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import LogoutButton from '../../auth/components/LogoutButton';
import {
    LayoutDashboard,
    Users,
    FileQuestion,
    FileText,
    CheckCircle,
    ShoppingCart,
    Receipt,
    BarChart2,
    Activity,
    Menu,
    X,
    User,
} from 'lucide-react';

const Layout = ({ children, title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    const menuItems = [
        {
            path: '/',
            name: 'Dashboard',
            icon: <LayoutDashboard size={18} />,
            roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'],
        },
        {
            path: '/vendors',
            name: 'Vendors',
            icon: <Users size={18} />,
            roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'],
        },
        {
            path: '/rfqs',
            name: "RFQ's",
            icon: <FileQuestion size={18} />,
            roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'],
        },
        {
            path: '/quotations',
            name: 'Quotations',
            icon: <FileText size={18} />,
            roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'],
        },
        {
            path: '/approvals',
            name: 'Approvals',
            icon: <CheckCircle size={18} />,
            roles: ['ADMIN', 'MANAGER'],
        },
        {
            path: '/purchase-orders',
            name: 'Purchase Orders',
            icon: <ShoppingCart size={18} />,
            roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'],
        },
        {
            path: '/invoices',
            name: 'Invoices',
            icon: <Receipt size={18} />,
            roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'],
        },
        {
            path: '/reports',
            name: 'Reports',
            icon: <BarChart2 size={18} />,
            roles: ['ADMIN', 'MANAGER'],
        },
        {
            path: '/activity',
            name: 'Activity',
            icon: <Activity size={18} />,
            roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'],
        },
        {
            path: '/users',
            name: 'Manage Users',
            icon: <Users size={18} />,
            roles: ['ADMIN'],
        },
    ];

    const filteredMenuItems = menuItems.filter(
        (item) => !user || !item.roles || item.roles.includes(user.role)
    );

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className={`app-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <span className="brand-logo">VB</span>
                    <span className="brand-name">VendorBridge</span>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        {filteredMenuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <button
                                        onClick={() => navigate(item.path)}
                                        className={`nav-link-btn ${isActive ? 'active' : ''}`}
                                        title={!sidebarOpen ? item.name : undefined}
                                    >
                                        <span className="nav-icon">{item.icon}</span>
                                        <span className="nav-text">{item.name}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile-summary">
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase() || <User size={18} />}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user?.name || 'User'}</div>
                            <div className="user-role">{user?.role || 'Staff'}</div>
                        </div>
                    </div>
                    <div className="logout-container">
                        <LogoutButton />
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="main-content-wrapper">
                <header className="main-header">
                    <div className="header-left">
                        <button
                            className="toggle-sidebar-btn"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle sidebar"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h1 className="header-title">{title || 'Procurement Management'}</h1>
                    </div>

                </header>

                <main className="page-content">{children}</main>
            </div>
        </div>
    );
};

export default Layout;
