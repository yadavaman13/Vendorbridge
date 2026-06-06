import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import Logout from '../../auth/components/LogoutButton';
import Sidebar from '../components/Sidebar';

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <main>
            <div className="home-with-sidebar">
                <Sidebar />
                <div className="home-content">
                    <div className="home-container">
                        <h1>Welcome, {user?.name || user?.email}!</h1>
                        <p>You are successfully logged in.</p>
                        <Logout />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default HomePage;
