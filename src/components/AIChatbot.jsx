import { useState, useRef, useEffect } from 'react';
import { chatWithAI, checkBackendHealth } from '../api/backend';

export default function AIChatbot({ dark = false, origin = null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('unknown'); // 'healthy' | 'offline' | 'unknown'
  const messagesEndRef = useRef(null);

  // Check backend health when opening
  useEffect(() => {
    if (open && backendStatus === 'unknown') {
      checkBackendHealth().then(isHealthy => {
        setBackendStatus(isHealthy ? 'healthy' : 'offline');
      });
    }
  }, [open]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage }
    ];
    setMessages(newMessages);

    setLoading(true);

    try {
      // Prepare location context
      const location = origin ? {
        lat: origin[0],
        lon: origin[1],
        name: 'Current location'
      } : null;

      // Call AI API (with fallback built-in)
      const response = await chatWithAI(
        userMessage,
        newMessages.slice(-4),
        location
      );

      // Check if this was a fallback response
      const isFallback = !response.suggestions || response.suggestions.length === 0;
      if (isFallback && backendStatus !== 'offline') {
        setBackendStatus('offline');
      }

      // Add AI response
      setMessages([
        ...newMessages,
        { role: 'assistant', content: response.reply }
      ]);

    } catch (error) {
      console.error('❌ Chat error:', error);
      setBackendStatus('offline');
      
      setMessages([
        ...newMessages,
        { 
          role: 'assistant', 
          content: '⚠️ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại hoặc dùng tính năng tìm kiếm thay!' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) {
    // Floating button
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 100,
          right: 20,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          color: '#fff',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="Trợ lý AI"
      >
        🤖
      </button>
    );
  }

  // Chat window
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 100,
        right: 20,
        zIndex: 9999,
        width: 360,
        height: 500,
        borderRadius: 12,
        overflow: 'hidden',
        background: dark ? '#1e1e1e' : '#fff',
        border: `1px solid ${dark ? '#2a2a2a' : '#e5e7eb'}`,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 12,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            🤖 Trợ lý AI
            {backendStatus === 'offline' && (
              <span style={{ 
                fontSize: 10, 
                background: 'rgba(239, 68, 68, 0.8)', 
                padding: '2px 6px', 
                borderRadius: 4 
              }}>
                Offline
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            {backendStatus === 'offline' 
              ? 'Chế độ fallback (không cần server)' 
              : 'Tư vấn du lịch Việt Nam'}
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, opacity: 0.6 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>👋</div>
            <div>
              {backendStatus === 'offline' 
                ? 'Xin chào! AI đang offline nhưng tôi vẫn có thể giúp bạn tìm địa điểm!' 
                : 'Xin chào! Tôi có thể giúp bạn tìm địa điểm ở Việt Nam.'}
            </div>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
              Hãy thử hỏi: "Tìm quán cà phê gần đây"
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: msg.role === 'user'
                  ? (dark ? '#3b82f6' : '#3b82f6')
                  : (dark ? '#2a2a2a' : '#f3f4f6'),
                color: msg.role === 'user' ? '#fff' : (dark ? '#e5e7eb' : '#111'),
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '8px 12px',
              borderRadius: 8,
              background: dark ? '#2a2a2a' : '#f3f4f6',
              color: dark ? '#e5e7eb' : '#111',
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              <span className="dot" style={{ animation: 'blink 1.4s infinite both' }}>●</span>
              <span className="dot" style={{ animation: 'blink 1.4s infinite both 0.2s' }}>●</span>
              <span className="dot" style={{ animation: 'blink 1.4s infinite both 0.4s' }}>●</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: 12,
          borderTop: `1px solid ${dark ? '#2a2a2a' : '#e5e7eb'}`,
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={backendStatus === 'offline' 
            ? 'Hỏi tôi (chế độ offline)...' 
            : 'Hỏi tôi về địa điểm...'}
          disabled={loading}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: `1px solid ${dark ? '#404040' : '#d1d5db'}`,
            background: dark ? '#0f172a' : '#fff',
            color: dark ? '#e5e7eb' : '#111',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: loading || !input.trim()
              ? (dark ? '#404040' : '#d1d5db')
              : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: '#fff',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {loading ? '⏳' : '📤'}
        </button>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}