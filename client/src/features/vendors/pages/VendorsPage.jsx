import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../shared/components/Layout';
import { useAuth } from '../../auth/hooks/useAuth';
import {
    Users, CheckCircle, XCircle, AlertCircle, Loader2,
    Building2, Mail, Phone, Globe, Shield, Search, RefreshCw,
} from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '', withCredentials: true });

const StatusBadge = ({ status }) => (
    <span className={`status-badge ${status?.toLowerCase()}`}>{status}</span>
);

const VendorsPage = () => {
    const { user } = useAuth();
    const [vendors, setVendors] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, visible: false })), 4000);
    };

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: 100 });
            if (statusFilter) params.set('status', statusFilter);
            const res = await api.get(`/api/vendors?${params}`);
            if (res.data?.success) {
                setVendors(res.data.data.items || []);
                setTotal(res.data.data.total || 0);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load vendors.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVendors(); }, [statusFilter]);

    const handleStatusUpdate = async (id, status) => {
        try {
            const res = await api.patch(`/api/vendors/${id}/status`, { status });
            if (res.data?.success) {
                showToast(`Vendor status updated to ${status}.`);
                fetchVendors();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update status.', 'error');
        }
    };

    const filtered = vendors.filter(v =>
        !search ||
        v.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        v.contactEmail?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout title="Vendors">
            {toast.visible && (
                <div className={`toast-banner ${toast.type === 'error' ? 'is-error' : 'is-success'}`}>
                    {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    <span className="toast-message">{toast.message}</span>
                </div>
            )}

            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <h2 className="page-section-title">
                        <Users size={18} /> Vendor Directory
                    </h2>
                    <span className="page-count-badge">{total} vendors</span>
                </div>
                <div className="page-toolbar-right">
                    <div className="search-input-wrap">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Search vendors..."
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
                    <button className="icon-action-btn" onClick={fetchVendors} title="Refresh">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            <div className="procurement-content-card" style={{ minHeight: 300 }}>
                {loading ? (
                    <div className="loading-state"><div className="spinner" /><p>Loading vendors...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state"><AlertCircle size={40} /><p>No vendors found.</p></div>
                ) : (
                    <table className="procurement-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Contact Person</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>GST / Tax ID</th>
                                <th>Status</th>
                                {user?.role === 'ADMIN' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(v => (
                                <tr key={v.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="vendor-avatar">{v.companyName?.charAt(0)}</div>
                                            <strong>{v.companyName}</strong>
                                        </div>
                                    </td>
                                    <td>{v.contactPerson || '—'}</td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                                            {v.contactEmail || '—'}
                                        </span>
                                    </td>
                                    <td>{v.phone || '—'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.gstNumber || '—'}</td>
                                    <td><StatusBadge status={v.status} /></td>
                                    {user?.role === 'ADMIN' && (
                                        <td>
                                            <div className="action-button-group">
                                                {v.status !== 'APPROVED' && (
                                                    <button
                                                        className="action-btn generate-po-btn"
                                                        onClick={() => handleStatusUpdate(v.id, 'APPROVED')}
                                                    >
                                                        <CheckCircle size={13} /> Approve
                                                    </button>
                                                )}
                                                {v.status !== 'REJECTED' && (
                                                    <button
                                                        className="action-btn"
                                                        style={{ background: 'var(--danger-bg-08)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                                                        onClick={() => handleStatusUpdate(v.id, 'REJECTED')}
                                                    >
                                                        <XCircle size={13} /> Reject
                                                    </button>
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

export default VendorsPage;
