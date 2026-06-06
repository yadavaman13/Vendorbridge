import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';
import { getCategories } from '../../shared/services/categories.api.js';

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
    phone: '',
    companyName: '',
    gstNumber: '',
    categoryId: '',
    address: '',
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
    const [step, setStep] = useState(1);
    const [formValues, setFormValues] = useState({
        username: '',
        email: '',
        phone: '',
        role: '',
        password: '',
        phone: '',
        companyName: '',
        gstNumber: '',
        categoryId: '',
        address: '',
    });
    const [errors, setErrors] = useState(createInitialErrors());
    const [touched, setTouched] = useState({
        username: false,
        email: false,
        phone: false,
        role: false,
        password: false,
        phone: false,
        companyName: false,
        gstNumber: false,
        categoryId: false,
        address: false,
    });
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [toast, setToast] = useState(createInitialToast);
    const navigate = useNavigate();
    const { handleRegister } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const res = await getCategories();
                if (res?.success && Array.isArray(res.data?.items)) {
                    setCategories(res.data.items.map(cat => ({
                        value: cat.id.toString(),
                        label: cat.name,
                    })));
                }
            } catch (err) {
                console.error('Failed to load categories', err);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (!toast.visible) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setToast(createInitialToast());
        }, 5000);

        return () => window.clearTimeout(timer);
    }, [toast.visible]);

    const validateField = (fieldName, fieldValue) => {
        if (fieldName === 'username') {
            return fieldValue.trim() ? '' : 'Name is required.';
        }

        if (fieldName === 'email') {
<<<<<<< HEAD
            if (!fieldValue.trim()) {
                return 'Valid email is required.';
            }

=======
>>>>>>> ca22778df33d11b21d8d6653d241fdc13363a3fd
            return validateEmail(fieldValue, {
                requiredMessage: 'Valid email is required.',
                invalidMessage: 'Valid email is required.',
            });
        }

        if (fieldName === 'password') {
            return validatePasswordStrength(fieldValue);
        }

        if (fieldName === 'phone') {
<<<<<<< HEAD
            return validatePhone(fieldValue);
        }

        if (fieldName === 'role') {
            return fieldValue?.trim() ? '' : 'Role is required.';
=======
            const trimmed = fieldValue.trim();
            if (!trimmed) {
                return 'Phone number is required.';
            }
            return /^\d{10}$/.test(trimmed) ? '' : 'Phone number must be exactly 10 digits.';
        }

        if (fieldName === 'companyName') {
            return fieldValue.trim() ? '' : 'Company name is required.';
        }

        if (fieldName === 'gstNumber') {
            const trimmed = fieldValue.trim();
            if (!trimmed) {
                return 'GST number is required.';
            }
            return trimmed.length >= 5 ? '' : 'GST number must be at least 5 characters.';
        }

        if (fieldName === 'categoryId') {
            return fieldValue ? '' : 'Category selection is required.';
>>>>>>> ca22778df33d11b21d8d6653d241fdc13363a3fd
        }

        return '';
    };

    const validateStep1 = () => {
        const nextErrors = {
            ...errors,
            username: validateField('username', formValues.username),
            email: validateField('email', formValues.email),
            phone: validateField('phone', formValues.phone),
            role: validateField('role', formValues.role),
            password: validateField('password', formValues.password),
            phone: validateField('phone', formValues.phone),
        };
        setErrors(nextErrors);
<<<<<<< HEAD
        setTouched({ username: true, email: true, phone: true, role: true, password: true });
=======
        setTouched((prev) => ({
            ...prev,
            username: true,
            email: true,
            password: true,
            phone: true,
        }));
        return !nextErrors.username && !nextErrors.email && !nextErrors.password && !nextErrors.phone;
    };
>>>>>>> ca22778df33d11b21d8d6653d241fdc13363a3fd

    const validateStep2 = () => {
        const nextErrors = {
            ...errors,
            companyName: validateField('companyName', formValues.companyName),
            gstNumber: validateField('gstNumber', formValues.gstNumber),
            categoryId: validateField('categoryId', formValues.categoryId),
            address: validateField('address', formValues.address),
        };
        setErrors(nextErrors);
        setTouched((prev) => ({
            ...prev,
            companyName: true,
            gstNumber: true,
            categoryId: true,
            address: true,
        }));
        return !nextErrors.companyName && !nextErrors.gstNumber && !nextErrors.categoryId && !nextErrors.address;
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleBack = (e) => {
        e.preventDefault();
        setStep(1);
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

        if (!validateStep1()) {
            setStep(1);
            return;
        }

        if (!validateStep2()) {
            setStep(2);
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await handleRegister({
                name: formValues.username,
                email: formValues.email,
                phone: formValues.phone,
                role: formValues.role,
                password: formValues.password,
                phone: formValues.phone,
                companyName: formValues.companyName,
                gstNumber: formValues.gstNumber,
                categoryId: formValues.categoryId,
                address: formValues.address || null,
            });

            if (result?.success) {
                setErrors(createInitialErrors());
                setTouched({
                    username: false,
                    email: false,
                    password: false,
                    phone: false,
                    companyName: false,
                    gstNumber: false,
                    categoryId: false,
                    address: false,
                });
                setFormValues({
                    username: '',
                    email: '',
                    password: '',
                    phone: '',
                    companyName: '',
                    gstNumber: '',
                    categoryId: '',
                    address: '',
                });
                setStep(1);
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

            if (Object.values(nextErrors).some(Boolean)) {
                setErrors(nextErrors);
                setTouched({
                    username: true,
                    email: true,
                    password: true,
                    phone: true,
                    companyName: true,
                    gstNumber: true,
                    categoryId: true,
                    address: true,
                });

                // Send back to Step 1 if there's any step 1 error
                if (nextErrors.username || nextErrors.email || nextErrors.password || nextErrors.phone) {
                    setStep(1);
                } else {
                    setStep(2);
                }
                return;
            }

            setToast({
                visible: true,
                type: 'error',
                message: result?.message || 'Registration failed.',
            });
        } catch (err) {
            console.error('Registration form error', err);
            setToast({
                visible: true,
                type: 'error',
                message: 'An unexpected error occurred.',
            });
        } finally {
            setIsSubmitting(false);
        }
<<<<<<< HEAD

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
=======
>>>>>>> ca22778df33d11b21d8d6653d241fdc13363a3fd
    };

    return (
        <main className="auth-page auth-page--register">
            <section className="form-container auth-form-container auth-form-container--register register-form-container">
                <div className="auth-branding">
                    <div className="auth-copy">
                        <p className="auth-eyebrow">New Vendor Account</p>
                        <h1 className="form-title">Create your account</h1>
                        <p className="form-subtitle">
                            Set up your profile and join the platform in a few quick steps.
                        </p>
                    </div>
                </div>

                <div className="step-indicator">
                    <div className={`step-indicator__item ${step === 1 ? 'is-active' : ''} ${step > 1 ? 'is-completed' : ''}`}>
                        <div className="step-indicator__number">1</div>
                        <div className="step-indicator__label">Account Info</div>
                    </div>
                    <div className="step-indicator__line" />
                    <div className={`step-indicator__item ${step === 2 ? 'is-active' : ''}`}>
                        <div className="step-indicator__number">2</div>
                        <div className="step-indicator__label">Company Info</div>
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
<<<<<<< HEAD
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
=======
                    {step === 1 && (
                        <div className="auth-form-grid animate-fade-in">
                            <FormGroup
                                label="Vendor Name"
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
                                label="Email Address"
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
                            <FormGroup
                                label="Phone Number"
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
                        </div>
                    )}

                    {step === 2 && (
                        <div className="auth-form-grid animate-fade-in">
                            <FormGroup
                                label="Company Name"
                                id="companyName"
                                name="companyName"
                                type="text"
                                value={formValues.companyName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isBusy}
                                hasError={Boolean(touched.companyName && errors.companyName)}
                                errorMessage={touched.companyName ? errors.companyName : ''}
                            />
                            <FormGroup
                                label="GST Number"
                                id="gstNumber"
                                name="gstNumber"
                                type="text"
                                value={formValues.gstNumber}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isBusy}
                                hasError={Boolean(touched.gstNumber && errors.gstNumber)}
                                errorMessage={touched.gstNumber ? errors.gstNumber : ''}
                            />
                            <div className="grid-span-full">
                                <FormGroup
                                    label="Business Category"
                                    id="categoryId"
                                    name="categoryId"
                                    type="select"
                                    placeholder="Select Category"
                                    value={formValues.categoryId}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isBusy || loadingCategories}
                                    hasError={Boolean(touched.categoryId && errors.categoryId)}
                                    errorMessage={touched.categoryId ? errors.categoryId : ''}
                                    options={categories}
                                />
                            </div>
                            <div className="grid-span-full">
                                <FormGroup
                                    label="Company Address"
                                    id="address"
                                    name="address"
                                    type="textarea"
                                    value={formValues.address}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isBusy}
                                    hasError={Boolean(touched.address && errors.address)}
                                    errorMessage={touched.address ? errors.address : ''}
                                />
                            </div>
                        </div>
                    )}

                    {step === 1 && <PasswordMeter password={formValues.password} />}

                    {step === 1 ? (
                        <div className="auth-actions">
                            <button
                                className="btn btn-auth-submit auth-submit-btn"
                                type="button"
                                onClick={handleNext}
                            >
                                Next Step
                            </button>
                        </div>
                    ) : (
                        <div className="auth-actions auth-actions--two-buttons">
                            <button
                                className="btn btn-secondary auth-back-btn"
                                type="button"
                                onClick={handleBack}
                                disabled={isBusy}
                            >
                                Back
                            </button>
                            <button
                                className="btn btn-auth-submit auth-submit-btn"
                                type="submit"
                                disabled={isBusy}
                            >
                                {isBusy ? 'Registering...' : 'Register'}
                            </button>
                        </div>
                    )}
>>>>>>> ca22778df33d11b21d8d6653d241fdc13363a3fd
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
