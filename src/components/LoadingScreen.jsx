import React from 'react';

/**
 * LoadingScreen component
 * Displayed during initial authentication check
 * Supports dark mode
 */
export default function LoadingScreen({ dark = false }) {
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: dark ? '#0b0b0b' : '#ffffff',
        color: dark ? '#e5e7eb' : '#111',
        transition: 'background-color 0.3s ease',
    };

    const spinnerStyle = {
        width: 48,
        height: 48,
        border: `4px solid ${dark ? '#374151' : '#e5e7eb'}`,
        borderTop: `4px solid ${dark ? '#3b82f6' : '#2563eb'}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    };

    const textStyle = {
        marginTop: 16,
        fontSize: 16,
        fontWeight: 500,
        opacity: 0.8,
    };

    return (
        <div style={containerStyle}>
            <style>
                {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
            </style>
            <div style={spinnerStyle} />
            <div style={textStyle}>Đang tải...</div>
        </div>
    );
}