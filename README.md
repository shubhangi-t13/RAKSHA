# Raksha — Digital Warranty Locker

Prototype: photograph a bill → Claude reads it → warranty record saved with expiry tracking.

## Structure

```
raksha/
  backend/     Node + Express API. Handles bill photo → Claude vision extraction → JSON storage.
  frontend/    React (Vite) + Tailwind. The web app UI.
```

## 1. Get a free API key (no credit card needed)

1. Go to https://aistudio.google.com/apikey
2. Sign in with any Google account
3. Click "Create API key"
4. Copy the key (starts with `AIza...`)

This uses Google's Gemini free tier — no billing setup required to get started.

## 2. Run the backend

```bash
cd backend
npm install
cp .env.example .env
# paste your key into .env → GEMINI_API_KEY=AIza...
npm run dev
```

Backend runs at `http://localhost:4000`. Data is stored in `backend/db.json` (a flat file —
fine for a prototype, swap for a real database like SQLite/Postgres later).

## 3. Run the frontend

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies `/api` calls to the backend.
Open that URL in your browser.

## 4. Try it

1. Click "+ Add bill"
2. Take a photo of a real bill (or upload one) — works best on phone since the camera
   button uses `capture="environment"`
3. Claude extracts product, seller, price, purchase date, and estimates warranty duration
4. Review/edit the fields, then save
5. Your dashboard shows a "seal" for each product — green (protected), amber (expiring
   within 30 days), red (expired)

## Testing on your phone (same wifi network)

Vite's dev server is reachable from other devices on the same network:

```bash
npm run dev -- --host
```

Then on your phone, open `http://<your-computer's-local-ip>:5173`. This gives you a real
mobile-web experience — good enough to test the "photograph a crumpled bill" flow with
real users before building anything native.

## Path to a native mobile app

This backend is framework-agnostic — any client can call it. To go native without
rewriting the extraction logic:

- **Fastest**: wrap the existing web app in Capacitor or a WebView shell for app store distribution
- **Fully native**: build a React Native (Expo) app that calls the same `/api/extract-bill`,
  `/api/bills` endpoints — reuse `frontend/src/lib/api.js` as your starting point almost as-is

## What's deliberately missing (prototype scope)

- Auth / multiple users — everything is a single shared locker right now
- Push notifications for expiry reminders — the dashboard banner is the reminder for now
- Cloud file storage for bill images — currently images aren't persisted after extraction,
  only the extracted data is saved (add S3/Cloudinary before showing this to real users
  who expect their bill photo saved too)
- A real database — `db.json` won't scale past a handful of users, swap for SQLite or
  Postgres once you have signal

Per the original plan: get 20–30 real people using this before building further.
