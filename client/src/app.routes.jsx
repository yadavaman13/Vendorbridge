import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import VerifyEmail from './features/auth/pages/VerifyEmail';
import ForgotPassword from './features/auth/pages/ForgotPassword';
import HomePage from './features/shared/pages/HomePage';
import ManagerDashboard from './features/manager/pages/ManagerDashboard';
import ProtectedRoute from './features/auth/components/ProtectedRoute';

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <HomePage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/manager/dashboard',
        element: (
            <ProtectedRoute allowedRoles={['MANAGER']} redirectTo="/">
                <ManagerDashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <Register />,
    },
    {
        path: '/verify-email',
        element: <VerifyEmail />,
    },
    {
        path: '/forgot-password',
        element: <ForgotPassword />,
    }
]);
