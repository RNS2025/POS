# Phase C — Staff kasse register (PIN + Verifone + QR)

**Plan #:** 006  
**Status:** not integrated  
**Created:** 2026-06-08  
**Parent:** [003-pos-implementation-roadmap](./003-pos-implementation-roadmap.md) — simplified Phase **C**  
**Depends on:** Phase A + B (`feature/merchant-catalog`, `feature/kiosk-checkout`)

> **Worktree:** `npm run worktree:new -- feature/staff-kasse`

**Goal:** Staff register iPad flow — PIN session, product grid + cart, charge card via Verifone (per-kasse POI), or Pay with QR. Admin staff CRUD with hashed PINs. Orders store `kasseId` + `staffUserId` + line items.

**Deferred:** Receipt as separate printable page polish; old amount-only `/kasse` API kept for backward compat.

---

## API

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/tenants/:tenantSlug/staff` | Admin JWT |
| POST | `/api/v1/tenants/:tenantSlug/staff` | Admin JWT |
| PATCH | `/api/v1/tenants/:tenantSlug/staff/:staffId` | Admin JWT |
| POST | `/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/pin` | Public (slug) |
| GET | `/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/catalog` | Kasse session JWT |
| POST | `/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/sales` | Kasse session JWT |
| POST | `/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/pay/qr` | Kasse session JWT |
| GET | `/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/orders/:orderId` | Kasse session JWT |
| GET | `/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/receipt/:orderId` | Kasse session JWT |

**Kasse session JWT:** `role: kasse_staff`, 8h TTL, claims `kasseId`, `staffUserId`, `displayName`.

---

## Client routes

`/:tenantSlug/kasse/:kasseSlug` — `KasseLayoutComponent`

| Path | Page |
|------|------|
| `''` | PIN pad or register split view |
| `pay/qr` | QR payment + poll |
| `receipt` | Sale receipt |

Admin: `/:tenantSlug/admin/staff`, `/staff/new`, `/staff/:staffId`

---

## Exit criteria

- [x] Admin can add staff with 4–6 digit PIN
- [x] Register bookmark → PIN → catalog + cart
- [x] Terminal sale uses kasse `verifonePoiId` (not tenant default POI)
- [x] QR sale sets `kasseId` + `staffUserId` on order
- [x] Server + Client build pass
- [ ] Integration test: sale without PIN → 401

---

## Smoke test

1. Admin: create register kasse (`type: register`, POI optional), assign products, add staff with PIN.
2. Open `/{tenantSlug}/kasse/{kasseSlug}` on iPad/desktop.
3. Enter PIN → add products → Charge card (simulator) or Pay with QR.
4. Receipt shows lines, staff name, kasse name.
