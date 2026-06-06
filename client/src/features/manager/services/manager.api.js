import api from '../../shared/services/api';

/**
 * Fetch role-aware dashboard summary metrics
 */
export async function getDashboardSummary() {
    const response = await api.get('/api/dashboard/summary');
    return response.data;
}

/**
 * List quotations with filters
 */
export async function getQuotations(params = {}) {
    const response = await api.get('/api/quotations', { params });
    return response.data;
}

/**
 * Select a quotation as the winning bid
 */
export async function selectQuotation(id) {
    const response = await api.patch(`/api/quotations/${id}/select`);
    return response.data;
}

/**
 * Reject a quotation
 */
export async function rejectQuotation(id) {
    const response = await api.patch(`/api/quotations/${id}/reject`);
    return response.data;
}

/**
 * List RFQs with optional filters
 */
export async function getRFQs(params = {}) {
    const response = await api.get('/api/rfqs', { params });
    return response.data;
}

/**
 * Fetch quotation comparisons for an RFQ
 */
export async function getQuotationComparison(rfqId) {
    const response = await api.get(`/api/rfqs/${rfqId}/quotations/comparison`);
    return response.data;
}

/**
 * List users (used by manager to view procurement officers)
 */
export async function getUsers(params = {}) {
    const response = await api.get('/api/users', { params });
    return response.data;
}

/**
 * Manager creates a Procurement Officer user account
 */
export async function createProcurementOfficer({ email, password, name, phone }) {
    const response = await api.post('/api/auth/manager/create-user', {
        email,
        password,
        name,
        phone,
    });
    return response.data;
}

/**
 * Fetch overall procurement report (spends, PO status counts)
 */
export async function getProcurementReport() {
    const response = await api.get('/api/reports/procurement');
    return response.data;
}

/**
 * Fetch vendor performance metrics
 */
export async function getVendorPerformanceReport() {
    const response = await api.get('/api/reports/vendor-performance');
    return response.data;
}
