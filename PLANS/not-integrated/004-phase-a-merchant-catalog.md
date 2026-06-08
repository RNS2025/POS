# Phase A — Shared UI + merchant catalog

**Plan #:** 004  
**Status:** not integrated  
**Created:** 2026-06-08  
**Parent:** [003-pos-implementation-roadmap](./003-pos-implementation-roadmap.md) — simplified Phase **A**

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` or `superpowers:subagent-driven-development`  
> **Worktree:** `npm run worktree:new -- feature/merchant-catalog`

**Goal:** Ship reusable admin UI primitives, then full merchant catalog admin (kasser, categories, products + images) in one vertical slice.

**Architecture:** Build `shared/components` first; refactor two existing list pages to prove them. One Prisma migration. Standard layers: repository → service → controller → route. `AdminLayout` wraps `/:slug/admin/*` child routes. No separate `*.interface.ts` repo files.

**Tech stack:** Angular 19+ standalone components, Express, Prisma, `tsx --test`, native `<dialog>`.

**Deferred to Phase B/C:** `numeric-pad`, `cart-line` (kiosk/kasse).

---

## Task order overview

| # | Task | Delivers |
|---|------|----------|
| 1 | `pos-button` | Shared button |
| 2 | `confirm-dialog` | One modal for all confirms |
| 3 | `copy-field` | Copy URL / invite / payment link |
| 4 | `paginator` | Prev/next footer |
| 5 | `async-shell` + `form-actions` | Loading/error + edit form footer |
| 6 | Refactor existing pages | merchants-list, orders-list, order-detail |
| 7 | Prisma migration | Catalog tables + Order/User extensions |
| 8 | Repositories + shared types | Tenant-scoped data access |
| 9 | Kasser API + admin pages | List, new, edit |
| 10 | Categories API + admin pages | List, new, edit |
| 11 | Products API + images + admin pages | List, new, edit |
| 12 | `AdminLayout` + route tree | Sidebar nav |

---

## Task 1: `pos-button`

**Files:**
- Create: `Client/src/app/shared/components/pos-button/pos-button.component.ts`

- [ ] **Step 1: Create component**

```typescript
import { Component, input, output } from '@angular/core';

export type PosButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

@Component({
  selector: 'pos-button',
  standalone: true,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <span aria-hidden="true">… </span>
      }
      <ng-content />
    </button>
  `,
})
export class PosButtonComponent {
  readonly variant = input<PosButtonVariant>('secondary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly pressed = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (this.type() === 'button') {
      event.preventDefault();
    }
    this.pressed.emit(event);
  }
}
```

No CSS in v1 — browser default button; `variant` is semantic for a future design pass.

- [ ] **Step 2: Build Client**

```bash
cd Client && npm run build
```

Expected: PASS.

---

## Task 2: `confirm-dialog`

**Files:**
- Create: `Client/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`

- [ ] **Step 1: Create dialog component**

```typescript
import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { PosButtonComponent } from '../pos-button/pos-button.component';

@Component({
  selector: 'confirm-dialog',
  standalone: true,
  imports: [PosButtonComponent],
  template: `
    <dialog #dialog (cancel)="onCancel($event)">
      <form method="dialog">
        @if (title()) {
          <h2>{{ title() }}</h2>
        }
        @if (message()) {
          <p>{{ message() }}</p>
        }
        <ng-content />
        <p>
          <pos-button type="button" [variant]="confirmVariant()" (pressed)="onConfirm()">
            {{ confirmLabel() }}
          </pos-button>
          <pos-button type="button" variant="ghost" (pressed)="onCancelClick()">
            {{ cancelLabel() }}
          </pos-button>
        </p>
      </form>
    </dialog>
  `,
})
export class ConfirmDialogComponent {
  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly open = input(false);
  readonly title = input('');
  readonly message = input('');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly confirmVariant = input<'primary' | 'danger'>('danger');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  constructor() {
    effect(() => {
      const el = this.dialogEl().nativeElement;
      if (this.open() && !el.open) {
        el.showModal();
      } else if (!this.open() && el.open) {
        el.close();
      }
    });
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancelClick(): void {
    this.dialogEl().nativeElement.close();
    this.cancelled.emit();
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.cancelled.emit();
  }
}
```

- [ ] **Step 2: Build Client** — PASS.

---

## Task 3: `copy-field`

**Files:**
- Create: `Client/src/app/shared/components/copy-field/copy-field.component.ts`

- [ ] **Step 1: Implement**

```typescript
import { Component, input, signal } from '@angular/core';
import { PosButtonComponent } from '../pos-button/pos-button.component';

@Component({
  selector: 'copy-field',
  standalone: true,
  imports: [PosButtonComponent],
  template: `
    <p>
      <input [value]="value()" readonly aria-label="Copy value" />
      <pos-button type="button" (pressed)="copy()">
        {{ copied() ? 'Copied' : 'Copy' }}
      </pos-button>
    </p>
  `,
})
export class CopyFieldComponent {
  readonly value = input.required<string>();
  protected readonly copied = signal(false);

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.value());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      /* clipboard blocked — user can select input */
    }
  }
}
```

---

## Task 4: `paginator`

**Files:**
- Create: `Client/src/app/shared/components/paginator/paginator.component.ts`

- [ ] **Step 1: Implement**

```typescript
import { Component, computed, input, output } from '@angular/core';
import { PosButtonComponent } from '../pos-button/pos-button.component';

@Component({
  selector: 'pos-paginator',
  standalone: true,
  imports: [PosButtonComponent],
  template: `
    <p>
      Page {{ page() }} — {{ total() }} total
      <pos-button type="button" [disabled]="!canPrev()" (pressed)="prev.emit()">Previous</pos-button>
      <pos-button type="button" [disabled]="!canNext()" (pressed)="next.emit()">Next</pos-button>
    </p>
  `,
})
export class PaginatorComponent {
  readonly page = input.required<number>();
  readonly total = input.required<number>();
  readonly limit = input(20);
  readonly hasMore = input<boolean | undefined>(undefined);

  readonly prev = output<void>();
  readonly next = output<void>();

  protected readonly canPrev = computed(() => this.page() > 1);
  protected readonly canNext = computed(() => {
    const hm = this.hasMore();
    if (hm !== undefined) return hm;
    return this.page() * this.limit() < this.total();
  });
}
```

---

## Task 5: `async-shell` + `form-actions`

**Files:**
- Create: `Client/src/app/shared/components/async-shell/async-shell.component.ts`
- Create: `Client/src/app/shared/components/form-actions/form-actions.component.ts`

- [ ] **Step 1: async-shell**

```typescript
import { Component, input } from '@angular/core';

@Component({
  selector: 'async-shell',
  standalone: true,
  template: `
    @if (loading()) {
      <p>{{ loadingMessage() }}</p>
    } @else if (error()) {
      <p>{{ error() }}</p>
    } @else if (empty()) {
      <p>{{ emptyMessage() }}</p>
    } @else {
      <ng-content />
    }
  `,
})
export class AsyncShellComponent {
  readonly loading = input(false);
  readonly error = input('');
  readonly empty = input(false);
  readonly loadingMessage = input('Loading…');
  readonly emptyMessage = input('No items found.');
}
```

- [ ] **Step 2: form-actions**

```typescript
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PosButtonComponent } from '../pos-button/pos-button.component';

@Component({
  selector: 'form-actions',
  standalone: true,
  imports: [PosButtonComponent, RouterLink],
  template: `
    <p>
      <pos-button type="submit" variant="primary" [loading]="saving()" [disabled]="saveDisabled()">
        {{ saveLabel() }}
      </pos-button>
      @if (cancelLink()) {
        <a [routerLink]="cancelLink()">Cancel</a>
      }
      <ng-content />
    </p>
  `,
})
export class FormActionsComponent {
  readonly saving = input(false);
  readonly saveDisabled = input(false);
  readonly saveLabel = input('Save');
  readonly cancelLink = input<string | string[] | null>(null);
  readonly save = output<void>();
}
```

Note: wrap `<form (ngSubmit)="save()">` around fields; `form-actions` stays inside form for submit button.

- [ ] **Step 3: Barrel export** (optional)

Create `Client/src/app/shared/components/index.ts` re-exporting all shared components.

---

## Task 6: Refactor existing pages

**Files:**
- Modify: `Client/src/app/features/platform/pages/merchants-list.page.ts` + `.html`
- Modify: `Client/src/app/features/admin/pages/orders/orders-list.page.ts` + `.html`
- Modify: `Client/src/app/features/admin/pages/orders/order-detail.page.ts` + `.html`

- [ ] **Step 1: merchants-list** — replace prev/next with `<pos-paginator>`; filter/apply/export with `<pos-button>`.

- [ ] **Step 2: orders-list** — same paginator swap.

- [ ] **Step 3: order-detail** — replace refund inline toggle with:

```html
<confirm-dialog
  [open]="refundDialogOpen()"
  title="Refund"
  message="Enter amount to refund."
  confirmLabel="Confirm refund"
  (confirmed)="refund()"
  (cancelled)="refundDialogOpen.set(false)"
>
  <p>
    <label>
      Amount (DKK)
      <input type="number" [(ngModel)]="refundAmountDkk" ... />
    </label>
  </p>
</confirm-dialog>
```

Void/abort: simple `confirm-dialog` with message only.

- [ ] **Step 4: merchant-detail** — use `<copy-field>` for shop link when platform adds copy UX; use `<pos-button>` on save/ping.

- [ ] **Step 5: Build + smoke test** login → orders → platform merchants.

---

## Task 7: Prisma migration

**Files:**
- Modify: `Server/prisma/schema.prisma`
- Create: migration via `prisma migrate dev`

- [ ] **Step 1: Add models** — `Kasse`, `Category`, `Product`, `ProductKasse`, `OrderLineItem` (see [003 Phase 1 schema](./003-pos-implementation-roadmap.md#phase-1--catalog-data-model) or prior 004 draft).

- [ ] **Step 2: Extend `Order`** — `kasseId`, `staffUserId`, `customerPhone`, `paymentMethod`, `lineItems`.

- [ ] **Step 3: Extend `User`** — `displayName`, `pinHash`, `isActive` (staff in Phase C).

- [ ] **Step 4: Seed SQL for existing tenants** — insert default kiosk `customer` where missing.

```bash
cd Server && npx prisma migrate dev --name merchant_catalog
npx prisma generate
```

---

## Task 8: Repositories + shared types

**Files:**
- Create: `Shared/types/kasse.ts`, `category.ts`, `product.ts`, `catalog.ts`
- Create: `Server/src/repositories/kasse.repository.ts`
- Create: `Server/src/repositories/category.repository.ts`
- Create: `Server/src/repositories/product.repository.ts`
- Modify: `Server/src/repositories/tenant.repository.ts` — transaction seeds default kiosk
- Create: `Server/src/repositories/merchant-catalog.test.ts`

- [ ] **Step 1: Shared types** — `KasseType`, `PaginatedResponse` list DTOs, create/update requests per spec §3.13.

- [ ] **Step 2: `IKasseRepository` in same file** as `KasseRepository`:

| Method | Notes |
|--------|-------|
| `listByTenant(tenantId, page, limit)` | paginated |
| `findById(tenantId, id)` | null if wrong tenant |
| `create` / `update` | validate payment toggles ≥1 for kiosk |
| `setProductIds(tenantId, kasseId, productIds)` | replaces `ProductKasse` rows |

- [ ] **Step 3: Category + Product repos** — CRUD, `deleteCategoryIfEmpty`, product `setKasseVisibility`.

- [ ] **Step 4: Tests**

```bash
cd Server && npm test -- src/repositories/merchant-catalog.test.ts
```

Cover: default kiosk on tenant create; tenant B cannot read tenant A kasse.

---

## Task 9: Kasser API + admin pages

**Files:**
- Create: `Server/src/services/kasse.service.ts`, `controllers/kasse.controller.ts`, `routes/kasser.routes.ts`
- Register in `Server/src/routes/index.ts`
- Create: `Client/src/app/core/services/kasser.service.ts`
- Create: `Client/src/app/features/admin/pages/kasser/kasser-list.page.ts`
- Create: `Client/src/app/features/admin/pages/kasser/kasse-form.page.ts` (new + edit)

**API:**

| Method | Path |
|--------|------|
| GET | `/api/v1/kasser?page&limit` |
| POST | `/api/v1/kasser` |
| PATCH | `/api/v1/kasser/:id` |
| PUT | `/api/v1/kasser/:id/products` `{ productIds: string[] }` |

- [ ] **Step 1: Backend** — `requireAuth`, `requireTenantMatch`, Zod validation.

- [ ] **Step 2: List page** — table + `<pos-paginator>` + link to new.

- [ ] **Step 3: Form page** — type select, slug, copy-field for iPad URL (`payment.rns-apps.dk/{slug}/kiosk|kasse/{kasseSlug}`), payment toggles when kiosk, `<form-actions>`, deactivate via `<confirm-dialog>`.

- [ ] **Step 4: After PATCH success** — patch row in list state from response (no full refetch).

---

## Task 10: Categories API + admin pages

**Files:**
- Create: `Server/src/services/category.service.ts`, controller, routes under `/api/v1/categories`
- Create: `Client/src/app/core/services/categories.service.ts`
- Create: `admin/pages/categories/categories-list.page.ts`, `category-form.page.ts`

- [ ] **Step 1: CRUD API** — PATCH deactivate; DELETE only if `countProducts === 0` → 409.

- [ ] **Step 2: List + form** — sort order field; delete button disabled when products > 0; confirm-dialog for deactivate/delete.

---

## Task 11: Products API + images + admin pages

**Files:**
- Create: `Server/src/infra/uploads.ts` (or `services/product-image.storage.ts`)
- Create: product service, controller, routes (multipart)
- Create: `Client/src/app/core/services/products.service.ts`
- Create: `admin/pages/products/products-list.page.ts`, `product-form.page.ts`

**API:**

| Method | Path |
|--------|------|
| GET | `/api/v1/products` |
| POST | `/api/v1/products` multipart |
| PATCH | `/api/v1/products/:id` multipart |
| DELETE | `/api/v1/products/:id/image` |
| GET | `/api/v1/products/images/:productId` |

- [ ] **Step 1: Image storage** — `UPLOAD_DIR` env; tenant-scoped path; max 2 MB JPEG/PNG/WebP.

- [ ] **Step 2: Product form** — file input, kasse visibility checkboxes, `<form-actions>`, deactivate confirm.

- [ ] **Step 3: List** — thumbnail column, `<async-shell>`, `<pos-paginator>`.

---

## Task 12: `AdminLayout` + routes

**Files:**
- Create: `Client/src/app/layouts/admin-layout/admin-layout.component.ts`
- Modify: `Client/src/app/app.routes.ts`

- [ ] **Step 1: Layout** — sidebar links: Products, Categories, Kasser, Orders, Setup; `<router-outlet>`; minimal nav only.

- [ ] **Step 2: Nest admin routes**

```typescript
{
  path: ':tenantSlug/admin',
  component: AdminLayoutComponent,
  canActivate: [authGuard, tenantSlugGuard],
  children: [
    { path: 'products', ... },
    { path: 'products/new', ... },
    { path: 'products/:id', ... },
    { path: 'categories', ... },
    { path: 'kasser', ... },
    { path: 'orders', component: OrdersListPage },
    { path: 'orders/:orderId', component: OrderDetailPage },
    { path: 'setup', component: SetupPage },
    { path: '', redirectTo: 'products', pathMatch: 'full' },
  ],
},
```

- [ ] **Step 3: Remove duplicate guards** from child pages if layout handles them.

- [ ] **Step 4: Full build**

```bash
cd Server && npm run build && npm test
cd Client && npm run build
```

---

## Done criteria (Phase A)

- [ ] Five shared components exist; merchants-list + orders-list + order-detail use them
- [ ] Merchant can CRUD kasser, categories, products in admin
- [ ] Product image upload works; list shows `imageUrl`
- [ ] Default kiosk kasse on new tenants; backfill migration for existing
- [ ] Deactivate flows use `confirm-dialog` (not ad-hoc `confirm()`)
- [ ] Tenant isolation test on kasser/product repos
- [ ] `numeric-pad` / `cart-line` **not** in this phase

---

## Merge

```bash
npm run worktree:merge -- feature/merchant-catalog
```

**Next:** [003 Phase B](./003-pos-implementation-roadmap.md#simplified-phases-6-worktrees--production-v1) — `feature/kiosk-checkout` (add `numeric-pad`, `cart-line`).
