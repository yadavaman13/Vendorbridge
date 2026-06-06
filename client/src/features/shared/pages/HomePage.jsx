import { Navigate } from 'react-router';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import Logout from '../../auth/components/LogoutButton';
import Sidebar from '../components/Sidebar';
import {
    Activity,
    BarChart2,
    CheckCircle,
    FileQuestion,
    Moon,
    Package,
    Receipt,
    ShoppingCart,
    Sunset,
    Sun,
} from 'lucide-react';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true,
});

/* ─── Greeting icon based on time ─────────────────────────────────── */
const GreetingIcon = () => {
    const h = new Date().getHours();
    if (h < 12) return <Sun size={20} />;
    if (h < 17) return <Sunset size={20} />;
    return <Moon size={20} />;
};

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};

/* ─── Mini bar chart ───────────────────────────────────────────────── */
const BarChart = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="bar-chart-wrap bar-chart-loading">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bar-col">
                        <div className="bar-fill skeleton" style={{ height: `${30 + Math.random() * 60}%` }} />
                        <span className="bar-label skeleton-label" />
                    </div>
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bar-chart-empty">
                <BarChart2 size={28} />
                <span>No spending data yet</span>
            </div>
        );
    }

    const max = Math.max(...data.map(d => d.value)) || 1;
    return (
        <div className="bar-chart-wrap">
            {data.map((d, i) => (
                <div key={i} className="bar-col">
                    <div
                        className="bar-fill"
                        style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
                        title={`INR ${Number(d.value).toLocaleString()}`}
                    />
                    <span className="bar-label">{d.label}</span>
                </div>
            ))}
        </div>
    );
};

/* ─── Status badge ─────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => (
    <span className={`status-badge ${status?.toLowerCase()}`}>{status}</span>
);

/* ─── Skeleton row ─────────────────────────────────────────────────── */
const SkeletonRows = ({ cols, rows = 4 }) => (
    <>
        {[...Array(rows)].map((_, i) => (
            <tr key={i}>
                {[...Array(cols)].map((_, j) => (
                    <td key={j}><div className="skeleton-cell" /></td>
                ))}
            </tr>
        ))}
    </>
);

/* ─── Quick action config ──────────────────────────────────────────── */
const QUICK_ACTIONS = [
    { id: 'new-rfq',    label: 'New RFQ',       icon: <FileQuestion size={18} />, path: '/rfqs',           color: '#714b67' },
    { id: 'view-pos',   label: 'View POs',       icon: <Package size={18} />,      path: '/purchase-orders', color: '#22c55e' },
    { id: 'approve',    label: 'Approvals',      icon: <CheckCircle size={18} />,  path: '/approvals',       color: '#f59e0b' },
    { id: 'invoices',   label: 'Invoices',       icon: <Receipt size={18} />,      path: '/invoices',        color: '#e65b65' },
    { id: 'reports',    label: 'Reports',        icon: <BarChart2 size={18} />,    path: '/reports',         color: '#3b82f6' },
    { id: 'activity',   label: 'Activity',       icon: <Activity size={18} />,     path: '/activity',        color: '#8b5cf6' },
];

/* ─── Derive month label ────────────────────────────────────────────── */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ═══════════════════════════════════════════════════════════════════ */
const HomePage = () => {
    const { user } = useAuth();

    if (user?.role === 'MANAGER') {
        return <Navigate to="/manager/dashboard" replace />;
    }

    /* ── raw data states ── */
    const [quotations,     setQuotations]     = useState([]);
    const [approvals,      setApprovals]      = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [invoices,       setInvoices]       = useState([]);

    /* ── loading flags ── */
    const [loadingQ, setLoadingQ] = useState(true);
    const [loadingA, setLoadingA] = useState(true);
    const [loadingP, setLoadingP] = useState(true);
    const [loadingI, setLoadingI] = useState(true);

    /* ──────────────────── fetch all data in parallel ── */
    useEffect(() => {
        // Quotations (SELECTED = active RFQs awaiting PO)
        api.get('/api/quotations?status=SELECTED&limit=100')
            .then(r => r.data?.success && setQuotations(r.data.data.items || []))
            .catch(console.error)
            .finally(() => setLoadingQ(false));

        // Approvals (all, we'll filter PENDING client-side)
        api.get('/api/approvals?limit=100')
            .then(r => r.data?.success && setApprovals(r.data.data.items || []))
            .catch(console.error)
            .finally(() => setLoadingA(false));

        // Purchase Orders
        const poEndpoint = user?.role === 'VENDOR'
            ? '/api/vendors/me/purchase-orders'
            : '/api/purchase-orders?limit=100';
        api.get(poEndpoint)
            .then(r => r.data?.success && setPurchaseOrders(r.data.data.items || []))
            .catch(console.error)
            .finally(() => setLoadingP(false));

        // Invoices
        api.get('/api/invoices?limit=100')
            .then(r => r.data?.success && setInvoices(r.data.data.items || []))
            .catch(console.error)
            .finally(() => setLoadingI(false));
    }, [user?.role]);

    /* ──────────────────── derived stats ── */
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear  = now.getFullYear();

    const activeRFQsCount    = quotations.length;
    const pendingApprovals   = approvals.filter(a => a.status === 'PENDING');
    const overdueApprovals   = approvals.filter(a => a.status === 'OVERDUE');
    const posThisMonth       = purchaseOrders.filter(po => {
        const d = new Date(po.createdAt);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const overdueInvoices    = invoices.filter(i => i.status === 'OVERDUE');

    /* ── recent 5 POs ── */
    const recentPOs = [...purchaseOrders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    /* ── spending chart: last 6 months of PO totalAmounts ── */
    const spendingData = (() => {
        const result = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(thisYear, thisMonth - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            const total = purchaseOrders
                .filter(po => {
                    const pd = new Date(po.createdAt);
                    return pd.getMonth() === m && pd.getFullYear() === y;
                })
                .reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);
            result.push({ label: MONTHS[m], value: total });
        }
        return result;
    })();

    const totalSpend = spendingData.reduce((s, d) => s + d.value, 0);

    /* ── stat cards config ── */
    const STATS = [
        {
            id: 'rfq',
            label: "Active RFQ's",
            value: loadingQ ? null : activeRFQsCount,
            change: loadingQ ? '...' : `${activeRFQsCount} awaiting PO`,
            trend: 'up',
            icon: <FileQuestion size={20} />,
            color: '#714b67',
            bg: 'rgba(113,75,103,0.1)',
            loading: loadingQ,
        },
        {
            id: 'approvals',
            label: 'Pending Approvals',
            value: loadingA ? null : pendingApprovals.length,
            change: loadingA ? '...' : overdueApprovals.length > 0
                ? `${overdueApprovals.length} overdue`
                : 'All up to date',
            trend: overdueApprovals.length > 0 ? 'warning' : 'up',
            icon: <CheckCircle size={20} />,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.1)',
            loading: loadingA,
        },
        {
            id: 'po',
            label: "PO's This Month",
            value: loadingP ? null : posThisMonth.length,
            change: loadingP ? '...' : `${purchaseOrders.length} total`,
            trend: 'up',
            icon: <ShoppingCart size={20} />,
            color: '#22c55e',
            bg: 'rgba(34,197,94,0.1)',
            loading: loadingP,
        },
        {
            id: 'invoices',
            label: 'Overdue Invoices',
            value: loadingI ? null : overdueInvoices.length,
            change: loadingI ? '...' : overdueInvoices.length > 0
                ? 'Action needed'
                : `${invoices.length} total`,
            trend: overdueInvoices.length > 0 ? 'down' : 'up',
            icon: <Receipt size={20} />,
            color: overdueInvoices.length > 0 ? '#e65b65' : '#22c55e',
            bg: overdueInvoices.length > 0 ? 'rgba(230,91,101,0.1)' : 'rgba(34,197,94,0.1)',
            loading: loadingI,
        },
    ];

    /* ── render ── */
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
