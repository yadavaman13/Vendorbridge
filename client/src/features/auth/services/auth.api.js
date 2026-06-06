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

export async function register({ name, email, password, phone, companyName, gstNumber, categoryId, address }) {
    const response = await api.post(`${API_PATH_PREFIX}/auth/register`, {
        name,
        email,
        password,
        phone,
        companyName,
        gstNumber,
        categoryId,
        address,
    });
    return response.data;
}

export async function login({ email, password }) {
    const response = await api.post(`${API_PATH_PREFIX}/auth/login`, {
        email,
        password,
    });
    return response.data;
}

export async function verifyEmail({ email, otp }) {
    const response = await api.post(`${API_PATH_PREFIX}/auth/verify-email`, {
        email,
        otp,
    });
    return response.data;
}

export async function resendOtp({ email }) {
    const response = await api.post(`${API_PATH_PREFIX}/auth/resend-otp`, {
        email,
    });
    return response.data;
}

export async function requestPasswordReset({ email }) {
    const response = await api.post(`${API_PATH_PREFIX}/auth/forgot-password`, {
        email,
    });
    return response.data;
}

export async function resetPassword({ email, otp, password, confirmPassword }) {
    const response = await api.post(`${API_PATH_PREFIX}/auth/reset-password`, {
        email,
        otp,
        password,
        confirmPassword,
    });
    return response.data;
}

export async function logout() {
    try {
        await api.post(`${API_PATH_PREFIX}/auth/logout`);
    } catch (err) {
        console.error('Logout Failed', err);
    }
}

export async function getMe() {
    try {
        const response = await api.get(`${API_PATH_PREFIX}/auth/get-me`);
        return response.data;
    } catch (err) {
        console.error('Failed to fetch user data', err);
        return null;
    }
}
