import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicos/auth.service';

/**
 * Guard que protege as rotas privadas de usuário comum.
 * Redireciona para /login se o usuário não estiver autenticado.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticado()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
