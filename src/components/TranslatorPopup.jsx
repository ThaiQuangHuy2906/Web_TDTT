import React, { useState, useEffect, useRef } from 'react';
import { translateEnToVi } from '../api/translate.js';

export default function TranslatorPopup({ open, dark, onClose }) {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);

    const textareaRef = useRef(null);

    // Focus khi popup mở
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
        } else {
            setInput('');
            setOutput('');
            setErr(null);
        }
    }, [open]);

    if (!open) return null;

    const popupStyle = {
        position: 'absolute',
        top: 80,
        left: 10,
        zIndex: 5000,
        width: 360,
        padding: 12,
        borderRadius: 10,
        background: dark ? '#0f172a' : '#ffffff',
        border: `1px solid ${dark ? '#334155' : '#e5e7eb'}`,
        boxShadow: dark ? '0 4px 18px rgba(0,0,0,0.6)' : '0 4px 18px rgba(0,0,0,0.15)',
        color: dark ? '#e5e7eb' : '#111',
    };

    const btn = {
        padding: '6px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        border: `1px solid ${dark ? '#475569' : '#d1d5db'}`,
        background: dark ? '#1e293b' : '#f3f4f6',
        color: dark ? '#e5e7eb' : '#111'
    };

    const handleTranslate = async () => {
        if (!input.trim()) {
            setErr('❗ Nhập câu tiếng Anh trước đã.');
            return;
        }

        setLoading(true);
        setErr(null);
        setOutput('');

        try {
            const result = await translateEnToVi(input.trim());
            setOutput(result);
        } catch {
            setErr('⚠ Không thể dịch lúc này, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={popupStyle}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>🌐 Dịch Anh → Việt</div>

            <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Nhập câu tiếng Anh…"
                style={{
                    width: '100%',
                    minHeight: 70,
                    borderRadius: 6,
                    padding: 8,
                    border: `1px solid ${dark ? '#475569' : '#d1d5db'}`,
                    background: dark ? '#1e293b' : '#fff',
                    color: dark ? '#e2e8f0' : '#111'
                }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button style={btn} onClick={handleTranslate} disabled={loading}>
                    {loading ? '⏳ Đang dịch…' : 'Dịch'}
                </button>
                <button style={btn} onClick={onClose}>Đóng</button>
            </div>

            {err && (
                <div style={{ marginTop: 6, color: '#dc2626', fontSize: 13 }}>
                    {err}
                </div>
            )}

            {output && (
                <div
                    style={{
                        marginTop: 10,
                        padding: 10,
                        background: dark ? '#1e293b' : '#f1f5f9',
                        borderRadius: 6,
                        fontSize: 14,
                        whiteSpace: 'pre-wrap'
                    }}
                >
                    {output}
                </div>
            )}
        </div>
    );
}
