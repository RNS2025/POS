# SaaS landing page

**Product:** RNS-Apps unified shop + kasse platform  
**Route:** `/` on `payment.rns-apps.dk`  
**Branch:** `feature/saas-landing-page`

---

## Business narrative

**Headline:** One shop. Online and in-store. Zero setup chaos.

**Example merchant — Café Nord:** A Copenhagen café selling pastries at the counter and taking pre-orders online. Instead of juggling separate tools, they use RNS-Apps for one shop, one admin, and guided help to go live.

### Messaging rules (landing page only)

| Do | Don't |
|----|-------|
| Sell unified online + in-store sales | Mention Quickpay, Clearhaus, Verifone, or BYOK |
| Emphasize easy registration | Imply merchants need payment accounts before signing up |
| Highlight guided setup + RNS support | Talk about paying third-party providers on the landing page |

Payment provider details belong in admin setup guides (`docs/setup-guides/`), not on the public landing page.

---

## Page sections

| Section | Anchor | i18n prefix |
|---------|--------|-------------|
| Header + nav | — | `landing.nav.*` |
| Hero + 3D scene | — | `landing.hero.*` |
| Problem → solution | — | `landing.problem.*` |
| How it works (3 steps) | `#how-it-works` | `landing.steps.*` |
| Features grid | `#features` | `landing.features.*` |
| Trust strip | — | `landing.trust.*` |
| Pricing teaser | `#pricing` | `landing.pricing.*` |
| Final CTA | — | `landing.cta.*` |
| Footer | — | `landing.footer.*` |

Primary CTAs link to `/register` and `/login`.

---

## Brand assets

Copied from [rns-apps.dk](https://www.rns-apps.dk/) — committed locally, not hotlinked.

| File | Source | Usage |
|------|--------|-------|
| `Client/public/brand/logo.png` | https://www.rns-apps.dk/logo.png | Header, footer |
| `Client/public/brand/logo-small.png` | https://www.rns-apps.dk/logo_small.png | Favicon |

### Tailwind theme tokens (`Client/src/styles.css`)

| Token | Value |
|-------|-------|
| `--color-brand-bg` | `#2a2a2a` |
| `--color-brand-text` | `#eae9e9` |
| `--color-primary-500` | `#ff6941` |
| `--color-primary-600` | `#f2865f` |

---

## i18n

**Default locale:** English (`en`)  
**Supported:** Danish (`da`)  
**Storage:** `localStorage` key `pos.locale`

### Adding a string

1. Add key to `Client/src/app/core/i18n/locales/en.ts`
2. Mirror in `locales/da.ts`
3. Use in template: `{{ 'landing.section.key' | translate }}`

### Migrating other pages

- [ ] `register` — move strings to `register.*` keys
- [ ] `login` — move strings to `login.*` keys
- [ ] `admin/setup` — move strings to `setup.*` keys
- [ ] Shop, checkout, kasse pages

---

## 3D hero scene

**Location:** `Client/src/app/features/marketing/components/hero-3d-scene.component.ts`

- Pure CSS 3D transforms — no Three.js or WebGL libraries
- Global keyframes in `styles.scss` (`.landing-orbit`, `.landing-scene`)
- Mouse parallax via CSS variables `--rx`, `--ry`
- `prefers-reduced-motion: reduce` disables orbit and parallax

---

## Screenshots

_Add screenshots after first deploy._

- [ ] Hero (EN)
- [ ] Hero (DA)
- [ ] Mobile header
