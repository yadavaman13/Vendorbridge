import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../shared/components/Layout';
import {
    BarChart2, TrendingUp, ShoppingCart, Receipt, Users,
    FileText, Loader2, AlertCircle, RefreshCw, Award, Target,
} from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '', withCredentials: true });

const MetricCard = ({ icon, label, value, sub, color }) => (
    <div className="stat-card" style={{ '--card-accent': color }}>
        <div className="stat-card-top">
            <div className="stat-icon" style={{ background: `${color}18`, color }}>
                {icon}
            </div>
        </div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-change up" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
);

const ReportsPage = () => {
    const [procurement, setProcurement] = useState(null);
    const [vendorPerf, setVendorPerf] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, visible: false })), 4000);
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [procRes, perfRes] = await Promise.all([
                api.get('/api/reports/procurement'),
                api.get('/api/reports/vendor-performance'),
            ]);
            if (procRes.data?.success) setProcurement(procRes.data.data.record);
            if (perfRes.data?.success) setVendorPerf(perfRes.data.data.items || []);
        } catch (err) {
            console.error(err);
            showToast('Failed to load reports.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    return (
        <Layout title="Reports">
            {toast.visible && (
                <div className={`toast-banner ${toast.type === 'error' ? 'is-error' : 'is-success'}`}>
                    <AlertCircle size={18} />
                    <span className="toast-message">{toast.message}</span>
                </div>
            )}

            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <h2 className="page-section-title">
                        <BarChart2 size={18} /> Procurement Reports
                    </h2>
                </div>
                <div className="page-toolbar-right">
                    <button className="icon-action-btn" onClick={fetchAll} title="Refresh">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state"><div className="spinner" /><p>Compiling reports...</p></div>
            ) : (
                <>
                    {/* Procurement Metrics */}
                    {procurement && (
                        <>
                            <h3 className="section-subheading">Procurement Overview</h3>
                            <div className="dash-stat-grid" style={{ marginBottom: 24 }}>
                                <MetricCard
                                    icon={<ShoppingCart size={20} />}
                                    label="Total Purchase Orders"
                                    value={procurement.totalPOs ?? 0}
                                    color="#714b67"
                                />
                                <MetricCard
                                    icon={<Receipt size={20} />}
                                    label="Total Spend (INR)"
                                    value={`INR ${Number(procurement.totalSpend || 0).toLocaleString()}`}
                                    color="#22c55e"
                                />
                                <MetricCard
                                    icon={<FileText size={20} />}
                                    label="Active POs"
                                    value={procurement.activePOs ?? 0}
                                    color="#3b82f6"
                                />
                                <MetricCard
                                    icon={<TrendingUp size={20} />}
                                    label="Avg. PO Value"
                                    value={`INR ${Number(procurement.avgPOValue || 0).toLocaleString()}`}
                                    color="#f59e0b"
                                />
                            </div>

                            {/* PO Status Breakdown */}
                            {procurement.poByStatus && procurement.poByStatus.length > 0 && (
                                <div className="procurement-content-card" style={{ marginBottom: 24 }}>
                                    <div className="table-header-info">
                                        <h2>PO Status Breakdown</h2>
                                    </div>
                                    <table className="procurement-table">
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                                <th>Count</th>
                                                <th>Total Value (INR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {procurement.poByStatus.map((row, i) => (
                                                <tr key={i}>
                                                    <td><span className={`status-badge ${row.status?.toLowerCase()}`}>{row.status}</span></td>
                                                    <td><strong>{row.count}</strong></td>
                                                    <td>INR {Number(row.totalValue || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* Vendor Performance */}
                    <h3 className="section-subheading">Vendor Performance</h3>
                    <div className="procurement-content-card">
                        <div className="table-header-info">
                            <h2>Vendor Win Rates & Compliance</h2>
                            <p>Ranked by quotation win rate and PO fulfilment.</p>
                        </div>
                        {vendorPerf.length === 0 ? (
                            <div className="empty-state"><AlertCircle size={40} /><p>No vendor performance data yet.</p></div>
                        ) : (
                            <table className="procurement-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Vendor</th>
                                        <th>Total Bids</th>
                                        <th>Won</th>
                                        <th>Win Rate</th>
                                        <th>Total POs</th>
                                        <th>Total Value (INR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vendorPerf.map((v, i) => {
                                        const winRate = v.totalBids > 0
                                            ? ((v.wonBids / v.totalBids) * 100).toFixed(1)
                                            : '0.0';
                                        return (
                                            <tr key={v.vendorId || i}>
                                                <td style={{ color: 'var(--primary)', fontWeight: 700 }}>
                                                    {i === 0 && <Award size={14} style={{ color: '#f59e0b', marginRight: 4 }} />}
                                                    {i + 1}
                                                </td>
                                                <td><strong>{v.companyName}</strong></td>
                                                <td>{v.totalBids ?? '—'}</td>
                                                <td>{v.wonBids ?? '—'}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div className="mini-progress-bar">
                                                            <div className="mini-progress-fill" style={{ width: `${winRate}%` }} />
                                                        </div>
                                                        <span>{winRate}%</span>
                                                    </div>
                                                </td>
                                                <td>{v.totalPOs ?? '—'}</td>
                                                <td>INR {Number(v.totalValue || 0).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </Layout>
    );
};

export default ReportsPage;
