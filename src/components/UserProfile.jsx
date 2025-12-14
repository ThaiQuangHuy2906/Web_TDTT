import React, { useState, useRef, useEffect } from 'react';
import useAuth from '../hooks/useAuth';

/**
 * UserProfile Component
 * Displays user email and logout button
 * Positioned in the top control panel
 */
export default function UserProfile({ dark = false }) {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            // AuthContext will handle redirect to login screen
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    if (!user) return null;

    const containerStyle = {
        position: 'relative',
        display: 'inline-block',
    };

    const buttonStyle = {
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: `2px solid ${dark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: '#fff',
        cursor: 'pointer',
        fontSize: 16,
        fontWeight: 600,
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: dark
            ? '0 4px 12px rgba(139, 92, 246, 0.4)'
            : '0 4px 12px rgba(99, 102, 241, 0.3)',
    };

    const avatarStyle = {
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 700,
    };

    const dropdownStyle = {
        position: 'absolute',
        top: 40,
        right: 0,
        minWidth: 220,
        borderRadius: 10,
        border: `1px solid ${dark ? '#2a2a2a' : '#e5e7eb'}`,
        background: dark ? '#0b0b0b80' : '#ffffffd9',
        backdropFilter: 'blur(8px)',
        boxShadow: dark ? '0 8px 20px rgba(0,0,0,.45)' : '0 8px 20px rgba(0,0,0,.12)',
        padding: 8,
        zIndex: 2000,
    };

    const emailStyle = {
        padding: '8px 12px',
        fontSize: 13,
        color: dark ? '#9ca3af' : '#6b7280',
        borderBottom: `1px solid ${dark ? '#1f2937' : '#f1f5f9'}`,
        marginBottom: 4,
        wordBreak: 'break-all',
    };

    const logoutButtonStyle = {
        width: '100%',
        padding: '8px 12px',
        borderRadius: 6,
        border: 'none',
        background: dark ? '#dc2626' : '#ef4444',
        color: '#fff',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    };

    // Get first letter of email for avatar
    const avatarLetter = user.email ? user.email[0].toUpperCase() : '?';

    return (
        <div ref={dropdownRef} style={containerStyle}>
            <button
                style={buttonStyle}
                onClick={() => setShowDropdown(!showDropdown)}
                title={user.email}
            >
                <div style={avatarStyle}>{avatarLetter}</div>
            </button>

            {showDropdown && (
                <div style={dropdownStyle}>
                    <div style={emailStyle}>
                        Đang đăng nhập với:
                        <br />
                        <strong>{user.email}</strong>
                    </div>
                    <button
                        style={logoutButtonStyle}
                        onClick={handleLogout}
                    >
                        🚪 Đăng xuất
                    </button>
                </div>
            )}
        </div>
    );
}