import axios from 'axios';

const API_BASE_URL =
    import.meta.env.DEV
        ? '/api'
        : import.meta.env.VITE_API_URL ||
          'https://cohort2-0-backend-1-kphk.onrender.com';
const API_PATH_PREFIX = import.meta.env.DEV ? '' : '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

export async function listQuotations({ page = 1, limit = 10, status = '', rfqId, vendorId } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    if (rfqId) params.rfqId = rfqId;
    if (vendorId) params.vendorId = vendorId;

    const response = await api.get(`${API_PATH_PREFIX}/quotations`, { params });
    return response.data;
}

export async function getQuotationById(id) {
    const response = await api.get(`${API_PATH_PREFIX}/quotations/${id}`);
    return response.data;
}

export async function submitQuotation(id) {
    const response = await api.post(`${API_PATH_PREFIX}/quotations/${id}/submit`);
    return response.data;
}

export async function selectQuotation(id) {
    const response = await api.patch(`${API_PATH_PREFIX}/quotations/${id}/select`);
    return response.data;
}

export async function rejectQuotation(id) {
    const response = await api.patch(`${API_PATH_PREFIX}/quotations/${id}/reject`);
    return response.data;
}
