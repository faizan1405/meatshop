'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, MessageCircleQuestion, Search } from 'lucide-react';
import { faqs } from '@/data/faqs';
import { matchFaq } from '@/lib/faqMatcher';
import { getWhatsAppLink } from '@/lib/whatsapp';
import styles from './faq.module.css';

export default function FaqInteractive() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState('9217577006'); // Fallback default

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings?.whatsappNumber) {
          setWhatsappNumber(data.settings.whatsappNumber);
        } else if (data.success && data.settings?.contactNumber) {
          setWhatsappNumber(data.settings.contactNumber);
        }
      })
      .catch(err => console.error("Failed to load settings", err));
  }, []);

  const categories = ['All', ...new Set(faqs.map(f => f.category))];

  const filteredFaqs = activeCategory === 'All' 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const match = matchFaq(searchQuery);
    setSearchResult(match);
    setHasSearched(true);
  };

  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <>
      {/* Local AI Helper Box */}
      <div className={styles.aiHelperBox}>
        <div className={styles.aiHelperHeader}>
          <MessageCircleQuestion size={24} />
          <span>Ask Porville Help (Local Search)</span>
        </div>
        
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input 
            type="text" 
            placeholder="e.g. How long does delivery take?"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHasSearched(false);
            }}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.askButton}>
            Ask
          </button>
        </form>

        {hasSearched && searchResult && (
          <div className={styles.resultBox}>
            <div className={styles.resultTitle}>Match found: {searchResult.question}</div>
            <div className={styles.resultAnswer}>{searchResult.answer}</div>
          </div>
        )}

        {hasSearched && !searchResult && (
          <div className={styles.fallbackBox}>
            <div className={styles.fallbackText}>
              I couldn’t find an exact answer for that. You can contact Porville support on WhatsApp for help with your question or complaint.
            </div>
            <a 
              href={getWhatsAppLink(whatsappNumber, `Hi Porville, I need help with this question/complaint: ${searchQuery}`)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappButton}
              aria-label="Ask this question on WhatsApp"
            >
              Ask on WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Category Filters */}
      <div className={styles.categoryFilters}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`${styles.categoryPill} ${activeCategory === cat ? styles.categoryPillActive : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className={styles.accordionList}>
        {filteredFaqs.map(faq => (
          <div key={faq.id} className={styles.accordionItem}>
            <button 
              className={styles.accordionHeader}
              onClick={() => toggleAccordion(faq.id)}
              aria-expanded={openAccordion === faq.id}
            >
              <span>{faq.question}</span>
              <ChevronDown 
                size={20} 
                className={`${styles.icon} ${openAccordion === faq.id ? styles.iconOpen : ''}`} 
              />
            </button>
            
            {openAccordion === faq.id && (
              <div className={styles.accordionContent}>
                {faq.answer}
              </div>
            )}
          </div>
        ))}
        
        {filteredFaqs.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No FAQs found in this category.
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className={styles.supportCta}>
        <h3 className={styles.supportTitle}>Still need help?</h3>
        <p className={styles.supportText}>
          Send your question or complaint to us on WhatsApp and our team will help you.
        </p>
        <a 
          href={getWhatsAppLink(whatsappNumber, "Hi Porville, I need help with a question or complaint.")}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappButton}
        >
          Contact on WhatsApp
        </a>
      </div>
    </>
  );
}
