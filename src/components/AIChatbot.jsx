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
        console.log('🔌 Backend status:', isHealthy ? 'Online' : 'Offline');
      }).catch(() => {
        setBackendStatus('offline');
        console.log('🔌 Backend status: Offline (check failed)');
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
        name: 'Vị trí hiện tại'
      } : null;

      console.log('📤 Sending to AI:', { userMessage, location, backendStatus });

      // Call AI API (with fallback built-in)
      const response = await chatWithAI(
        userMessage,
        newMessages.slice(-4), // Last 4 messages for context
        location
      );

      console.log('📥 AI Response:', response);

      // Check if this was a fallback response
      const isFallback = !response.suggestions || response.suggestions.length === 0;
      if (isFallback && backendStatus !== 'offline') {
        setBackendStatus('offline');
        console.log('⚠️ Switched to offline mode (fallback response detected)');
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
          content: '⚠️ Xin lỗi, có lỗi xảy ra. Hãy thử lại hoặc dùng tính năng tìm kiếm!' 
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

  const startConversation = (exampleQuery) => {
    setInput(exampleQuery);
    setTimeout(() => handleSend(), 100);
  };

  if (!open) {
    // Floating button
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 20,
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
        bottom: 20,
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
            {backendStatus === 'healthy' && (
              <span style={{ 
                fontSize: 10, 
                background: 'rgba(34, 197, 94, 0.8)', 
                padding: '2px 6px', 
                borderRadius: 4 
              }}>
                Online
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            {backendStatus === 'offline' 
              ? 'Chế độ cơ bản (không cần server)' 
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
            fontSize: 16,
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
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>👋</div>
            <div style={{ 
              color: dark ? '#e5e7eb' : '#111',
              marginBottom: 12 
            }}>
              {backendStatus === 'offline' 
                ? 'Xin chào! Tôi có thể giúp bạn tìm địa điểm (chế độ cơ bản)' 
                : 'Xin chào! Tôi có thể giúp bạn tìm địa điểm ở Việt Nam'}
            </div>
            
            {/* Example questions */}
            <div style={{ 
              fontSize: 13, 
              opacity: 0.8,
              marginTop: 12,
              color: dark ? '#9ca3af' : '#6b7280',
            }}>
              Thử hỏi:
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 6,
              marginTop: 8 
            }}>
              {[
                'Tìm quán cà phê gần đây',
                'Nhà hàng nào ngon?',
                'Địa điểm tham quan ở đâu?'
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => startConversation(q)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${dark ? '#404040' : '#e5e7eb'}`,
                    background: dark ? '#2a2a2a' : '#f9fafb',
                    color: dark ? '#e5e7eb' : '#111',
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = dark ? '#333' : '#f3f4f6';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = dark ? '#2a2a2a' : '#f9fafb';
                    e.currentTarget.style.borderColor = dark ? '#404040' : '#e5e7eb';
                  }}
                >
                  {q}
                </button>
              ))}
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
                  ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                  : (dark ? '#2a2a2a' : '#f3f4f6'),
                color: msg.role === 'user' ? '#fff' : (dark ? '#e5e7eb' : '#111'),
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
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
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ 
                animation: 'blink 1.4s infinite both',
                fontSize: 12 
              }}>●</span>
              <span style={{ 
                animation: 'blink 1.4s infinite both 0.2s',
                fontSize: 12 
              }}>●</span>
              <span style={{ 
                animation: 'blink 1.4s infinite both 0.4s',
                fontSize: 12 
              }}>●</span>
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
            ? 'Hỏi tôi (chế độ cơ bản)...' 
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
            fontSize: 14,
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
            fontSize: 16,
            transition: 'all 0.2s',
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