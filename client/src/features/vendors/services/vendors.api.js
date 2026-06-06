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

export async function getVendors({ page = 1, limit = 10, status = '' } = {}) {
    try {
        const params = { page, limit };
        if (status) {
            params.status = status;
        }
        const response = await api.get(`${API_PATH_PREFIX}/vendors`, { params });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getVendorById(id) {
    try {
        const response = await api.get(`${API_PATH_PREFIX}/vendors/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getVendorMe() {
    try {
        const response = await api.get(`${API_PATH_PREFIX}/vendors/me`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function updateVendorStatus(id, status) {
    try {
        const response = await api.patch(`${API_PATH_PREFIX}/vendors/${id}/status`, {
            status,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}
