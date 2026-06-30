'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Bot, ChevronDown } from 'lucide-react';

// FAQ knowledge base — extend or connect to an AI API here later
const FAQ_RESPONSES = [
  {
    patterns: ['delivery time', 'how long', 'how fast', 'when will', 'deliver', 'time'],
    answer: 'We deliver within 2 hours of order confirmation across Sangam Vihar and neighbouring sectors. Orders placed before 8 PM are delivered the same day.',
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
    answer: 'You can track your order by visiting the "My Orders" section in your account, or use the order tracking page at /orders with your order ID.',
  },
  {
    patterns: ['product', 'stock', 'available', 'chicken', 'mutton', 'eggs', 'duck', 'quail', 'live stock', 'ready to eat'],
    answer: 'We carry fresh Chicken, Mutton, Quail, Duck, Farm Fresh Eggs, Ready-to-Eat items, and Live Stock. Browse all products at /shop or explore by category.',
  },
  {
    patterns: ['location', 'address', 'where', 'store', 'outlet', 'sangam vihar'],
    answer: 'Our outlet is located at: D-1b/1028, Sangam Vihar, New Delhi – 110080. We currently deliver within Sangam Vihar and nearby areas.',
  },
  {
    patterns: ['contact', 'phone', 'call', 'whatsapp', 'number', 'reach'],
    answer: 'You can reach us at:\n📞 Call: 9217577006\n💬 WhatsApp: wa.me/919217577006\n📧 Email: porville1986@gmail.com',
  },
  {
    patterns: ['payment', 'pay', 'upi', 'card', 'razorpay', 'cash on delivery', 'cod'],
    answer: 'We accept all major payment methods via Razorpay — UPI, debit/credit cards, net banking, and wallets. Cash on delivery is not available currently.',
  },
  {
    patterns: ['return', 'refund', 'cancel', 'cancellation'],
    answer: 'Perishable meat products cannot be returned due to food safety regulations. For quality issues or incorrect orders, please contact us within 1 hour of delivery on 9217577006.',
  },
  {
    patterns: ['fssai', 'license', 'food safety', 'certified', 'registration'],
    answer: 'Yes, Porville is FSSAI registered. FoSCoS Reference No: 30260223123490898, registered with the Government of Delhi, Department of Food Safety.',
  },
  {
    patterns: ['hello', 'hi', 'hey', 'start', 'help'],
    answer: 'Hello! Welcome to Porville Fresh Cuts 🥩\n\nI can help with:\n• Delivery time & charges\n• Coupon codes\n• Order tracking\n• Products & availability\n• Contact & location\n• Payment methods\n\nWhat would you like to know?',
  },
];

const DEFAULT_RESPONSE =
  "I'm not sure about that. For specific queries, please call us at 9217577006 or WhatsApp at wa.me/919217577006. Our team is happy to help!";

function getBotResponse(userMessage) {
  const lower = userMessage.toLowerCase();
  for (const faq of FAQ_RESPONSES) {
    if (faq.patterns.some((p) => lower.includes(p))) {
      return faq.answer;
    }
  }
  return DEFAULT_RESPONSE;
}

function Message({ msg }) {
  const isBot = msg.role === 'bot';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isBot ? 'flex-start' : 'flex-end',
        marginBottom: '10px',
      }}
    >
      {isBot && (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0, marginTop: '2px' }}>
          <Bot size={14} color="#000" />
        </div>
      )}
      <div
        style={{
          maxWidth: '78%',
          padding: '9px 12px',
          borderRadius: isBot ? '0 12px 12px 12px' : '12px 0 12px 12px',
          background: isBot ? '#f5f5f5' : 'var(--primary-gold)',
          color: isBot ? '#333' : '#000',
          fontSize: '0.82rem',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {msg.text}
      </div>
    </div>
  );
}

const QUICK_QUESTIONS = [
  'Delivery time?',
  'Free delivery?',
  'Coupon codes',
  'Contact us',
];

export default function FloatingChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render on admin routes
  if (pathname?.startsWith('/admin')) return null;
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! Welcome to Porville 🥩 Ask me about delivery, coupons, products, or anything else!' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = (text) => {
    const userText = text || input.trim();
    if (!userText) return;

    const userMsg = { role: 'user', text: userText };
    const botMsg = { role: 'bot', text: getBotResponse(userText) };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
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
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '320px',
            maxHeight: '480px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9998,
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'var(--bg-dark, #0c0b0a)',
              color: '#fff',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-gold, #c9a84c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="#000" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Porville Assistant</div>
              <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Usually replies instantly</div>
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
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          <div style={{ padding: '0 12px 8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  border: '1px solid var(--primary-gold, #c9a84c)',
                  borderRadius: '20px',
                  background: 'transparent',
                  color: 'var(--primary-gold, #c9a84c)',
                  cursor: 'pointer',
                  fontWeight: 600,
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
              placeholder="Type a message..."
              style={{
                flex: 1,
                border: '1px solid #e0e0e0',
                borderRadius: '20px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            <button
              onClick={() => sendMessage()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--primary-gold, #c9a84c)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
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
        title="Chat with us"
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
        aria-label="Open chat assistant"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
