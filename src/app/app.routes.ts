import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/catalog/catalog').then(m => m.Catalog) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  { path: 'registro', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
  {
    path: 'perfil',
    canMatch: [authGuard],
    loadComponent: () => import('./pages/profile-page/profile-page').then(m => m.ProfilePage),
  },
  { path: '**', redirectTo: '' },
];