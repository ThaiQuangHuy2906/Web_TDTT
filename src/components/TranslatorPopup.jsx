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

    const handleTranslate = async () => {
        if (!input.trim()) {
            setErr('Nhập câu tiếng Anh trước đã.');
            return;
        }

        setLoading(true);
        setErr(null);
        setOutput('');

        try {
            const result = await translateEnToVi(input.trim());
            setOutput(result);
        } catch {
            setErr('Không thể dịch lúc này, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: 80,
            left: 16,
            zIndex: 5000,
            width: 380,
            borderRadius: 16,
            background: dark ? '#0f172a' : '#ffffff',
            border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
            boxShadow: dark
                ? '0 20px 50px rgba(0,0,0,0.6)'
                : '0 20px 50px rgba(0,0,0,0.15)',
            overflow: 'hidden',
        }}>
            {/* Gradient Header */}
            <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Decorative circle */}
                <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                        }}>
                            🌐
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>
                                Dịch nhanh
                            </div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                                Anh → Việt
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 16,
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s',
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: 16 }}>
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Nhập câu tiếng Anh…"
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleTranslate();
                        }
                    }}
                    style={{
                        width: '100%',
                        minHeight: 80,
                        borderRadius: 12,
                        padding: 12,
                        border: `1.5px solid ${dark ? '#334155' : '#e2e8f0'}`,
                        background: dark ? '#1e293b' : '#f8fafc',
                        color: dark ? '#e2e8f0' : '#1e293b',
                        fontSize: 14,
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={e => {
                        e.target.style.borderColor = dark ? '#334155' : '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                    }}
                />

                <button
                    onClick={handleTranslate}
                    disabled={loading}
                    style={{
                        width: '100%',
                        marginTop: 12,
                        padding: '12px 20px',
                        borderRadius: 12,
                        border: 'none',
                        background: loading
                            ? (dark ? '#334155' : '#e2e8f0')
                            : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                        color: loading ? (dark ? '#64748b' : '#94a3b8') : '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: loading ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.3)',
                    }}
                >
                    {loading ? '⏳ Đang dịch…' : '🔄 Dịch'}
                </button>

                {err && (
                    <div style={{
                        marginTop: 12,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: dark
                            ? 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)'
                            : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                        color: dark ? '#fca5a5' : '#dc2626',
                        fontSize: 13,
                        border: `1px solid ${dark ? '#991b1b' : '#fecaca'}`,
                    }}>
                        ⚠️ {err}
                    </div>
                )}

                {output && (
                    <div style={{
                        marginTop: 12,
                        padding: 14,
                        background: dark
                            ? 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)'
                            : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        borderRadius: 12,
                        border: `1px solid ${dark ? '#3b82f6' : '#bae6fd'}`,
                        fontSize: 14,
                        whiteSpace: 'pre-wrap',
                        color: dark ? '#e2e8f0' : '#1e293b',
                    }}>
                        <div style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#3b82f6',
                            marginBottom: 6,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>
                            Kết quả
                        </div>
                        {output}
                    </div>
                )}
            </div>
        </div>
    );
}
