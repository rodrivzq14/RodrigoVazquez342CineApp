import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AdminLayout } from './admin-layout/admin-layout';
import { permisoGuard } from '../../guards/permiso-guard';
import { roleGuard } from '../../guards/role-guard';
import { AuthService } from '../../services/auth.service';
import { SECCIONES } from './admin-layout/secciones';

// Se cargan solo cuando entra alguien con acceso al panel (loadChildren en app.routes.ts).
// Cada sección tiene su propio guard: un rol personalizado puede tener solo algunas.
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        // Va a la primera sección que tenga habilitada
        path: '',
        pathMatch: 'full',
        redirectTo: () => {
          const auth = inject(AuthService);
          return SECCIONES.find((s) => auth.puede(s.permiso))?.ruta ?? '/';
        },
      },
      {
        path: 'funciones',
        canMatch: [permisoGuard('funciones')],
        loadComponent: () => import('./admin-screenings/admin-screenings').then(m => m.AdminScreenings),
      },
      {
        path: 'peliculas',
        canMatch: [permisoGuard('peliculas')],
        loadComponent: () => import('./admin-movies/admin-movies').then(m => m.AdminMovies),
      },
      {
        path: 'productos',
        canMatch: [permisoGuard('candy')],
        loadComponent: () => import('./admin-products/admin-products').then(m => m.AdminProducts),
      },
      {
        path: 'combos',
        canMatch: [permisoGuard('candy')],
        loadComponent: () => import('./admin-combos/admin-combos').then(m => m.AdminCombos),
      },
      {
        path: 'configuracion',
        canMatch: [permisoGuard('configuracion')],
        loadComponent: () => import('./admin-settings/admin-settings').then(m => m.AdminSettings),
      },
      {
        path: 'canjes',
        canMatch: [permisoGuard('configuracion')],
        loadComponent: () => import('./admin-canjes/admin-canjes').then(m => m.AdminCanjes),
      },
      {
        path: 'actividad',
        canMatch: [permisoGuard('actividad')],
        loadComponent: () => import('./admin-log/admin-log').then(m => m.AdminLog),
      },
      {
        path: 'propuestas',
        canMatch: [permisoGuard('propuestas')],
        loadComponent: () => import('./admin-propuestas/admin-propuestas').then(m => m.AdminPropuestas),
      },
      {
        // Los roles los maneja solo el admin "de verdad", si no alguien podría darse más permisos
        path: 'roles',
        canMatch: [roleGuard(['admin'])],
        loadComponent: () => import('./admin-roles/admin-roles').then(m => m.AdminRoles),
      },
    ],
  },
];
