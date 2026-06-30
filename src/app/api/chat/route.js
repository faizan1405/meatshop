import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are the official customer support assistant for Porville, a premium fresh meat shop in New Delhi, India. Answer ONLY questions related to Porville's products, delivery, orders, payments, coupons, and business information.

BUSINESS DETAILS:
- Name: Porville | Tagline: "Fresh Cut. Pure Standards."
- Location: D-1b/1028, Sangam Vihar, New Delhi – 110080
- Phone: 9217577006 | WhatsApp: wa.me/919217577006 | Email: porville1986@gmail.com
- Delivery area: Sangam Vihar and neighbouring sectors in South Delhi
- Delivery time: Within 2 hours of order confirmation
- Delivery charge: ₹40 for orders below ₹770. FREE delivery on orders ₹770 and above.
- Payment: Online only via Razorpay (UPI, debit/credit cards, net banking, wallets). No cash on delivery.
- FSSAI: FoSCoS Reference No. 30260223123490898, registered with Govt. of Delhi, Dept. of Food Safety (23-02-2026). Application reference — final certificate pending.

PRODUCTS:
- Chicken: curry cut, boneless, drumsticks, wings, feet, mix curry cut, pickle
- Mutton: curry cut, boneless, keema
- Quail (Batair): pasture-raised
- Duck: dressed/whole
- Farm Fresh Eggs: desi eggs, premium eggs
- Ready to Eat: smoked salami, kebabs, burgers, biryani
- Live Stock: live birds (order by phone call)
- Special cuts: custom orders on request

ACTIVE COUPONS (10% off, minimum order ₹770):
- PORVILLE10
- FRESH10
- CHICKEN10
- MEAT10
Apply at checkout in the coupon field.

ORDER TRACKING: Login → "My Orders" or use the /orders page with your order ID.

REFUND/CANCELLATION: Perishable products cannot be returned. For quality issues or wrong orders, contact within 1 hour of delivery at 9217577006.

RULES YOU MUST FOLLOW:
1. Only answer questions about Porville. Politely decline anything unrelated.
2. Never invent prices, stock levels, or order status. Say "please check the website" or "call us" instead.
3. Never reveal or discuss any customer's personal or order data.
4. Keep answers short — 1 to 4 sentences max. No long lists unless necessary.
5. Use Indian English naturally. Be warm and helpful, not robotic.
6. If unsure, say "For accurate information, please call 9217577006 or WhatsApp us."
7. Never discuss competitors or make comparative claims.`;

// Models tried in order — first success wins
const MODELS = [
  'google/gemma-2-9b-it:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
];

async function callOpenRouter(apiKey, model, messages) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://meatshop-three.vercel.app',
      'X-Title': 'Porville Fresh Cuts Assistant',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 400,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('Empty content in response');
  return reply;
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('[chat] OPENROUTER_API_KEY is not set — restart the server after adding it to .env.local');
      return NextResponse.json(
        { success: false, message: 'AI not configured (missing API key)' },
        { status: 503 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
    }

    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, message: 'messages must be a non-empty array' }, { status: 400 });
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg || typeof lastUserMsg.content !== 'string' || !lastUserMsg.content.trim()) {
      return NextResponse.json({ success: false, message: 'No user message found' }, { status: 400 });
    }

    const recentMessages = messages.slice(-12).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).trim(),
    }));

    // Try each model in order — first success wins
    const errors = [];
    for (const model of MODELS) {
      try {
        const reply = await callOpenRouter(apiKey, model, recentMessages);
        console.log(`[chat] Success with model: ${model}`);
        return NextResponse.json({ success: true, reply });
      } catch (err) {
        console.warn(`[chat] Model ${model} failed:`, err.message);
        errors.push(`${model}: ${err.message}`);
      }
    }

    // All models failed
    console.error('[chat] All models failed:', errors);
    return NextResponse.json(
      { success: false, message: 'All AI models failed', errors },
      { status: 502 }
    );
  } catch (error) {
    console.error('[chat] Unhandled error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
