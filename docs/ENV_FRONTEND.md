# Frontend environment variables

Vite only exposes variables prefixed with `VITE_` to the browser bundle.

## Safe for the frontend

| Variable | Purpose |
|----------|---------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_…` / `pk_live_…`) |
| `VITE_STRIPE_MOCK_CHECKOUT` | `true` / `false` — mock pay in local DEV when Stripe is off |

## Temporary demo seeds (local / staging only)

These hydrate empty passwords in the client demo database so Admin / Ops / Partner login still works until server auth ships. They are **bundled into the JS build** if set at build time — use only on trusted staging hosts, never for production customer traffic.

| Variable | Purpose |
|----------|---------|
| `VITE_DEMO_ADMIN_PASSWORD` | Seed password for `admin@superjetglobal.com` |
| `VITE_DEMO_OPS_PASSWORD` | Seed password for operations demo users |
| `VITE_DEMO_PARTNER_PASSWORD` | Seed password for demo partner `mohammed@alfaris.ae` |

## Never put these in `VITE_*` or frontend code

- Database URLs or DB passwords
- `STRIPE_SECRET_KEY` / webhook secrets
- SMTP passwords
- Resend / SendGrid API keys
- `PASSPORT_OCR_API_KEY`
- Admin or partner passwords in source control (use gitignored `.env` only for demo seeds)

## Files

- Template: `.env.example` (repo root)
- Local secrets: `.env` / `.env.local` (gitignored)
