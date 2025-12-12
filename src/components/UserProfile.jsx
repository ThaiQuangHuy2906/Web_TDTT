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
    gap: 8,
    padding: '8px 14px',
    borderRadius: 10,
    border: 'none',
    background: dark 
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)'
      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
    color: dark ? '#e5e7eb' : '#111',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: `1px solid ${dark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
  };

  const avatarStyle = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
  };

  const dropdownStyle = {
    position: 'absolute',
    top: 48,
    right: 0,
    minWidth: 240,
    borderRadius: 12,
    border: `1px solid ${dark ? 'rgba(42, 42, 42, 0.8)' : 'rgba(229, 231, 235, 0.8)'}`,
    background: dark ? 'rgba(17, 17, 17, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    boxShadow: dark ? '0 8px 24px rgba(0,0,0,.5)' : '0 8px 24px rgba(0,0,0,.15)',
    padding: 12,
    zIndex: 2000,
  };

  const emailStyle = {
    padding: '12px 14px',
    fontSize: 13,
    borderRadius: 8,
    background: dark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(249, 250, 251, 0.8)',
    border: `1px solid ${dark ? 'rgba(64, 64, 64, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
    marginBottom: 8,
    wordBreak: 'break-all',
  };

  const logoutButtonStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
        <span style={{ 
          maxWidth: 120, 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
        }}>
          {user.email}
        </span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
      </button>

      {showDropdown && (
        <div style={dropdownStyle}>
          <div style={emailStyle}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>
              Đang đăng nhập với
            </div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {user.email}
            </div>
          </div>
          <button
            style={logoutButtonStyle}
            onClick={handleLogout}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}