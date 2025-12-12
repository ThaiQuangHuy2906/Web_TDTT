import React from 'react';

/**
 * AuthLayout - Shared layout for authentication screens
 * Provides consistent styling for Login, Signup, and ForgotPassword
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Form content
 * @param {string} props.title - Page title
 * @param {boolean} props.dark - Dark mode flag
 */
export default function AuthLayout({ children, title, dark = false }) {
    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: dark ? '#0b0b0b' : '#f9fafb',
        padding: 20,
        transition: 'background-color 0.3s ease',
    };

    const cardStyle = {
        width: '100%',
        maxWidth: 420,
        padding: 32,
        backgroundColor: dark ? '#1e1e1e' : '#ffffff',
        color: dark ? '#e5e7eb' : '#111',
        borderRadius: 16,
        border: `1px solid ${dark ? '#2a2a2a' : '#e5e7eb'}`,
        boxShadow: dark
            ? '0 10px 40px rgba(0,0,0,0.5)'
            : '0 10px 40px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
    };

    const headerStyle = {
        textAlign: 'center',
        marginBottom: 32,
    };

    const titleStyle = {
        fontSize: 28,
        fontWeight: 700,
        marginBottom: 8,
        background: dark
            ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
            : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    };

    const subtitleStyle = {
        fontSize: 14,
        opacity: 0.7,
        marginTop: 4,
    };

    const logoStyle = {
        fontSize: 48,
        marginBottom: 16,
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={headerStyle}>
                    <div style={logoStyle}>🗺️</div>
                    <h1 style={titleStyle}>{title}</h1>
                    <p style={subtitleStyle}>OSM-VN - Khám phá bản đồ Việt Nam</p>
                </div>
                {children}
            </div>
        </div>
    );
}