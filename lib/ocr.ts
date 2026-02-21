import OpenAI from 'openai'
import { z } from 'zod'
import type { Item } from '@/types'

// Export type for Route Handler
export interface OcrResult {
  items: Item[]
  taxCents: number
  tipCents: number
}

// Lazy client initialization — prevents "No API key" error if this module is
// imported before app.prepare() has loaded .env.local (Pitfall 2 in research).
let _client: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_client) _client = new OpenAI()  // reads OPENAI_API_KEY at first call
  return _client
}

// Zod schema for GPT-4o response validation.
// GPT-4o returns prices as dollars (e.g., 12.99) — we convert to cents in the handler.
const ReceiptItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),          // dollars — will be converted to cents
  qty: z.number().int().positive().default(1),
})

const ReceiptSchema = z.object({
  items: z.array(ReceiptItemSchema),
  subtotal: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  tip: z.number().nonnegative().optional(),
})

// Structured prompt: instructs GPT-4o to return only food line items as JSON.
// Excludes subtotal, tax, tip from items array — those go in top-level fields.
const OCR_PROMPT = `Extract all food and drink line items from this restaurant receipt as JSON.
Return ONLY valid JSON with this exact shape, no explanation or markdown:
{
  "items": [{ "name": string, "price": number, "qty": number }],
  "subtotal": number,
  "tax": number,
  "tip": number
}
Rules:
- items array: food and drink items only
- Exclude subtotal, tax, tip, service charge, and discount lines from items array
- price is in dollars (e.g., 12.99 for $12.99)
- qty defaults to 1 if not shown on receipt
- If a line cannot be identified as a food or drink item, omit it
- Return 0 for tax or tip if not present on receipt`

// Static fixture for dev mock mode — avoids GPT-4o API costs during UI development.
// Enable with USE_OCR_MOCK=true in .env.local
const OCR_MOCK_FIXTURE: OcrResult = {
  items: [
    { id: 'item-0', name: 'Burger', priceCents: 1299, qty: 1 },
    { id: 'item-1', name: 'Fries', priceCents: 499, qty: 2 },
    { id: 'item-2', name: 'Draft Beer', priceCents: 699, qty: 1 },
    { id: 'item-3', name: 'Soda', priceCents: 299, qty: 3 },
  ],
  taxCents: 209,
  tipCents: 400,
}

/**
 * Extract line items from a receipt image using GPT-4o Vision.
 * Returns items with integer priceCents (never floats).
 *
 * @param imageBuffer - Raw image bytes
 * @param mimeType - MIME type (e.g., "image/jpeg", "image/png")
 */
export async function extractReceiptItems(
  imageBuffer: Buffer,
  mimeType: string
): Promise<OcrResult> {
  // Dev mock mode — returns fixture data instantly, no API call
  if (process.env.USE_OCR_MOCK === 'true') {
    console.log('[OCR] Mock mode enabled — returning fixture data')
    return OCR_MOCK_FIXTURE
  }

  const base64 = imageBuffer.toString('base64')
  const dataUri = `data:${mimeType};base64,${base64}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0,  // deterministic extraction — lower variance in output
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: OCR_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: dataUri,
              detail: 'high',  // high detail for small receipt text
            },
          },
        ],
      },
    ],
  })

  const raw = response.choices[0].message.content
  if (!raw) {
    throw new Error('GPT-4o returned empty response')
  }

  // Validate response shape with Zod — GPT output is probabilistic
  const parsed = JSON.parse(raw)
  const receipt = ReceiptSchema.parse(parsed)

  // Convert all dollar values to integer cents using Math.round().
  // Per pitfall research: never use Math.floor() for dollar->cent conversion.
  // $12.99 * 100 = 1298.9999... -> Math.round gives 1299
  const items: Item[] = receipt.items.map((item, i) => ({
    id: `item-${i}`,
    name: item.name,
    priceCents: Math.round(item.price * 100),
    qty: item.qty,
  }))

  return {
    items,
    taxCents: Math.round((receipt.tax ?? 0) * 100),
    tipCents: Math.round((receipt.tip ?? 0) * 100),
  }
}
