import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AdminAuthService } from '../servicos/admin-auth.service';

/**
 * canMatch: permite a rota do admin layout somente se autenticado.
 * canActivate: protege rotas filhas individualmente.
 */
export const adminGuard: CanMatchFn & CanActivateFn = () => {
  const adminAuth = inject(AdminAuthService);
  const router = inject(Router);

  if (adminAuth.autenticado()) {
    return true;
  }

  return router.createUrlTree(['/painel']);
};

/**
 * canMatch: permite a rota de login do painel somente quando NÃO autenticado.
 * Se já estiver logado, ignora esta rota para permitir o match do layout admin.
 */
export const naoAdminGuard: CanMatchFn = () => {
  const adminAuth = inject(AdminAuthService);

  if (!adminAuth.autenticado()) {
    return true;
  }

  return false;
};
