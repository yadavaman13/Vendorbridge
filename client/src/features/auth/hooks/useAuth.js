import { useContext } from 'react';

import { AuthContext } from '../auth.context';
import {
    register,
    login,
    requestPasswordReset,
    resetPassword,
    logout,
    getMe,
} from '../services/auth.api';

export const useAuth = () => {
    const context = useContext(AuthContext);

    const { loading, setLoading, user, setUser, error, setError } = context;

<<<<<<< HEAD
    const handleRegister = async ({ name, email, phone, role, password }) => {
=======
    const handleRegister = async ({ name, email, password, phone, companyName, gstNumber, categoryId, address }) => {
>>>>>>> ca22778df33d11b21d8d6653d241fdc13363a3fd
        setLoading(true);
        setError(null);

        let data;
        try {
<<<<<<< HEAD
            data = await register({ name, email, phone, role, password });
            console.log('Registration Failed', data);
=======
            data = await register({ name, email, password, phone, companyName, gstNumber, categoryId, address });
            console.log('Registration Response', data);
>>>>>>> ca22778df33d11b21d8d6653d241fdc13363a3fd
            if (data?.user) {
                setUser(data.user);
                sessionStorage.setItem('user', JSON.stringify(data.user));
            }

            return data;
        } catch (err) {
            const responseData = err?.response?.data;
            const message =
                responseData?.message || err?.message || 'Registration failed.';
            
            // Server validation returns errors under either "error" or "errors" key
            let errors = [];
            if (Array.isArray(responseData?.error)) {
                errors = responseData.error;
            } else if (Array.isArray(responseData?.errors)) {
                errors = responseData.errors;
            }

            setError(message);

            return {
                success: false,
                message,
                errors,
            };
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        setError(null);

        let data;
        try {
            data = await login({ email, password });
            if (data?.user) {
                setUser(data.user);
                sessionStorage.setItem('user', JSON.stringify(data.user));
            } else {
                throw new Error(data?.message || 'Login Failed');
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Login Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPasswordReset = async ({ email }) => {
        setLoading(true);
        setError(null);

        try {
            const data = await requestPasswordReset({ email });

            if (data?.success === false) {
                setError(data.message || 'Request failed.');
                return {
                    success: false,
                    message: data.message || 'Request failed.',
                };
            }

            return { success: true, data };
        } catch (err) {
            const responseData = err?.response?.data;
            const message =
                responseData?.message ||
                err?.message ||
                'Unable to send reset email.';

            setError(message);

            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async ({
        email,
        otp,
        password,
        confirmPassword,
    }) => {
        setLoading(true);
        setError(null);

        try {
            const data = await resetPassword({
                email,
                otp,
                password,
                confirmPassword,
            });

            if (data?.success === false) {
                setError(data.message || 'Password reset failed.');
                return {
                    success: false,
                    message: data.message || 'Password reset failed.',
                };
            }

            setUser(null);
            sessionStorage.removeItem('user');

            return { success: true, data };
        } catch (err) {
            const responseData = err?.response?.data;
            const message =
                responseData?.message ||
                err?.message ||
                'Password reset failed.';

            setError(message);

            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            sessionStorage.removeItem('user');
        } catch (error) {
            console.error('Logout Failed', error);
        }
    };

    const handleGetMe = async () => {
        let data;
        try {
            setLoading(true);

            if (sessionStorage.getItem('user')) {
                setUser(JSON.parse(sessionStorage.getItem('user')));
                return;
            }

            data = await getMe();
            setUser(data?.user || null);
        } catch (error) {
            console.error('Failed to fetch user data', error);
            setError(data?.message || 'Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    return {
        handleRegister,
        handleLogin,
        handleLogout,
        handleRequestPasswordReset,
        handleResetPassword,
        handleGetMe,
        user,
        loading,
        error,
    };
};
