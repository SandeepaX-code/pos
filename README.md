# restaurant-pos (Next.js)

## Quick run (dev)

```bash
cd d:\Syzygy\restaurant-pos
npm run dev
```

Open: http://localhost:3000

## Quick run (production)

> Production build may require Firebase Admin environment variables.

### 1) set env vars (PowerShell)

Set these before build/start:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Example (replace values):

```powershell
$env:FIREBASE_PROJECT_ID="your-project-id"
$env:FIREBASE_CLIENT_EMAIL="your-client-email"
$env:FIREBASE_PRIVATE_KEY="your-private-key-with-newlines"
```

### 2) build + start

```bash
cd d:\Syzygy\restaurant-pos
npm run build:backend
npm run start:backend
```

## Verify endpoints

This project includes a simple endpoint checker:

```bash
cd d:\Syzygy\restaurant-pos
npm run check:endpoints
```

It checks:

- `GET /api/health`
- `GET /api/dashboard/summary`

## Notes

- Backend uses Firebase Admin in `src/lib/firebase/admin.ts`. If the env vars are missing, Next production build can fail during page-data collection.
- If you only want to run UI features during local development, prefer `npm run dev`.
