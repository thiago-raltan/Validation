import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Produto, FiltrosProduto } from '../modelos/produto.model';
import { RespostaPaginada } from '../modelos/carta.model';
import { normalizarRespostaPaginada } from './api-normalizer.util';
import { gerarProximoId } from './admin-fixture.store';
import { paginarLista } from './dev-fixture.util';
import { FixtureService } from './fixture.service';

/**
 * Serviço para gerenciamento de produtos no painel admin.
 * Cobre pelúcias, figuras, boxes e acessórios.
 */
@Injectable({ providedIn: 'root' })
export class AdminProdutoService {
  private readonly rotasPorCategoria = {
    figura: `${environment.apiUrl}/figuras`,
    pelucia: `${environment.apiUrl}/pelucias`,
    box: `${environment.apiUrl}/caixas`,
    acessorio: `${environment.apiUrl}/caixas`,
  } as const;

  constructor(private http: HttpClient, private fixtureService: FixtureService) {}

  listar(filtros: FiltrosProduto = {}): Observable<RespostaPaginada<Produto>> {
    if (this.fixtureService.estaAtivo()) {
      const filtrados = this.filtrar(this.obterProdutos(), filtros);
      return of(paginarLista(filtrados, filtros.pagina ?? 1, filtros.itensPorPagina ?? 20));
    }

    const pagina = filtros.pagina ?? 1;
    const itensPorPagina = filtros.itensPorPagina ?? 20;

    if (filtros.categoria) {
      const rota = this.rotasPorCategoria[filtros.categoria];
      return this.http
        .get<unknown>(rota, { params: this.buildParams(filtros) })
        .pipe(map((resposta) => normalizarRespostaPaginada<Produto>(resposta)));
    }

    return forkJoin([
      this.http.get<unknown>(this.rotasPorCategoria.figura, { params: this.buildParams(filtros) }),
      this.http.get<unknown>(this.rotasPorCategoria.pelucia, { params: this.buildParams(filtros) }),
      this.http.get<unknown>(this.rotasPorCategoria.box, { params: this.buildParams(filtros) }),
    ]).pipe(
      map(([figuras, pelucias, caixas]) => {
        const dados = [
          ...normalizarRespostaPaginada<Produto>(figuras).dados,
          ...normalizarRespostaPaginada<Produto>(pelucias).dados,
          ...normalizarRespostaPaginada<Produto>(caixas).dados,
        ];
        const total = dados.length;
        const inicio = (pagina - 1) * itensPorPagina;
        return {
          dados: dados.slice(inicio, inicio + itensPorPagina),
          total,
          pagina,
          itensPorPagina,
          totalPaginas: Math.max(1, Math.ceil(total / itensPorPagina)),
        };
      })
    );
  }

  buscarPorId(id: number): Observable<Produto> {
    if (this.fixtureService.estaAtivo()) {
      const produto = this.obterProdutos().find((item) => item.id === id);
      return produto ? of(produto) : throwError(() => new Error('Produto nao encontrado.'));
    }

    return this.http.get<Produto>(`${this.rotasPorCategoria.figura}/${id}`);
  }

  criar(produto: Partial<Produto>): Observable<Produto> {
    if (this.fixtureService.estaAtivo()) {
      const produtos = this.obterProdutos();
      const novoProduto = {
        destaque: false,
        quantidadeEstoque: 0,
        categoria: 'figura',
        ...produto,
        id: gerarProximoId(produtos, 9201),
      } as Produto;
      produtos.unshift(novoProduto);
      this.salvarProdutos(produtos);
      return of(novoProduto);
    }

    const categoria = produto.categoria ?? 'figura';
    return this.http.post<Produto>(this.rotasPorCategoria[categoria], produto);
  }

  atualizar(id: number, produto: Partial<Produto>): Observable<Produto> {
    if (this.fixtureService.estaAtivo()) {
      const produtos = this.obterProdutos();
      const indice = produtos.findIndex((item) => item.id === id);
      if (indice < 0) {
        return throwError(() => new Error('Produto nao encontrado.'));
      }

      const atualizado = { ...produtos[indice], ...produto, id } as Produto;
      produtos[indice] = atualizado;
      this.salvarProdutos(produtos);
      return of(atualizado);
    }

    const categoria = produto.categoria ?? 'figura';
    return this.http.put<Produto>(`${this.rotasPorCategoria[categoria]}/${id}`, produto);
  }

  remover(id: number, categoria: Produto['categoria'] = 'figura'): Observable<void> {
    if (this.fixtureService.estaAtivo()) {
      this.salvarProdutos(this.obterProdutos().filter((item) => item.id !== id));
      return of(void 0);
    }

    return this.http.delete<void>(`${this.rotasPorCategoria[categoria]}/${id}`);
  }

  private obterProdutos(): Produto[] {
    return this.fixtureService.obterProdutos();
  }

  private salvarProdutos(produtos: Produto[]): void {
    this.fixtureService.salvarProdutos(produtos);
  }

  private filtrar(produtos: Produto[], filtros: FiltrosProduto): Produto[] {
    const busca = filtros.busca?.trim().toLowerCase();
    return produtos.filter((produto) => {
      const passaBusca = !busca || produto.nome.toLowerCase().includes(busca);
      const passaCategoria = !filtros.categoria || produto.categoria === filtros.categoria;
      const passaPrecoMin = filtros.precoMin == null || produto.preco >= filtros.precoMin;
      const passaPrecoMax = filtros.precoMax == null || produto.preco <= filtros.precoMax;
      return passaBusca && passaCategoria && passaPrecoMin && passaPrecoMax;
    });
  }

  private buildParams(filtros: FiltrosProduto): Record<string, string> {
    const params: Record<string, string> = {};
    if (filtros.busca) params['busca'] = filtros.busca;
    if (filtros.precoMin !== undefined) params['precoMin'] = String(filtros.precoMin);
    if (filtros.precoMax !== undefined) params['precoMax'] = String(filtros.precoMax);
    if (filtros.pagina !== undefined) params['pagina'] = String(filtros.pagina);
    if (filtros.itensPorPagina !== undefined) params['itensPorPagina'] = String(filtros.itensPorPagina);
    return params;
  }
}
