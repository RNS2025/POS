# Merchant admin users and RBAC

**Status:** approved for implementation  
**Created:** 2026-06-08

## Summary

Merchants get multiple email/password admin portal users with three fixed roles: **Owner**, **Manager**, and **Viewer**. Permissions are enforced server-side via a static matrix shared with the client. Owners create users with temporary passwords; users must change password on first login.

Kasse PIN **Staff** remain separate — no admin portal access.

## Roles and permissions

| Permission | Owner | Manager | Viewer |
|------------|:-----:|:-------:|:------:|
| catalog:read / write | R/W | R/W | R |
| categories:read / write | R/W | R/W | R |
| kasser:read / write | R/W | R/W | R |
| staff:read / write | R/W | R/W | R |
| orders:read | yes | yes | yes |
| orders:write | yes | no | no |
| setup:read | yes | yes | no |
| setup:write | yes | no | no |
| users:read / write | R/W | no | no |

Multiple Owners per shop are allowed. At least one active Owner must remain.

## Data model

- `User.role`: `owner | manager | viewer | platform_admin | staff`
- `User.mustChangePassword`: boolean, default false
- Migrate existing merchant `admin` → `owner`

## Auth

- Login accepts merchant admin roles only (not staff).
- Register and platform invite create `owner`.
- `POST /api/v1/auth/change-password` clears `mustChangePassword`.
- Merchant APIs blocked when `mustChangePassword` except change-password.

## Admin user management (Owner only)

- `GET/POST/PATCH /api/v1/:tenantSlug/admin/users`
- Owner sets temp password on create/reset; `mustChangePassword: true`

## Out of scope

Email invites from merchants, custom roles, staff↔admin linking, platform impersonation, audit table.
