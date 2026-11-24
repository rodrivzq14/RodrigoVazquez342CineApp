import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { irAlLogin } from './auth-guard';
import { Permiso } from '../models/permisos';

/** Deja entrar solo si el usuario tiene ese permiso (admin o rol personalizado que lo incluya) */
export const permisoGuard = (permiso: Permiso): CanMatchFn => async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;

  if (auth.puede(permiso)) return true;
  return auth.isLoggedIn() ? router.createUrlTree(['/']) : irAlLogin(router);
};

/** Para el panel: alcanza con tener al menos una sección del admin */
export const panelGuard: CanMatchFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;

  if (auth.entraAlPanel()) return true;
  return auth.isLoggedIn() ? router.createUrlTree(['/']) : irAlLogin(router);
};
