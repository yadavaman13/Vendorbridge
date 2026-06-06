import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../shared/components/Layout';
import { useAuth } from '../../auth/hooks/useAuth';
import {
    CheckCircle, XCircle, AlertCircle, RefreshCw, Clock,
    ThumbsUp, ThumbsDown, MessageSquare, Search,
} from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '', withCredentials: true });

const StatusBadge = ({ status }) => (
    <span className={`status-badge ${status?.toLowerCase()}`}>{status}</span>
);

const ApprovalsPage = () => {
    const { user } = useAuth();
    const [approvals, setApprovals] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [remarksModal, setRemarksModal] = useState({ open: false, id: null, action: null });
    const [remarks, setRemarks] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, visible: false })), 4000);
    };

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: 100 });
            if (statusFilter) params.set('status', statusFilter);
            const res = await api.get(`/api/approvals?${params}`);
            if (res.data?.success) {
                setApprovals(res.data.data.items || []);
                setTotal(res.data.data.total || 0);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load approvals.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchApprovals(); }, [statusFilter]);

    const handleAction = async () => {
        const { id, action } = remarksModal;
        try {
            const url = `/api/approvals/${id}/${action}`;
            const res = await api.patch(url, { remarks });
            if (res.data?.success) {
                showToast(`Approval ${action}d successfully.`);
                setRemarksModal({ open: false, id: null, action: null });
                setRemarks('');
                fetchApprovals();
            }
        } catch (err) {
            showToast(err.response?.data?.message || `Failed to ${remarksModal.action}.`, 'error');
        }
    };

    const openModal = (id, action) => {
        setRemarks('');
        setRemarksModal({ open: true, id, action });
    };

    const filtered = approvals.filter(a =>
        !search ||
        String(a.quotationId).includes(search) ||
        a.approverName?.toLowerCase().includes(search.toLowerCase())
    );

    const summary = {
        PENDING: approvals.filter(a => a.status === 'PENDING').length,
        APPROVED: approvals.filter(a => a.status === 'APPROVED').length,
        REJECTED: approvals.filter(a => a.status === 'REJECTED').length,
    };

    return (
        <Layout title="Approvals">
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
                    <span className="chip-label">Total</span>
                </div>
                <div className="summary-chip chip-pending">
                    <span className="chip-value">{summary.PENDING}</span>
                    <span className="chip-label">Pending</span>
                </div>
                <div className="summary-chip chip-success">
                    <span className="chip-value">{summary.APPROVED}</span>
                    <span className="chip-label">Approved</span>
                </div>
                <div className="summary-chip chip-danger">
                    <span className="chip-value">{summary.REJECTED}</span>
                    <span className="chip-label">Rejected</span>
                </div>
            </div>

            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <h2 className="page-section-title">
                        <CheckCircle size={18} /> Approval Requests
                    </h2>
                </div>
                <div className="page-toolbar-right">
                    <div className="search-input-wrap">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Search by quotation ID..."
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
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <button className="icon-action-btn" onClick={fetchApprovals} title="Refresh">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            <div className="procurement-content-card" style={{ minHeight: 300 }}>
                {loading ? (
                    <div className="loading-state"><div className="spinner" /><p>Loading approvals...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state"><AlertCircle size={40} /><p>No approval requests found.</p></div>
                ) : (
                    <table className="procurement-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Quotation ID</th>
                                <th>Approver</th>
                                <th>Remarks</th>
                                <th>Status</th>
                                <th>Submitted</th>
                                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => (
                                <tr key={a.id}>
                                    <td style={{ color: 'var(--primary)', fontWeight: 700 }}>#{a.id}</td>
                                    <td>Quotation #{a.quotationId}</td>
                                    <td>{a.approverName || `User #${a.approverId}`}</td>
                                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {a.remarks || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                    </td>
                                    <td><StatusBadge status={a.status} /></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                        {new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                                        <td>
                                            {a.status === 'PENDING' && (
                                                <div className="action-button-group">
                                                    <button
                                                        className="action-btn generate-po-btn"
                                                        onClick={() => openModal(a.id, 'approve')}
                                                    >
                                                        <ThumbsUp size={13} /> Approve
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        style={{ background: 'var(--danger-bg-08)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                                                        onClick={() => openModal(a.id, 'reject')}
                                                    >
                                                        <ThumbsDown size={13} /> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Remarks Modal */}
            {remarksModal.open && (
                <div className="overlay-modal-backdrop">
                    <div className="modal-container" style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h2 style={{ textTransform: 'capitalize' }}>
                                {remarksModal.action} Approval #{remarksModal.id}
                            </h2>
                            <button className="close-modal-btn" onClick={() => setRemarksModal({ open: false, id: null, action: null })}>
                                &times;
                            </button>
                        </div>
                        <div className="modal-form">
                            <div className="form-input-group">
                                <label>Remarks (optional)</label>
                                <textarea
                                    className="form-textarea-input"
                                    placeholder="Add remarks or reason..."
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                />
                            </div>
                            <div className="modal-actions-footer">
                                <button className="cancel-footer-btn" onClick={() => setRemarksModal({ open: false, id: null, action: null })}>
                                    Cancel
                                </button>
                                <button
                                    className="submit-footer-btn"
                                    style={remarksModal.action === 'reject' ? { background: 'var(--danger)' } : {}}
                                    onClick={handleAction}
                                >
                                    Confirm {remarksModal.action === 'approve' ? 'Approval' : 'Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ApprovalsPage;
