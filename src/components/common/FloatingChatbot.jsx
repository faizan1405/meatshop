'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Bot, ChevronDown, Loader } from 'lucide-react';

// Local FAQ fallback — used when the AI API is unavailable or slow
const FAQ_RESPONSES = [
  {
    patterns: ['delivery time', 'how long', 'how fast', 'when will', 'deliver', 'time'],
    answer: 'We deliver within 2 hours of order confirmation across Sangam Vihar and neighbouring sectors.',
  },
  {
    patterns: ['free delivery', 'delivery charge', 'shipping charge', 'delivery fee', '770', '40', 'minimum order'],
    answer: 'Free delivery on orders above ₹770. Otherwise a ₹40 delivery charge applies.',
  },
  {
    patterns: ['coupon', 'discount', 'promo', 'code', 'offer', 'porville10', 'fresh10', 'chicken10', 'meat10'],
    answer: 'We have 4 active 10% discount coupons:\n• PORVILLE10\n• FRESH10\n• CHICKEN10\n• MEAT10\n\nAll require a minimum order of ₹770. Apply at checkout.',
  },
  {
    patterns: ['track', 'order status', 'where is my order', 'tracking'],
    answer: 'You can track your order by visiting "My Orders" in your account, or use the /orders page with your order ID.',
  },
  {
    patterns: ['product', 'stock', 'available', 'chicken', 'mutton', 'eggs', 'duck', 'quail', 'live stock', 'ready to eat'],
    answer: 'We carry fresh Chicken, Mutton, Quail, Duck, Farm Fresh Eggs, Ready-to-Eat items, and Live Stock. Browse all at /shop.',
  },
  {
    patterns: ['location', 'address', 'where', 'store', 'outlet', 'sangam vihar'],
    answer: 'Our outlet: D-1b/1028, Sangam Vihar, New Delhi – 110080. We deliver within Sangam Vihar and nearby areas.',
  },
  {
    patterns: ['contact', 'phone', 'call', 'whatsapp', 'number', 'reach'],
    answer: '📞 Call: 9217577006\n💬 WhatsApp: wa.me/919217577006\n📧 Email: porville1986@gmail.com',
  },
  {
    patterns: ['payment', 'pay', 'upi', 'card', 'razorpay', 'cash on delivery', 'cod'],
    answer: 'We accept all major payment methods via Razorpay — UPI, debit/credit cards, net banking, and wallets. No cash on delivery.',
  },
  {
    patterns: ['return', 'refund', 'cancel', 'cancellation'],
    answer: 'Perishable products cannot be returned. For quality issues or wrong orders, contact us within 1 hour of delivery at 9217577006.',
  },
  {
    patterns: ['fssai', 'license', 'food safety', 'certified', 'registration'],
    answer: 'Porville is FSSAI registered. FoSCoS Ref: 30260223123490898 — registered with the Govt. of Delhi, Dept. of Food Safety.',
  },
];

function localFallback(userMessage) {
  const lower = userMessage.toLowerCase();
  for (const faq of FAQ_RESPONSES) {
    if (faq.patterns.some((p) => lower.includes(p))) return faq.answer;
  }
  return "I'm not sure about that. For specific queries, please call 9217577006 or WhatsApp at wa.me/919217577006. Our team is happy to help!";
}

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end', marginBottom: '10px' }}>
      {isBot && (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-gold, #c9a84c)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0, marginTop: '2px' }}>
          <Bot size={14} color="#000" />
        </div>
      )}
      <div style={{
        maxWidth: '78%',
        padding: '9px 12px',
        borderRadius: isBot ? '0 12px 12px 12px' : '12px 0 12px 12px',
        background: isBot ? '#f5f5f5' : 'var(--primary-gold, #c9a84c)',
        color: isBot ? '#333' : '#000',
        fontSize: '0.82rem',
        lineHeight: '1.55',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

const INITIAL_MESSAGE = { role: 'assistant', content: 'Hello! Welcome to Porville 🥩 I\'m your AI assistant. Ask me anything about our products, delivery, coupons, or orders!' };

const QUICK_QUESTIONS = ['Delivery time?', 'Free delivery?', 'Coupon codes', 'Contact us'];

export default function FloatingChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  if (pathname?.startsWith('/admin')) return null;

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isTyping) return;

    const userMsg = { role: 'user', content: userText };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.filter((m) => m.role !== 'assistant' || m !== INITIAL_MESSAGE),
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        // Fallback to local FAQ
        setMessages((prev) => [...prev, { role: 'assistant', content: localFallback(userText) }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: localFallback(userText) }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '320px',
          maxHeight: '500px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9998,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.08)',
        }}>

          {/* Header */}
          <div style={{ background: 'var(--bg-dark, #0c0b0a)', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-gold, #c9a84c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="#000" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Porville AI Assistant</div>
              <div style={{ fontSize: '0.68rem', color: '#aaa' }}>Powered by AI · Usually replies instantly</div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}>
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-gold, #c9a84c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={14} color="#000" />
                </div>
                <div style={{ background: '#f5f5f5', padding: '9px 14px', borderRadius: '0 12px 12px 12px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <Loader size={12} style={{ animation: 'spin 1s linear infinite', color: '#888' }} />
                  <span style={{ fontSize: '0.78rem', color: '#888' }}>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          <div style={{ padding: '0 12px 8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isTyping}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  border: '1px solid var(--primary-gold, #c9a84c)',
                  borderRadius: '20px',
                  background: 'transparent',
                  color: 'var(--primary-gold, #c9a84c)',
                  cursor: isTyping ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  opacity: isTyping ? 0.5 : 1,
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid #eee', padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={isTyping}
              style={{
                flex: 1,
                border: '1px solid #e0e0e0',
                borderRadius: '20px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                outline: 'none',
                opacity: isTyping ? 0.7 : 1,
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isTyping || !input.trim()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--primary-gold, #c9a84c)',
                border: 'none',
                cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                opacity: isTyping || !input.trim() ? 0.5 : 1,
              }}
            >
              <Send size={15} color="#000" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        title="Chat with Porville AI"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '20px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--bg-dark, #0c0b0a)',
          border: '2px solid var(--primary-gold, #c9a84c)',
          color: 'var(--primary-gold, #c9a84c)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        aria-label="Open Porville AI assistant"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
