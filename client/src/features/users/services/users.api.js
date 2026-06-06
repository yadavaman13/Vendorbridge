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

export async function listUsers({ page = 1, limit = 10, role = '' } = {}) {
    const params = { page, limit };
    if (role) params.role = role;

    const response = await api.get(`${API_PATH_PREFIX}/users`, { params });
    return response.data;
}

export async function updateUserRole(id, role) {
    const response = await api.patch(`${API_PATH_PREFIX}/users/${id}/role`, {
        role,
    });
    return response.data;
}

export async function updateUser(id, updates) {
    const response = await api.patch(`${API_PATH_PREFIX}/users/${id}`, updates);
    return response.data;
}

export async function deleteUser(id) {
    const response = await api.delete(`${API_PATH_PREFIX}/users/${id}`);
    return response.data;
}

export async function createManagerUser({ name, email, phone, password }) {
    const response = await api.post(`${API_PATH_PREFIX}/auth/admin/create-user`, {
        name,
        email,
        phone,
        password,
    });
    return response.data;
}
