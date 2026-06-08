import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { platformAdminGuard } from './core/guards/platform-admin.guard';
import { tenantSlugGuard } from './core/guards/tenant-slug.guard';
import { OrderDetailPage } from './features/admin/pages/orders/order-detail.page';
import { OrdersListPage } from './features/admin/pages/orders/orders-list.page';
import { SetupPage } from './features/admin/pages/setup.page';
import { CategoriesListPage } from './features/admin/pages/categories/categories-list.page';
import { CategoryFormPage } from './features/admin/pages/categories/category-form.page';
import { KasserListPage } from './features/admin/pages/kasser/kasser-list.page';
import { KasseFormPage } from './features/admin/pages/kasser/kasse-form.page';
import { ProductsListPage } from './features/admin/pages/products/products-list.page';
import { ProductFormPage } from './features/admin/pages/products/product-form.page';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { CheckoutCancelPage } from './features/checkout/pages/checkout-cancel.page';
import { CheckoutSuccessPage } from './features/checkout/pages/checkout-success.page';
import { CheckoutPage } from './features/checkout/pages/checkout.page';
import { InvitePage } from './features/invite/pages/invite.page';
import { LoginPage } from './features/login/pages/login.page';
import { CreateMerchantPage } from './features/platform/pages/create-merchant.page';
import { MerchantsListPage } from './features/platform/pages/merchants-list.page';
import { MerchantDetailPage } from './features/platform/pages/merchant-detail.page';
import { RegisterPage } from './features/register/pages/register.page';
import { KasseLayoutComponent } from './layouts/kasse-layout/kasse-layout.component';
import { KasseQrPage } from './features/kasse/pages/kasse-qr.page';
import { KasseReceiptPage } from './features/kasse/pages/kasse-receipt.page';
import { KasseRegisterPage } from './features/kasse/pages/kasse-register.page';
import { StaffFormPage } from './features/admin/pages/staff/staff-form.page';
import { StaffListPage } from './features/admin/pages/staff/staff-list.page';
import { HomePage } from './features/shop/pages/home.page';
import { KioskLayoutComponent } from './layouts/kiosk-layout/kiosk-layout.component';
import { KioskCancelPage } from './features/kiosk/pages/kiosk-cancel.page';
import { KioskCartPage } from './features/kiosk/pages/kiosk-cart.page';
import { KioskCatalogPage } from './features/kiosk/pages/kiosk-catalog.page';
import { KioskCheckoutPage } from './features/kiosk/pages/kiosk-checkout.page';
import { KioskLaterPage } from './features/kiosk/pages/kiosk-later.page';
import { KioskQrPage } from './features/kiosk/pages/kiosk-qr.page';
import { KioskStartPage } from './features/kiosk/pages/kiosk-start.page';
import { KioskSuccessPage } from './features/kiosk/pages/kiosk-success.page';

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
    path: ':tenantSlug/kiosk/:kasseSlug',
    component: KioskLayoutComponent,
    children: [
      { path: 'start', component: KioskStartPage },
      { path: 'cart', component: KioskCartPage },
      { path: 'checkout', component: KioskCheckoutPage },
      { path: 'checkout/qr', component: KioskQrPage },
      { path: 'checkout/later', component: KioskLaterPage },
      { path: 'checkout/success', component: KioskSuccessPage },
      { path: 'checkout/cancel', component: KioskCancelPage },
      { path: '', component: KioskCatalogPage },
    ],
  },
  {
    path: ':tenantSlug/kasse/:kasseSlug',
    component: KasseLayoutComponent,
    children: [
      { path: 'pay/qr', component: KasseQrPage },
      { path: 'receipt', component: KasseReceiptPage },
      { path: '', component: KasseRegisterPage },
    ],
  },
  {
    path: ':tenantSlug/admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, tenantSlugGuard],
    children: [
      { path: 'products', component: ProductsListPage },
      { path: 'products/new', component: ProductFormPage },
      { path: 'products/:productId', component: ProductFormPage },
      { path: 'categories', component: CategoriesListPage },
      { path: 'categories/new', component: CategoryFormPage },
      { path: 'categories/:categoryId', component: CategoryFormPage },
      { path: 'kasser', component: KasserListPage },
      { path: 'kasser/new', component: KasseFormPage },
      { path: 'kasser/:kasseId', component: KasseFormPage },
      { path: 'staff', component: StaffListPage },
      { path: 'staff/new', component: StaffFormPage },
      { path: 'staff/:staffId', component: StaffFormPage },
      { path: 'orders', component: OrdersListPage },
      { path: 'orders/:orderId', component: OrderDetailPage },
      { path: 'setup', component: SetupPage },
      { path: '', redirectTo: 'products', pathMatch: 'full' },
    ],
  },
  { path: ':tenantSlug/checkout/success', component: CheckoutSuccessPage },
  { path: ':tenantSlug/checkout/cancel', component: CheckoutCancelPage },
  { path: ':tenantSlug/checkout', component: CheckoutPage },
  { path: ':tenantSlug', component: HomePage },
  { path: '**', redirectTo: '' },
];
