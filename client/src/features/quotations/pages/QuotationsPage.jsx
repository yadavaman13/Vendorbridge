import React, { useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useQuotations } from '../hooks/useQuotations';
import Table from '../../shared/components/Table';
import Modal from '../../shared/components/Modal';
import Loader from '../../shared/components/Loader';
import Toast from '../../shared/components/Toast';
import '../styles/quotations.scss';

const formatAmount = (value) => {
    if (value == null) return '—';
    return `₹${Number(value).toLocaleString('en-IN')}`;
};

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

const QuotationStatusBadge = ({ status }) => {
    const normalized = status?.toLowerCase() || '';
    return (
        <span className={`vb-quotation-badge status-${normalized}`}>
            {status}
        </span>
    );
};

const QuotationDetailsItem = ({ label, value }) => (
    <div className="vb-quotation-details__item">
        <span className="vb-quotation-details__label">{label}</span>
        <span className="vb-quotation-details__value">{value || '—'}</span>
    </div>
);

const QuotationItemsTable = ({ items }) => (
    <table className="vb-quotation-items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Delivery (days)</th>
                <th>Line Total</th>
            </tr>
        </thead>
        <tbody>
            {items.map((item) => (
                <tr key={item.id}>
                    <td>{item.itemName}</td>
                    <td>{item.quantity}</td>
                    <td>{formatAmount(item.unitPrice)}</td>
                    <td>{item.deliveryDays}</td>
                    <td>{formatAmount(item.lineTotal)}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

const QuotationPage = () => {
    const { user } = useAuth();
    const {
        quotations,
        total,
        page,
        limit,
        statusFilter,
        searchTerm,
        loading,
        detailsLoading,
        error,
        selectedQuotation,
        toastConfig,
        fetchQuotationDetails,
        setSelectedQuotation,
        closeToast,
        handleStatusFilterChange,
        handleSearchChange,
        handleSubmit,
        handleSelect,
        handleReject,
        setPage,
    } = useQuotations();

    const isVendor = user?.role === 'VENDOR';
    const isApprover = ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'].includes(user?.role);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const columns = useMemo(() => {
        const baseColumns = [
            {
                key: 'rfqTitle',
                header: 'RFQ',
                render: (row) => row.rfqTitle || '—',
            },
            {
                key: 'totalAmount',
                header: 'Total',
                render: (row) => formatAmount(row.totalAmount),
            },
            {
                key: 'status',
                header: 'Status',
                render: (row) => <QuotationStatusBadge status={row.status} />,
            },
            {
                key: 'submittedAt',
                header: 'Submitted',
                render: (row) => formatDate(row.submittedAt),
            },
        ];

        if (isApprover) {
            baseColumns.splice(1, 0, {
                key: 'companyName',
                header: 'Vendor',
                render: (row) => row.companyName || '—',
            });
        }

        return baseColumns;
    }, [isApprover]);

    const handleRowClick = async (row) => {
        await fetchQuotationDetails(row.id);
    };

    const getModalFooter = () => {
        if (!selectedQuotation) {
            return (
                <button type="button" className="vb-btn vb-btn--secondary" onClick={() => setSelectedQuotation(null)}>
                    Close
                </button>
            );
        }

        if (isVendor && selectedQuotation.status === 'DRAFT') {
            return (
                <div className="vb-quotations-modal__actions">
                    <button
                        type="button"
                        className="vb-btn vb-btn--success"
                        onClick={async () => {
                            const result = await handleSubmit(selectedQuotation.id);
                            if (result.success) {
                                fetchQuotationDetails(selectedQuotation.id);
                            }
                        }}
                        disabled={loading}
                    >
                        Submit Quotation
                    </button>
                    <button type="button" className="vb-btn vb-btn--secondary" onClick={() => setSelectedQuotation(null)}>
                        Close
                    </button>
                </div>
            );
        }

        if (isApprover && selectedQuotation.status === 'SUBMITTED') {
            return (
                <div className="vb-quotations-modal__actions">
                    <button
                        type="button"
                        className="vb-btn vb-btn--danger"
                        onClick={async () => {
                            const result = await handleReject(selectedQuotation.id);
                            if (result.success) {
                                fetchQuotationDetails(selectedQuotation.id);
                            }
                        }}
                        disabled={loading}
                    >
                        Reject Quotation
                    </button>
                    <button
                        type="button"
                        className="vb-btn vb-btn--success"
                        onClick={async () => {
                            const result = await handleSelect(selectedQuotation.id);
                            if (result.success) {
                                fetchQuotationDetails(selectedQuotation.id);
                            }
                        }}
                        disabled={loading}
                    >
                        Select as Winner
                    </button>
                    <button type="button" className="vb-btn vb-btn--secondary" onClick={() => setSelectedQuotation(null)}>
                        Close
                    </button>
                </div>
            );
        }

        return (
            <button type="button" className="vb-btn vb-btn--secondary" onClick={() => setSelectedQuotation(null)}>
                Close
            </button>
        );
    };

    return (
        <div className="vb-page-shell">
            <header className="vb-quotations-page__header">
                <h1 className="vb-quotations-page__title">Quotations</h1>
                <p className="vb-quotations-page__subtitle">
                    Review and manage submitted quotations for RFQs across procurement.
                </p>
            </header>

            <div className="vb-quotations-page__toolbar vb-surface">
                <div className="vb-quotations-page__search-box">
                    <div className="vb-search-input-wrapper">
                        <span className="vb-search-icon">🔍</span>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => handleSearchChange(event.target.value)}
                            placeholder="Search by RFQ, vendor, amount, or status"
                            className="vb-search-input"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                className="vb-search-clear"
                                onClick={() => handleSearchChange('')}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <span className="vb-search-summary">Showing {quotations.length} of {total} quotations</span>
                </div>

                <div className="vb-filter-tabs">
                    {['', 'DRAFT', 'SUBMITTED', 'SELECTED', 'REJECTED'].map((status) => (
                        <button
                            key={status || 'ALL'}
                            type="button"
                            className={`vb-filter-tab ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => handleStatusFilterChange(status)}
                        >
                            {status ? status.toLowerCase().replace('_', ' ') : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {error ? (
                <div className="vb-quotations-page__alert error-alert">
                    <span>{error}</span>
                </div>
            ) : (
                <div className="vb-quotations-page__table-wrapper vb-surface">
                    <Table
                        columns={columns}
                        data={quotations}
                        rowKey="id"
                        loading={loading}
                        onRowClick={handleRowClick}
                        emptyState={{
                            title: 'No quotations available',
                            description: 'Try a broader search or update the active filters.',
                        }}
                    />
                </div>
            )}

            {!loading && totalPages > 1 && (
                <div className="vb-quotations-page__pagination">
                    <button
                        type="button"
                        className="vb-pagination-btn"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                    >
                        &larr; Previous
                    </button>
                    <span className="vb-pagination-text">Page {page} of {totalPages} ({total} total)</span>
                    <button
                        type="button"
                        className="vb-pagination-btn"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                    >
                        Next &rarr;
                    </button>
                </div>
            )}

            <Modal
                open={Boolean(selectedQuotation) || detailsLoading}
                onClose={() => setSelectedQuotation(null)}
                title={selectedQuotation ? `Quotation #${selectedQuotation.id}` : 'Loading quotation'}
                size="lg"
                footer={getModalFooter()}
            >
                {selectedQuotation ? (
                    <div className="vb-quotation-details">
                        <div className="vb-quotation-details__summary">
                            <QuotationDetailsItem label="RFQ" value={selectedQuotation.rfqTitle} />
                            <QuotationDetailsItem label="Vendor" value={selectedQuotation.companyName} />
                            <QuotationDetailsItem label="Total" value={formatAmount(selectedQuotation.totalAmount)} />
                            <QuotationDetailsItem label="Status" value={<QuotationStatusBadge status={selectedQuotation.status} />} />
                            <QuotationDetailsItem label="Submitted" value={formatDate(selectedQuotation.submittedAt)} />
                            <QuotationDetailsItem label="Notes" value={selectedQuotation.notes || 'No notes provided.'} />
                        </div>

                        <div className="vb-quotation-details__section">
                            <h3 className="vb-quotation-details__section-title">Quotation Items</h3>
                            <QuotationItemsTable items={selectedQuotation.items || []} />
                        </div>
                    </div>
                ) : (
                    <div className="vb-quotation-details__loading">
                        <Loader text="Loading quotation details..." />
                    </div>
                )}
            </Modal>

            <Toast
                open={toastConfig.open}
                variant={toastConfig.variant}
                title={toastConfig.title}
                message={toastConfig.message}
                onClose={closeToast}
                duration={4200}
                className="vb-toast-wrapper"
            />
        </div>
    );
};

export default QuotationPage;
