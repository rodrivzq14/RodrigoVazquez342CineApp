import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Manda al login recordando a dónde quería ir, así después de entrar vuelve ahí */
export function irAlLogin(router: Router): UrlTree {
  const volver = router.currentNavigation()?.extractedUrl.toString();
  return router.createUrlTree(['/login'], { queryParams: volver ? { volver } : {} });
}

export const authGuard: CanMatchFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.isLoggedIn() || irAlLogin(router);
};
