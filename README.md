# Palm Port — Unified Operations (Demo)

Static prototype (たたき台) for Palm Port Pty Ltd. Pure HTML/CSS/JS — **no build step, no backend**. Mock data only.

## What it shows
- 🗓 **Drag-and-drop roster** — staff × day grid; drag jobs from the *未割当 (unassigned)* pool onto any staff/day cell (works on touch + mouse via SortableJS).
- ⚡ **"Enter once → auto-reflect"** — moving a job pulses the 予約→ロスター→日報→請求/XERO→給与 flow.
- 🔄 **Tourism (PDC) ⇄ Cleaning (JQC) toggle** — two businesses, one platform. Cleaning jobs show 🔁 Recurring / WhatsApp; tourism shows Per-person / LINE.
- 📱 **Staff mobile view** — tap "スタッフ携帯画面" to see one staff member's day with customer details, notes, and a GPS-start button (cleaning).
- 📊 KPI strip (income / cost / margin / jobs / unassigned) recomputes live.

## Run locally
Just open `index.html` in a browser. (Or serve it: `npx serve .`)

## Deploy to Vercel
**Option A — CLI (fastest):**
```bash
npm i -g vercel      # once
cd palmport-demo
vercel               # follow prompts → preview URL
vercel --prod        # production URL to send the client
```

**Option B — Dashboard:**
1. Push this folder to a GitHub repo (or drag-drop the folder at vercel.com/new).
2. Framework preset: **Other** (it's static). No build command, output dir = root.
3. Deploy → copy the URL.

That URL is what you send the client — opens on desktop and phone, nothing to install.

## Files
| File | Purpose |
|------|---------|
| `index.html` | Page structure |
| `styles.css` | All styling |
| `app.js` | Mock data + render + drag/drop logic |
