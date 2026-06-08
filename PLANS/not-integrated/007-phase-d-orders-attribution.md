# Phase D — Orders admin attribution & filters

**Plan #:** 007  
**Status:** not integrated  
**Created:** 2026-06-08  
**Parent:** [003-pos-implementation-roadmap](./003-pos-implementation-roadmap.md) — simplified Phase **D**

> **Worktree:** `npm run worktree:new -- feature/orders-attribution`

**Goal:** Merchant can filter orders by kasse, employee, channel, payment method; order detail shows line items, kasse, staff, phone, and pay-later status.

---

## API changes

`GET /api/v1/tenants/:tenantSlug/orders` — new query params:
- `kasseId`
- `staffUserId`
- `paymentMethod` (`qr` | `later` | `terminal` | `sms`)

List items include: `kasseName`, `kasseSlug`, `staffDisplayName`, `paymentMethod`, `customerPhone`.

`GET .../orders/:orderId/detail` includes: `lineItems`, `kasseName`, `kasseSlug`, `staffDisplayName`, `customerPhone`, `paymentMethod`.

`pending_payment` added to `OrderStatus`.

---

## Exit criteria

- [x] Filter orders by kasse, staff, payment method
- [x] Order detail shows line items and attribution
- [x] Pay later orders visually distinct
- [x] Server + Client build pass
