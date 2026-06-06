import React, { useMemo, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import Table from '../../shared/components/Table';
import Modal from '../../shared/components/Modal';
import Loader from '../../shared/components/Loader';
import Toast from '../../shared/components/Toast';
import '../styles/users.scss';
import Layout from '../../shared/components/Layout';

const roleLabels = {
    ADMIN: 'Admin',
    PROCUREMENT_OFFICER: 'Procurement Officer',
    MANAGER: 'Manager',
    VENDOR: 'Vendor',
};

const roleOptions = ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'];

const UsersPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const {
        users,
        total,
        page,
        limit,
        roleFilter,
        searchTerm,
        loading,
        error,
        toastConfig,
        closeToast,
        handleSearchChange,
        handleRoleFilterChange,
        handleUpdateUser,
        handleDeleteUser,
        handleCreateManager,
        setPage,
    } = useUsers();

    const [selectedUser, setSelectedUser] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '' });
    const [editError, setEditError] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [createError, setCreateError] = useState(null);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const columns = useMemo(() => [
        {
            key: 'name',
            header: 'Name',
            render: (row) => row.name || '—',
        },
        {
            key: 'email',
            header: 'Email',
            render: (row) => row.email || '—',
        },
        {
            key: 'phone',
            header: 'Phone',
            render: (row) => row.phone || '—',
        },
        {
            key: 'role',
            header: 'Role',
            render: (row) => roleLabels[row.role] || row.role,
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (row) => new Date(row.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
                <button
                    type="button"
                    className="vb-btn vb-btn--secondary vb-user-action-btn"
                    onClick={() => {
                        setSelectedUser(row);
                        setEditForm({
                            name: row.name || '',
                            email: row.email || '',
                            phone: row.phone || '',
                            role: row.role || '',
                        });
                        setEditError(null);
                    }}
                >
                    Edit
                </button>
            ),
        },
    ], []);

    const clearCreateForm = () => {
        setCreateForm({ name: '', email: '', phone: '', password: '' });
        setCreateError(null);
    };

    const submitCreateManager = async () => {
        setCreateError(null);
        if (!createForm.email || !createForm.password) {
            setCreateError('Email and password are required.');
            return;
        }

        const result = await handleCreateManager(createForm);
        if (result.success) {
            setCreateModalOpen(false);
            clearCreateForm();
        } else {
            setCreateError(result.message || 'Unable to create manager.');
        }
    };

    const submitUserUpdate = async () => {
        if (!selectedUser) return;
        setEditError(null);

        const result = await handleUpdateUser(selectedUser.id, {
            name: editForm.name,
            email: editForm.email,
            phone: editForm.phone,
            role: editForm.role,
        });

        if (result.success) {
            setSelectedUser(null);
        } else {
            setEditError(result.message || 'Unable to update user.');
        }
    };

    const submitUserDelete = async () => {
        if (!selectedUser) return;
        const confirmed = window.confirm(
            `Delete ${selectedUser.name || selectedUser.email}? This action will remove the user from active listings.`
        );
        if (!confirmed) return;

        const result = await handleDeleteUser(selectedUser.id);
        if (result.success) {
            setSelectedUser(null);
        } else {
            setEditError(result.message || 'Unable to delete user.');
        }
    };

    if (!isAdmin) {
        return (
            <Layout title="Access Denied">
                <div className="vb-vendors-page__alert error-alert">
                    <h2>Access Denied</h2>
                    <p>Only Admin users can manage user accounts.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="User Management">
            <header className="vb-users-page__header">
                <div>
                    <h1 className="vb-users-page__title">User Management</h1>
                    <p className="vb-users-page__subtitle">
                        Create manager accounts, review registered users, and update roles.
                    </p>
                </div>
                <button
                    type="button"
                    className="vb-btn vb-btn--success vb-users-page__create-btn"
                    onClick={() => setCreateModalOpen(true)}
                >
                    Create Manager
                </button>
            </header>

            <div className="vb-users-page__toolbar">
                <div className="vb-users-page__search-box">
                    <div className="vb-search-input-wrapper">
                        <span className="vb-search-icon">🔍</span>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => handleSearchChange(event.target.value)}
                            placeholder="Search users by name, email, phone, or role"
                            className="vb-search-input"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                className="vb-search-clear"
                                onClick={() => handleSearchChange('')}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <span className="vb-search-summary">Showing {users.length} of {total} users</span>
                </div>

                <div className="vb-filter-tabs">
                    {['', 'ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'].map((role) => (
                        <button
                            key={role || 'ALL'}
                            type="button"
                            className={`vb-filter-tab ${roleFilter === role ? 'active' : ''}`}
                            onClick={() => handleRoleFilterChange(role)}
                        >
                            {role ? roleLabels[role] : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {error ? (
                <div className="vb-vendors-page__alert error-alert">
                    <span>{error}</span>
                </div>
            ) : (
                <div className="vb-users-page__table-wrapper vb-surface">
                    <Table
                        columns={columns}
                        data={users}
                        rowKey="id"
                        loading={loading}
                        emptyState={{
                            title: 'No users found',
                            description: 'Try adjusting your filters or create a new manager account.',
                        }}
                    />
                </div>
            )}

            {!loading && totalPages > 1 && (
                <div className="vb-vendors-page__pagination">
                    <button
                        type="button"
                        className="vb-pagination-btn"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                    >
                        &larr; Previous
                    </button>
                    <span className="vb-pagination-text">Page {page} of {totalPages} ({total} total)</span>
                    <button
                        type="button"
                        className="vb-pagination-btn"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                    >
                        Next &rarr;
                    </button>
                </div>
            )}

            <Modal
                open={Boolean(selectedUser)}
                onClose={() => setSelectedUser(null)}
                title={selectedUser ? `Edit ${selectedUser.name}` : 'Edit user'}
                size="md"
                footer={(
                    <div className="vb-quotations-modal__actions">
                        <button
                            type="button"
                            className="vb-btn vb-btn--secondary"
                            onClick={() => setSelectedUser(null)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="vb-btn vb-btn--danger"
                            onClick={submitUserDelete}
                            disabled={loading}
                        >
                            Delete User
                        </button>
                        <button
                            type="button"
                            className="vb-btn vb-btn--success"
                            onClick={submitUserUpdate}
                            disabled={loading}
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            >
                {selectedUser ? (
                    <div className="vb-user-edit-modal">
                        <label className="vb-input-group">
                            Name
                            <input
                                value={editForm.name}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                                className="vb-input"
                                placeholder="Full name"
                            />
                        </label>
                        <label className="vb-input-group">
                            Email
                            <input
                                value={editForm.email}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                                className="vb-input"
                                type="email"
                                placeholder="email@example.com"
                            />
                        </label>
                        <label className="vb-input-group">
                            Phone
                            <input
                                value={editForm.phone}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
                                className="vb-input"
                                placeholder="10 digit phone"
                            />
                        </label>
                        <label className="vb-select-label">
                            Role
                            <select
                                value={editForm.role}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value }))}
                                className="vb-select"
                            >
                                {roleOptions.map((role) => (
                                    <option key={role} value={role}>
                                        {roleLabels[role]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {editError && <p className="vb-form-error">{editError}</p>}
                    </div>
                ) : (
                    <Loader text="Loading user..." />
                )}
            </Modal>

            <Modal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Create Manager"
                size="md"
                footer={(
                    <div className="vb-quotations-modal__actions">
                        <button
                            type="button"
                            className="vb-btn vb-btn--secondary"
                            onClick={() => setCreateModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="vb-btn vb-btn--success"
                            onClick={submitCreateManager}
                            disabled={loading}
                        >
                            Create Manager
                        </button>
                    </div>
                )}
            >
                <div className="vb-user-create-form">
                    <label className="vb-input-group">
                        Name
                        <input
                            value={createForm.name}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                            className="vb-input"
                            placeholder="Manager name"
                        />
                    </label>
                    <label className="vb-input-group">
                        Email
                        <input
                            value={createForm.email}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                            className="vb-input"
                            type="email"
                            placeholder="manager@example.com"
                        />
                    </label>
                    <label className="vb-input-group">
                        Phone
                        <input
                            value={createForm.phone}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                            className="vb-input"
                            placeholder="Phone number"
                        />
                    </label>
                    <label className="vb-input-group">
                        Password
                        <input
                            value={createForm.password}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                            className="vb-input"
                            type="password"
                            placeholder="Secure password"
                        />
                    </label>
                    {createError && <p className="vb-form-error">{createError}</p>}
                </div>
            </Modal>

            <Toast
                open={toastConfig.open}
                variant={toastConfig.variant}
                title={toastConfig.title}
                message={toastConfig.message}
                onClose={closeToast}
                duration={4000}
            />
            </Layout>
    );
};

export default UsersPage;
