# 4. Webhook (optional — we set it in code)

Our platform sends the callback URL automatically on each payment (`callbackurl` / `QuickPay-Callback-Url`).

You do **not** need to paste a webhook URL in Quickpay Manager for normal checkout.

Optional: set **Default payment settings → Callback url** in Quickpay Manager only if you create payments outside our platform.

## Local development (no public URL)

Quickpay cannot POST to `localhost`. For local testing you have two options:

1. **Status sync (default)** — After payment, the success page and merchant **Refresh status from Quickpay** pull the latest state via `GET /payments/{id}`. No tunnel required.
2. **Tunnel (optional)** — Use ngrok or Cloudflare Tunnel, set `API_PUBLIC_URL` in `Server/.env` to the public HTTPS URL, restart the server, then create a new payment link so callbacks use the tunnel.

## Render staging (Blueprint)

Deploy the full stack from the repo root `render.yaml`:

| Resource | Purpose |
|----------|---------|
| `pos-db` | Postgres (free tier for testing) |
| `pos-api` | Express API + webhooks |
| `pos-web` | Angular static site |

### Deploy steps

1. **Render Dashboard** → **Blueprints** → connect the repo and sync the Blueprint.
2. Confirm API health: `GET https://pos-api.onrender.com/api/health`
3. Seed platform admin and a demo tenant (Render shell or local with production `DATABASE_URL`):
   ```bash
   npm run seed:platform-admin --prefix Server
   npm run seed:tenant --prefix Server
   ```
4. In merchant setup, verify the **Webhook URL** shows  
   `https://pos-api.onrender.com/api/v1/webhooks/quickpay/{tenantId}`  
   (from `RENDER_EXTERNAL_URL` when `API_PUBLIC_URL` is unset).

### Webhooks vs CORS on Render

- **Quickpay callbacks** are server-to-server POSTs to the API hostname directly. They do **not** use browser CORS.
- **Browser traffic** uses the static site rewrite: `/api/*` on `pos-web` proxies to `pos-api`, so the SPA calls same-origin `/api/v1/...` without cross-origin preflight.
- `CORS_ORIGIN` on the API is synced to the static site URL in the Blueprint. For local dev against a deployed API, set comma-separated origins, e.g.  
  `CORS_ORIGIN=https://pos-web.onrender.com,http://localhost:4200`

### Free tier notes

- Cold starts (~30s) on free web services can delay the first webhook retry; status sync on the success page remains a backup.
- After deploy, place a test payment and confirm Quickpay Manager shows callback success and the order reaches `captured`.
