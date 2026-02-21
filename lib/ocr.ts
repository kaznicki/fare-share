// OCR library — implemented in Plan 01-03
// Stub exported here so server.ts and Route Handlers can import without TS errors.

export interface OcrResult {
  items: Array<{ id: string; name: string; priceCents: number; qty: number }>
  taxCents: number
  tipCents: number
}

// Implemented in Plan 01-03
export async function extractReceiptItems(
  _imageBuffer: Buffer,
  _mimeType: string
): Promise<OcrResult> {
  throw new Error('OCR not yet implemented — Plan 01-03')
}
