import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import AuthLayout from './AuthLayout';

/**
 * ForgotPassword Component
 * Handles password reset email sending
 */
export default function ForgotPassword({ dark = false, onBackToLogin }) {
    const { resetPassword, error, clearError } = useAuth();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
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
        setSuccess(false);
        clearError();

        // Client-side validation
        if (!email) {
            setValidationError('Vui lòng nhập email');
            return;
        }

        if (!validateEmail(email)) {
            setValidationError('Email không hợp lệ');
            return;
        }

        try {
            setLoading(true);
            await resetPassword(email);
            setSuccess(true);
            setEmail(''); // Clear field after success
        } catch (err) {
            // Error already set in AuthContext
            console.error('Password reset error:', err);
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

    const successStyle = {
        padding: '12px 16px',
        borderRadius: 8,
        backgroundColor: dark ? '#065f46' : '#d1fae5',
        color: dark ? '#6ee7b7' : '#047857',
        fontSize: 14,
        marginBottom: 16,
        border: `1px solid ${dark ? '#047857' : '#a7f3d0'}`,
        lineHeight: 1.6,
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

    const descriptionStyle = {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 24,
        lineHeight: 1.6,
    };

    return (
        <AuthLayout title="Quên mật khẩu" dark={dark}>
            <form onSubmit={handleSubmit}>
                {/* Description */}
                <div style={descriptionStyle}>
                    Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
                </div>

                {/* Success message */}
                {success && (
                    <div style={successStyle}>
                        ✅ Email đặt lại mật khẩu đã được gửi!
                        <br />
                        Vui lòng kiểm tra hộp thư (và cả thư mục spam).
                    </div>
                )}

                {/* Error messages */}
                {(error || validationError) && (
                    <div style={errorStyle}>
                        {validationError || error}
                    </div>
                )}

                {/* Email field */}
                <div style={{ marginBottom: 20 }}>
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

                {/* Submit button */}
                <button
                    type="submit"
                    style={buttonStyle}
                    disabled={loading}
                >
                    {loading ? 'Đang gửi...' : 'Gửi email đặt lại'}
                </button>

                {/* Back to login */}
                <div style={dividerStyle}>
                    <a onClick={() => onBackToLogin?.()} style={linkStyle}>
                        ← Quay lại đăng nhập
                    </a>
                </div>
            </form>
        </AuthLayout>
    );
}