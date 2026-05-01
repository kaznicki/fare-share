# Fare Share

Split the restaurant bill by what everyone actually ordered.

One person photographs the receipt. The app extracts the line items via GPT-4o Vision. Everyone at the table claims what they had — and gets an exact total with their proportional share of tax and tip. No more splitting evenly, no more mental math on a full stomach.

---

## How It Works

1. **Host photographs the receipt** — tap the camera button, take a photo
2. **Review the extracted items** — correct any OCR errors before creating the session
3. **Share the session** — a QR code and link are generated; everyone scans in
4. **Everyone claims their items** — tap to claim, including shared dishes and duplicates
5. **Host finalizes** — each person sees exactly what they owe, with tax and tip included

---

## OCR Accuracy

Fare Share uses GPT-4o Vision to read receipts. It works well on most printed restaurant receipts, but it isn't perfect.

**Common edge cases:**
- Quantity-prefixed lines (e.g. *2 Taco Tuesday $2.00*) may be extracted as a single item at the full price rather than two items at the unit price
- Handwritten or faded receipts may produce errors
- Item names are often abbreviated or approximated from the printed text

The review screen lets the host correct items, prices, and quantities before creating the session. **Always verify the extracted items match your receipt before sharing.**

---

## Tech Stack

- **Next.js 15** — frontend and API routes
- **Custom WebSocket server** (`ws`) — real-time claiming sync across all devices
- **GPT-4o Vision** — receipt OCR
- **Tailwind CSS v4** — styling
- **Zustand** — client state

---

## Local Setup

```bash
npm install
```

Create `.env.local`:

```env
OPENAI_API_KEY=sk-...
USE_OCR_MOCK=false
```

Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To run with mock OCR (no API key needed):

```env
USE_OCR_MOCK=true
```

---

## Deployment

Fare Share requires a persistent server for WebSocket support — **Vercel is not supported**.

### Railway (recommended)

1. Install the Railway CLI: `npm install -g @railway/cli`
2. Log in: `railway login`
3. Create a project: `railway init`
4. Set environment variables:
   ```bash
   railway variables set OPENAI_API_KEY=sk-...
   railway variables set USE_OCR_MOCK=false
   ```
5. Deploy: `railway up`

Railway will detect the Node.js project, run `npm run build`, then `npm start`.

### Other platforms

Any platform that supports persistent Node.js processes works: [Fly.io](https://fly.io), [Render](https://render.com).

---

## Notes

- Sessions are ephemeral — no database, no login, no session history
- The app handles shared items (multiple people claiming the same dish) and splits the cost evenly among claimants
- Tax and tip are distributed proportionally based on each person's subtotal, using the Largest Remainder Method to guarantee exact cent accuracy
