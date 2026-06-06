import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';

import FormGroup from '../components/FormGroup';
import FormField from '../../shared/components/FormField';
import {
    validateEmail,
    validatePasswordStrength,
    validatePhone,
} from '../utils/validation.utils';
import PasswordMeter from '../components/PasswordMeter';
import '../styles/auth.scss';

const createInitialErrors = () => ({
    username: '',
    email: '',
    phone: '',
    role: '',
    password: '',
});

const createInitialToast = () => ({
    visible: false,
    message: '',
    type: 'success',
});

const mapServerFieldName = (fieldName) => {
    if (fieldName === 'name') {
        return 'username';
    }

    return fieldName;
};

const Register = () => {
    const [formValues, setFormValues] = useState({
        username: '',
        email: '',
        phone: '',
        role: '',
        password: '',
    });
    const [errors, setErrors] = useState(createInitialErrors);
    const [touched, setTouched] = useState({
        username: false,
        email: false,
        phone: false,
        role: false,
        password: false,
    });
    const [toast, setToast] = useState(createInitialToast);
    const navigate = useNavigate();
    const { handleRegister } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!toast.visible) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setToast(createInitialToast());
        }, 3000);

        return () => window.clearTimeout(timer);
    }, [toast.visible]);

    const validateField = (fieldName, fieldValue) => {
        if (fieldName === 'username') {
            return fieldValue.trim() ? '' : 'Name is required.';
        }

        if (fieldName === 'email') {
            if (!fieldValue.trim()) {
                return 'Valid email is required.';
            }

            return validateEmail(fieldValue, {
                requiredMessage: 'Valid email is required.',
                invalidMessage: 'Valid email is required.',
            });
        }

        if (fieldName === 'password') {
            return validatePasswordStrength(fieldValue);
        }

        if (fieldName === 'phone') {
            return validatePhone(fieldValue);
        }

        if (fieldName === 'role') {
            return fieldValue?.trim() ? '' : 'Role is required.';
        }

        return '';
    };

    const validateForm = () => {
        const nextErrors = {
            username: validateField('username', formValues.username),
            email: validateField('email', formValues.email),
            phone: validateField('phone', formValues.phone),
            role: validateField('role', formValues.role),
            password: validateField('password', formValues.password),
        };

        setErrors(nextErrors);
        setTouched({ username: true, email: true, phone: true, role: true, password: true });

        return !Object.values(nextErrors).some(Boolean);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));

        if (touched[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: validateField(name, value),
            }));
        }

        if (toast.visible) {
            setToast(createInitialToast());
        }
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;

        setTouched((prev) => ({ ...prev, [name]: true }));
        setErrors((prev) => ({
            ...prev,
            [name]: validateField(name, value),
        }));
    };

    const isBusy = isSubmitting;

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        let result;
        setIsSubmitting(true);

        try {
            result = await handleRegister({
                name: formValues.username,
                email: formValues.email,
                phone: formValues.phone,
                role: formValues.role,
                password: formValues.password,
            });
        } finally {
            setIsSubmitting(false);
        }

        if (result?.success) {
            setErrors(createInitialErrors());
            setTouched({ username: false, email: false, phone: false, role: false, password: false });
            setFormValues({ username: '', email: '', phone: '', role: '', password: '' });
            navigate('/verify-email', {
                state: {
                    email: formValues.email.trim().toLowerCase(),
                    cooldownSeconds: 300,
                },
            });
            return;
        }

        const nextErrors = createInitialErrors();

        if (Array.isArray(result?.errors)) {
            result.errors.forEach((fieldError) => {
                const fieldName = mapServerFieldName(
                    fieldError.path || fieldError.param || '',
                );

                if (fieldName && nextErrors[fieldName] !== undefined) {
                    nextErrors[fieldName] =
                        fieldError.msg || fieldError.message || result.message;
                }
            });
        }

        if (nextErrors.username || nextErrors.email || nextErrors.phone || nextErrors.role || nextErrors.password) {
            setErrors(nextErrors);
            setTouched({ username: true, email: true, phone: true, role: true, password: true });
            return;
        }

        setToast({
            visible: true,
            type: 'error',
            message: result?.message || 'Registration failed.',
        });
    };

    return (
        <main className="auth-page auth-page--register">
            <section className="form-container auth-form-container auth-form-container--register register-form-container">
                <div className="auth-branding">
                    <div className="auth-copy">
                        <p className="auth-eyebrow">New account</p>
                        <h1 className="form-title">Create your account</h1>
                        <p className="form-subtitle">
                            Set up your profile and join the platform in a few
                            quick steps.
                        </p>
                    </div>
                </div>

                {toast.visible && (
                    <div
                        className={`toast-banner ${toast.type === 'error' ? 'is-error' : 'is-success'}`}
                        role="status"
                        aria-live="polite"
                    >
                        {toast.message}
                    </div>
                )}

                <form
                    className="auth-form"
                    onSubmit={handleFormSubmit}
                    noValidate
                >
                    <FormGroup
                        label="Name"
                        id="username"
                        name="username"
                        type="text"
                        value={formValues.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isBusy}
                        hasError={Boolean(touched.username && errors.username)}
                        errorMessage={touched.username ? errors.username : ''}
                    />
                    <FormGroup
                        label="Email"
                        id="email"
                        name="email"
                        type="email"
                        value={formValues.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isBusy}
                        hasError={Boolean(touched.email && errors.email)}
                        errorMessage={touched.email ? errors.email : ''}
                    />
                    <FormGroup
                        label="Phone"
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formValues.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isBusy}
                        hasError={Boolean(touched.phone && errors.phone)}
                        errorMessage={touched.phone ? errors.phone : ''}
                    />
                    <FormField
                        id="role"
                        name="role"
                        type="select"
                        value={formValues.role}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isBusy}
                        required
                        options={[
                            { value: 'ADMIN', label: 'Admin' },
                            { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer' },
                            { value: 'MANAGER', label: 'Manager' },
                            { value: 'VENDOR', label: 'Vendor' },
                        ]}
                        placeholder="Select role"
                        error={touched.role ? errors.role : ''}
                    />
                    <FormGroup
                        label="Password"
                        id="password"
                        name="password"
                        type="password"
                        value={formValues.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isBusy}
                        hasError={Boolean(touched.password && errors.password)}
                        errorMessage={touched.password ? errors.password : ''}
                    />
                    <PasswordMeter password={formValues.password} />

                    <div className="auth-actions">
                        <button
                            className="btn btn-auth-submit auth-submit-btn"
                            type="submit"
                            disabled={isBusy}
                        >
                            {isBusy ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>

                <p className="form-footer">
                    Already have an account?{' '}
                    <Link className="auth-link" to="/login">
                        Login
                    </Link>
                </p>
            </section>
        </main>
    );
};

export default Register;
