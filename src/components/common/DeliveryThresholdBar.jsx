'use client';

import React from 'react';
import { Truck, PartyPopper } from 'lucide-react';

/**
 * Reusable free-delivery progress indicator. Shared by the cart drawer, cart
 * page and checkout page so the message + bar behave identically everywhere.
 *
 * The threshold is compared against the items SUBTOTAL (before any coupon
 * discount) — the same value the shared delivery rule (computeDeliveryCharge)
 * uses to decide the fee, so the bar and the actual charge never disagree.
 *
 * Behaviour:
 *   - threshold missing / <= 0        → renders nothing (Case C).
 *   - subtotal < threshold            → "Add ₹X more to unlock free delivery".
 *   - subtotal >= threshold           → "You unlocked free delivery" + full bar.
 *
 * All values come from admin settings via props — nothing is hardcoded here.
 *
 * @param {number} subtotal              Items subtotal (pre-discount).
 * @param {number} freeDeliveryThreshold Admin-configured free delivery threshold.
 * @param {object} [style]               Optional wrapper style overrides.
 */
export default function DeliveryThresholdBar({ subtotal = 0, freeDeliveryThreshold = 0, style }) {
  const threshold = Number(freeDeliveryThreshold) || 0;
  const sub = Number(subtotal) || 0;

  // Case C: no usable threshold → hide safely.
  if (threshold <= 0) return null;

  const unlocked = sub >= threshold;
  const remaining = Math.max(Math.ceil(threshold - sub), 0);
  const progress = Math.min(Math.max((sub / threshold) * 100, 0), 100);

  const accent = unlocked ? 'var(--success)' : 'var(--primary-gold)';

  return (
    <div
      style={{
        background: 'var(--bg-cream, #faf7f0)',
        border: '1px solid var(--border-cream, #ece5d8)',
        borderRadius: '8px',
        padding: '10px 12px',
        margin: '8px 0',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dark)' }}>
        {unlocked ? (
          <PartyPopper size={15} style={{ color: accent, flexShrink: 0 }} />
        ) : (
          <Truck size={15} style={{ color: accent, flexShrink: 0 }} />
        )}
        <span>
          {unlocked
            ? 'You unlocked free delivery'
            : `Add ₹${remaining} more to unlock free delivery`}
        </span>
      </div>

      {/* Progress track */}
      <div
        style={{
          marginTop: '8px',
          height: '6px',
          width: '100%',
          background: 'var(--border-cream, #ece5d8)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress toward free delivery"
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: accent,
            borderRadius: '999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
