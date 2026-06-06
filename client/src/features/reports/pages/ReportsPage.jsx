import React from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useReports } from '../hooks/useReports';
import Loader from '../../shared/components/Loader';
import '../../vendors/styles/vendors.scss';
import '../styles/reports.scss';

const ReportsPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const { procurementReport, vendorPerformance, loading, error, summaryRows } = useReports();

    if (!isAdmin) {
        return (
            <div className="vb-page-shell">
                <div className="vb-vendors-page__alert error-alert">
                    <h2>Access Denied</h2>
                    <p>Only Admin users can view procurement analytics.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vb-page-shell">
            <header className="vb-vendors-page__header">
                <div>
                    <h1 className="vb-vendors-page__title">Procurement Analytics</h1>
                    <p className="vb-vendors-page__subtitle">
                        View spend summaries, request status trends, and vendor performance in one place.
                    </p>
                </div>
            </header>

            {loading ? (
                <div className="vb-loader-center">
                    <Loader text="Loading analytics..." />
                </div>
            ) : error ? (
                <div className="vb-vendors-page__alert error-alert">
                    <span>{error}</span>
                </div>
            ) : (
                <div className="vb-reports-grid">
                    <section className="vb-report-card vb-surface">
                        <h2 className="vb-report-card__title">Key summary</h2>
                        <div className="vb-report-summary">
                            {summaryRows.map((item) => (
                                <div key={item.label} className="vb-report-summary__item">
                                    <span className="vb-report-summary__label">{item.label}</span>
                                    <strong className="vb-report-summary__value">{item.value}</strong>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="vb-report-card vb-surface">
                        <h2 className="vb-report-card__title">Vendor performance</h2>
                        <div className="vb-report-table-wrapper">
                            <table className="vb-table">
                                <thead>
                                    <tr>
                                        <th>Vendor</th>
                                        <th>Requests</th>
                                        <th>On-time</th>
                                        <th>Spend</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vendorPerformance?.map((row) => (
                                        <tr key={row.vendorId || row.vendorName}>
                                            <td>{row.vendorName || 'Unknown'}</td>
                                            <td>{row.requestCount || 0}</td>
                                            <td>{row.onTimeRate ? `${row.onTimeRate}%` : 'N/A'}</td>
                                            <td>{row.totalSpend ? `₦${row.totalSpend.toLocaleString()}` : '–'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!vendorPerformance?.length && (
                                <p className="vb-empty-message">No vendor performance data available.</p>
                            )}
                        </div>
                    </section>

                    <section className="vb-report-card vb-surface">
                        <h2 className="vb-report-card__title">Request breakdown</h2>
                        <dl className="vb-report-breakdown">
                            <div className="vb-report-breakdown__row">
                                <dt>Total requests</dt>
                                <dd>{procurementReport?.requestCount ?? 'N/A'}</dd>
                            </div>
                            <div className="vb-report-breakdown__row">
                                <dt>Approved value</dt>
                                <dd>{procurementReport?.approvedValue ? `₦${procurementReport.approvedValue.toLocaleString()}` : 'N/A'}</dd>
                            </div>
                            <div className="vb-report-breakdown__row">
                                <dt>Rejected value</dt>
                                <dd>{procurementReport?.rejectedValue ? `₦${procurementReport.rejectedValue.toLocaleString()}` : 'N/A'}</dd>
                            </div>
                            <div className="vb-report-breakdown__row">
                                <dt>Average request value</dt>
                                <dd>{procurementReport?.averageValue ? `₦${procurementReport.averageValue.toLocaleString()}` : 'N/A'}</dd>
                            </div>
                        </dl>
                    </section>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
