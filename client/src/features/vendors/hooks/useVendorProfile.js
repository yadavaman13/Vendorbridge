import { useState, useCallback } from 'react';
import { getVendorMe } from '../services/vendors.api';

export const useVendorProfile = () => {
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchVendorProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getVendorMe();
            if (result?.success) {
                const profile = result.data.record || null;
                setVendor(profile);
                return profile;
            }
            const message = result?.message || 'Failed to retrieve vendor profile.';
            setError(message);
            return null;
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Failed to retrieve vendor profile.';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        vendor,
        loading,
        error,
        fetchVendorProfile,
        setVendor,
        setError,
    };
};
