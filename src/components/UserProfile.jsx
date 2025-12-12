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
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 8,
        border: `1px solid ${dark ? '#404040' : '#d1d5db'}`,
        background: dark ? '#1b1b1b' : '#f3f4f6',
        color: dark ? '#e5e7eb' : '#111',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        transition: 'all 0.2s ease',
    };

    const avatarStyle = {
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
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
                <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                </span>
                <span style={{ fontSize: 10 }}>▼</span>
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