import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/catalog/catalog').then(m => m.Catalog) 
  },
  { 
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login) 
  },
  { 
    path: 'registro', 
    loadComponent: () => import('./pages/register/register').then(m => m.Register) 
  },
  {
    path: 'perfil',
    canMatch: [authGuard],
    loadComponent: () => import('./pages/profile-page/profile-page').then(m => m.ProfilePage)
  },
  {
    path: 'pelicula/:id',
    loadComponent: () => import('./pages/movie-detail/movie-detail').then(m => m.MovieDetail)
  },
  {
    path: 'funcion/:id',
    loadComponent: () => import('./pages/seat-selection/seat-selection').then(m => m.SeatSelection)
  },
  {
    path: 'compra/:id',
    loadComponent: () => import('./pages/checkout/checkout').then(m => m.Checkout),
  },
  {
    path: 'confirmacion/:id',
    loadComponent: () => import('./pages/confirmation/confirmation').then(m => m.Confirmation),
  },
  {
    path: 'admin',
    canMatch: [roleGuard(['admin'])],
    loadChildren: () => import('./pages/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'validar',
    canMatch: [roleGuard(['empleado', 'admin'])],
    loadComponent: () => import('./pages/validate/validate').then(m => m.Validate),
  },
  { 
    path: '**', 
    redirectTo: '' 
  },
];