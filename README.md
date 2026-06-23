# Superjet Visa

Visa application platform — React frontend + Express API.

## Project layout

```
Visa/
├── frontend/          # React + Vite website (pages, components, client DB)
│   ├── src/
│   ├── index.html
│   └── vite.config.ts
├── backend/           # Express API (auth, email, passport OCR proxy)
│   ├── index.mjs
│   ├── users.mjs
│   └── data/
├── package.json       # Run scripts from repo root
└── .env               # API keys (see .env.example)
```

## Quick start

```bash
npm install
npm run dev
```

- **Website:** http://localhost:5173/
- **API:** http://localhost:3001/

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + frontend together |
| `npm run dev:client` | Frontend only (Vite) |
| `npm run dev:server` | Backend API only |
| `npm run build` | Production frontend build |
