import { Routes } from '@angular/router';
import { HomePage } from './features/shop/pages/home.page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: '**', redirectTo: '' },
];
