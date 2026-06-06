import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import Layout from '../../shared/components/Layout';
import { useAuth } from '../../auth/hooks/useAuth';
import {
    FileText, Plus, Send, CheckCircle, XCircle, Calculator, AlertCircle
} from 'lucide-react';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

const PurchaseOrderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quotations'); // 'quotations', 'pos'
  
  // Data States
  const [quotations, setQuotations] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Toast Banner State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Modal / Overlay States
  const [poModal, setPoModal] = useState({ open: false, quotation: null });
  const [invoiceModal, setInvoiceModal] = useState({ open: false, po: null });

  // Form Input States
  const [poForm, setPoForm] = useState({ taxRate: 18, expectedDeliveryDate: '', notes: '' });
  const [invForm, setInvForm] = useState({ invoiceNumber: '', discountAmount: 0, dueDate: '', paymentTerms: 'NET 30', notes: '' });

  // Calculation Previews
  const [calcPreview, setCalcPreview] = useState({ subtotal: 0, tax: 0, total: 0 });
  const [invPreview, setInvPreview] = useState({ subtotal: 0, tax: 0, discount: 0, total: 0 });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  // 1. Fetch Data functions
  const fetchApprovedQuotations = async () => {
    setLoading(true);
    try {
      // Fetch only SELECTED (approved) quotations
      const res = await api.get('/api/quotations?status=SELECTED');
      if (res.data?.success) {
        setQuotations(res.data.data.items || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch approved quotations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const endpoint = user?.role === 'VENDOR' ? '/api/vendors/me/purchase-orders' : '/api/purchase-orders';
      const res = await api.get(endpoint);
      if (res.data?.success) {
        setPurchaseOrders(res.data.data.items || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch Purchase Orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'quotations') fetchApprovedQuotations();
    if (activeTab === 'pos') fetchPurchaseOrders();
  }, [activeTab]);

  // 2. Calculations triggers
  useEffect(() => {
    if (poModal.quotation) {
      const subtotal = Number(poModal.quotation.totalAmount) || 0;
      const taxRate = Number(poForm.taxRate) || 0;
      const tax = (subtotal * taxRate) / 100;
      const total = subtotal + tax;
      setCalcPreview({ subtotal, tax, total });
    }
  }, [poForm.taxRate, poModal.quotation]);

  useEffect(() => {
    if (invoiceModal.po) {
      const subtotal = Number(invoiceModal.po.subtotal) || 0;
      const tax = Number(invoiceModal.po.taxAmount) || 0;
      const discount = Number(invForm.discountAmount) || 0;
      const total = subtotal + tax - discount;
      setInvPreview({ subtotal, tax, discount, total });
    }
  }, [invForm.discountAmount, invoiceModal.po]);

  // 3. Purchase Order Actions
  const handleOpenPoModal = (quotation) => {
    setPoModal({ open: true, quotation });
    const today = new Date();
    today.setDate(today.getDate() + 14); // default 14 days delivery
    const defaultDate = today.toISOString().split('T')[0];
    setPoForm({ taxRate: 18, expectedDeliveryDate: defaultDate, notes: '' });
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/purchase-orders', {
        quotationId: poModal.quotation.id,
        taxRate: poForm.taxRate,
        expectedDeliveryDate: poForm.expectedDeliveryDate,
        notes: poForm.notes,
      });

      if (res.data?.success) {
        showToast('Purchase Order generated successfully!');
        setPoModal({ open: false, quotation: null });
        fetchApprovedQuotations();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to generate Purchase Order.', 'error');
    }
  };

  const handleUpdatePOStatus = async (id, status) => {
    try {
      const res = await api.patch(`/api/purchase-orders/${id}/status`, { status });
      if (res.data?.success) {
        showToast(`PO status updated to ${status}.`);
        fetchPurchaseOrders();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update status.', 'error');
    }
  };

  const handleSendPO = async (id) => {
    try {
      const res = await api.post(`/api/purchase-orders/${id}/send`);
      if (res.data?.success) {
        showToast('Purchase Order sent to vendor via email.');
        fetchPurchaseOrders();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to send Purchase Order.', 'error');
    }
  };

  const handleAcknowledgePO = async (id) => {
    try {
      const res = await api.post(`/api/purchase-orders/${id}/acknowledge`);
      if (res.data?.success) {
        showToast('Purchase Order acknowledged successfully.');
        fetchPurchaseOrders();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to acknowledge Purchase Order.', 'error');
    }
  };

  // 4. Invoice Actions
  const handleOpenInvoiceModal = (po) => {
    setInvoiceModal({ open: true, po });
    const today = new Date();
    today.setDate(today.getDate() + 30); // NET 30 default due date
    const defaultDate = today.toISOString().split('T')[0];
    setInvForm({
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      discountAmount: 0,
      dueDate: defaultDate,
      paymentTerms: 'NET 30',
      notes: `Invoice generated from ${po.poNumber}`
    });
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
        showToast('Invoice generated successfully! Redirecting to Invoices...');
        setInvoiceModal({ open: false, po: null });
        fetchPurchaseOrders();
        setTimeout(() => navigate('/invoices'), 1200);
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to generate Invoice.', 'error');
    }
  };

  return (
    <Layout title="Procurement Hub & POs">
      {/* Toast Banner */}
      {toast.visible && (
        <div className={`toast-banner ${toast.type === 'error' ? 'is-error' : 'is-success'}`}>
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
          <span className="toast-message">{toast.message}</span>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="procurement-tabs-container">
        <button 
          onClick={() => setActiveTab('quotations')} 
          className={`tab-btn ${activeTab === 'quotations' ? 'active' : ''}`}
        >
          <CheckCircle size={16} /> Approved Quotations
        </button>
        <button 
          onClick={() => setActiveTab('pos')} 
          className={`tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
        >
          <FileText size={16} /> Purchase Orders
        </button>
      </div>

      <div className="procurement-content-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Retrieving records from database...</p>
          </div>
        ) : (
          <>
            {/* Approved Quotations Tab */}
            {activeTab === 'quotations' && (
              <div className="data-table-container">
                <div className="table-header-info">
                  <h2>Selected Quotations</h2>
                  <p>Bids that are approved and pending creation of an official Purchase Order.</p>
                </div>
                {quotations.length === 0 ? (
                  <div className="empty-state">
                    <AlertCircle size={40} />
                    <p>No selected quotations found ready for PO processing.</p>
                  </div>
                ) : (
                  <table className="procurement-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>RFQ Title</th>
                        <th>Vendor Company</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotations.map(q => (
                        <tr key={q.id}>
                          <td>#{q.id}</td>
                          <td>{q.rfqTitle || 'Laptops Procurement'}</td>
                          <td><strong>{q.companyName}</strong></td>
                          <td>INR {Number(q.totalAmount).toLocaleString()}</td>
                          <td><span className="status-badge selected">{q.status}</span></td>
                          <td>
                            {user?.role !== 'VENDOR' && (
                              <button 
                                className="action-btn generate-po-btn"
                                onClick={() => handleOpenPoModal(q)}
                              >
                                <Plus size={14} /> Generate PO
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Purchase Orders Tab */}
            {activeTab === 'pos' && (
              <div className="data-table-container">
                <div className="table-header-info">
                  <h2>Official Purchase Orders</h2>
                  <p>Track order statuses, notify vendors, and generate official billing invoices.</p>
                </div>
                {purchaseOrders.length === 0 ? (
                  <div className="empty-state">
                    <AlertCircle size={40} />
                    <p>No Purchase Orders generated yet.</p>
                  </div>
                ) : (
                  <table className="procurement-table">
                    <thead>
                      <tr>
                        <th>PO Number</th>
                        <th>Vendor</th>
                        <th>Subtotal</th>
                        <th>Tax</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Delivery Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.map(po => (
                        <tr key={po.id}>
                          <td><strong>{po.poNumber}</strong></td>
                          <td>{po.companyName}</td>
                          <td>INR {Number(po.subtotal).toLocaleString()}</td>
                          <td>INR {Number(po.taxAmount).toLocaleString()}</td>
                          <td><strong>INR {Number(po.totalAmount).toLocaleString()}</strong></td>
                          <td>
                            <span className={`status-badge ${po.status?.toLowerCase()}`}>
                              {po.status}
                            </span>
                          </td>
                          <td>{po.expectedDeliveryDate || 'N/A'}</td>
                          <td>
                            <div className="action-button-group">
                              {/* Staff Operations */}
                              {user?.role !== 'VENDOR' && (
                                <>
                                  {po.status === 'CREATED' && (
                                    <button 
                                      className="icon-action-btn"
                                      title="Send PO to Vendor"
                                      onClick={() => handleSendPO(po.id)}
                                    >
                                      <Send size={14} />
                                    </button>
                                  )}
                                  <select 
                                    value={po.status}
                                    onChange={(e) => handleUpdatePOStatus(po.id, e.target.value)}
                                    className="inline-status-select"
                                  >
                                    <option value="CREATED">CREATED</option>
                                    <option value="SENT">SENT</option>
                                    <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                  </select>
                                </>
                              )}

                              {/* Vendor Operations */}
                              {user?.role === 'VENDOR' && po.status === 'SENT' && (
                                <button 
                                  className="action-btn acknowledge-po-btn"
                                  onClick={() => handleAcknowledgePO(po.id)}
                                >
                                  Acknowledge
                                </button>
                              )}

                              {/* Generate Invoice button */}
                              {po.status === 'ACKNOWLEDGED' && (
                                <button 
                                  className="action-btn invoice-btn"
                                  onClick={() => handleOpenInvoiceModal(po)}
                                >
                                  Generate Invoice
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}


          </>
        )}
      </div>

      {/* Generate PO Modal */}
      {poModal.open && (
        <div className="overlay-modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Generate Purchase Order</h2>
              <button 
                className="close-modal-btn" 
                onClick={() => setPoModal({ open: false, quotation: null })}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="modal-form">
              <div className="form-summary-row">
                <span className="summary-label">Quotation ID:</span>
                <span className="summary-val">#{poModal.quotation.id}</span>
              </div>
              <div className="form-summary-row">
                <span className="summary-label">Bidder:</span>
                <span className="summary-val"><strong>{poModal.quotation.companyName}</strong></span>
              </div>

              <div className="form-input-group">
                <label>Tax Rate (%)</label>
                <div className="tax-input-flex">
                  <select 
                    value={poForm.taxRate}
                    onChange={(e) => setPoForm({ ...poForm, taxRate: Number(e.target.value) })}
                    className="form-select-input"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>
              </div>

              <div className="form-input-group">
                <label>Expected Delivery Date</label>
                <input 
                  type="date"
                  required
                  value={poForm.expectedDeliveryDate}
                  onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                  className="form-text-input"
                />
              </div>

              <div className="form-input-group">
                <label>Procurement Notes / Instructions</label>
                <textarea 
                  value={poForm.notes}
                  onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                  placeholder="E.g. Delivery instructions, packaging preferences..."
                  className="form-textarea-input"
                />
              </div>

              {/* Dynamic calculations preview */}
              <div className="calculations-preview-box">
                <h3><Calculator size={14} /> Calculations Preview</h3>
                <div className="calc-row">
                  <span>Subtotal Amount:</span>
                  <span>INR {calcPreview.subtotal.toLocaleString()}</span>
                </div>
                <div className="calc-row">
                  <span>Estimated Tax ({poForm.taxRate}%):</span>
                  <span>INR {calcPreview.tax.toLocaleString()}</span>
                </div>
                <hr />
                <div className="calc-row total-row">
                  <span>Grand Total PO Amount:</span>
                  <span>INR {calcPreview.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="modal-actions-footer">
                <button 
                  type="button" 
                  className="cancel-footer-btn"
                  onClick={() => setPoModal({ open: false, quotation: null })}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-footer-btn">
                  Generate PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
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

              {/* Dynamic calculations preview */}
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
                <div className="calc-row text-danger">
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

export default PurchaseOrderDashboard;
