'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Bot, ChevronDown, ExternalLink } from 'lucide-react';
import { useCart } from './Providers';
import { matchFaq } from '@/lib/faqMatcher';
import { getWhatsAppLink } from '@/lib/whatsapp';

// Shown when the local matcher can't confidently answer the question.
const FALLBACK_TEXT =
  "I couldn’t find an exact answer for that. You can reach Porville support on WhatsApp for help with your question or complaint.";

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end', marginBottom: '10px' }}>
      {isBot && (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--primary-gold, #c9a84c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '8px',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          <Bot size={14} color="#000" />
        </div>
      )}
      <div
        style={{
          maxWidth: '78%',
          padding: '9px 12px',
          borderRadius: isBot ? '0 12px 12px 12px' : '12px 0 12px 12px',
          background: isBot ? '#f5f5f5' : 'var(--primary-gold, #c9a84c)',
          color: isBot ? '#333' : '#000',
          fontSize: '0.82rem',
          lineHeight: '1.55',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {msg.content}
        {msg.wa && (
          <a
            href={msg.wa}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '8px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: '#25d366',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.78rem',
              textDecoration: 'none',
            }}
          >
            Ask on WhatsApp <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    "Hello! Welcome to Porville 🥩 Ask me about products, delivery, payments, coupons, freshness, or orders — I'll answer from our FAQ.",
};

const QUICK_QUESTIONS = ['Delivery charges?', 'How fresh is the meat?', 'Coupon codes', 'Payment methods'];

const DEFAULT_WHATSAPP = '9217577006';

export default function FloatingChatbot() {
  const pathname = usePathname();
  const { isCartOpen } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP);
  const bottomRef = useRef(null);

  // Pull the public WhatsApp/contact number from public-safe settings so the
  // fallback link isn't a hardcoded duplicate. Falls back to the default.
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.whatsappNumber) {
          setWhatsappNumber(data.settings.whatsappNumber);
        } else if (data.success && data.settings?.contactNumber) {
          setWhatsappNumber(data.settings.contactNumber);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (pathname?.startsWith('/admin')) return null;

  const sendMessage = (text) => {
    const userText = (text || input).trim();
    if (!userText) return;

    const userMsg = { role: 'user', content: userText };

    // Fully local lookup — no network, no external AI.
    const match = matchFaq(userText);
    const botMsg = match
      ? { role: 'assistant', content: match.answer }
      : {
          role: 'assistant',
          content: FALLBACK_TEXT,
          wa: getWhatsAppLink(
            whatsappNumber,
            `Hi Porville, I need help with this question/complaint: ${userText}`
          ),
        };

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
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .porville-chat-window {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: min(340px, calc(100vw - 24px));
          max-height: min(500px, calc(100dvh - 120px));
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          display: flex;
          flex-direction: column;
          z-index: 9998;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.08);
          animation: chatSlideUp 0.22s ease;
        }
        @media (max-width: 400px) {
          .porville-chat-window {
            right: 8px;
            bottom: 80px;
          }
        }
      `}</style>

      {/* Chat Window — hidden while the cart drawer is open so it never
          overlaps the drawer's checkout button. */}
      {isOpen && !isCartOpen && (
        <div className="porville-chat-window">
          {/* Header */}
          <div
            style={{
              background: 'var(--bg-dark, #0c0b0a)',
              color: '#fff',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary-gold, #c9a84c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} color="#000" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Porville Help</div>
              <div style={{ fontSize: '0.68rem', color: '#aaa' }}>Instant answers from our FAQ</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Minimise chat"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '4px' }}
            >
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
          <div style={{ padding: '0 12px 8px', display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
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
          <div
            style={{
              borderTop: '1px solid #eee',
              padding: '10px 12px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              aria-label="Type your message"
              style={{
                flex: 1,
                border: '1px solid #e0e0e0',
                borderRadius: '20px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                outline: 'none',
                minWidth: 0,
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              aria-label="Send message"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--primary-gold, #c9a84c)',
                border: 'none',
                cursor: !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                opacity: !input.trim() ? 0.5 : 1,
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
        title="Porville Help"
        aria-label="Open Porville help"
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
          display: isCartOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
