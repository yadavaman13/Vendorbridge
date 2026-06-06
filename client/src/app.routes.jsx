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

// Feature pages
import PurchaseOrderDashboard from './features/purchase-order/pages/PurchaseOrderDashboard';
import InvoicesPage from './features/purchase-order/pages/InvoicesPage';
import VendorsPage from './features/vendors/pages/VendorsPage';
import RFQsPage from './features/rfqs/pages/RFQsPage';
import QuotationsPage from './features/quotations/pages/QuotationsPage';
import ApprovalsPage from './features/approvals/pages/ApprovalsPage';
import ReportsPage from './features/reports/pages/ReportsPage';
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
    { path: '/login',            element: <Login /> },
    { path: '/register',         element: <Register /> },
    { path: '/verify-email',     element: <VerifyEmail /> },
    { path: '/forgot-password',  element: <ForgotPassword /> },
]);
