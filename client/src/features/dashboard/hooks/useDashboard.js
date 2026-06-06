import { useState, useCallback } from 'react';
import { getDashboardSummary } from '../services/dashboard.api';

export const useDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getDashboardSummary();
            if (result?.success) {
                setSummary(result.data.record || null);
            } else {
                setError(result?.message || 'Failed to retrieve dashboard summary.');
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to retrieve dashboard summary.');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        summary,
        loading,
        error,
        fetchSummary,
    };
};
