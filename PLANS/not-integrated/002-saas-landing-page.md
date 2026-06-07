**Plan #:** 002
**Status:** not integrated
**Created:** 2026-06-07

# SaaS landing page + i18n (EN/DA)

Marketing landing page at `/` for the RNS-Apps POS platform with Tailwind v4, CSS 3D hero, EN/DA i18n, and RNS brand assets from [rns-apps.dk](https://www.rns-apps.dk/).

See [docs/marketing/saas-landing-page.md](../../docs/marketing/saas-landing-page.md) for business narrative, messaging rules, and maintenance guide.

## Scope delivered

- `/` — lazy-loaded landing page (replaces redirect to `/register`)
- `Client/public/brand/` — logo assets from rns-apps.dk
- `Client/src/app/core/i18n/` — runtime EN/DA switching via `TranslationService` + `TranslatePipe`
- `Client/src/app/features/marketing/` — landing page, header, footer, 3D hero
- Tailwind v4 + PostCSS in Client only

## Messaging rules

- Do **not** mention Quickpay, Clearhaus, Verifone, BYOK, or payment-provider prerequisites on the landing page.
- Frame payment setup as post-registration guided setup.

## Out of scope

- Translating register/login/admin pages (foundation only)
- Backend changes
