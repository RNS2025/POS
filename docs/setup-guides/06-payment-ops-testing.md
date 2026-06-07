# 6. Payment operations testing

Test merchant payment controls after Quickpay and Verifone are connected.

## Merchant admin

1. Log in as shop admin → `/{slug}/admin/setup`
2. Open **Orders** — list shows online and in-store orders
3. Open a failed order → **Retry payment** should appear
4. Open a captured order → **Refund** with full or partial amount

## Quickpay (online)

1. Enable test transactions in Quickpay Manager
2. Place order at `/{slug}/checkout`
3. **Success:** order status `captured`, no retry button
4. **Decline:** use test decline card → order `failed` → retry creates new payment link
5. **Cancel:** abandon Payment Window → cancel page marks order `cancelled` → retry available
6. **Refund:** from order detail, refund partial then remaining → `partially_refunded` then `refunded`
7. Confirm webhook updates match merchant-initiated refunds

## Verifone (in-store)

1. Enable **Use Verifone simulator** in setup (or set `VERIFONE_SIMULATOR=true`)
2. Open **Kasse** → charge → order appears in Orders as `captured`
3. **Decline:** test with real terminal/simulator decline scenario → order `failed` → retry from order detail or kasse
4. **Refund:** partial then full from order detail
5. **Void:** void button on same-day captured terminal sale (within 24h)
6. **Abort:** if payment stays `pending`, use **Cancel on terminal** from order detail or kasse

Official reference: [Verifone testing integration](https://docs.verifone.com/pos-cloud/pos-cloud-guide/readme-1/testing/testing-integration)

## Automated tests

```bash
cd Server
npm test
npm run build

cd ../Client
npm run build
```
