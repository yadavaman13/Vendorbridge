import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../shared/components/Layout';
import {
    Activity, User, Clock, RefreshCw, AlertCircle,
    ShoppingCart, FileText, Receipt, Users, Search, Filter,
} from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '', withCredentials: true });

const ENTITY_ICONS = {
    purchase_order: <ShoppingCart size={14} />,
    quotation:      <FileText size={14} />,
    invoice:        <Receipt size={14} />,
    vendor:         <Users size={14} />,
    approval:       <FileText size={14} />,
};

const ACTION_COLORS = {
    CREATE:   '#22c55e',
    UPDATE:   '#3b82f6',
    DELETE:   '#e65b65',
    APPROVE:  '#714b67',
    REJECT:   '#e65b65',
    SEND:     '#f59e0b',
    VIEW:     '#6a6779',
};

const ActionBadge = ({ action }) => (
    <span
        className="status-badge"
        style={{
            background: `${ACTION_COLORS[action] || '#714b67'}18`,
            color: ACTION_COLORS[action] || '#714b67',
            border: `1px solid ${ACTION_COLORS[action] || '#714b67'}`,
            textTransform: 'uppercase',
            fontSize: 10,
            fontWeight: 700,
        }}
    >
        {action}
    </span>
);

const ActivityPage = () => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const LIMIT = 25;

    const fetchLogs = async (pg = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: pg, limit: LIMIT });
            if (actionFilter) params.set('actionType', actionFilter);
            if (entityFilter) params.set('entityType', entityFilter);
            const res = await api.get(`/api/activity-logs?${params}`);
            if (res.data?.success) {
                setLogs(res.data.data.items || []);
                setTotal(res.data.data.total || 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(page); }, [page, actionFilter, entityFilter]);

    const totalPages = Math.ceil(total / LIMIT);

    const filtered = logs.filter(l =>
        !search ||
        l.actionType?.toLowerCase().includes(search.toLowerCase()) ||
        l.entityType?.toLowerCase().includes(search.toLowerCase()) ||
        l.userName?.toLowerCase().includes(search.toLowerCase())
    );

    const fmt = (dt) => {
        if (!dt) return '—';
        const d = new Date(dt);
        return d.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const timeAgo = (dt) => {
        const diff = Date.now() - new Date(dt).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <Layout title="Activity">
            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <h2 className="page-section-title">
                        <Activity size={18} /> Activity Log
                    </h2>
                    <span className="page-count-badge">{total} events</span>
                </div>
                <div className="page-toolbar-right">
                    <div className="search-input-wrap">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Search by user or action..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <select
                        value={actionFilter}
                        onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                        className="filter-select"
                    >
                        <option value="">All Actions</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="APPROVE">Approve</option>
                        <option value="REJECT">Reject</option>
                        <option value="SEND">Send</option>
                        <option value="VIEW">View</option>
                    </select>
                    <select
                        value={entityFilter}
                        onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
                        className="filter-select"
                    >
                        <option value="">All Entities</option>
                        <option value="purchase_order">Purchase Order</option>
                        <option value="quotation">Quotation</option>
                        <option value="invoice">Invoice</option>
                        <option value="vendor">Vendor</option>
                        <option value="approval">Approval</option>
                    </select>
                    <button className="icon-action-btn" onClick={() => fetchLogs(page)} title="Refresh">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            <div className="procurement-content-card" style={{ minHeight: 300 }}>
                {loading ? (
                    <div className="loading-state"><div className="spinner" /><p>Loading activity log...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state"><AlertCircle size={40} /><p>No activity records found.</p></div>
                ) : (
                    <>
                        <table className="procurement-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Entity</th>
                                    <th>Entity ID</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(log => (
                                    <tr key={log.id}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>
                                                    {timeAgo(log.createdAt)}
                                                </span>
                                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                    {fmt(log.createdAt)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div className="vendor-avatar" style={{ width: 24, height: 24, fontSize: 11 }}>
                                                    {log.userName?.charAt(0) || <User size={12} />}
                                                </div>
                                                <span>{log.userName || `User #${log.userId}`}</span>
                                            </div>
                                        </td>
                                        <td><ActionBadge action={log.actionType} /></td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                                                {ENTITY_ICONS[log.entityType] || <FileText size={14} />}
                                                {log.entityType?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>
                                            #{log.entityId}
                                        </td>
                                        <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-muted)' }}>
                                            {log.description || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination-bar">
                                <button
                                    className="page-btn"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    &lsaquo; Prev
                                </button>
                                <span className="page-info">Page {page} of {totalPages}</span>
                                <button
                                    className="page-btn"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                >
                                    Next &rsaquo;
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default ActivityPage;
