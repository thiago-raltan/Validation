import { HttpErrorResponse } from '@angular/common/http';

export function obterMensagemErroApi(erro: unknown): string {
  if (erro && typeof erro === 'object' && 'name' in erro && erro.name === 'TimeoutError') {
    return 'Tempo de resposta excedido. Tente novamente em instantes.';
  }

  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0) {
      return 'Falha na conexao com API.';
    }

    if (erro.status === 500) {
      return 'Erro interno no servidor (500). Tente novamente mais tarde.';
    }

    if (erro.status === 503) {
      return 'Servico indisponivel (503). Tente novamente em instantes.';
    }

    if (erro.status === 404) {
      return 'Recurso nao encontrado (404).';
    }

    if (erro.status === 401) {
      return 'Nao autenticado (401). Faça login para continuar.';
    }

    if (erro.status === 403) {
      return 'Acesso negado (403).';
    }

    if (erro.status === 400) {
      return 'Requisicao invalida (400). Verifique os dados enviados.';
    }

    const mensagemBody = extrairMensagemBody(erro.error);
    if (mensagemBody) {
      return mensagemBody;
    }

    return `Erro na API (${erro.status}).`;
  }

  return 'Falha na conexao com API.';
}

function extrairMensagemBody(body: unknown): string | null {
  if (!body) return null;
  if (typeof body === 'string') return body;
  if (typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    const msg = obj['message'] ?? obj['erro'] ?? obj['error'];
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return null;
}
