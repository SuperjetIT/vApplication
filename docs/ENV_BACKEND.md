# Backend environment variables

Express reads variables from the process environment (via `dotenv` / hosting panel). Prefer server env over Admin UI JSON for secrets.

## Required for email / OTP

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key (preferred) |
| `SENDGRID_API_KEY` | SendGrid API key (optional) |
| `SMTP_HOST` | SMTP host |
| `SMTP_PORT` | SMTP port (default `587`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password / app password |
| `SMTP_FROM_NAME` | From display name |
| `SMTP_FROM_EMAIL` | From address |
| `SMTP_REPLY_TO` | Reply-To |
| `CONTACT_TO` | Inbox for contact + visa-checker forms |

## OCR

| Variable | Purpose |
|----------|---------|
| `PASSPORT_OCR_API_KEY` | Server-only OCR vendor key (never accept from the browser) |

## Stripe (future server use)

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Server-only |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verify |

## Runtime

| Variable | Purpose |
|----------|---------|
| `API_PORT` | Listen port (default `3001`) |

## Health

`GET /api/health` → `{ "status": "ok" }`

## Security notes

- Do not commit `.env` or `backend/email-settings.json` with real secrets.
- Partner list/login/update responses never include `password`.
- OCR endpoint uses `PASSPORT_OCR_API_KEY` from the environment only.
