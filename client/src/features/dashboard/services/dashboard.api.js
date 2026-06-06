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

export async function getDashboardSummary() {
    try {
        const response = await api.get(`${API_PATH_PREFIX}/dashboard/summary`);
        return response.data;
    } catch (error) {
        throw error;
    }
}
