import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Pedido, CriarPedido } from '../modelos/pedido.model';
import { normalizarRespostaPaginada } from './api-normalizer.util';
import { FixtureService } from './fixture.service';

const CHAVE_USUARIO = 'auth_usuario';

/**
 * Serviço de pedidos para o usuário comum.
 * Criação de pedidos (checkout) e listagem dos próprios pedidos.
 */
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly urlBase = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient, private fixtureService: FixtureService) {}

  /** Cria um novo pedido (checkout). Requer autenticação de usuário. */
  criarPedido(dados: CriarPedido): Observable<Pedido> {
    if (!this.fixtureService.estaAtivo()) {
      return this.http.post<Pedido>(this.urlBase, dados);
    }

    return of(this.criarPedidoLocal(dados));
  }

  /** Lista os pedidos do usuário logado */
  meusPedidos(): Observable<Pedido[]> {
    const pedidosTemporarios = this.obterPedidosTemporarios();

    if (this.fixtureService.estaAtivo()) {
      return of(pedidosTemporarios);
    }

    return this.http.get<unknown>(this.urlBase).pipe(
      map((resposta) => {
        return this.normalizarPedidos(resposta);
      }),
      catchError((erro) => throwError(() => erro))
    );
  }

  /** Busca o detalhe de um pedido pelo ID */
  buscarPorId(id: number): Observable<Pedido> {
    const pedidoTemporario = this.obterPedidosTemporarios().find((pedido) => pedido.id === id);

    if (this.fixtureService.estaAtivo()) {
      return pedidoTemporario ? of(pedidoTemporario) : throwError(() => new Error('Pedido nao encontrado.'));
    }

    return this.http.get<Pedido>(`${this.urlBase}/${id}`).pipe(
      catchError((erro) => throwError(() => erro))
    );
  }

  private normalizarPedidos(resposta: unknown): Pedido[] {
    if (Array.isArray(resposta)) {
      return resposta as Pedido[];
    }

    return normalizarRespostaPaginada<Pedido>(resposta).dados;
  }

  private obterPedidosTemporarios(): Pedido[] {
    return this.fixtureService.obterPedidosUsuario(this.obterUsuarioId());
  }

  private criarPedidoLocal(dados: CriarPedido): Pedido {
    const pedidosLocais = this.carregarPedidosLocais();
    const usuario = this.obterUsuarioLogado();
    const dataAtual = new Date().toISOString();
    const ultimoId = pedidosLocais.reduce((maior, pedido) => Math.max(maior, pedido.id), 9399);
    const itens = this.montarItensPedido(dados);
    const total = itens.reduce((acumulado, item) => acumulado + item.precoUnitario * item.quantidade, 0);

    const pedido: Pedido = {
      id: ultimoId + 1,
      usuarioId: usuario?.id ?? 999,
      nomeCliente: usuario?.nome ?? 'Cliente Vegeta',
      emailCliente: usuario?.email ?? 'cliente@cartasvegeta.com',
      itens,
      status: 'pendente',
      total,
      formaPagamento: this.formatarFormaPagamento(dados.formaPagamento),
      enderecoEntrega: dados.enderecoEntrega,
      dataCriacao: dataAtual,
      dataAtualizacao: dataAtual,
    };

    this.fixtureService.salvarPedidosLocais([pedido, ...pedidosLocais]);
    return pedido;
  }

  private montarItensPedido(dados: CriarPedido): Pedido['itens'] {
    const carrinho = this.fixtureService.carregarCarrinho();

    return dados.itens.map((item, indice) => {
      const origem = carrinho.find(
        (itemCarrinho) => itemCarrinho.carta?.id === item.cartaId || itemCarrinho.produto?.id === item.produtoId
      );

      return {
        id: indice + 1,
        cartaId: item.cartaId,
        produtoId: item.produtoId,
        nomeProduto: origem?.carta?.nome ?? origem?.produto?.nome ?? `Item ${indice + 1}`,
        imagemUrl: origem?.carta?.imagemUrl ?? origem?.produto?.imagemUrl ?? '',
        quantidade: item.quantidade,
        precoUnitario: origem?.carta?.preco ?? origem?.produto?.preco ?? 0,
      };
    });
  }

  private carregarPedidosLocais(): Pedido[] {
    return this.fixtureService.obterPedidosLocais();
  }

  private obterUsuarioLogado(): { id: number; nome: string; email: string } | null {
    try {
      const usuario = localStorage.getItem(CHAVE_USUARIO);
      if (!usuario) {
        return null;
      }

      const dados = JSON.parse(usuario) as Partial<{ id: number; nome: string; email: string }>;
      if (typeof dados.id !== 'number') {
        return null;
      }

      return {
        id: dados.id,
        nome: this.normalizarNomeUsuario(dados.nome),
        email: this.normalizarEmailUsuario(dados.email),
      };
    } catch {
      return null;
    }
  }

  private obterUsuarioId(): number | null {
    return this.obterUsuarioLogado()?.id ?? null;
  }

  private formatarFormaPagamento(formaPagamento: CriarPedido['formaPagamento']): string {
    const mapa: Record<CriarPedido['formaPagamento'], string> = {
      pix: 'PIX',
      cartao: 'Cartao',
      boleto: 'Boleto',
    };

    return mapa[formaPagamento] ?? formaPagamento;
  }

  private normalizarNomeUsuario(nome?: string): string {
    if (!nome || nome === 'Usuario Teste' || nome === 'Usuario local') {
      return 'Ana Martins';
    }

    return nome;
  }

  private normalizarEmailUsuario(email?: string): string {
    if (!email || email === 'teste@teste.com' || email === 'local@cartasvegeta.dev' || email === 'usuario@cartasvegeta.dev') {
      return 'ana.martins@cartasvegeta.com';
    }

    return email;
  }
}
