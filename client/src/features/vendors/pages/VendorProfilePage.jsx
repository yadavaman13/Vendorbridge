import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import { useVendorProfile } from '../hooks/useVendorProfile';
import Loader from '../../shared/components/Loader';
import '../styles/vendors.scss';

const VendorProfilePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { vendor, loading, error, fetchVendorProfile } = useVendorProfile();

    useEffect(() => {
        if (user?.role === 'VENDOR') {
            fetchVendorProfile();
        }
    }, [fetchVendorProfile, user?.role]);

    if (user?.role !== 'VENDOR') {
        return (
            <div className="vb-page-shell">
                <div className="vb-vendors-page__alert error-alert">
                    <h2>Access Denied</h2>
                    <p>Only vendor users can view this page.</p>
                    <button
                        type="button"
                        className="vb-btn vb-btn--secondary"
                        onClick={() => navigate('/dashboard')}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="vb-vendors-page">
            <header className="vb-vendors-page__header">
                <h1 className="vb-vendors-page__title">My Vendor Profile</h1>
                <p className="vb-vendors-page__subtitle">
                    View the details of your registered vendor organization.
                </p>
            </header>

            {loading ? (
                <div className="vb-vendors-details__loading">
                    <Loader text="Loading your vendor profile..." />
                </div>
            ) : error ? (
                <div className="vb-vendors-page__alert error-alert">
                    <span>{error}</span>
                </div>
            ) : vendor ? (
                <div className="vb-vendors-details vb-surface">
                    <div className="vb-vendors-details__section">
                        <h3 className="section-title">Company Profile</h3>
                        <div className="details-grid">
                            <div className="detail-item">
                                <span className="detail-label">Company Name</span>
                                <span className="detail-value highlight">{vendor.companyName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">GST Number</span>
                                <span className="detail-value">{vendor.gstNumber || '—'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Status</span>
                                <span className={`vb-vendor-badge status-${vendor.status?.toLowerCase()}`}>
                                    {vendor.status}
                                </span>
                            </div>
                            <div className="detail-item full-width">
                                <span className="detail-label">Office Address</span>
                                <span className="detail-value">{vendor.address || '—'}</span>
                            </div>
                        </div>
                    </div>

                    <hr className="modal-divider" />

                    <div className="vb-vendors-details__section">
                        <h3 className="section-title">Procurement Category</h3>
                        <div className="details-grid">
                            <div className="detail-item">
                                <span className="detail-label">Category Name</span>
                                <span className="detail-value">{vendor.category?.name || '—'}</span>
                            </div>
                        </div>
                    </div>

                    <hr className="modal-divider" />

                    <div className="vb-vendors-details__section">
                        <h3 className="section-title">Primary Contact</h3>
                        <div className="details-grid">
                            <div className="detail-item">
                                <span className="detail-label">Full Name</span>
                                <span className="detail-value">{vendor.user?.name || '—'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Email Address</span>
                                <span className="detail-value">{vendor.user?.email || '—'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Phone Number</span>
                                <span className="detail-value">{vendor.user?.phone || '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="vb-vendors-page__alert error-alert">
                    <span>No vendor profile available at the moment.</span>
                </div>
            )}
        </div>
    );
};

export default VendorProfilePage;
