import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

// Auth pages
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import VerifyEmail from './features/auth/pages/VerifyEmail';
import ForgotPassword from './features/auth/pages/ForgotPassword';

// Shared
import HomePage from './features/shared/pages/HomePage';
import ManagerDashboard from './features/manager/pages/ManagerDashboard';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import RootLayout from './features/shared/components/RootLayout';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import VendorsPage from './features/vendors/pages/VendorsPage';
import VendorProfilePage from './features/vendors/pages/VendorProfilePage';
import QuotationPage from './features/quotations/pages/QuotationsPage';
import UsersPage from './features/users/pages/UsersPage';
import ReportsPage from './features/reports/pages/ReportsPage';

// Simple reusable placeholder for sidebar paths not yet fully built
const PlaceholderPage = ({ title }) => {
    return (
        <div className="vb-page-shell">
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>{title}</h1>
            <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>This module is currently under development.</p>
        </div>
    );
};

// Feature pages
import PurchaseOrderDashboard from './features/purchase-order/pages/PurchaseOrderDashboard';
import InvoicesPage from './features/purchase-order/pages/InvoicesPage';
import RFQsPage from './features/rfqs/pages/RFQsPage';
import QuotationsPage from './features/quotations/pages/QuotationsPage';
import ApprovalsPage from './features/approvals/pages/ApprovalsPage';
import ActivityPage from './features/activity/pages/ActivityPage';

const protect = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

export const router = createBrowserRouter([
    {
        path: '/manager/dashboard',
        element: (
            <ProtectedRoute allowedRoles={['MANAGER']} redirectTo="/">
                <ManagerDashboard />
            </ProtectedRoute>
        ),
        children: [
            {
                path: '',
                element: <Navigate to="dashboard" replace />,
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
                element: <QuotationPage />,
            },
            {
                path: 'users',
                element: <UsersPage />,
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
                element: <ReportsPage />,
            },
            {
                path: 'activity',
                element: <PlaceholderPage title="Activity Logs" />,
            }
        ]
    },
    { path: '/',                 element: protect(<HomePage />) },
    { path: '/purchase-orders',  element: protect(<PurchaseOrderDashboard />) },
    { path: '/vendors',          element: protect(<VendorsPage />) },
    { path: '/rfqs',             element: protect(<RFQsPage />) },
    { path: '/quotations',       element: protect(<QuotationsPage />) },
    { path: '/approvals',        element: protect(<ApprovalsPage />) },
    { path: '/invoices',         element: protect(<InvoicesPage />) },
    { path: '/reports',          element: protect(<ReportsPage />) },
    { path: '/activity',         element: protect(<ActivityPage />) },
    { path: '/users',            element: protect(<UsersPage />) },
    { path: '/login',            element: <Login /> },
    { path: '/register',         element: <Register /> },
    { path: '/verify-email',     element: <VerifyEmail /> },
    { path: '/forgot-password',  element: <ForgotPassword /> },
]);

