import { useCallback, useEffect, useMemo, useState } from 'react';
import { createManagerUser, deleteUser, listUsers, updateUser, updateUserRole } from '../services/users.api';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [roleFilter, setRoleFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toastConfig, setToastConfig] = useState({
        open: false,
        variant: 'info',
        title: '',
        message: '',
    });

    const fetchUsers = useCallback(async ({ page: pageNumber = page, limit: pageLimit = limit, role = roleFilter } = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await listUsers({ page: pageNumber, limit: pageLimit, role });
            const payload = response?.data || response;
            setUsers(payload.items || []);
            setTotal(payload.total || 0);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    }, [limit, page, roleFilter]);

    useEffect(() => {
        fetchUsers({ page, limit, role: roleFilter });
    }, [fetchUsers, page, limit, roleFilter]);

    const broadcastToast = useCallback((variant, title, message) => {
        setToastConfig({ open: true, variant, title, message });
    }, []);

    const closeToast = useCallback(() => {
        setToastConfig((prev) => ({ ...prev, open: false }));
    }, []);

    const handleRoleFilterChange = useCallback((role) => {
        setRoleFilter(role);
        setPage(1);
    }, []);

    const handleSearchChange = useCallback((value) => {
        setSearchTerm(value);
        setPage(1);
    }, []);

    const handleUpdateUserRole = useCallback(async (userId, role) => {
        setLoading(true);
        setError(null);
        try {
            const response = await updateUserRole(userId, role);
            const payload = response?.data || response;
            if (payload?.success) {
                broadcastToast('success', 'Role Updated', payload.message || 'User role updated successfully.');
                await fetchUsers({ page, limit, role: roleFilter });
                return { success: true, item: payload.data?.item || null };
            }
            setError(payload?.message || 'Failed to update user role.');
            return { success: false, message: payload?.message };
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Failed to update user role.';
            setError(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    }, [broadcastToast, fetchUsers, limit, page, roleFilter]);

    const handleUpdateUser = useCallback(async (userId, updates) => {
        setLoading(true);
        setError(null);
        try {
            const response = await updateUser(userId, updates);
            const payload = response?.data || response;
            if (payload?.success) {
                broadcastToast('success', 'User Updated', payload.message || 'User information updated successfully.');
                await fetchUsers({ page, limit, role: roleFilter });
                return { success: true, item: payload.data?.item || null };
            }
            setError(payload?.message || 'Failed to update user.');
            return { success: false, message: payload?.message };
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Failed to update user.';
            setError(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    }, [broadcastToast, fetchUsers, limit, page, roleFilter]);

    const handleDeleteUser = useCallback(async (userId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await deleteUser(userId);
            const payload = response?.data || response;
            if (payload?.success) {
                broadcastToast('success', 'User Deleted', payload.message || 'User deleted successfully.');
                await fetchUsers({ page, limit, role: roleFilter });
                return { success: true };
            }
            setError(payload?.message || 'Failed to delete user.');
            return { success: false, message: payload?.message };
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Failed to delete user.';
            setError(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    }, [broadcastToast, fetchUsers, limit, page, roleFilter]);

    const handleCreateManager = useCallback(async ({ email, password, name, phone }) => {
        setLoading(true);
        setError(null);

        try {
            const response = await createManagerUser({ email, password, name, phone });
            const payload = response?.data || response;
            if (payload?.success) {
                broadcastToast('success', 'Manager Created', payload.message || 'Manager user created successfully.');
                await fetchUsers({ page, limit, role: roleFilter });
                return { success: true, user: payload.user || null };
            }
            setError(payload?.message || 'Failed to create manager.');
            return { success: false, message: payload?.message };
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Failed to create manager.';
            setError(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    }, [broadcastToast, fetchUsers, limit, page, roleFilter]);

    const filteredUsers = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        if (!normalized) return users;

        return users.filter((user) => {
            const name = user.name?.toLowerCase() || '';
            const email = user.email?.toLowerCase() || '';
            const phone = user.phone?.toLowerCase() || '';
            const role = user.role?.toLowerCase() || '';

            return [name, email, phone, role].some((value) => value.includes(normalized));
        });
    }, [searchTerm, users]);

    return {
        users: filteredUsers,
        total,
        page,
        limit,
        roleFilter,
        searchTerm,
        loading,
        error,
        toastConfig,
        fetchUsers,
        closeToast,
        handleSearchChange,
        handleRoleFilterChange,
        handleUpdateUserRole,
        handleUpdateUser,
        handleDeleteUser,
        handleCreateManager,
        setPage,
    };
};
