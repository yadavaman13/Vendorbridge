import { useEffect, useMemo, useState } from 'react';
import { getProcurementReport, getVendorPerformanceReport } from '../services/reports.api';

export function useReports() {
    const [procurementReport, setProcurementReport] = useState(null);
    const [vendorPerformance, setVendorPerformance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadReports = async () => {
            setLoading(true);
            setError(null);

            try {
                const [procurementData, vendorData] = await Promise.all([
                    getProcurementReport(),
                    getVendorPerformanceReport(),
                ]);
                setProcurementReport(procurementData);
                setVendorPerformance(vendorData);
            } catch (fetchError) {
                setError(
                    fetchError?.response?.data?.message ||
                        fetchError?.message ||
                        'Unable to load analytics data.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadReports();
    }, []);

    const summaryRows = useMemo(() => {
        if (!procurementReport) return [];

        return [
            {
                label: 'Total spend',
                value: procurementReport.totalSpend
                    ? `₦${procurementReport.totalSpend.toLocaleString()}`
                    : 'N/A',
            },
            {
                label: 'Approved requests',
                value: procurementReport.approvedCount || 0,
            },
            {
                label: 'Pending requests',
                value: procurementReport.pendingCount || 0,
            },
            {
                label: 'Vendors engaged',
                value: procurementReport.vendorCount || 0,
            },
        ];
    }, [procurementReport]);

    return {
        procurementReport,
        vendorPerformance,
        loading,
        error,
        summaryRows,
    };
}
