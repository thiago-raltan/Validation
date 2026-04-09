import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { timeout } from 'rxjs';
import { map } from 'rxjs/operators';

function desembrulharResposta(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const possivelEnvelope = body as {
    success?: unknown;
    code?: unknown;
    data?: unknown;
    error?: unknown;
  };
  if ('data' in possivelEnvelope && 'success' in possivelEnvelope && 'code' in possivelEnvelope) {
    if (possivelEnvelope.success === false) {
      const status =
        typeof possivelEnvelope.code === 'number' ? possivelEnvelope.code : Number(possivelEnvelope.code) || 400;
      const mensagem =
        typeof possivelEnvelope.error === 'string'
          ? possivelEnvelope.error
          : 'A API retornou falha na requisicao.';

      throw new HttpErrorResponse({
        status,
        statusText: 'API Error',
        error: { message: mensagem },
      });
    }
    return possivelEnvelope.data;
  }
  return body;
}

/**
 * Interceptor HTTP que injeta o token JWT nas requisições.
 * Prioriza o token de admin (sessionStorage), depois o de usuário (localStorage).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenAdmin = sessionStorage.getItem('admin_token');
  const tokenUsuario = localStorage.getItem('auth_token');
  const token = tokenAdmin ?? tokenUsuario;

  if (token) {
    const reqAutenticada = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(reqAutenticada).pipe(
      timeout(5000),
      map((evento) =>
        evento instanceof HttpResponse
          ? evento.clone({ body: desembrulharResposta(evento.body) })
          : evento
      )
    );
  }

  return next(req).pipe(
    timeout(5000),
    map((evento) =>
      evento instanceof HttpResponse
        ? evento.clone({ body: desembrulharResposta(evento.body) })
        : evento
    )
  );
};
