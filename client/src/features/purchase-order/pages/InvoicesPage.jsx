import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../shared/components/Layout';
import { useAuth } from '../../auth/hooks/useAuth';
import {
    Download, Printer, Mail, AlertCircle, CheckCircle, XCircle, Calculator, Plus,
} from 'lucide-react';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true,
});

const InvoicesPage = () => {
    const { user } = useAuth();

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Invoice modal (generate from PO) state
    const [invoiceModal, setInvoiceModal] = useState({ open: false, po: null });
    const [invForm, setInvForm] = useState({ invoiceNumber: '', discountAmount: 0, dueDate: '', paymentTerms: 'NET 30', notes: '' });
    const [invPreview, setInvPreview] = useState({ subtotal: 0, tax: 0, discount: 0, total: 0 });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
    };

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/invoices');
            if (res.data?.success) {
                setInvoices(res.data.data.items || []);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to fetch Invoices.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    // Recalculate preview whenever discount or PO changes
    useEffect(() => {
        if (invoiceModal.po) {
            const subtotal = Number(invoiceModal.po.subtotal) || 0;
            const tax = Number(invoiceModal.po.taxAmount) || 0;
            const discount = Number(invForm.discountAmount) || 0;
            const total = subtotal + tax - discount;
            setInvPreview({ subtotal, tax, discount, total });
        }
    }, [invForm.discountAmount, invoiceModal.po]);

    const handleUpdateInvoiceStatus = async (id, status) => {
        try {
            const res = await api.patch(`/api/invoices/${id}/status`, { status });
            if (res.data?.success) {
                showToast(`Invoice status updated to ${status}.`);
                fetchInvoices();
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to update invoice status.', 'error');
        }
    };

    const handleDownloadPdf = async (id, invoiceNumber) => {
        try {
            showToast('Downloading invoice PDF...');
            const res = await api.get(`/api/invoices/${id}/download/file`, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `invoice_${invoiceNumber}.pdf`;
            link.click();
        } catch (err) {
            console.error(err);
            showToast('Failed to download invoice PDF.', 'error');
        }
    };

    const handlePrintInvoice = async (id) => {
        try {
            const res = await api.get(`/api/invoices/${id}/print`);
            if (res.data?.success) {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html>
                        <head><title>Print Invoice</title></head>
                        <body>
                            ${res.data.data.record.html}
                            <script>
                                window.onload = function() {
                                    window.print();
                                    window.close();
                                }
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to print invoice.', 'error');
        }
    };

    const handleEmailInvoice = async (id) => {
        try {
            showToast('Sending invoice email...');
            const res = await api.post(`/api/invoices/${id}/email`);
            if (res.data?.success) {
                showToast('Invoice emailed to vendor successfully.');
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to email invoice.', 'error');
        }
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/api/invoices', {
                poId: invoiceModal.po.id,
                invoiceNumber: invForm.invoiceNumber,
                subtotal: invPreview.subtotal,
                taxAmount: invPreview.tax,
                discountAmount: invForm.discountAmount,
                totalAmount: invPreview.total,
                dueDate: invForm.dueDate,
                paymentTerms: invForm.paymentTerms,
                notes: invForm.notes,
            });
            if (res.data?.success) {
                showToast('Invoice generated successfully!');
                setInvoiceModal({ open: false, po: null });
                fetchInvoices();
            }
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || 'Failed to generate Invoice.', 'error');
        }
    };

    return (
        <Layout title="Invoices">
            {/* Toast */}
            {toast.visible && (
                <div className={`toast-banner ${toast.type === 'error' ? 'is-error' : 'is-success'}`}>
                    {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    <span className="toast-message">{toast.message}</span>
                </div>
            )}

            <div className="procurement-content-card">
                <div className="table-header-info">
                    <h2>Procurement Invoices</h2>
                    <p>Manage payouts, print billing layouts, download verified PDFs, and email accounts.</p>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <p>Retrieving invoices from database...</p>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={40} />
                        <p>No Invoices recorded yet. Generate one from an Acknowledged Purchase Order.</p>
                    </div>
                ) : (
                    <table className="procurement-table">
                        <thead>
                            <tr>
                                <th>Invoice Number</th>
                                <th>PO Ref</th>
                                <th>Vendor Company</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td><strong>{inv.invoiceNumber}</strong></td>
                                    <td>{inv.poNumber || 'N/A'}</td>
                                    <td>{inv.companyName}</td>
                                    <td>INR {Number(inv.totalAmount).toLocaleString()}</td>
                                    <td>
                                        <span className={`status-badge ${inv.status?.toLowerCase()}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td>{inv.dueDate || 'N/A'}</td>
                                    <td>
                                        <div className="action-button-group">
                                            <button
                                                className="icon-action-btn"
                                                title="Download PDF"
                                                onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                className="icon-action-btn"
                                                title="Print Invoice"
                                                onClick={() => handlePrintInvoice(inv.id)}
                                            >
                                                <Printer size={14} />
                                            </button>
                                            <button
                                                className="icon-action-btn"
                                                title="Email Invoice"
                                                onClick={() => handleEmailInvoice(inv.id)}
                                            >
                                                <Mail size={14} />
                                            </button>
                                            {user?.role !== 'VENDOR' && (
                                                <select
                                                    value={inv.status}
                                                    onChange={(e) => handleUpdateInvoiceStatus(inv.id, e.target.value)}
                                                    className="inline-status-select"
                                                >
                                                    <option value="GENERATED">GENERATED</option>
                                                    <option value="SENT">SENT</option>
                                                    <option value="VIEWED">VIEWED</option>
                                                    <option value="PAID">PAID</option>
                                                    <option value="OVERDUE">OVERDUE</option>
                                                    <option value="CANCELLED">CANCELLED</option>
                                                </select>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Generate Invoice Modal (accessible if opened programmatically) */}
            {invoiceModal.open && (
                <div className="overlay-modal-backdrop">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2>Generate Billing Invoice</h2>
                            <button
                                className="close-modal-btn"
                                onClick={() => setInvoiceModal({ open: false, po: null })}
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreateInvoice} className="modal-form">
                            <div className="form-summary-row">
                                <span className="summary-label">PO Reference:</span>
                                <span className="summary-val"><strong>{invoiceModal.po.poNumber}</strong></span>
                            </div>
                            <div className="form-summary-row">
                                <span className="summary-label">Vendor:</span>
                                <span className="summary-val">{invoiceModal.po.companyName}</span>
                            </div>

                            <div className="form-input-group">
                                <label>Invoice Number</label>
                                <input
                                    type="text"
                                    required
                                    value={invForm.invoiceNumber}
                                    onChange={(e) => setInvForm({ ...invForm, invoiceNumber: e.target.value })}
                                    className="form-text-input"
                                />
                            </div>

                            <div className="form-grid-flex">
                                <div className="form-input-group flex-1">
                                    <label>Discount Amount (INR)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={invForm.discountAmount}
                                        onChange={(e) => setInvForm({ ...invForm, discountAmount: Number(e.target.value) })}
                                        className="form-text-input"
                                    />
                                </div>
                                <div className="form-input-group flex-1">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={invForm.dueDate}
                                        onChange={(e) => setInvForm({ ...invForm, dueDate: e.target.value })}
                                        className="form-text-input"
                                    />
                                </div>
                            </div>

                            <div className="form-input-group">
                                <label>Payment Terms</label>
                                <select
                                    value={invForm.paymentTerms}
                                    onChange={(e) => setInvForm({ ...invForm, paymentTerms: e.target.value })}
                                    className="form-select-input"
                                >
                                    <option value="NET 15">NET 15 Days</option>
                                    <option value="NET 30">NET 30 Days</option>
                                    <option value="NET 45">NET 45 Days</option>
                                    <option value="DUE ON RECEIPT">Due on Receipt</option>
                                </select>
                            </div>

                            <div className="form-input-group">
                                <label>Billing Notes / Comments</label>
                                <textarea
                                    value={invForm.notes}
                                    onChange={(e) => setInvForm({ ...invForm, notes: e.target.value })}
                                    placeholder="Notes, bank account transfer instructions, etc..."
                                    className="form-textarea-input"
                                />
                            </div>

                            <div className="calculations-preview-box">
                                <h3><Calculator size={14} /> Invoice Calculations Preview</h3>
                                <div className="calc-row">
                                    <span>PO Subtotal:</span>
                                    <span>INR {invPreview.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="calc-row">
                                    <span>PO Tax:</span>
                                    <span>INR {invPreview.tax.toLocaleString()}</span>
                                </div>
                                <div className="calc-row">
                                    <span>Applied Discount:</span>
                                    <span>- INR {invPreview.discount.toLocaleString()}</span>
                                </div>
                                <hr />
                                <div className="calc-row total-row">
                                    <span>Net Payout Due:</span>
                                    <span>INR {invPreview.total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="modal-actions-footer">
                                <button
                                    type="button"
                                    className="cancel-footer-btn"
                                    onClick={() => setInvoiceModal({ open: false, po: null })}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="submit-footer-btn">
                                    Generate Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default InvoicesPage;
