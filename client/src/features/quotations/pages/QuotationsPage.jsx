import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../shared/components/Layout';
import { useAuth } from '../../auth/hooks/useAuth';
import {
    FileText, CheckCircle, XCircle, AlertCircle, Search, RefreshCw, Plus,
} from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '', withCredentials: true });

const StatusBadge = ({ status }) => (
    <span className={`status-badge ${status?.toLowerCase()}`}>{status}</span>
);

const QuotationsPage = () => {
    const { user } = useAuth();
    const [quotations, setQuotations] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, visible: false })), 4000);
    };

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: 100 });
            if (statusFilter) params.set('status', statusFilter);
            const res = await api.get(`/api/quotations?${params}`);
            if (res.data?.success) {
                setQuotations(res.data.data.items || []);
                setTotal(res.data.data.total || 0);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load quotations.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQuotations(); }, [statusFilter]);

    const handleSelect = async (id) => {
        try {
            const res = await api.patch(`/api/quotations/${id}/select`);
            if (res.data?.success) { showToast('Quotation selected!'); fetchQuotations(); }
        } catch (err) { showToast(err.response?.data?.message || 'Failed.', 'error'); }
    };

    const handleReject = async (id) => {
        try {
            const res = await api.patch(`/api/quotations/${id}/reject`);
            if (res.data?.success) { showToast('Quotation rejected.'); fetchQuotations(); }
        } catch (err) { showToast(err.response?.data?.message || 'Failed.', 'error'); }
    };

    const isStaff = user?.role !== 'VENDOR';

    const filtered = quotations.filter(q =>
        !search ||
        q.rfqTitle?.toLowerCase().includes(search.toLowerCase()) ||
        q.companyName?.toLowerCase().includes(search.toLowerCase())
    );

    // Group by status for summary
    const summary = {
        PENDING: quotations.filter(q => q.status === 'PENDING').length,
        SELECTED: quotations.filter(q => q.status === 'SELECTED').length,
        REJECTED: quotations.filter(q => q.status === 'REJECTED').length,
    };

    return (
        <Layout title="Quotations">
            {toast.visible && (
                <div className={`toast-banner ${toast.type === 'error' ? 'is-error' : 'is-success'}`}>
                    {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    <span className="toast-message">{toast.message}</span>
                </div>
            )}

            {/* Summary chips */}
            <div className="summary-chips">
                <div className="summary-chip chip-total">
                    <span className="chip-value">{total}</span>
                    <span className="chip-label">Total Bids</span>
                </div>
                <div className="summary-chip chip-pending">
                    <span className="chip-value">{summary.PENDING}</span>
                    <span className="chip-label">Pending</span>
                </div>
                <div className="summary-chip chip-success">
                    <span className="chip-value">{summary.SELECTED}</span>
                    <span className="chip-label">Selected</span>
                </div>
                <div className="summary-chip chip-danger">
                    <span className="chip-value">{summary.REJECTED}</span>
                    <span className="chip-label">Rejected</span>
                </div>
            </div>

            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <h2 className="page-section-title">
                        <FileText size={18} /> Quotation Bids
                    </h2>
                </div>
                <div className="page-toolbar-right">
                    <div className="search-input-wrap">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Search by title or vendor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="SELECTED">Selected</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <button className="icon-action-btn" onClick={fetchQuotations} title="Refresh">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            <div className="procurement-content-card" style={{ minHeight: 300 }}>
                {loading ? (
                    <div className="loading-state"><div className="spinner" /><p>Loading quotations...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state"><AlertCircle size={40} /><p>No quotations match your filters.</p></div>
                ) : (
                    <table className="procurement-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>RFQ Title</th>
                                <th>Vendor</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                                <th>Delivery</th>
                                <th>Status</th>
                                {isStaff && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(q => (
                                <tr key={q.id}>
                                    <td style={{ color: 'var(--primary)', fontWeight: 700 }}>#{q.id}</td>
                                    <td>{q.rfqTitle || '—'}</td>
                                    <td><strong>{q.companyName}</strong></td>
                                    <td>{q.quantity || '—'}</td>
                                    <td>INR {Number(q.unitPrice || 0).toLocaleString()}</td>
                                    <td><strong>INR {Number(q.totalAmount).toLocaleString()}</strong></td>
                                    <td>{q.leadTimeDays ? `${q.leadTimeDays}d` : '—'}</td>
                                    <td><StatusBadge status={q.status} /></td>
                                    {isStaff && (
                                        <td>
                                            <div className="action-button-group">
                                                {q.status === 'PENDING' && (
                                                    <>
                                                        <button className="action-btn generate-po-btn" onClick={() => handleSelect(q.id)}>
                                                            <CheckCircle size={13} /> Select
                                                        </button>
                                                        <button
                                                            className="action-btn"
                                                            style={{ background: 'var(--danger-bg-08)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                                                            onClick={() => handleReject(q.id)}
                                                        >
                                                            <XCircle size={13} /> Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    );
};

export default QuotationsPage;
