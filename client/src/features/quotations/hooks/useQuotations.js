import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    listQuotations,
    getQuotationById,
    submitQuotation,
    selectQuotation,
    rejectQuotation,
} from '../services/quotations.api';

export const useQuotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [toastConfig, setToastConfig] = useState({
        open: false,
        variant: 'info',
        title: '',
        message: '',
    });

    const fetchQuotations = useCallback(async ({ page: pageNumber = page, limit: pageLimit = limit, status = statusFilter } = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await listQuotations({ page: pageNumber, limit: pageLimit, status });
            const payload = response?.data || response;
            setQuotations(payload.items || []);
            setTotal(payload.total || 0);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Unable to load quotations.');
        } finally {
            setLoading(false);
        }
    }, [limit, page, statusFilter]);

    useEffect(() => {
        fetchQuotations({ page, limit, status: statusFilter });
    }, [fetchQuotations, page, limit, statusFilter]);

    const fetchQuotationDetails = useCallback(async (id) => {
        setDetailsLoading(true);
        setError(null);

        try {
            const response = await getQuotationById(id);
            const payload = response?.data || response;
            setSelectedQuotation(payload.item || payload);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Unable to load quotation details.');
        } finally {
            setDetailsLoading(false);
        }
    }, []);

    const showToast = useCallback((variant, title, message) => {
        setToastConfig({ open: true, variant, title, message });
    }, []);

    const closeToast = useCallback(() => {
        setToastConfig((prev) => ({ ...prev, open: false }));
    }, []);

    const handleStatusFilterChange = useCallback((status) => {
        setStatusFilter(status);
        setPage(1);
    }, []);

    const handleSearchChange = useCallback((value) => {
        setSearchTerm(value);
        setPage(1);
    }, []);

    const handleSubmit = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            const response = await submitQuotation(id);
            const payload = response?.data || response;
            if (payload?.success) {
                showToast('success', 'Quotation Submitted', payload.message || 'Quotation submitted successfully.');
                fetchQuotations({ page, limit, status: statusFilter });
                return { success: true };
            }

            setError(payload?.message || 'Unable to submit quotation.');
            return { success: false, message: payload?.message };
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Unable to submit quotation.');
            return { success: false, message: err?.response?.data?.message || err?.message };
        } finally {
            setLoading(false);
        }
    }, [fetchQuotations, limit, page, showToast, statusFilter]);

    const handleSelect = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            const response = await selectQuotation(id);
            const payload = response?.data || response;
            if (payload?.success) {
                showToast('success', 'Quotation Selected', payload.message || 'Winning quotation selected successfully.');
                fetchQuotations({ page, limit, status: statusFilter });
                return { success: true };
            }

            setError(payload?.message || 'Unable to select quotation.');
            return { success: false, message: payload?.message };
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Unable to select quotation.');
            return { success: false, message: err?.response?.data?.message || err?.message };
        } finally {
            setLoading(false);
        }
    }, [fetchQuotations, limit, page, showToast, statusFilter]);

    const handleReject = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            const response = await rejectQuotation(id);
            const payload = response?.data || response;
            if (payload?.success) {
                showToast('success', 'Quotation Rejected', payload.message || 'Quotation rejected successfully.');
                fetchQuotations({ page, limit, status: statusFilter });
                return { success: true };
            }

            setError(payload?.message || 'Unable to reject quotation.');
            return { success: false, message: payload?.message };
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Unable to reject quotation.');
            return { success: false, message: err?.response?.data?.message || err?.message };
        } finally {
            setLoading(false);
        }
    }, [fetchQuotations, limit, page, showToast, statusFilter]);

    const filteredQuotations = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        if (!normalized) return quotations;

        return quotations.filter((item) => {
            const rfqTitle = item.rfqTitle?.toLowerCase() || '';
            const vendorName = item.companyName?.toLowerCase() || '';
            const status = item.status?.toLowerCase() || '';
            const amount = String(item.totalAmount || '').toLowerCase();

            return [rfqTitle, vendorName, status, amount].some((value) => value.includes(normalized));
        });
    }, [quotations, searchTerm]);

    return {
        quotations: filteredQuotations,
        total,
        page,
        limit,
        statusFilter,
        searchTerm,
        loading,
        detailsLoading,
        error,
        selectedQuotation,
        toastConfig,
        fetchQuotations,
        fetchQuotationDetails,
        setSelectedQuotation,
        closeToast,
        handleStatusFilterChange,
        handleSearchChange,
        handleSubmit,
        handleSelect,
        handleReject,
        setPage,
        setStatusFilter,
    };
};
