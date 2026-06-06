import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true,
});

export async function getCategories() {
    const response = await api.get('/api/categories');
    return response.data;
}
