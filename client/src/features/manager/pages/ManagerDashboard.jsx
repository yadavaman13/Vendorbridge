import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import DashboardNavbar from '../../shared/pages/DashboardNavbar';
import DashboardSidebar from '../../shared/pages/DashboardSidebar';
import {
    getDashboardSummary,
    getQuotations,
    selectQuotation,
    rejectQuotation,
    getRFQs,
    getQuotationComparison,
    getUsers,
    createProcurementOfficer,
    getProcurementReport,
    getVendorPerformanceReport
} from '../services/manager.api';
import {
    Check,
    X,
    Briefcase,
    Users,
    IndianRupee,
    ChevronRight,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import '../styles/manager-dashboard.scss';

const ManagerDashboard = () => {
    const { user, handleLogout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');

    // Dashboard State
    const [dashboardMetrics, setDashboardMetrics] = useState(null);
    const [loadingMetrics, setLoadingMetrics] = useState(true);

    // Quotations State
    const [quotationsList, setQuotationsList] = useState([]);
    const [loadingQuotations, setLoadingQuotations] = useState(false);

    // RFQs State
    const [rfqsList, setRFQsList] = useState([]);
    const [loadingRFQs, setLoadingRFQs] = useState(false);
    const [selectedRFQForComparison, setSelectedRFQForComparison] = useState(null);
    const [rfqComparisonData, setRfqComparisonData] = useState(null);
    const [loadingComparison, setLoadingComparison] = useState(false);

    // Procurement Officers State
    const [officersList, setOfficersList] = useState([]);
    const [loadingOfficers, setLoadingOfficers] = useState(false);
    const [registerForm, setRegisterForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [registerStatus, setRegisterStatus] = useState({ success: null, message: '' });
    const [registering, setRegistering] = useState(false);

    // Reports State
    const [spendReport, setSpendReport] = useState(null);
    const [vendorPerformance, setVendorPerformance] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);

    // Remarks Modal/Prompt State
    const [actioningQuotationId, setActioningQuotationId] = useState(null);
    const [actionType, setActionType] = useState(null); // 'select' or 'reject'
    const [actionRemarks, setActionRemarks] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    // Fetch handlers
    const fetchDashboardData = async () => {
        try {
            setLoadingMetrics(true);
            const data = await getDashboardSummary();
            if (data.success && data.data?.record) {
                setDashboardMetrics(data.data.record);
            }
            // Load all quotations for queue filtering and recent display
            const quotesRes = await getQuotations();
            if (quotesRes.success && quotesRes.data?.items) {
                setQuotationsList(quotesRes.data.items);
            }
            // Load RFQs to plot month-wise activity chart
            const rfqsRes = await getRFQs();
            if (rfqsRes.success && rfqsRes.data?.items) {
                setRFQsList(rfqsRes.data.items);
            }
            // Pre-load officers for dashboard count
            const usersRes = await getUsers();
            if (usersRes.success && usersRes.data?.items) {
                const officersOnly = usersRes.data.items.filter(u => u.role === 'PROCUREMENT_OFFICER');
                setOfficersList(officersOnly);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard summary', err);
        } finally {
            setLoadingMetrics(false);
        }
    };

    const fetchQuotationsData = async () => {
        try {
            setLoadingQuotations(true);
            const data = await getQuotations();
            if (data.success && data.data?.items) {
                setQuotationsList(data.data.items);
            }
        } catch (err) {
            console.error('Failed to fetch quotations', err);
        } finally {
            setLoadingQuotations(false);
        }
    };

    const fetchRFQsData = async () => {
        try {
            setLoadingRFQs(true);
            const data = await getRFQs();
            if (data.success && data.data?.items) {
                setRFQsList(data.data.items);
            }
        } catch (err) {
            console.error('Failed to fetch RFQs', err);
        } finally {
            setLoadingRFQs(false);
        }
    };

    const fetchOfficersData = async () => {
        try {
            setLoadingOfficers(true);
            const data = await getUsers();
            if (data.success && data.data?.items) {
                const officersOnly = data.data.items.filter(u => u.role === 'PROCUREMENT_OFFICER');
                setOfficersList(officersOnly);
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoadingOfficers(false);
        }
    };

    const fetchReportsData = async () => {
        try {
            setLoadingReports(true);
            const spendRes = await getProcurementReport();
            if (spendRes.success && spendRes.data?.record) {
                setSpendReport(spendRes.data.record);
            }
            const performanceRes = await getVendorPerformanceReport();
            if (performanceRes.success && performanceRes.data?.items) {
                setVendorPerformance(performanceRes.data.items);
            }
        } catch (err) {
            console.error('Failed to fetch reports', err);
        } finally {
            setLoadingReports(false);
        }
    };

    // Initial load
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDashboardData();
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // Tab-based data loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'dashboard') {
                fetchDashboardData();
            } else if (activeTab === 'quotations') {
                fetchQuotationsData();
            } else if (activeTab === 'rfqs') {
                fetchRFQsData();
            } else if (activeTab === 'officers') {
                fetchOfficersData();
            } else if (activeTab === 'reports') {
                fetchReportsData();
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [activeTab]);

    const handleOpenAction = (id, type) => {
        setActioningQuotationId(id);
        setActionType(type);
        setActionRemarks('');
        setRegisterStatus({ success: null, message: '' });
    };

    const handleConfirmQuotationAction = async () => {
        if (!actioningQuotationId) return;
        try {
            setSubmittingAction(true);
            let response;
            if (actionType === 'select') {
                response = await selectQuotation(actioningQuotationId);
            } else {
                response = await rejectQuotation(actioningQuotationId);
            }

            if (response.success) {
                // Refresh relevant lists
                if (activeTab === 'dashboard') {
                    fetchDashboardData();
                } else if (activeTab === 'quotations') {
                    fetchQuotationsData();
                }
                if (selectedRFQForComparison) {
                    handleViewComparison(selectedRFQForComparison);
                }
                setActioningQuotationId(null);
                setActionType(null);
            } else {
                alert(response.message || `Failed to ${actionType} quotation.`);
            }
        } catch (error) {
            console.error(`Error processing ${actionType} quotation`, error);
            alert(`Error processing request: ${error.message || error}`);
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleViewComparison = async (rfq) => {
        setSelectedRFQForComparison(rfq);
        setLoadingComparison(true);
        try {
            const res = await getQuotationComparison(rfq.id);
            if (res.success && res.data) {
                setRfqComparisonData(res.data);
            } else {
                setRfqComparisonData(null);
            }
        } catch (err) {
            console.error('Failed to fetch comparison', err);
            setRfqComparisonData(null);
        } finally {
            setLoadingComparison(false);
        }
    };

    const handleRegisterOfficer = async (e) => {
        e.preventDefault();
        setRegistering(true);
        setRegisterStatus({ success: null, message: '' });
        try {
            const res = await createProcurementOfficer(registerForm);
            if (res.success) {
                setRegisterStatus({
                    success: true,
                    message: 'Procurement Officer registered successfully!',
                });
                setRegisterForm({ name: '', email: '', phone: '', password: '' });
                fetchOfficersData();
            } else {
                setRegisterStatus({
                    success: false,
                    message: res.message || 'Registration failed.',
                });
            }
        } catch (err) {
            setRegisterStatus({
                success: false,
                message: err.response?.data?.message || 'Error occurred during registration.',
            });
        } finally {
            setRegistering(false);
        }
    };

    // Computations from states
    const pendingQuotationsCount = quotationsList.filter(q => q.status === 'SUBMITTED').length;
    const activeRFQsCount = rfqsList.filter(r => r.status === 'OPEN' || r.status === 'CLOSED').length;
    const totalSpendVal = spendReport?.totalCompletedSpend || 0;

    // Month-wise analytics calculations
    const rfqCountsByMonth = Array(12).fill(0);
    const quotationCountsByMonth = Array(12).fill(0);

    rfqsList.forEach(rfq => {
        if (rfq.createdAt) {
            const date = new Date(rfq.createdAt);
            const m = date.getMonth();
            if (m >= 0 && m < 12) {
                rfqCountsByMonth[m]++;
            }
        }
    });

    quotationsList.forEach(q => {
        const dateStr = q.submittedAt || q.createdAt;
        if (dateStr) {
            const date = new Date(dateStr);
            const m = date.getMonth();
            if (m >= 0 && m < 12) {
                quotationCountsByMonth[m]++;
            }
        }
    });

    const maxRfq = Math.max(...rfqCountsByMonth, 0);
    const maxQuote = Math.max(...quotationCountsByMonth, 0);
    const maxVal = Math.max(maxRfq, maxQuote, 1);

    const rfqPoints = rfqCountsByMonth.map((count, i) => {
        const x = 30 + i * (440 / 11);
        const y = 120 - (count / maxVal) * 90;
        return { x, y, count };
    });

    const quotePoints = quotationCountsByMonth.map((count, i) => {
        const x = 30 + i * (440 / 11);
        const y = 120 - (count / maxVal) * 90;
        return { x, y, count };
    });

    const rfqLinePath = rfqPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const rfqFillPath = rfqLinePath ? `${rfqLinePath} L 470 120 L 30 120 Z` : '';

    const quoteLinePath = quotePoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const quoteFillPath = quoteLinePath ? `${quoteLinePath} L 470 120 L 30 120 Z` : '';

    const monthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <main className="manager-dashboard-shell">
            <DashboardNavbar
                user={user}
                searchVal={searchQuery}
                onSearchChange={setSearchQuery}
            />

            <section className="manager-dashboard-body">
                <DashboardSidebar
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                        setActiveTab(tab);
                        setSelectedRFQForComparison(null);
                    }}
                    onLogout={handleLogout}
                />

                <div className="manager-content">
                    {/* Render active views */}
                    {activeTab === 'dashboard' && (
                        <div className="tab-pane-view">
                            <h2 className="tab-pane-title">Overview Dashboard</h2>
                            
                            {/* Stat cards section */}
                            <section className="manager-stat-grid">
                                <article className="manager-stat-tile">
                                    <div className="manager-stat-tile__icon-wrapper manager-stat-tile__icon-wrapper--danger">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div className="manager-stat-tile__content">
                                        <p className="manager-stat-tile__label">Pending Decisions</p>
                                        <h3 className="manager-stat-tile__value">
                                            {loadingMetrics ? '...' : pendingQuotationsCount}
                                        </h3>
                                        <p className="manager-stat-tile__helper">Quotations awaiting approval</p>
                                    </div>
                                </article>

                                <article className="manager-stat-tile">
                                    <div className="manager-stat-tile__icon-wrapper manager-stat-tile__icon-wrapper--primary">
                                        <Briefcase size={24} />
                                    </div>
                                    <div className="manager-stat-tile__content">
                                        <p className="manager-stat-tile__label">Active RFQs</p>
                                        <h3 className="manager-stat-tile__value">
                                            {loadingMetrics ? '...' : activeRFQsCount || dashboardMetrics?.rfqs?.length || 0}
                                        </h3>
                                        <p className="manager-stat-tile__helper">Active procurement cycles</p>
                                    </div>
                                </article>

                                <article className="manager-stat-tile">
                                    <div className="manager-stat-tile__icon-wrapper manager-stat-tile__icon-wrapper--success">
                                        <Users size={24} />
                                    </div>
                                    <div className="manager-stat-tile__content">
                                        <p className="manager-stat-tile__label">Procurement Officers</p>
                                        <h3 className="manager-stat-tile__value">
                                            {loadingMetrics ? '...' : officersList.length}
                                        </h3>
                                        <p className="manager-stat-tile__helper">Officers under your view</p>
                                    </div>
                                </article>

                                <article className="manager-stat-tile">
                                    <div className="manager-stat-tile__icon-wrapper manager-stat-tile__icon-wrapper--warning">
                                        <IndianRupee size={24} />
                                    </div>
                                    <div className="manager-stat-tile__content">
                                        <p className="manager-stat-tile__label">Total Spend</p>
                                        <h3 className="manager-stat-tile__value">
                                            {loadingMetrics ? '...' : `₹${totalSpendVal.toLocaleString()}`}
                                        </h3>
                                        <p className="manager-stat-tile__helper">Total completed order value</p>
                                    </div>
                                </article>
                            </section>

                            <section className="manager-content-grid">
                                {/* Activity chart / mock illustration */}
                                <article className="manager-card manager-card--wide">
                                    <header className="manager-card__header">
                                        <h2>Procurement Flow Trend</h2>
                                        <span className="manager-card__tag">Live Overview</span>
                                    </header>
                                    
                                    <div className="manager-chart-box">
                                        <div className="manager-chart-legend">
                                            <span className="legend-item"><span className="dot dot--primary" /> RFQs Opened</span>
                                            <span className="legend-item"><span className="dot dot--success" /> Quotations Received</span>
                                        </div>
                                        <svg className="manager-svg-chart" viewBox="0 0 500 150">
                                            <defs>
                                                <linearGradient id="rfqGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
                                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                                                </linearGradient>
                                                <linearGradient id="quoteGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                                                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                                                </linearGradient>
                                            </defs>

                                            {/* Grid line helpers */}
                                            <line x1="30" y1="120" x2="470" y2="120" stroke="#ececf0" strokeWidth="1" />
                                            <line x1="30" y1="75" x2="470" y2="75" stroke="#f1f2f6" strokeWidth="1" strokeDasharray="4" />
                                            <line x1="30" y1="30" x2="470" y2="30" stroke="#f1f2f6" strokeWidth="1" strokeDasharray="4" />

                                            {/* RFQ Area & Line */}
                                            {rfqFillPath && (
                                                <path d={rfqFillPath} fill="url(#rfqGradient)" stroke="none" />
                                            )}
                                            {rfqLinePath && (
                                                <path d={rfqLinePath} fill="none" stroke="var(--primary)" strokeWidth="2.5" />
                                            )}

                                            {/* Quotations Area & Line */}
                                            {quoteFillPath && (
                                                <path d={quoteFillPath} fill="url(#quoteGradient)" stroke="none" />
                                            )}
                                            {quoteLinePath && (
                                                <path d={quoteLinePath} fill="none" stroke="#22c55e" strokeWidth="2.5" />
                                            )}

                                            {/* Highlight circles on values */}
                                            {rfqPoints.map((p, i) => p.count > 0 && (
                                                <circle key={`rfq-dot-${i}`} cx={p.x} cy={p.y} r="4" fill="var(--primary)">
                                                    <title>RFQs: {p.count} in {monthsLabels[i]}</title>
                                                </circle>
                                            ))}
                                            {quotePoints.map((p, i) => p.count > 0 && (
                                                <circle key={`quote-dot-${i}`} cx={p.x} cy={p.y} r="4" fill="#22c55e">
                                                    <title>Quotations: {p.count} in {monthsLabels[i]}</title>
                                                </circle>
                                            ))}
                                        </svg>
                                        <div className="manager-chart-x-axis">
                                            {monthsLabels.map((m, idx) => (
                                                <span key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem' }}>{m}</span>
                                            ))}
                                        </div>
                                    </div>
                                </article>

                                {/* Decision Queue */}
                                <article className="manager-card">
                                    <header className="manager-card__header">
                                        <h2>Action Queue</h2>
                                        <span className="manager-card__tag manager-card__tag--danger">
                                            {pendingQuotationsCount} pending
                                        </span>
                                    </header>

                                    <div className="manager-decision-list">
                                        {loadingMetrics ? (
                                            <p className="text-center">Loading action queue...</p>
                                        ) : quotationsList.filter(q => q.status === 'SUBMITTED').slice(0, 3).length === 0 ? (
                                            <p className="manager-empty-state">No pending bids needing selection.</p>
                                        ) : (
                                            quotationsList
                                                .filter(q => q.status === 'SUBMITTED')
                                                .slice(0, 3)
                                                .map(quote => (
                                                    <div key={quote.id} className="decision-queue-item">
                                                        <div className="decision-queue-item__info">
                                                            <h4>RFQ #{quote.rfqId}</h4>
                                                            <p>Vendor: {quote.vendorName || `Vendor ID ${quote.vendorId}`}</p>
                                                            <strong className="quote-amount">₹{quote.totalAmount?.toLocaleString()}</strong>
                                                        </div>
                                                        <div className="decision-queue-item__actions">
                                                            <button
                                                                className="btn-action-icon btn-action-icon--select"
                                                                title="Select Bid"
                                                                onClick={() => handleOpenAction(quote.id, 'select')}
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                className="btn-action-icon btn-action-icon--reject"
                                                                title="Reject Bid"
                                                                onClick={() => handleOpenAction(quote.id, 'reject')}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </article>
                            </section>

                            <section className="manager-content-grid">
                                {/* Quotations List Overview */}
                                <article className="manager-card manager-card--wide">
                                    <header className="manager-card__header">
                                        <h2>Recent Quotations</h2>
                                        <button className="btn-text-link" onClick={() => setActiveTab('quotations')}>
                                            View All <ChevronRight size={16} />
                                        </button>
                                    </header>

                                    <div className="table-responsive">
                                        {loadingMetrics ? (
                                            <p className="text-center">Loading recent quotations...</p>
                                        ) : (
                                            <table className="manager-table">
                                                <thead>
                                                    <tr>
                                                        <th>Quotation ID</th>
                                                        <th>RFQ ID</th>
                                                        <th>Vendor</th>
                                                        <th>Total Amount</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {quotationsList.slice(0, 5).map(quote => (
                                                        <tr key={quote.id}>
                                                            <td>#Q-{quote.id}</td>
                                                            <td>#RFQ-{quote.rfqId}</td>
                                                            <td>{quote.vendorName || `Vendor ${quote.vendorId}`}</td>
                                                            <td>₹{quote.totalAmount?.toLocaleString()}</td>
                                                            <td>
                                                                <span className={`status-badge status-badge--${quote.status.toLowerCase()}`}>
                                                                    {quote.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {quotationsList.length === 0 && (
                                                        <tr>
                                                            <td colSpan="5" className="text-center">No quotations found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </article>

                                {/* Active Officers Summary */}
                                <article className="manager-card">
                                    <header className="manager-card__header">
                                        <h2>Procurement Team</h2>
                                        <button className="btn-text-link" onClick={() => setActiveTab('officers')}>
                                            Manage <ChevronRight size={16} />
                                        </button>
                                    </header>

                                    <div className="manager-officers-mini-list">
                                        {loadingMetrics ? (
                                            <p className="text-center">Loading team...</p>
                                        ) : officersList.slice(0, 4).map(off => (
                                            <div key={off.id} className="officer-mini-item">
                                                <div className="officer-mini-avatar">
                                                    {off.name.slice(0, 1).toUpperCase()}
                                                </div>
                                                <div className="officer-mini-details">
                                                    <h5>{off.name}</h5>
                                                    <p>{off.email}</p>
                                                </div>
                                                <span className={`status-dot ${off.isActive ? 'status-dot--active' : ''}`} />
                                            </div>
                                        ))}
                                        {!loadingMetrics && officersList.length === 0 && (
                                            <p className="manager-empty-state">No officers added yet.</p>
                                        )}
                                    </div>
                                </article>
                            </section>
                        </div>
                    )}

                    {activeTab === 'rfqs' && (
                        <div className="tab-pane-view">
                            <h2 className="tab-pane-title">RFQ Workspace</h2>

                            {selectedRFQForComparison ? (
                                <article className="manager-card manager-card--wide">
                                    <header className="manager-card__header">
                                        <div>
                                            <button className="btn-back" onClick={() => { setSelectedRFQForComparison(null); setRfqComparisonData(null); }}>
                                                &larr; Back to RFQs
                                            </button>
                                            <h2 style={{ marginTop: '8px' }}>Comparing Quotations for RFQ #{selectedRFQForComparison.id}</h2>
                                            <p className="text-muted">{selectedRFQForComparison.title}</p>
                                        </div>
                                    </header>

                                    {loadingComparison ? (
                                        <p className="text-center">Loading comparison details...</p>
                                    ) : !rfqComparisonData || rfqComparisonData.quotations?.length === 0 ? (
                                        <p className="manager-empty-state">No quotations submitted for this RFQ yet.</p>
                                    ) : (
                                        <div className="comparison-workspace">
                                            <div className="table-responsive">
                                                <table className="manager-table comparison-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Vendor Company</th>
                                                            <th>Quotation Amount</th>
                                                            <th>Notes</th>
                                                            <th>Status</th>
                                                            <th className="text-center">Decision Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rfqComparisonData.quotations.map((quote) => (
                                                            <tr key={quote.id} className={quote.status === 'SELECTED' ? 'row-selected' : ''}>
                                                                <td><strong>{quote.companyName}</strong></td>
                                                                <td>
                                                                    <strong className="text-primary">₹{quote.totalAmount?.toLocaleString()}</strong>
                                                                </td>
                                                                <td>{quote.notes || 'N/A'}</td>
                                                                <td>
                                                                    <span className={`status-badge status-badge--${quote.status.toLowerCase()}`}>
                                                                        {quote.status}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center">
                                                                    {quote.status === 'SUBMITTED' ? (
                                                                        <div className="table-row-actions">
                                                                            <button
                                                                                className="btn btn-primary btn-sm"
                                                                                onClick={() => handleOpenAction(quote.id, 'select')}
                                                                            >
                                                                                Select Winning Bid
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-danger btn-sm"
                                                                                onClick={() => handleOpenAction(quote.id, 'reject')}
                                                                            >
                                                                                Reject Bid
                                                                            </button>
                                                                        </div>
                                                                    ) : quote.status === 'SELECTED' ? (
                                                                        <span className="text-success"><CheckCircle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Winning Bid</span>
                                                                    ) : (
                                                                        <span className="text-muted">No actions available</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            ) : (
                                <article className="manager-card manager-card--wide">
                                    <header className="manager-card__header">
                                        <h2>All RFQs</h2>
                                    </header>

                                    <div className="table-responsive">
                                        {loadingRFQs ? (
                                            <p className="text-center">Loading RFQs...</p>
                                        ) : (
                                            <table className="manager-table">
                                                <thead>
                                                    <tr>
                                                        <th>RFQ ID</th>
                                                        <th>Title</th>
                                                        <th>Status</th>
                                                        <th>Created At</th>
                                                        <th className="text-center">Quotation Comparisons</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rfqsList
                                                        .filter(rfq => rfq.title?.toLowerCase().includes(searchQuery.toLowerCase()) || rfq.id.toString().includes(searchQuery))
                                                        .map(rfq => (
                                                            <tr key={rfq.id}>
                                                                <td>#RFQ-{rfq.id}</td>
                                                                <td>{rfq.title}</td>
                                                                <td>
                                                                    <span className={`status-badge status-badge--${rfq.status.toLowerCase()}`}>
                                                                        {rfq.status}
                                                                    </span>
                                                                </td>
                                                                <td>{new Date(rfq.createdAt).toLocaleDateString()}</td>
                                                                <td className="text-center">
                                                                    <button
                                                                        className="btn btn-primary-transparent btn-sm"
                                                                        onClick={() => handleViewComparison(rfq)}
                                                                    >
                                                                        Compare & Approve &rarr;
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    {rfqsList.length === 0 && (
                                                        <tr>
                                                            <td colSpan="5" className="text-center">No RFQs found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </article>
                            )}
                        </div>
                    )}

                    {activeTab === 'quotations' && (
                        <div className="tab-pane-view">
                            <h2 className="tab-pane-title">Quotation Approvals</h2>

                            <article className="manager-card manager-card--wide">
                                <header className="manager-card__header">
                                    <h2>Vendor Quotation Auditing</h2>
                                </header>

                                <div className="table-responsive">
                                    {loadingQuotations ? (
                                        <p className="text-center">Loading quotations...</p>
                                    ) : (
                                        <table className="manager-table">
                                            <thead>
                                                <tr>
                                                    <th>Quotation ID</th>
                                                    <th>RFQ ID</th>
                                                    <th>Vendor</th>
                                                    <th>Total Amount</th>
                                                    <th>Status</th>
                                                    <th>Submitted Date</th>
                                                    <th className="text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {quotationsList
                                                    .filter(q => q.status.toLowerCase().includes(searchQuery.toLowerCase()) || q.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    .map(quote => (
                                                        <tr key={quote.id}>
                                                            <td>#Q-{quote.id}</td>
                                                            <td>#RFQ-{quote.rfqId}</td>
                                                            <td>{quote.vendorName || `Vendor ${quote.vendorId}`}</td>
                                                            <td>₹{quote.totalAmount?.toLocaleString()}</td>
                                                            <td>
                                                                <span className={`status-badge status-badge--${quote.status.toLowerCase()}`}>
                                                                    {quote.status}
                                                                </span>
                                                            </td>
                                                            <td>{quote.submittedAt ? new Date(quote.submittedAt).toLocaleDateString() : 'N/A'}</td>
                                                            <td className="text-center">
                                                                {quote.status === 'SUBMITTED' ? (
                                                                    <div className="table-row-actions">
                                                                        <button
                                                                            className="btn btn-primary btn-sm"
                                                                            onClick={() => handleOpenAction(quote.id, 'select')}
                                                                        >
                                                                            Select Winning
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={() => handleOpenAction(quote.id, 'reject')}
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted">Finalized</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {quotationsList.length === 0 && (
                                                    <tr>
                                                        <td colSpan="7" className="text-center">No quotations available.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </article>
                        </div>
                    )}

                    {activeTab === 'officers' && (
                        <div className="tab-pane-view">
                            <h2 className="tab-pane-title">Officer Management</h2>

                            <section className="manager-content-grid">
                                {/* Registration form */}
                                <article className="manager-card">
                                    <header className="manager-card__header">
                                        <h2>Register Procurement Officer</h2>
                                    </header>

                                    <form className="manager-form" onSubmit={handleRegisterOfficer}>
                                        <div className="form-group-tile">
                                            <label>Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Enter full name"
                                                value={registerForm.name}
                                                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="form-group-tile">
                                            <label>Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="enter email@vendorbridge.local"
                                                value={registerForm.email}
                                                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                            />
                                        </div>

                                        <div className="form-group-tile">
                                            <label>Password</label>
                                            <input
                                                type="password"
                                                required
                                                placeholder="Min 6 characters"
                                                value={registerForm.password}
                                                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                            />
                                        </div>

                                        <div className="form-group-tile">
                                            <label>Phone Number</label>
                                            <input
                                                type="tel"
                                                required
                                                maxLength="10"
                                                placeholder="10 digit number"
                                                value={registerForm.phone}
                                                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                                            />
                                        </div>

                                        {registerStatus.message && (
                                            <div className={`form-feedback-message form-feedback-message--${registerStatus.success ? 'success' : 'error'}`}>
                                                {registerStatus.message}
                                            </div>
                                        )}

                                        <button className="btn btn-primary btn-auth-submit" type="submit" disabled={registering}>
                                            {registering ? 'Registering...' : 'Register Procurement Officer'}
                                        </button>
                                    </form>
                                </article>

                                {/* List of officers */}
                                <article className="manager-card manager-card--wide">
                                    <header className="manager-card__header">
                                        <h2>Assigned Procurement Officers</h2>
                                    </header>

                                    <div className="table-responsive">
                                        {loadingOfficers ? (
                                            <p className="text-center">Loading officers...</p>
                                        ) : (
                                            <table className="manager-table">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>Phone</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {officersList.map(off => (
                                                        <tr key={off.id}>
                                                            <td><strong>{off.name}</strong></td>
                                                            <td>{off.email}</td>
                                                            <td>{off.phone}</td>
                                                            <td>
                                                                <span className={`status-badge ${off.isActive ? 'status-badge--active' : 'status-badge--inactive'}`}>
                                                                    {off.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {officersList.length === 0 && (
                                                        <tr>
                                                            <td colSpan="4" className="text-center">No officers registered.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </article>
                            </section>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="tab-pane-view">
                            <h2 className="tab-pane-title">Procurement & Spend Analytics</h2>

                            {loadingReports ? (
                                <p className="text-center">Loading report dashboards...</p>
                            ) : (
                                <>
                                    <section className="manager-content-grid">
                                        {/* Category spends */}
                                        <article className="manager-card">
                                            <header className="manager-card__header">
                                                <h2>Spend by Product Category</h2>
                                            </header>

                                            <div className="spend-category-list">
                                                {spendReport?.spendByCategory?.length === 0 ? (
                                                    <p className="manager-empty-state">No category spends recorded yet.</p>
                                                ) : (
                                                    spendReport?.spendByCategory?.map(cat => (
                                                        <div key={cat.categoryId} className="spend-category-item">
                                                            <div className="spend-category-item__header">
                                                                <span>{cat.categoryName}</span>
                                                                <strong>₹{Number(cat.totalSpend).toLocaleString()}</strong>
                                                            </div>
                                                            <div className="spend-category-bar">
                                                                <div
                                                                    className="spend-category-bar__fill"
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            100,
                                                                            (Number(cat.totalSpend) / (totalSpendVal || 1)) * 100
                                                                        )}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </article>

                                        {/* PO status counts */}
                                        <article className="manager-card">
                                            <header className="manager-card__header">
                                                <h2>PO Status Breakdown</h2>
                                            </header>

                                            <div className="manager-queue-list">
                                                {spendReport?.purchaseOrdersBreakdown?.length === 0 ? (
                                                    <p className="manager-empty-state">No purchase orders found.</p>
                                                ) : (
                                                    spendReport?.purchaseOrdersBreakdown?.map(po => (
                                                        <li key={po.status}>
                                                            <strong>{po.count} Orders</strong>
                                                            <span>Status: {po.status} (Total: ₹{Number(po.amount).toLocaleString()})</span>
                                                        </li>
                                                    ))
                                                )}
                                            </div>
                                        </article>
                                    </section>

                                    <article className="manager-card manager-card--wide" style={{ marginTop: '14px' }}>
                                        <header className="manager-card__header">
                                            <h2>Vendor Quotation Win Rates & Compliance</h2>
                                        </header>

                                        <div className="table-responsive">
                                            <table className="manager-table">
                                                <thead>
                                                    <tr>
                                                        <th>Vendor Name</th>
                                                        <th>Total Quotations</th>
                                                        <th>Quotations Won</th>
                                                        <th>Win Rate %</th>
                                                        <th>Completed POs</th>
                                                        <th>Total Spend Volume</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vendorPerformance.map(vendor => (
                                                        <tr key={vendor.vendorId}>
                                                            <td><strong>{vendor.companyName}</strong></td>
                                                            <td>{vendor.totalQuotations}</td>
                                                            <td>{vendor.quotationsWon}</td>
                                                            <td>
                                                                <strong className="text-primary">{vendor.winRatePercentage}%</strong>
                                                            </td>
                                                            <td>{vendor.completedPOs}</td>
                                                            <td>₹{Number(vendor.totalPOSpend).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    {vendorPerformance.length === 0 && (
                                                        <tr>
                                                            <td colSpan="6" className="text-center">No vendor statistics available.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </article>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="tab-pane-view">
                            <h2 className="tab-pane-title">My Account</h2>

                            <article className="manager-card" style={{ maxWidth: '500px' }}>
                                <header className="manager-card__header">
                                    <h2>Manager Profile Details</h2>
                                </header>

                                <dl className="manager-profile-list">
                                    <div>
                                        <dt>Full Name</dt>
                                        <dd>{user?.name || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt>Email Address</dt>
                                        <dd>{user?.email || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt>System Role</dt>
                                        <dd>
                                            <span className="status-badge status-badge--primary">
                                                {user?.role || 'MANAGER'}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Account ID</dt>
                                        <dd>#M-{user?.id || 'N/A'}</dd>
                                    </div>
                                </dl>
                            </article>
                        </div>
                    )}
                </div>
            </section>

            {/* Action remarks inline dialog overlay */}
            {actioningQuotationId && (
                <div className="manager-modal-overlay">
                    <div className="manager-modal">
                        <h3>Confirm Decision</h3>
                        <p>Are you sure you want to <strong>{actionType}</strong> this quotation?</p>
                        
                        <div className="form-group-tile" style={{ marginTop: '14px' }}>
                            <label>Auditor Remarks (Optional)</label>
                            <textarea
                                placeholder="Enter reason or selection notes..."
                                rows="3"
                                value={actionRemarks}
                                onChange={(e) => setActionRemarks(e.target.value)}
                            />
                        </div>

                        <div className="manager-modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => handleOpenAction(null, null)}
                                disabled={submittingAction}
                            >
                                Cancel
                            </button>
                            <button
                                className={`btn ${actionType === 'select' ? 'btn-primary' : 'btn-danger'}`}
                                onClick={handleConfirmQuotationAction}
                                disabled={submittingAction}
                            >
                                {submittingAction ? 'Processing...' : `Confirm ${actionType === 'select' ? 'Selection' : 'Rejection'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ManagerDashboard;
