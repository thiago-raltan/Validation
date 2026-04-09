import { environment } from '../../../environments/environment';
import { CategoriaProduto } from '../modelos/produto.model';

export const IMAGEM_FALLBACK_CARTA = 'assets/img/TESTE-CARD.jpg';
export const IMAGEM_FALLBACK_BOX = 'assets/img/TESTE-BOX.png';
export const IMAGEM_FALLBACK_FIGURA = 'assets/img/TESTE-FIGURE.png';
export const IMAGEM_FALLBACK_PELUCIA = 'assets/img/TESTE-PELUCIA.png';

export function obterImagemFallbackProduto(categoria?: CategoriaProduto): string {
  switch (categoria) {
    case 'figura':
      return IMAGEM_FALLBACK_FIGURA;
    case 'pelucia':
      return IMAGEM_FALLBACK_PELUCIA;
    case 'box':
    case 'acessorio':
    default:
      return IMAGEM_FALLBACK_BOX;
  }
}

export function resolverUrlImagem(imagemUrl: string | null | undefined, fallback: string): string {
  const valor = String(imagemUrl ?? '').trim();

  if (!valor) {
    return fallback;
  }

  if (/^(https?:|data:|blob:|assets\/)/i.test(valor)) {
    return valor;
  }

  if (valor.startsWith('/')) {
    return new URL(valor, environment.apiUrl).toString();
  }

  if (valor.startsWith('uploads/') || valor.startsWith('api/')) {
    return new URL(`/${valor.replace(/^\/+/, '')}`, environment.apiUrl).toString();
  }

  return valor;
}

export function aplicarFallbackImagem(evento: Event, fallback: string): void {
  const imagem = evento.target as HTMLImageElement | null;

  if (!imagem) {
    return;
  }

  imagem.onerror = null;
  imagem.src = fallback;
}