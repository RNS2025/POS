**Plan #:** 008
**Status:** not integrated
**Created:** 2026-06-08

# Phase E — Platform archive & export

**Branch:** `feature/platform-archive`  
**Depends on:** Platform merchant detail (Phase 0), catalog + orders (A, D)  
**Spec:** `003-pos-implementation-roadmap.md` Phase 9 (v1 subset), design spec §3.14

## Goal

RNS platform admins can export a merchant's data (ZIP) and archive the merchant. Archived tenants are blocked from public routes, merchant login, staff PIN, and webhooks. Full PII erasure worker deferred to a later phase.

## v1 scope

| In scope | Deferred |
|----------|----------|
| `Tenant.lifecycleStatus` + `archivedAt` | `purged` status, `retentionUntil` |
| Export ZIP (JSON files, no secrets) | Async export job |
| Archive merchant (deactivate users, wipe keys) | Reactivate endpoint |
| Platform audit log (export, archive) | Erasure worker |
| Danger zone UI on merchant detail | Merchant self-service closure |

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/platform/merchants/:tenantId/export-data` | ZIP download; audit `export_data` |
| POST | `/api/v1/platform/merchants/:tenantId/archive` | Body `{ confirmName }`; audit `archive_merchant` |

## Schema

- `tenants.lifecycle_status` — `active` \| `archived` (default `active`)
- `tenants.archived_at` — nullable timestamp
- `platform_audit_logs` — `tenant_id`, `actor_id`, `action`, `created_at`

## Archive side effects

1. Set `lifecycle_status = archived`, `archived_at = now()`
2. Deactivate all `users` (`is_active = false`)
3. Delete `tenant_invites`, `tenant_quickpay_config`, `tenant_verifone_config`
4. Deactivate all `kasser`
5. Clear `quickpay_connected_at`, `verifone_connected_at`

## Export contents (ZIP)

- `manifest.json`, `tenant.json`, `users.json` (no PIN/password hashes)
- `categories.json`, `products.json`, `kasser.json`
- `orders.json` (with line items + payment metadata)
- `notes.json`

**Excludes:** Quickpay/Verifone secrets, encrypted keys, PIN hashes.

## Guards when archived

| Path | Behaviour |
|------|-----------|
| `resolveTenantFromSlug` | 404 |
| Merchant admin login | 401 |
| Staff PIN login | 404 |
| Invite accept | 410 |
| Quickpay webhook | 404 |

## Tasks

- [x] **E.1** Tenant lifecycle fields + migration
- [x] **E.2** `PlatformAuditLog` repository
- [x] **E.3** Export service (archiver ZIP)
- [x] **E.4** Archive service + repository transaction
- [x] **E.5** Platform routes + controllers
- [x] **E.6** Archived-tenant guards (slug, auth, webhook, PIN)
- [x] **E.7** Shared types + merchant detail danger zone UI

## Done when

- Platform admin can export ZIP and archive a merchant from merchant detail
- Archived slug returns 404 on kiosk/kasse/checkout
- Merchant login and webhooks rejected for archived tenant

## Test plan (manual)

1. Open platform merchant detail → Export all data → ZIP downloads with JSON files
2. Archive merchant (type shop name) → lifecycle shows Archived
3. Visit `/{slug}/kiosk/customer` → 404
4. Merchant admin login for slug → fails
5. Quickpay webhook for tenant → 404
