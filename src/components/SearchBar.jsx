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
            gap: 8,
            alignItems: 'center',
        },
        input: {
            width: 360,
            padding: '8px 10px',
            borderRadius: 8,
            border: `1px solid ${dark ? '#404040' : '#cbd5e1'}`,
            background: dark ? '#0f172a' : '#fff',
            color: dark ? '#e5e7eb' : '#111',
            outline: 'none',
        },
        btn: {
            padding: '8px 12px',
            borderRadius: 8,
            border: `1px solid ${dark ? '#404040' : '#d1d5db'}`,
            background: dark ? '#1b1b1b' : '#f3f4f6',
            color: dark ? '#e5e7eb' : '#111',
            cursor: 'pointer'
        },
        dropdown: {
            position: 'absolute',
            top: 40,
            left: 0,
            width: 360,
            maxHeight: 240,
            overflowY: 'auto',
            zIndex: 2000,
            borderRadius: 10,
            border: `1px solid ${dark ? '#2a2a2a' : '#e5e7eb'}`,
            background: dark ? '#0b0b0b80' : '#ffffffd9',
            backdropFilter: 'blur(8px)',
            boxShadow: dark ? '0 8px 20px rgba(0,0,0,.45)' : '0 8px 20px rgba(0,0,0,.12)'
        },
        row: (hover) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '8px 10px',
            cursor: 'pointer',
            background: hover ? (dark ? '#111827' : '#f9fafb') : 'transparent',
            color: dark ? '#e5e7eb' : '#111',
            borderBottom: `1px solid ${dark ? '#1f2937' : '#f1f5f9'}`
        }),
        smallBtn: {
            padding: '4px 6px',
            borderRadius: 6,
            border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
            background: dark ? '#111827' : '#fff',
            color: dark ? '#e5e7eb' : '#111',
            cursor: 'pointer'
        },
        hint: { fontSize: 12, color: dark ? '#94a3b8' : '#6b7280', padding: '6px 10px' }
    };

    return (
        <div ref={wrapRef} style={ui.wrap}>
            <input
                ref={inputRef}
                style={ui.input}
                placeholder="Nhập địa điểm ở Việt Nam…"
                value={value}
                onChange={e => { setValue(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
                onKeyDown={e => {
                    if (e.key === 'Enter') doSearch();
                    if (e.key === 'Escape') setOpen(false);
                }}
            />
            <button style={ui.btn} onClick={doSearch}>Tìm</button>

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