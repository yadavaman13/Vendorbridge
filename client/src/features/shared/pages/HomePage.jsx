import { Navigate } from 'react-router';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import {
    FileQuestion,
    CheckCircle,
    ShoppingCart,
    Receipt,
    TrendingUp,
    TrendingDown,
    Clock,
    Plus,
    ArrowRight,
    BarChart2,
    Package,
    Activity,
    Loader2,
    AlertCircle,
    Sun,
    Sunset,
    Moon,
} from 'lucide-react';
import Layout from '../components/Layout';
import '../styles/home-page.scss';

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
        <Layout title="Dashboard">
            <div className="dashboard-root">

                {/* ── Greeting ── */}
                <div className="dash-greeting">
                    <div className="dash-greeting-text">
                        <div className="dash-greeting-icon">
                            <GreetingIcon />
                        </div>
                        <div>
                            <h2 className="dash-greeting-title">
                                {getGreeting()}, {user?.name?.split(' ')[0] || 'welcome back'}
                            </h2>
                            <p className="dash-greeting-sub">
                                Here's what's happening with your procurement today.
                            </p>
                        </div>
                    </div>
                    <button className="dash-new-rfq-btn" onClick={() => navigate('/purchase-orders')}>
                        <Plus size={16} /> New Purchase Order
                    </button>
                </div>

                {/* ── Stat Cards ── */}
                <div className="dash-stat-grid">
                    {STATS.map(s => (
                        <div key={s.id} className="stat-card">
                            <div className="stat-card-top">
                                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                                    {s.icon}
                                </div>
                            </div>
                            <div className="stat-value">
                                {s.loading
                                    ? <Loader2 size={24} className="spin-icon" />
                                    : s.value
                                }
                            </div>
                            <div className="stat-label">{s.label}</div>
                            <div className={`stat-change ${s.trend}`}>
                                {s.trend === 'up'      && <TrendingUp size={13} />}
                                {s.trend === 'down'    && <TrendingDown size={13} />}
                                {s.trend === 'warning' && <Clock size={13} />}
                                <span>{s.change}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Bottom grid ── */}
                <div className="dash-bottom-grid">

                    {/* Recent Purchase Orders */}
                    <div className="dash-card dash-card--table">
                        <div className="dash-card-header">
                            <h3 className="dash-card-title">Recent Purchase Orders</h3>
                            <button className="dash-view-all-btn" onClick={() => navigate('/purchase-orders')}>
                                View All <ArrowRight size={14} />
                            </button>
                        </div>
                        <table className="dash-po-table">
                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>Vendor</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingP ? (
                                    <SkeletonRows cols={5} />
                                ) : recentPOs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>
                                            <div className="dash-empty-row">
                                                <AlertCircle size={20} />
                                                <span>No purchase orders yet</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    recentPOs.map(po => (
                                        <tr key={po.id}>
                                            <td className="po-id-cell">{po.poNumber}</td>
                                            <td>{po.companyName || po.vendorName || '—'}</td>
                                            <td className="po-amount-cell">
                                                INR {Number(po.totalAmount).toLocaleString()}
                                            </td>
                                            <td className="po-date-cell">
                                                {new Date(po.createdAt).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </td>
                                            <td><StatusBadge status={po.status} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Right column */}
                    <div className="dash-right-col">

                        {/* Spending Trends */}
                        <div className="dash-card dash-card--chart">
                            <div className="dash-card-header">
                                <h3 className="dash-card-title">Spending Trends</h3>
                                <span className="dash-card-subtitle">Last 6 months</span>
                            </div>
                            {loadingP ? (
                                <div className="chart-loading">
                                    <Loader2 size={20} className="spin-icon" />
                                    <span>Loading data...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="chart-total">
                                        <span className="chart-total-val">
                                            INR {totalSpend >= 100000
                                                ? `${(totalSpend / 100000).toFixed(1)}L`
                                                : totalSpend.toLocaleString()}
                                        </span>
                                        <span className="chart-total-label">Total spend</span>
                                    </div>
                                    <BarChart data={spendingData} loading={false} />
                                </>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="dash-card dash-card--actions">
                            <h3 className="dash-card-title" style={{ marginBottom: '14px' }}>Quick Actions</h3>
                            <div className="quick-actions-grid">
                                {QUICK_ACTIONS.map(a => (
                                    <button
                                        key={a.id}
                                        id={`quick-action-${a.id}`}
                                        className="quick-action-btn"
                                        onClick={() => navigate(a.path)}
                                        style={{ '--action-color': a.color }}
                                    >
                                        <span className="qa-icon" style={{ color: a.color, background: `${a.color}18` }}>
                                            {a.icon}
                                        </span>
                                        <span className="qa-label">{a.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default HomePage;
