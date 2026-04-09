import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Pedido, ResumoAdmin } from '../modelos/pedido.model';
import { RespostaPaginada } from '../modelos/carta.model';
import { PerfilAdmin, UsuarioAdmin } from '../modelos/usuario.model';
import { normalizarRespostaPaginada } from './api-normalizer.util';
import { gerarProximoId } from './admin-fixture.store';
import { paginarLista } from './dev-fixture.util';
import { Carta } from '../modelos/carta.model';
import { Produto } from '../modelos/produto.model';
import { AdminAuthService } from './admin-auth.service';
import { FixtureService } from './fixture.service';

/**
 * Serviço de gerenciamento geral para o painel admin.
 * Cobre: pedidos, usuários e resumo do dashboard.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly urlBase = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private adminAuth: AdminAuthService,
    private fixtureService: FixtureService
  ) {}

  // --- Dashboard ---
  obterResumo(): Observable<ResumoAdmin> {
    if (this.fixtureService.estaAtivo()) {
      const cartas = this.obterCartasFixture();
      const produtos = this.obterProdutosFixture();
      const pedidos = this.obterPedidosFixture();
      const usuarios = this.obterUsuariosFixture();
      const agora = new Date();
      const faturamentoMes = pedidos
        .filter((pedido) => {
          const data = new Date(pedido.dataCriacao);
          return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
        })
        .reduce((total, pedido) => total + (pedido.total ?? 0), 0);

      return of({
        totalCartas: cartas.length,
        totalProdutos: produtos.length,
        totalPedidos: pedidos.length,
        pedidosPendentes: pedidos.filter((pedido) => pedido.status === 'pendente').length,
        totalUsuarios: usuarios.length,
        faturamentoMes,
      });
    }

    return forkJoin({
      cartas: this.http.get<unknown>(`${this.urlBase}/cartas`, {
        params: { pagina: '1', itensPorPagina: '1' },
      }),
      figuras: this.http.get<unknown>(`${this.urlBase}/figuras`, {
        params: { pagina: '1', itensPorPagina: '1' },
      }),
      pelucias: this.http.get<unknown>(`${this.urlBase}/pelucias`, {
        params: { pagina: '1', itensPorPagina: '1' },
      }),
      caixas: this.http.get<unknown>(`${this.urlBase}/caixas`, {
        params: { pagina: '1', itensPorPagina: '1' },
      }),
      pedidos: this.http.get<unknown>(`${this.urlBase}/pedidos`, {
        params: { pagina: '1', itensPorPagina: '200' },
      }),
    }).pipe(
      map(({ cartas, figuras, pelucias, caixas, pedidos }) => {
        const cartasPaginadas = normalizarRespostaPaginada<unknown>(cartas);
        const figurasPaginadas = normalizarRespostaPaginada<unknown>(figuras);
        const peluciasPaginadas = normalizarRespostaPaginada<unknown>(pelucias);
        const caixasPaginadas = normalizarRespostaPaginada<unknown>(caixas);
        const pedidosPaginados = normalizarRespostaPaginada<Pedido>(pedidos);

        const agora = new Date();
        const faturamentoMes = (pedidosPaginados.dados ?? [])
          .filter((pedido) => {
            const data = new Date(pedido.dataCriacao);
            return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
          })
          .reduce((total, pedido) => total + (pedido.total ?? 0), 0);

        return {
          totalCartas: cartasPaginadas.total ?? 0,
          totalProdutos: (figurasPaginadas.total ?? 0) + (peluciasPaginadas.total ?? 0) + (caixasPaginadas.total ?? 0),
          totalPedidos: pedidosPaginados.total ?? 0,
          pedidosPendentes: (pedidosPaginados.dados ?? []).filter((pedido) => pedido.status === 'pendente').length,
          totalUsuarios: 0,
          faturamentoMes,
        };
      })
    );
  }

  // --- Pedidos ---
  listarPedidos(pagina = 1, itensPorPagina = 20): Observable<RespostaPaginada<Pedido>> {
    if (this.fixtureService.estaAtivo()) {
      return of(paginarLista(this.obterPedidosFixture(), pagina, itensPorPagina));
    }

    return this.http
      .get<unknown>(`${this.urlBase}/pedidos`, {
        params: { pagina: String(pagina), itensPorPagina: String(itensPorPagina) },
      })
      .pipe(map((resposta) => normalizarRespostaPaginada<Pedido>(resposta)));
  }

  buscarPedidoPorId(id: number): Observable<Pedido> {
    if (this.fixtureService.estaAtivo()) {
      const pedido = this.obterPedidosFixture().find((item) => item.id === id);
      return pedido ? of(pedido) : throwError(() => new Error('Pedido nao encontrado.'));
    }

    return this.http.get<Pedido>(`${this.urlBase}/pedidos/${id}`);
  }

  atualizarStatusPedido(id: number, status: string): Observable<Pedido> {
    if (this.fixtureService.estaAtivo()) {
      const pedidos = this.obterPedidosFixture();
      const indice = pedidos.findIndex((pedido) => pedido.id === id);
      if (indice < 0) {
        return throwError(() => new Error('Pedido nao encontrado.'));
      }

      const atualizado = {
        ...pedidos[indice],
        status,
        dataAtualizacao: new Date().toISOString(),
      } as Pedido;
      pedidos[indice] = atualizado;
      this.salvarPedidosFixture(pedidos);
      return of(atualizado);
    }

    return this.http.patch<Pedido>(`${this.urlBase}/pedidos/${id}/status`, { status });
  }

  // --- Usuários ---
  listarUsuarios(pagina = 1, itensPorPagina = 20): Observable<RespostaPaginada<UsuarioAdmin>> {
    if (this.fixtureService.estaAtivo()) {
      return of(paginarLista(this.obterUsuariosFixture(), pagina, itensPorPagina));
    }

    return throwError(() => new Error('API atual nao possui rota de usuarios.'));
  }

  buscarUsuarioPorId(id: number): Observable<UsuarioAdmin> {
    if (this.fixtureService.estaAtivo()) {
      const usuario = this.obterUsuariosFixture().find((item) => item.id === id);
      return usuario ? of(usuario) : throwError(() => new Error('Usuario nao encontrado.'));
    }

    return throwError(() => new Error('API atual nao possui rota de usuarios.'));
  }

  criarUsuario(dados: Omit<UsuarioAdmin, 'id' | 'dataCadastro'> & Partial<Pick<UsuarioAdmin, 'ultimoAcesso' | 'observacao'>>): Observable<UsuarioAdmin> {
    if (this.fixtureService.estaAtivo()) {
      if (!this.adminAuth.podeCriarUsuarios() || !this.adminAuth.podeAtribuirPerfil(dados.perfil)) {
        return throwError(() => new Error('Seu perfil nao pode cadastrar este tipo de usuario.'));
      }

      const usuarios = this.obterUsuariosFixture();
      if (this.emailJaExiste(dados.email, usuarios)) {
        return throwError(() => new Error('Ja existe um usuario com este e-mail.'));
      }

      const criado = this.normalizarUsuarioAdmin({
        ...dados,
        id: gerarProximoId(usuarios, 1),
        dataCadastro: new Date().toISOString(),
      });

      this.salvarUsuariosFixture([criado, ...usuarios]);
      return of(criado);
    }

    return throwError(() => new Error('API atual nao possui rota de usuarios.'));
  }

  atualizarUsuario(id: number, dados: Partial<UsuarioAdmin>): Observable<UsuarioAdmin> {
    if (this.fixtureService.estaAtivo()) {
      const usuarios = this.obterUsuariosFixture();
      const indice = usuarios.findIndex((item) => item.id === id);
      if (indice < 0) {
        return throwError(() => new Error('Usuario nao encontrado.'));
      }

      const perfilDestino = (dados.perfil ?? usuarios[indice].perfil) as PerfilAdmin;
      if (!this.adminAuth.podeEditarUsuario(usuarios[indice], perfilDestino) || !this.adminAuth.podeAtribuirPerfil(perfilDestino, usuarios[indice])) {
        return throwError(() => new Error('Seu perfil nao pode editar este usuario.'));
      }

      if (dados.email && this.emailJaExiste(dados.email, usuarios, id)) {
        return throwError(() => new Error('Ja existe um usuario com este e-mail.'));
      }

      const atualizado = this.normalizarUsuarioAdmin({ ...usuarios[indice], ...dados, id });
      usuarios[indice] = atualizado;
      this.salvarUsuariosFixture(usuarios);
      this.adminAuth.sincronizarUsuarioAdmin(atualizado);
      return of(atualizado);
    }

    return throwError(() => new Error('API atual nao possui rota de usuarios.'));
  }

  removerUsuario(id: number): Observable<void> {
    if (this.fixtureService.estaAtivo()) {
      const usuario = this.obterUsuariosFixture().find((item) => item.id === id);
      if (!usuario) {
        return throwError(() => new Error('Usuario nao encontrado.'));
      }

      if (!this.adminAuth.podeExcluirUsuario(usuario)) {
        return throwError(() => new Error('Seu perfil nao pode excluir este usuario.'));
      }

      this.salvarUsuariosFixture(this.obterUsuariosFixture().filter((item) => item.id !== id));
      return of(void 0);
    }

    return throwError(() => new Error('API atual nao possui rota de usuarios.'));
  }

  private obterPedidosFixture(): Pedido[] {
    return this.fixtureService.obterPedidosUsuario();
  }

  private salvarPedidosFixture(pedidos: Pedido[]): void {
    this.fixtureService.salvarPedidosBase(pedidos);
  }

  private obterUsuariosFixture(): UsuarioAdmin[] {
    const base = this.fixtureService.obterUsuariosAdmin();
    return base
      .map((usuario, indice) => this.normalizarUsuarioAdmin(usuario, indice))
      .sort((a, b) => this.ordemPerfil(a.perfil) - this.ordemPerfil(b.perfil) || a.nome.localeCompare(b.nome));
  }

  private salvarUsuariosFixture(usuarios: UsuarioAdmin[]): void {
    this.fixtureService.salvarUsuariosAdmin(usuarios);
  }

  private obterCartasFixture(): Carta[] {
    return this.fixtureService.obterCartas();
  }

  private obterProdutosFixture(): Produto[] {
    return this.fixtureService.obterProdutos();
  }

  private normalizarUsuarioAdmin(usuario: Partial<UsuarioAdmin>, indice = 0): UsuarioAdmin {
    const perfil = this.normalizarPerfil(usuario.perfil, indice);
    return {
      id: Number(usuario.id ?? indice + 1),
      nome: String(usuario.nome ?? `Usuario ${indice + 1}`),
      email: String(usuario.email ?? '').trim().toLowerCase(),
      ativo: usuario.ativo ?? true,
      dataCadastro: String(usuario.dataCadastro ?? new Date().toISOString()),
      perfil,
      observacao: usuario.observacao ? String(usuario.observacao) : undefined,
      ultimoAcesso: usuario.ultimoAcesso ? String(usuario.ultimoAcesso) : undefined,
    };
  }

  private normalizarPerfil(perfil: PerfilAdmin | undefined, indice: number): PerfilAdmin {
    if (perfil === 'desenvolvedor' || perfil === 'administrador' || perfil === 'mantenedor') {
      return perfil;
    }

    if (indice === 0) {
      return 'desenvolvedor';
    }

    if (indice === 1) {
      return 'administrador';
    }

    return 'mantenedor';
  }

  private ordemPerfil(perfil: PerfilAdmin): number {
    if (perfil === 'desenvolvedor') {
      return 0;
    }

    if (perfil === 'administrador') {
      return 1;
    }

    return 2;
  }

  private emailJaExiste(email: string, usuarios: UsuarioAdmin[], idIgnorado?: number): boolean {
    const emailNormalizado = email.trim().toLowerCase();
    return usuarios.some((usuario) => usuario.email.trim().toLowerCase() === emailNormalizado && usuario.id !== idIgnorado);
  }
}
