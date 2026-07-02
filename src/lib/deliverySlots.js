// ===========================================================================
// SINGLE SOURCE OF TRUTH for delivery type + delivery slots.
//
// Two delivery modes:
//   RAW_SLOT              — raw items (chicken, mutton, quail, eggs, …). The
//                           customer picks a fixed date + time slot.
//   READY_TO_EAT_2_HOURS  — ready-to-eat only (biryani, kabab, …). Delivered
//                           "within 2 hours"; no slot selection needed.
//
// A cart with BOTH raw and ready-to-eat items is treated as RAW_SLOT (raw wins)
// so we never promise 2-hour delivery when raw items are present.
//
// All day/slot maths uses the India timezone (Asia/Kolkata) via Intl, so day
// names and "expired today" checks never drift with server UTC.
//
// This module is import-safe on both the server and the browser.
// ===========================================================================

export const DELIVERY_MODE = {
  RAW_SLOT: 'RAW_SLOT',
  READY_TO_EAT_2_HOURS: 'READY_TO_EAT_2_HOURS',
};

export const READY_TO_EAT_ESTIMATE = 'Within 2 hours';
export const READY_TO_EAT_HOURS = 2;

const IST_TZ = 'Asia/Kolkata';

// Fixed raw-item slots (24h HH:MM). Weekdays have two windows; weekends one.
const WEEKDAY_SLOTS = [
  { label: '9:00 AM – 12:00 PM', startTime: '09:00', endTime: '12:00' },
  { label: '5:00 PM – 8:00 PM', startTime: '17:00', endTime: '20:00' },
];
const WEEKEND_SLOTS = [
  { label: '9:00 AM – 9:00 PM', startTime: '09:00', endTime: '21:00' },
];

// Strong ready-to-eat name keywords. Only used as a LAST resort (when a product
// carries neither a productType nor a category). Kept deliberately narrow —
// terms like "fry"/"curry" are excluded because raw cuts use them ("curry cut").
const READY_KEYWORDS = [
  'ready to eat', 'ready-to-eat', 'biryani', 'kabab', 'kebab',
  'burger', 'sausage', 'pepperoni', 'nugget', 'roasted',
];

const lc = (v) => (typeof v === 'string' ? v.toLowerCase() : '');
const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

// ---------------------------------------------------------------------------
// D. Product classification
// ---------------------------------------------------------------------------

/**
 * Classify a single cart/order item as 'RAW' or 'READY_TO_EAT'.
 * Everything defaults to RAW unless it clearly belongs to Ready to Eat.
 *
 * Detection order (most reliable first):
 *   1. product.productType contains "ready"        (authoritative)
 *   2. category slug/name contains "ready"         (object or string)
 *   3. strong ready-to-eat keyword in the name     (fallback only)
 */
export function getItemDeliveryType(item) {
  if (!item) return 'RAW';
  const product = item.product || item;

  // 1) productType — e.g. 'ready to eat' vs 'fresh meat' / 'eggs' / 'live stock'.
  if (lc(product.productType).includes('ready')) return 'READY_TO_EAT';

  // 2) category — supports { name, slug } object or a plain string.
  const cat = product.category;
  let catName = '';
  let catSlug = '';
  if (cat && typeof cat === 'object') {
    catName = lc(cat.name);
    catSlug = lc(cat.slug);
  } else if (typeof cat === 'string') {
    catName = lc(cat);
    catSlug = lc(cat);
  }
  if (catSlug.includes('ready') || catName.includes('ready')) return 'READY_TO_EAT';

  // 3) Conservative keyword fallback on the product name.
  const name = lc(product.name || product.productName);
  if (name && READY_KEYWORDS.some((k) => name.includes(k))) return 'READY_TO_EAT';

  return 'RAW';
}

/**
 * Determine the delivery mode for a whole cart.
 * @returns {{ mode:string, isMixed:boolean, hasRaw:boolean, hasReady:boolean, note:string }}
 */
export function getCartDeliveryMode(items) {
  const list = Array.isArray(items) ? items : [];
  let hasRaw = false;
  let hasReady = false;
  for (const it of list) {
    if (getItemDeliveryType(it) === 'READY_TO_EAT') hasReady = true;
    else hasRaw = true;
  }

  const isMixed = hasRaw && hasReady;
  // Raw wins: raw-only OR mixed → RAW_SLOT. Ready-to-eat only → 2 hours.
  const mode = !hasRaw && hasReady ? DELIVERY_MODE.READY_TO_EAT_2_HOURS : DELIVERY_MODE.RAW_SLOT;

  let note = '';
  if (isMixed) note = 'Your order includes raw items, so delivery will follow the selected slot.';
  else if (mode === DELIVERY_MODE.READY_TO_EAT_2_HOURS) note = 'Ready-to-eat items will be delivered within 2 hours.';

  return { mode, isMixed, hasRaw, hasReady, note };
}

// ---------------------------------------------------------------------------
// Timezone helpers (Asia/Kolkata)
// ---------------------------------------------------------------------------

// Civil year/month/day/hour/minute in IST for a given instant.
function istNowParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  let hour = parseInt(parts.hour, 10);
  if (hour === 24) hour = 0; // some engines emit '24' at midnight
  return { year: +parts.year, month: +parts.month, day: +parts.day, hour, minute: +parts.minute };
}

const slotsForDow = (dow) => (dow === 0 || dow === 6 ? WEEKEND_SLOTS : WEEKDAY_SLOTS);

// ---------------------------------------------------------------------------
// A. Raw-item available slots
// ---------------------------------------------------------------------------

/**
 * Available raw-item delivery days + slots, starting from the IST "today".
 * Today's already-ended slots are hidden; a day with no remaining slots is
 * skipped, so the first entry is always the next genuinely available date.
 *
 * @param {{ fromDate?: Date, daysAhead?: number }} [opts]
 * @returns {Array<{ date:string, dayLabel:string, dow:number,
 *                    slots:Array<{ id:string, label:string, startTime:string, endTime:string }> }>}
 */
export function getAvailableRawDeliverySlots({ fromDate = new Date(), daysAhead = 7 } = {}) {
  const now = istNowParts(fromDate);
  const nowMinutes = now.hour * 60 + now.minute;
  const days = [];

  for (let offset = 0; offset < daysAhead; offset++) {
    // Build the civil date as a UTC midnight so weekday + formatting are stable.
    const dt = new Date(Date.UTC(now.year, now.month - 1, now.day + offset));
    const dow = dt.getUTCDay(); // 0=Sun … 6=Sat
    const date = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
    // Built in two parts so the label reads "Monday, 15 July" (with the comma).
    const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long' }).format(dt);
    const dayMonth = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long' }).format(dt);
    const dayLabel = `${weekday}, ${dayMonth}`; // e.g. "Monday, 15 July"

    let slots = slotsForDow(dow).map((s) => ({ ...s, id: `${s.startTime}-${s.endTime}` }));

    // Hide slots that have already ended for today (IST).
    if (offset === 0) {
      slots = slots.filter((s) => nowMinutes < toMinutes(s.endTime));
    }

    if (slots.length > 0) days.push({ date, dayLabel, dow, slots });
  }

  return days;
}

// ---------------------------------------------------------------------------
// B. Ready-to-eat estimate
// ---------------------------------------------------------------------------

/**
 * @returns {{ mode:string, estimate:string }}
 */
export function getReadyToEatEstimate({ orderTime = new Date() } = {}) {
  void orderTime; // reserved for a future exact ETA; the promise is a flat window.
  return { mode: DELIVERY_MODE.READY_TO_EAT_2_HOURS, estimate: READY_TO_EAT_ESTIMATE };
}

// ---------------------------------------------------------------------------
// E. Validate a delivery selection (shared by frontend + every order API)
// ---------------------------------------------------------------------------

/**
 * Validate the customer's delivery choice against the cart's delivery mode and
 * the live slot rules. Returns a normalized, server-trusted delivery payload.
 *
 * @param {{ items:Array, deliveryDate?:string, deliverySlot?:object,
 *           now?:Date, daysAhead?:number }} opts
 * @returns {{ valid:boolean, mode:string, error?:string,
 *             deliveryDate?:string, deliveryDateLabel?:string,
 *             deliverySlot?:{label:string,startTime:string,endTime:string},
 *             deliveryEstimate?:string, deliveryNote?:string }}
 */
export function validateDeliverySelection({ items, deliveryDate, deliverySlot, now = new Date(), daysAhead = 7 }) {
  const { mode, note, isMixed } = getCartDeliveryMode(items);

  // Ready-to-eat only → no date/slot required.
  if (mode === DELIVERY_MODE.READY_TO_EAT_2_HOURS) {
    return {
      valid: true,
      mode,
      deliveryEstimate: READY_TO_EAT_ESTIMATE,
      deliveryNote: note,
    };
  }

  // RAW_SLOT (raw-only or mixed) → date + slot mandatory.
  if (!deliveryDate || !deliverySlot || !deliverySlot.startTime || !deliverySlot.endTime) {
    return { valid: false, mode, error: 'Please select a delivery date and time slot.' };
  }

  const days = getAvailableRawDeliverySlots({ fromDate: now, daysAhead });
  const day = days.find((d) => d.date === deliveryDate);
  if (!day) {
    return { valid: false, mode, error: 'Selected delivery date is not available. Please choose another date.' };
  }

  const slot = day.slots.find(
    (s) => s.startTime === deliverySlot.startTime && s.endTime === deliverySlot.endTime
  );
  if (!slot) {
    return { valid: false, mode, error: 'Selected delivery slot is no longer available. Please choose another slot.' };
  }

  return {
    valid: true,
    mode,
    deliveryDate: day.date,
    deliveryDateLabel: day.dayLabel,
    deliverySlot: { label: slot.label, startTime: slot.startTime, endTime: slot.endTime },
    deliveryNote: isMixed ? note : '',
  };
}
