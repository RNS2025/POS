import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { platformAdminGuard } from './core/guards/platform-admin.guard';
import { tenantSlugGuard } from './core/guards/tenant-slug.guard';
import { verifoneConnectedGuard } from './core/guards/verifone-connected.guard';
import { OrderDetailPage } from './features/admin/pages/orders/order-detail.page';
import { OrdersListPage } from './features/admin/pages/orders/orders-list.page';
import { SetupPage } from './features/admin/pages/setup.page';
import { CheckoutCancelPage } from './features/checkout/pages/checkout-cancel.page';
import { CheckoutSuccessPage } from './features/checkout/pages/checkout-success.page';
import { CheckoutPage } from './features/checkout/pages/checkout.page';
import { InvitePage } from './features/invite/pages/invite.page';
import { LoginPage } from './features/login/pages/login.page';
import { CreateMerchantPage } from './features/platform/pages/create-merchant.page';
import { MerchantsListPage } from './features/platform/pages/merchants-list.page';
import { MerchantDetailPage } from './features/platform/pages/merchant-detail.page';
import { RegisterPage } from './features/register/pages/register.page';
import { KassePage } from './features/kasse/pages/kasse.page';
import { HomePage } from './features/shop/pages/home.page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/marketing/pages/landing.page').then((m) => m.LandingPage),
  },
  { path: 'register', component: RegisterPage },
  { path: 'login', component: LoginPage },
  { path: 'invite/:token', component: InvitePage },
  {
    path: 'platform/merchants/new',
    component: CreateMerchantPage,
    canActivate: [platformAdminGuard],
  },
  {
    path: 'platform/merchants',
    component: MerchantsListPage,
    canActivate: [platformAdminGuard],
  },
  {
    path: 'platform/merchants/:tenantId',
    component: MerchantDetailPage,
    canActivate: [platformAdminGuard],
  },
  {
    path: ':tenantSlug/kasse',
    component: KassePage,
    canActivate: [authGuard, tenantSlugGuard, verifoneConnectedGuard],
  },
  {
    path: ':tenantSlug/admin/orders',
    component: OrdersListPage,
    canActivate: [authGuard, tenantSlugGuard],
  },
  {
    path: ':tenantSlug/admin/orders/:orderId',
    component: OrderDetailPage,
    canActivate: [authGuard, tenantSlugGuard],
  },
  {
    path: ':tenantSlug/admin/setup',
    component: SetupPage,
    canActivate: [authGuard, tenantSlugGuard],
  },
  { path: ':tenantSlug/checkout/success', component: CheckoutSuccessPage },
  { path: ':tenantSlug/checkout/cancel', component: CheckoutCancelPage },
  { path: ':tenantSlug/checkout', component: CheckoutPage },
  { path: ':tenantSlug', component: HomePage },
  { path: '**', redirectTo: '' },
];
