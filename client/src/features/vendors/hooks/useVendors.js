import { useState, useCallback } from 'react';
import {
    getVendors,
    getVendorById,
    getVendorMe,
    updateVendorStatus,
} from '../services/vendors.api';

export const useVendors = () => {
    const [vendors, setVendors] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [selectedVendor, setSelectedVendor] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState(null);

    const fetchVendors = useCallback(async ({ page: p = 1, limit: l = 10, status = '' } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getVendors({ page: p, limit: l, status });
            if (result?.success) {
                setVendors(result.data.items || []);
                setTotal(result.data.total || 0);
                setPage(result.data.page || p);
                setLimit(result.data.limit || l);
            } else {
                setError(result?.message || 'Failed to retrieve vendors.');
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to retrieve vendors.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchVendorDetails = useCallback(async (id) => {
        setDetailsLoading(true);
        setDetailsError(null);
        setSelectedVendor(null);
        try {
            const result = await getVendorById(id);
            if (result?.success) {
                setSelectedVendor(result.data.record || null);
                return result.data.record;
            } else {
                setDetailsError(result?.message || 'Failed to retrieve vendor details.');
            }
        } catch (err) {
            setDetailsError(err?.response?.data?.message || err?.message || 'Failed to retrieve vendor details.');
        } finally {
            setDetailsLoading(false);
        }
        return null;
    }, []);

    const handleUpdateStatus = useCallback(async (id, newStatus) => {
        setLoading(true);
        setError(null);
        try {
            const result = await updateVendorStatus(id, newStatus);
            if (result?.success) {
                // Update local vendors list status
                setVendors((prev) =>
                    prev.map((v) =>
                        v.id === id ? { ...v, status: newStatus.toUpperCase() } : v
                    )
                );
                // Update selected vendor details if open
                setSelectedVendor((prev) =>
                    prev && prev.id === id ? { ...prev, status: newStatus.toUpperCase() } : prev
                );
                return { success: true, record: result.data.record };
            } else {
                return { success: false, message: result?.message || 'Failed to update vendor status.' };
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to update vendor status.';
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        vendors,
        total,
        page,
        limit,
        loading,
        error,
        selectedVendor,
        setSelectedVendor,
        detailsLoading,
        detailsError,
        fetchVendors,
        fetchVendorDetails,
        handleUpdateStatus,
    };
};
