'use client';

import React from 'react';
import { CalendarDays, Clock, CheckCircle2 } from 'lucide-react';

/**
 * Mobile-friendly raw-item delivery slot picker.
 *
 * Renders a wrapping row of available dates (chips) and, for the selected date,
 * a responsive grid of time-slot cards. All data comes from
 * getAvailableRawDeliverySlots() — this component holds no slot logic itself.
 *
 * @param {object}   props
 * @param {Array}    props.days          Output of getAvailableRawDeliverySlots().
 * @param {string}   props.selectedDate  Currently selected date ('YYYY-MM-DD').
 * @param {object}   props.selectedSlot  Currently selected slot { startTime, endTime, ... }.
 * @param {Function} props.onSelectDate  (date:string) => void
 * @param {Function} props.onSelectSlot  (slot:object) => void
 */
export default function DeliverySlotSelector({ days = [], selectedDate, selectedSlot, onSelectDate, onSelectSlot }) {
  if (!days || days.length === 0) {
    return (
      <p style={{ fontSize: '0.85rem', color: 'var(--text-dark-muted)' }}>
        No delivery slots are available right now. Please try again shortly.
      </p>
    );
  }

  const activeDay = days.find((d) => d.date === selectedDate) || days[0];
  const selectedSlotId =
    selectedSlot ? `${selectedSlot.startTime}-${selectedSlot.endTime}` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Date picker — wrapping chips (no horizontal overflow). */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <CalendarDays size={15} style={{ color: 'var(--primary-gold)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Choose a delivery date</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {days.map((d) => {
            const isActive = d.date === activeDay.date;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => onSelectDate(d.date)}
                style={{
                  flex: '1 1 auto',
                  minWidth: '120px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1.5px solid ${isActive ? 'var(--primary-gold)' : 'var(--border-cream, #ece5d8)'}`,
                  background: isActive ? 'var(--primary-gold)' : 'var(--white, #fff)',
                  color: isActive ? '#1a1712' : 'var(--text-dark)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {d.dayLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot picker — responsive grid, collapses to 1 column on narrow screens. */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Clock size={15} style={{ color: 'var(--primary-gold)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Choose a time slot</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px',
          }}
        >
          {activeDay.slots.map((slot) => {
            const isActive = slot.id === selectedSlotId;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => onSelectSlot({ ...slot, date: activeDay.date })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 12px',
                  borderRadius: '8px',
                  border: `1.5px solid ${isActive ? 'var(--success, #2e7d32)' : 'var(--border-cream, #ece5d8)'}`,
                  background: isActive ? '#eef7ee' : 'var(--white, #fff)',
                  color: 'var(--text-dark)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '48px',
                }}
              >
                {isActive && <CheckCircle2 size={16} style={{ color: 'var(--success, #2e7d32)', flexShrink: 0 }} />}
                <span>{slot.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
