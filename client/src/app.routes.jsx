import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import VerifyEmail from './features/auth/pages/VerifyEmail';
import ForgotPassword from './features/auth/pages/ForgotPassword';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import RootLayout from './features/shared/components/RootLayout';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import VendorsPage from './features/vendors/pages/VendorsPage';
import VendorProfilePage from './features/vendors/pages/VendorProfilePage';

// Simple reusable placeholder for sidebar paths not yet fully built
const PlaceholderPage = ({ title }) => {
    return (
        <div className="vb-page-shell">
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>{title}</h1>
            <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>This module is currently under development.</p>
        </div>
    );
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <RootLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: '',
                element: <Navigate to="/dashboard" replace />,
            },
            {
                path: 'dashboard',
                element: <DashboardPage />,
            },
            {
                path: 'vendors/me',
                element: <VendorProfilePage />,
            },
            {
                path: 'vendors',
                element: <VendorsPage />,
            },
            {
                path: 'rfqs',
                element: <PlaceholderPage title="RFQ's" />,
            },
            {
                path: 'quotations',
                element: <PlaceholderPage title="Quotations" />,
            },
            {
                path: 'approvals',
                element: <PlaceholderPage title="Approvals" />,
            },
            {
                path: 'purchase-orders',
                element: <PlaceholderPage title="Purchase Orders" />,
            },
            {
                path: 'invoices',
                element: <PlaceholderPage title="Invoices" />,
            },
            {
                path: 'reports',
                element: <PlaceholderPage title="Reports" />,
            },
            {
                path: 'activity',
                element: <PlaceholderPage title="Activity Logs" />,
            }
        ]
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

