import { Navigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import Logout from '../../auth/components/LogoutButton';

const HomePage = () => {
    const { user } = useAuth();

    if (user?.role === 'MANAGER') {
        return <Navigate to="/manager/dashboard" replace />;
    }

    return (
        <main>
            <div className="home-container">
                <h1>Welcome, {user?.name || user?.email}!</h1>
                <p>You are successfully logged in.</p>
                <Logout />
            </div>
        </main>
    );
};

export default HomePage;
