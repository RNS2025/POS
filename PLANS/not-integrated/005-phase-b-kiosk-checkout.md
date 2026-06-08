# Phase B — Kiosk catalog, cart, QR + pay later

**Plan #:** 005  
**Status:** not integrated  
**Created:** 2026-06-08  
**Parent:** [003-pos-implementation-roadmap](./003-pos-implementation-roadmap.md) — simplified Phase **B**  
**Depends on:** Phase A (`feature/merchant-catalog`)

> **Worktree:** `npm run worktree:new -- feature/kiosk-checkout` (from `feature/merchant-catalog`)

**Goal:** Customer self-service kiosk — browse catalog, build cart, pay via Quickpay QR or register order as pay later. Phone gate when SMS or pay later is enabled (SMS checkout deferred to Phase F).

**Architecture:** Public routes resolve tenant from slug + kiosk kasse from slug. Line-item checkout creates `Order` + `OrderLineItem` rows, then either Quickpay payment link (QR) or `pending_payment` (later). Client cart is in-memory per session; phone stored in `sessionStorage` keyed by tenant/kasse.

**Deferred:** SMS payment (Phase F), real QR image generation (placeholder box + payment link).

---

## API

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/tenants/:tenantSlug/kiosk/:kasseSlug/catalog` | Public (slug) |
| POST | `/api/v1/tenants/:tenantSlug/kiosk/:kasseSlug/checkout` | Public |
| GET | `/api/v1/tenants/:tenantSlug/kiosk/:kasseSlug/orders/:orderId` | Public (tenant-scoped) |

**Checkout body:** `{ paymentMethod: 'qr' | 'later', lines: [{ productId, quantity }], customerPhone? }`

---

## Client routes

`/:tenantSlug/kiosk/:kasseSlug` — `KioskLayoutComponent`

| Path | Page |
|------|------|
| `''` | Catalog (product grid + category chips) |
| `start` | Phone gate (numeric pad) |
| `cart` | Cart lines + checkout CTA |
| `checkout` | Payment method picker |
| `checkout/qr` | QR placeholder + poll order status |
| `checkout/later` | Pay-later confirmation |
| `checkout/success` | Payment success |
| `checkout/cancel` | Payment cancelled |

---

## Server files

- `Shared/types/kiosk.ts`
- `middleware/resolve-kiosk-kasse.middleware.ts`
- `services/kiosk-catalog.service.ts`
- `services/kiosk-checkout.service.ts`
- `controllers/kiosk.controller.ts`
- `routes/kiosk.routes.ts`
- Repository extensions: `listActiveForKasse`, `listActiveByTenant`, `createWithLineItems`

## Client files

- `core/services/kiosk.service.ts`
- `features/kiosk/services/kiosk-cart.service.ts`, `kiosk-phone.service.ts`
- `features/kiosk/pages/*`
- `layouts/kiosk-layout/kiosk-layout.component.ts`
- `shared/components/numeric-pad`, `cart-line`
- Kiosk styles in `styles.scss` (`.wf-grid`, `.wf-tile`, `.wf-footer-bar`, etc.)

---

## Exit criteria

- [x] Default kiosk at `/{slug}/kiosk/customer` loads catalog for seeded products
- [x] Cart add/update/remove; checkout validates lines server-side
- [x] QR checkout returns Quickpay `paymentUrl`; success page after poll sees `captured`
- [x] Pay later creates `pending_payment` order without Quickpay call
- [x] Phone required when `payWithLater` or `payWithSms` on kasse
- [x] Server + Client `npm run build` pass
- [ ] Integration test: tenant A kiosk ≠ tenant B; checkout uses tenant A Quickpay (mock) — optional before production

---

## Smoke test

1. Ensure Phase A migration applied and tenant has products on default kiosk kasse.
2. Open `http://localhost:4200/{tenantSlug}/kiosk/customer`.
3. Add items → cart → checkout → Pay with QR or Pay later.
4. QR: open payment link; after webhook/sync, kiosk redirects to success.
