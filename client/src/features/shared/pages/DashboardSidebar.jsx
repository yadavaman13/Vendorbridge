import {
    LayoutDashboard,
    User,
    Users,
    FileText,
    Briefcase,
    Settings,
    LogOut,
    Bell,
    HelpCircle
} from 'lucide-react';

const DashboardSidebar = ({ activeTab, onTabChange, onLogout }) => {
    const mainNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'officers', label: 'Employee', icon: Users },
        { id: 'quotations', label: 'Transaction', icon: FileText },
        { id: 'rfqs', label: 'Job', icon: Briefcase },
    ];

    const footerNavItems = [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'support', label: 'Support', icon: HelpCircle },
        { id: 'settings', label: 'Setting', icon: Settings },
    ];

    return (
        <aside className="dashboard-sidebar">
            <nav className="dashboard-sidebar__main" aria-label="Main navigation">
                {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`dashboard-sidebar__item ${isActive ? 'is-active' : ''}`}
                            onClick={() => onTabChange(item.id)}
                        >
                            <span className="dashboard-sidebar__icon-wrapper" aria-hidden="true">
                                <Icon size={18} />
                            </span>
                            <span className="dashboard-sidebar__label">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="dashboard-sidebar__divider" />

            <nav className="dashboard-sidebar__footer" aria-label="Secondary actions">
                {footerNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`dashboard-sidebar__item ${isActive ? 'is-active' : ''}`}
                            onClick={() => onTabChange(item.id)}
                        >
                            <span className="dashboard-sidebar__icon-wrapper" aria-hidden="true">
                                <Icon size={18} />
                            </span>
                            <span className="dashboard-sidebar__label">{item.label}</span>
                        </button>
                    );
                })}

                <button
                    type="button"
                    className="dashboard-sidebar__item dashboard-sidebar__item--logout"
                    onClick={onLogout}
                >
                    <span className="dashboard-sidebar__icon-wrapper" aria-hidden="true">
                        <LogOut size={18} />
                    </span>
                    <span className="dashboard-sidebar__label">Log Out</span>
                </button>
            </nav>
        </aside>
    );
};

export default DashboardSidebar;
