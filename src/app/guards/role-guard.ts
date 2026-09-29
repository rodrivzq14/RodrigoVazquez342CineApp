import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/profile';

export const roleGuard = (roles: Role[]): CanMatchFn => async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;

  const role = auth.role();
  if (role && roles.includes(role)) return true;
  return router.createUrlTree(auth.isLoggedIn() ? ['/'] : ['/login']);
};