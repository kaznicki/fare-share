import { NextRequest, NextResponse } from 'next/server'
import { extractReceiptItems } from '@/lib/ocr'

// Allowed image MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

// Max image size: 10MB
// Note: For App Router Route Handlers, body size is controlled differently than
// Pages Router. If large uploads are rejected, the recommended fix is to compress
// client-side (canvas toBlob quality 0.7) before upload rather than raising the limit.
const MAX_SIZE_BYTES = 10 * 1024 * 1024  // 10MB

export async function POST(req: NextRequest) {
  try {
    // Parse multipart form data
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request — expected multipart/form-data' },
        { status: 400 }
      )
    }

    const imageFile = formData.get('image')

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: 'No image provided. Include an "image" field in the form data.' },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return NextResponse.json(
        {
          error: `Unsupported image type: ${imageFile.type}. Use JPEG, PNG, or WebP.`,
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (imageFile.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Image too large (${(imageFile.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`,
        },
        { status: 400 }
      )
    }

    // Convert File to Buffer for OpenAI SDK
    const buffer = Buffer.from(await imageFile.arrayBuffer())

    // Call GPT-4o Vision (or mock if USE_OCR_MOCK=true)
    const result = await extractReceiptItems(buffer, imageFile.type)

    return NextResponse.json(result)
  } catch (err) {
    // Log full error server-side for debugging
    console.error('POST /api/ocr error:', err)

    // Return user-friendly error — matches OCR-04 requirement:
    // "If OCR fails, user sees an error and can proceed to add items manually"
    return NextResponse.json(
      { error: 'OCR failed. Please add items manually.' },
      { status: 500 }
    )
  }
}
