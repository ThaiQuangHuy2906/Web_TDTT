import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import AuthLayout from './AuthLayout';

/**
 * Login Component
 * Handles user login with email/password
 */
export default function Login({ dark = false, onSwitchToSignup, onSwitchToForgotPassword }) {
    const { login, error, clearError } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState('');

    // Validate email format
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError('');
        clearError();

        // Client-side validation
        if (!email || !password) {
            setValidationError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (!validateEmail(email)) {
            setValidationError('Email không hợp lệ');
            return;
        }

        try {
            setLoading(true);
            await login(email, password);
            // Success - AuthContext will handle redirect via App.jsx
        } catch (err) {
            // Error already set in AuthContext
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: 8,
        border: `1px solid ${dark ? '#404040' : '#d1d5db'}`,
        backgroundColor: dark ? '#0f172a' : '#fff',
        color: dark ? '#e5e7eb' : '#111',
        fontSize: 14,
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
    };

    const labelStyle = {
        display: 'block',
        marginBottom: 6,
        fontSize: 14,
        fontWeight: 500,
        color: dark ? '#e5e7eb' : '#374151',
    };

    const buttonStyle = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: 8,
        border: 'none',
        background: loading
            ? (dark ? '#4b5563' : '#9ca3af')
            : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        color: '#fff',
        fontSize: 15,
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: loading ? 0.7 : 1,
    };

    const errorStyle = {
        padding: '10px 12px',
        borderRadius: 8,
        backgroundColor: dark ? '#7f1d1d' : '#fee2e2',
        color: dark ? '#fca5a5' : '#dc2626',
        fontSize: 13,
        marginBottom: 16,
        border: `1px solid ${dark ? '#991b1b' : '#fecaca'}`,
    };

    const linkStyle = {
        color: dark ? '#60a5fa' : '#2563eb',
        textDecoration: 'none',
        fontWeight: 500,
        cursor: 'pointer',
    };

    const dividerStyle = {
        textAlign: 'center',
        margin: '24px 0',
        fontSize: 13,
        opacity: 0.6,
    };

    return (
        <AuthLayout title="Đăng nhập" dark={dark}>
            <form onSubmit={handleSubmit}>
                {/* Error messages */}
                {(error || validationError) && (
                    <div style={errorStyle}>
                        {validationError || error}
                    </div>
                )}

                {/* Email field */}
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        style={inputStyle}
                        disabled={loading}
                    />
                </div>

                {/* Password field */}
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Mật khẩu</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={inputStyle}
                        disabled={loading}
                    />
                </div>

                {/* Forgot password link */}
                <div style={{ textAlign: 'right', marginBottom: 20 }}>
                    <a
                        onClick={() => onSwitchToForgotPassword?.()}
                        style={{ ...linkStyle, fontSize: 13 }}
                    >
                        Quên mật khẩu?
                    </a>
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    style={buttonStyle}
                    disabled={loading}
                >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

                {/* Switch to signup */}
                <div style={dividerStyle}>
                    Chưa có tài khoản?{' '}
                    <a onClick={() => onSwitchToSignup?.()} style={linkStyle}>
                        Đăng ký ngay
                    </a>
                </div>
            </form>
        </AuthLayout>
    );
}