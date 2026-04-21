import { Injectable, signal } from '@angular/core';
import { SobreConteudo } from '../modelos/sobre.model';

const CHAVE_SOBRE = 'sobre_conteudo';

const CONTEUDO_PADRAO: SobreConteudo = {
  titulo: 'Sobre a <span class="sobre__titulo-destaque">Tríade</span>',
  subtitulo: 'Loja de cartas colecionaveis com atendimento simples e direto',
  missao:
    'A <strong>Tríade</strong> foi criada para reunir cards, figures e retro games em uma experiência consistente. ' +
    'Nosso foco e oferecer produtos originais, envio cuidadoso e atendimento claro para quem joga ou coleciona.',
  vantagens: [
    { icone: '🔍', titulo: 'Cartas verificadas', descricao: 'Conferimos os produtos antes de colocar no estoque.' },
    { icone: '📦', titulo: 'Envio protegido', descricao: 'As cartas sao embaladas com cuidado para chegar bem.' },
    { icone: '💬', titulo: 'Atendimento humano', descricao: 'Respondemos suas duvidas de forma simples e rapida.' },
    { icone: '🔄', titulo: 'Troca facilitada', descricao: 'Se houver problema, ajudamos voce a resolver sem complicacao.' },
    { icone: '🏦', titulo: 'Pagamento pratico', descricao: 'Voce pode pagar com PIX, cartao ou boleto.' },
    { icone: '🌎', titulo: 'Entrega para todo o Brasil', descricao: 'Enviamos para todo o pais com acompanhamento do pedido.' },
  ],
  numeros: [
    { valor: '5.000+', rotulo: 'cartas no estoque' },
    { valor: '12.000+', rotulo: 'clientes atendidos' },
    { valor: '100+', rotulo: 'colecoes disponiveis' },
    { valor: '6 anos', rotulo: 'de loja' },
  ],
  contato: {
    email: 'contato@triade.com.br',
    telefone: '(11) 99999-0000',
    horario: 'Segunda a sexta, das 9h as 18h',
  },
};

/**
 * Serviço que persiste e fornece o conteúdo editável da página Sobre.
 * Os dados ficam em localStorage para que as alterações do admin sejam refletidas
 * imediatamente sem necessidade de backend.
 */
@Injectable({ providedIn: 'root' })
export class SobreService {
  private _conteudo = signal<SobreConteudo>(this.carregar());

  /** Conteúdo atual da página Sobre (readonly) */
  readonly conteudo = this._conteudo.asReadonly();

  /** Retorna uma cópia do conteúdo padrão (para resetar o formulário) */
  obterPadrao(): SobreConteudo {
    return JSON.parse(JSON.stringify(CONTEUDO_PADRAO));
  }

  /** Salva o novo conteúdo no localStorage e atualiza o signal */
  salvar(novoConteudo: SobreConteudo): void {
    localStorage.setItem(CHAVE_SOBRE, JSON.stringify(novoConteudo));
    this._conteudo.set({ ...novoConteudo });
  }

  /** Restaura o conteúdo padrão */
  restaurarPadrao(): void {
    localStorage.removeItem(CHAVE_SOBRE);
    this._conteudo.set(this.obterPadrao());
  }

  private carregar(): SobreConteudo {
    try {
      const salvo = localStorage.getItem(CHAVE_SOBRE);
      if (salvo) {
        return JSON.parse(salvo) as SobreConteudo;
      }
    } catch {
      // ignore — usa padrão
    }
    return JSON.parse(JSON.stringify(CONTEUDO_PADRAO));
  }
}
