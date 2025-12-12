import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import AuthLayout from './AuthLayout';
import { migrateLocalStorageHistory } from '../../firebase/firestore';

/**
 * Signup Component
 * Handles user registration with email/password
 * Automatically migrates localStorage history after signup
 */
export default function Signup({ dark = false, onSwitchToLogin }) {
    const { signup, error, clearError } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
        if (!email || !password || !confirmPassword) {
            setValidationError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (!validateEmail(email)) {
            setValidationError('Email không hợp lệ');
            return;
        }

        if (password.length < 6) {
            setValidationError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (password !== confirmPassword) {
            setValidationError('Mật khẩu xác nhận không khớp');
            return;
        }

        try {
            setLoading(true);

            // Create user account
            const result = await signup(email, password);

            // Migrate localStorage history to Firestore
            try {
                await migrateLocalStorageHistory(result.user.uid);
                console.log('✅ History migrated successfully');
            } catch (migrationErr) {
                console.warn('⚠️ History migration failed (non-critical):', migrationErr);
                // Don't block signup if migration fails
            }

            // Success - AuthContext will handle redirect via App.jsx
        } catch (err) {
            // Error already set in AuthContext
            console.error('Signup error:', err);
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

    const hintStyle = {
        fontSize: 12,
        opacity: 0.6,
        marginTop: 4,
    };

    return (
        <AuthLayout title="Đăng ký" dark={dark}>
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
                    <div style={hintStyle}>Tối thiểu 6 ký tự</div>
                </div>

                {/* Confirm password field */}
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Xác nhận mật khẩu</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        style={inputStyle}
                        disabled={loading}
                    />
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    style={buttonStyle}
                    disabled={loading}
                >
                    {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>

                {/* Switch to login */}
                <div style={dividerStyle}>
                    Đã có tài khoản?{' '}
                    <a onClick={() => onSwitchToLogin?.()} style={linkStyle}>
                        Đăng nhập
                    </a>
                </div>
            </form>
        </AuthLayout>
    );
}