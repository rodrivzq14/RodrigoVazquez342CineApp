import { Routes } from '@angular/router';
import { AdminLayout } from './admin-layout/admin-layout';

// Se cargan solo cuando entra un admin (loadChildren en app.routes.ts)
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'funciones', pathMatch: 'full' },
      {
        path: 'peliculas',
        loadComponent: () => import('./admin-movies/admin-movies').then(m => m.AdminMovies),
      },
      {
        path: 'funciones',
        loadComponent: () => import('./admin-screenings/admin-screenings').then(m => m.AdminScreenings),
      },
      {
        path: 'productos',
        loadComponent: () => import('./admin-products/admin-products').then(m => m.AdminProducts),
      },
      {
        path: 'combos',
        loadComponent: () => import('./admin-combos/admin-combos').then(m => m.AdminCombos),
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./admin-settings/admin-settings').then(m => m.AdminSettings),
      },
      {
        path: 'actividad',
        loadComponent: () => import('./admin-log/admin-log').then(m => m.AdminLog),
      },
    ],
  },
];
