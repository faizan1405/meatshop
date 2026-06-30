import { NextResponse } from 'next/server';

// System prompt gives the AI full context about the Porville business
const SYSTEM_PROMPT = `You are a helpful customer assistant for Porville, a premium fresh meat shop in New Delhi, India.

Business details:
- Name: Porville
- Tagline: "Fresh Cut. Pure Standards."
- Location: D-1b/1028, Sangam Vihar, New Delhi – 110080
- Phone: 9217577006
- WhatsApp: wa.me/919217577006
- Email: porville1986@gmail.com
- Delivery area: Sangam Vihar and neighbouring sectors in South Delhi
- Delivery time: Within 2 hours of order confirmation
- Delivery charge: ₹40 for orders below ₹770. FREE delivery for orders ₹770 and above.
- Payment: Online only via Razorpay (UPI, cards, net banking, wallets). No COD.
- FSSAI: FoSCoS Reference No. 30260223123490898, registered with Govt. of Delhi Dept. of Food Safety (23-02-2026). This is an application reference — final certificate pending.

Products available:
- Chicken (curry cut, boneless, drumsticks, wings, feets, mix curry cut, pickle, etc.)
- Mutton (curry cut, boneless, keema, etc.)
- Quail (Batair) — pasture-raised
- Duck — dressed/whole
- Farm Fresh Eggs (Desi eggs, premium eggs)
- Ready to Eat (smoked salami, kebabs, burgers, biryani, etc.)
- Live Stock (live birds — order by call)
- Special cuts (custom orders)

Active discount coupons (10% off, minimum order ₹770):
- PORVILLE10
- FRESH10
- CHICKEN10
- MEAT10
(Apply at checkout in the coupon field)

Order tracking: Login → "My Orders" or use the /orders page with your order ID.

Refund/cancellation: Perishable products cannot be returned. For quality issues or wrong orders, contact within 1 hour of delivery at 9217577006.

Tone guidelines:
- Be warm, helpful, and concise
- Use Indian English naturally
- Keep answers short unless a detailed explanation is needed
- If you don't know something specific, ask the customer to call 9217577006 or WhatsApp us
- Don't make up prices or product details not listed above`;

export async function POST(request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'AI not configured' }, { status: 503 });
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, message: 'Invalid messages format' }, { status: 400 });
    }

    // Only pass last 10 messages to keep context manageable
    const recentMessages = messages.slice(-10);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://meatshop-three.vercel.app',
        'X-Title': 'Porville Fresh Cuts Assistant',
      },
      body: JSON.stringify({
        model: 'google/gemma-2-9b-it:free',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...recentMessages,
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('OpenRouter error:', response.status, errBody);
      return NextResponse.json({ success: false, message: 'AI service error' }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json({ success: false, message: 'Empty AI response' }, { status: 502 });
    }

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
