import { Search, Bell } from 'lucide-react';

const DashboardNavbar = ({ user, searchVal, onSearchChange }) => {
    const displayName = user?.name || 'Manager';
    const firstLetter = (displayName || 'M').slice(0, 1).toUpperCase();

    return (
        <header className="dashboard-navbar">
            <div className="dashboard-navbar__left">
                {/* Logoipsum icon mockup */}
                <div className="dashboard-navbar__logo-wrapper">
                </div>
                <h1 className="dashboard-navbar__brand">Vendorbridge</h1>
            </div>

            <div className="dashboard-navbar__center">
                <p className="dashboard-navbar__welcome">
                    Welcome Back, <span>{displayName}! 👋</span>
                </p>
            </div>

            <div className="dashboard-navbar__right">
                <div className="dashboard-navbar__search">
                    <Search className="dashboard-navbar__search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search for everything..."
                        value={searchVal || ''}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                    />
                </div>

                <button
                    className="dashboard-navbar__btn-notify"
                    type="button"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                    <span className="dashboard-navbar__notify-dot" />
                </button>

                <div className="dashboard-navbar__profile-trigger">
                    <div className="dashboard-navbar__avatar">{firstLetter}</div>
                    <div className="dashboard-navbar__profile-info">
                        <span className="dashboard-navbar__profile-name">{displayName}</span>
                        <span className="dashboard-navbar__profile-role">
                            {user?.role || 'MANAGER'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardNavbar;
