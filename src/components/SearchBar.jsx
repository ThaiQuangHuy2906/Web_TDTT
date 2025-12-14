import React, { useEffect, useMemo, useRef, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useFirestoreHistory from '../hooks/useFirestoreHistory';
import { addToHistory, removeFromHistory, clearHistory } from '../firebase/firestore';

/**
 * SearchBar Component (Updated for Firestore)
 * Now uses Firestore instead of localStorage for history
 *
 * Props:
 * - onSearch(query: string)
 * - dark?: boolean
 */
export default function SearchBar({ onSearch, dark = false }) {
    const { user } = useAuth();
    const { history, loading: historyLoading } = useFirestoreHistory();

    const [value, setValue] = useState('');
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const inputRef = useRef(null);

    // Filter history based on input
    const items = useMemo(() => {
        const v = value.trim().toLowerCase();
        if (!v) return history;
        return history.filter(x => x.toLowerCase().includes(v));
    }, [history, value]);

    // Click outside to close dropdown
    useEffect(() => {
        const h = (e) => {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const doSearch = async () => {
        const q = value.trim();
        if (!q) return;

        // Add to Firestore history
        if (user) {
            try {
                await addToHistory(user.uid, q);
            } catch (err) {
                console.error('Failed to save to history:', err);
                // Don't block search if history save fails
            }
        }

        onSearch?.(q);
        setOpen(false);
    };

    const handlePickHistory = async (q) => {
        setValue(q);
        setOpen(false);

        // Move to top of history (remove and re-add)
        if (user) {
            try {
                await addToHistory(user.uid, q);
            } catch (err) {
                console.error('Failed to update history:', err);
            }
        }

        onSearch?.(q);
    };

    const handleRemoveHistory = async (q) => {
        if (!user) return;

        try {
            await removeFromHistory(user.uid, q);
        } catch (err) {
            console.error('Failed to remove from history:', err);
        }
    };

    const handleClearHistory = async () => {
        if (!user) return;

        if (!confirm('Xóa toàn bộ lịch sử tìm kiếm?')) return;

        try {
            await clearHistory(user.uid);
            inputRef.current?.focus();
        } catch (err) {
            console.error('Failed to clear history:', err);
            alert('Không thể xóa lịch sử. Vui lòng thử lại.');
        }
    };

    const ui = {
        wrap: {
            position: 'relative',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
        },
        input: {
            width: 320,
            padding: '10px 14px',
            paddingLeft: 40,
            borderRadius: 12,
            border: `1.5px solid ${dark ? '#334155' : '#e2e8f0'}`,
            background: dark ? '#0f172a' : '#ffffff',
            color: dark ? '#e2e8f0' : '#1e293b',
            outline: 'none',
            fontSize: 14,
            transition: 'all 0.2s ease',
            boxShadow: dark
                ? 'inset 0 1px 3px rgba(0,0,0,0.3)'
                : 'inset 0 1px 3px rgba(0,0,0,0.05)',
        },
        searchIcon: {
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 16,
            opacity: 0.5,
            pointerEvents: 'none',
        },
        btn: {
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
        },
        dropdown: {
            position: 'absolute',
            top: 48,
            left: 0,
            width: 360,
            maxHeight: 280,
            overflowY: 'auto',
            zIndex: 2000,
            borderRadius: 14,
            border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
            background: dark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: dark
                ? '0 10px 40px rgba(0,0,0,0.5)'
                : '0 10px 40px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.2s ease-out',
        },
        row: (hover) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 14px',
            cursor: 'pointer',
            background: hover ? (dark ? '#1e293b' : '#f1f5f9') : 'transparent',
            color: dark ? '#e2e8f0' : '#1e293b',
            borderBottom: `1px solid ${dark ? '#1e293b' : '#f1f5f9'}`,
            transition: 'all 0.15s ease',
        }),
        smallBtn: {
            padding: '6px 10px',
            borderRadius: 8,
            border: 'none',
            background: dark ? '#334155' : '#f1f5f9',
            color: dark ? '#94a3b8' : '#64748b',
            cursor: 'pointer',
            fontSize: 12,
            transition: 'all 0.2s ease',
        },
        hint: {
            fontSize: 12,
            color: dark ? '#64748b' : '#94a3b8',
            padding: '10px 14px',
            fontWeight: 500,
            borderBottom: `1px solid ${dark ? '#1e293b' : '#f1f5f9'}`,
        }
    };

    return (
        <div ref={wrapRef} style={ui.wrap}>
            <span style={ui.searchIcon}>🔍</span>
            <input
                ref={inputRef}
                style={ui.input}
                placeholder="Nhập địa điểm ở Việt Nam…"
                value={value}
                onChange={e => { setValue(e.target.value); setOpen(true) }}
                onFocus={(e) => {
                    setOpen(true);
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = dark
                        ? '0 0 0 3px rgba(59, 130, 246, 0.2), inset 0 1px 3px rgba(0,0,0,0.3)'
                        : '0 0 0 3px rgba(59, 130, 246, 0.1), inset 0 1px 3px rgba(0,0,0,0.05)';
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = dark ? '#334155' : '#e2e8f0';
                    e.target.style.boxShadow = dark
                        ? 'inset 0 1px 3px rgba(0,0,0,0.3)'
                        : 'inset 0 1px 3px rgba(0,0,0,0.05)';
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') doSearch();
                    if (e.key === 'Escape') setOpen(false);
                }}
            />
            <button
                style={ui.btn}
                onClick={doSearch}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.5)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.4)';
                }}
            >
                Tìm
            </button>

            {/* Dropdown history */}
            {open && (
                <div style={ui.dropdown}>
                    <div style={ui.hint}>
                        📜 Lịch sử tìm kiếm
                        {historyLoading && ' (đang tải...)'}
                    </div>

                    {items.length === 0 && !historyLoading && (
                        <div style={{ ...ui.hint, paddingBottom: 10 }}>
                            {history.length === 0 ? 'Chưa có lịch sử' : 'Không có kết quả phù hợp'}
                        </div>
                    )}

                    {items.map(q => (
                        <div
                            key={q}
                            style={ui.row(false)}
                            onClick={() => handlePickHistory(q)}
                        >
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {q}
                            </span>
                            <button
                                style={ui.smallBtn}
                                onClick={(e) => { e.stopPropagation(); handleRemoveHistory(q) }}
                                title="Xóa khỏi lịch sử"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {history.length > 0 && (
                        <div style={{ padding: 8, display: 'flex', justifyContent: 'flex-end' }}>
                            <button style={ui.smallBtn} onClick={handleClearHistory}>
                                Xóa tất cả
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}