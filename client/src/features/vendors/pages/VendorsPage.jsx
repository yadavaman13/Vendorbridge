import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import { useVendors } from '../hooks/useVendors';
import Table from '../../shared/components/Table';
import Modal from '../../shared/components/Modal';
import Loader from '../../shared/components/Loader';
import Toast from '../../shared/components/Toast';
import '../styles/vendors.scss';

const VendorsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        vendors,
        total,
        page,
        limit,
        loading,
        error,
        selectedVendor,
        setSelectedVendor,
        detailsLoading,
        fetchVendors,
        fetchVendorDetails,
        handleUpdateStatus,
    } = useVendors();

    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [toastConfig, setToastConfig] = useState({ open: false, variant: 'info', title: '', message: '' });

    // Fetch vendors on load and on page/filter change
    const isVendorUser = user?.role === 'VENDOR';

    useEffect(() => {
        if (isVendorUser) {
            return;
        }

        fetchVendors({ page: currentPage, limit: 10, status: statusFilter });
    }, [fetchVendors, currentPage, statusFilter, isVendorUser]);

    const showToast = (variant, title, message) => {
        setToastConfig({ open: true, variant, title, message });
    };

    const closeToast = () => {
        setToastConfig((prev) => ({ ...prev, open: false }));
    };

    const handleFilterChange = (status) => {
        setStatusFilter(status);
        setCurrentPage(1); // reset page on filter change
    };

    const handlePageChange = (nextPage) => {
        setCurrentPage(nextPage);
    };

    const handleRowClick = async (row) => {
        // Fetch detailed data including address, user and category information
        await fetchVendorDetails(row.id);
    };

    const handleStatusUpdate = async (id, status) => {
        const result = await handleUpdateStatus(id, status);
        if (result.success) {
            showToast('success', 'Status Updated', `Vendor status updated to ${status} successfully.`);
            // Refresh list in place
            fetchVendors({ page: currentPage, limit: 10, status: statusFilter });
        } else {
            showToast('error', 'Update Failed', result.message || 'Failed to update vendor status.');
        }
    };

    const isAdmin = user?.role === 'ADMIN';
    const totalPages = Math.ceil(total / limit);

    if (isVendorUser) {
        return (
            <div className="vb-page-shell">
                <div className="vb-vendors-page__alert error-alert">
                    <h2>Access Denied</h2>
                    <p>Vendor users are not authorized to access the vendor management list.</p>
                    <button
                        type="button"
                        className="vb-btn vb-btn--secondary"
                        onClick={() => navigate('/vendors/me')}
                    >
                        View My Vendor Profile
                    </button>
                </div>
            </div>
        );
    }

    const columns = [
        {
            key: 'companyName',
            header: 'Company Name',
            className: 'vb-vendors-table__col-company',
            render: (row) => (
                <div className="company-cell">
                    <span className="company-name">{row.companyName}</span>
                </div>
            )
        },
        {
            key: 'category',
            header: 'Category',
            className: 'vb-vendors-table__col-category',
            render: (row) => row.category?.name || '—'
        },
        {
            key: 'contact',
            header: 'Contact Person',
            className: 'vb-vendors-table__col-contact',
            render: (row) => (
                <div className="contact-cell">
                    <span className="contact-name">{row.user?.name || '—'}</span>
                    <span className="contact-email">{row.user?.email}</span>
                </div>
            )
        },
        {
            key: 'gstNumber',
            header: 'GST Number',
            className: 'vb-vendors-table__col-gst'
        },
        {
            key: 'status',
            header: 'Status',
            className: 'vb-vendors-table__col-status',
            render: (row) => {
                const statusClass = row.status.toLowerCase();
                return (
                    <span className={`vb-vendor-badge status-${statusClass}`}>
                        {row.status}
                    </span>
                );
            }
        }
    ];

    return (
        <div className="vb-vendors-page">
            <header className="vb-vendors-page__header">
                <h1 className="vb-vendors-page__title">Vendors</h1>
                <p className="vb-vendors-page__subtitle">
                    List and manage registered Vendor organizations in VendorBridge.
                </p>
            </header>

            {/* Toast Alerts */}
            <div className="vb-toast-wrapper">
                <Toast
                    open={toastConfig.open}
                    variant={toastConfig.variant}
                    title={toastConfig.title}
                    message={toastConfig.message}
                    onClose={closeToast}
                    duration={4000}
                />
            </div>

            {/* Filter Tabs */}
            <div className="vb-vendors-page__filters">
                <div className="vb-filter-tabs">
                    <button
                        type="button"
                        className={`vb-filter-tab ${statusFilter === '' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('')}
                    >
                        All Vendors
                    </button>
                    <button
                        type="button"
                        className={`vb-filter-tab ${statusFilter === 'PENDING' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('PENDING')}
                    >
                        Pending Onboarding
                    </button>
                    <button
                        type="button"
                        className={`vb-filter-tab ${statusFilter === 'APPROVED' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('APPROVED')}
                    >
                        Approved
                    </button>
                    <button
                        type="button"
                        className={`vb-filter-tab ${statusFilter === 'REJECTED' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('REJECTED')}
                    >
                        Rejected
                    </button>
                </div>
            </div>

            {/* Table Area */}
            {error ? (
                <div className="vb-vendors-page__alert error-alert">
                    <span>{error}</span>
                </div>
            ) : (
                <div className="vb-vendors-page__table-wrapper vb-surface">
                    <Table
                        columns={columns}
                        data={vendors}
                        rowKey="id"
                        loading={loading}
                        onRowClick={handleRowClick}
                        emptyState={{
                            title: 'No vendors found',
                            description: 'No registered vendor matching the chosen status was found.'
                        }}
                    />
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="vb-vendors-page__pagination">
                    <button
                        type="button"
                        className="vb-pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        &larr; Previous
                    </button>
                    <span className="vb-pagination-text">
                        Page {currentPage} of {totalPages} ({total} total)
                    </span>
                    <button
                        type="button"
                        className="vb-pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next &rarr;
                    </button>
                </div>
            )}

            {/* Details Modal */}
            <Modal
                open={detailsLoading || Boolean(selectedVendor)}
                onClose={() => setSelectedVendor(null)}
                title="Vendor Detailed Profile"
                size="md"
                footer={
                    isAdmin && selectedVendor?.status === 'PENDING' ? (
                        <div className="vb-vendors-modal__actions">
                            <button
                                type="button"
                                className="vb-btn vb-btn--danger"
                                onClick={() => handleStatusUpdate(selectedVendor.id, 'REJECTED')}
                                disabled={loading}
                            >
                                Reject Onboarding
                            </button>
                            <button
                                type="button"
                                className="vb-btn vb-btn--success"
                                onClick={() => handleStatusUpdate(selectedVendor.id, 'APPROVED')}
                                disabled={loading}
                            >
                                Approve Vendor
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="vb-btn vb-btn--secondary"
                            onClick={() => setSelectedVendor(null)}
                        >
                            Close
                        </button>
                    )
                }
            >
                {selectedVendor ? (
                    <div className="vb-vendors-details">
                        <div className="vb-vendors-details__section">
                            <h3 className="section-title">Company Profile</h3>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Company Name</span>
                                    <span className="detail-value highlight">{selectedVendor.companyName}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">GST Number</span>
                                    <span className="detail-value">{selectedVendor.gstNumber}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status</span>
                                    <span className={`vb-vendor-badge status-${selectedVendor.status?.toLowerCase()}`}>
                                        {selectedVendor.status}
                                    </span>
                                </div>
                                <div className="detail-item full-width">
                                    <span className="detail-label">Office Address</span>
                                    <span className="detail-value">{selectedVendor.address}</span>
                                </div>
                            </div>
                        </div>

                        <hr className="modal-divider" />

                        <div className="vb-vendors-details__section">
                            <h3 className="section-title">Procurement Category</h3>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Category Name</span>
                                    <span className="detail-value">{selectedVendor.category?.name || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Category Code</span>
                                    <span className="detail-value code-font">{selectedVendor.category?.code || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <hr className="modal-divider" />

                        <div className="vb-vendors-details__section">
                            <h3 className="section-title">Primary Contact</h3>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Full Name</span>
                                    <span className="detail-value">{selectedVendor.user?.name || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email Address</span>
                                    <span className="detail-value">{selectedVendor.user?.email || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Phone Number</span>
                                    <span className="detail-value">{selectedVendor.user?.phone || '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="vb-vendors-details__loading">
                        <Loader text="Loading profile details..." />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default VendorsPage;
