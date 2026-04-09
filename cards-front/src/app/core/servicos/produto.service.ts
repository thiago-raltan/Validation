import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Produto, FiltrosProduto, CategoriaProduto } from '../modelos/produto.model';
import { RespostaPaginada } from '../modelos/carta.model';
import { normalizarRespostaPaginada } from './api-normalizer.util';
import { obterImagemFallbackProduto, resolverUrlImagem } from './imagem-fallback.util';
import { FixtureService } from './fixture.service';

/**
 * Serviço público de produtos (pelúcias, figuras, boxes, acessórios).
 * Apenas leitura — operações de escrita ficam no AdminProdutoService.
 */
@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly rotasPorCategoria: Record<'figura' | 'pelucia' | 'box' | 'acessorio', string> = {
    figura: `${environment.apiUrl}/figuras`,
    pelucia: `${environment.apiUrl}/pelucias`,
    box: `${environment.apiUrl}/caixas`,
    acessorio: `${environment.apiUrl}/caixas`,
  };
  private readonly cacheProdutos = new Map<number, Produto>();

  constructor(private http: HttpClient, private fixtureService: FixtureService) {}

  /** Lista produtos com filtros e paginação */
  listarProdutos(filtros: FiltrosProduto = {}): Observable<RespostaPaginada<Produto>> {
    const pagina = filtros.pagina ?? 1;
    const itensPorPagina = filtros.itensPorPagina ?? 20;

    if (this.fixtureService.estaAtivo()) {
      return this.listarProdutosComFixtures(filtros, pagina, itensPorPagina);
    }

    if (filtros.categoria) {
      const categoria = filtros.categoria;
      return this.buscarPorCategoria(categoria, filtros).pipe(
        map((resposta) => this.normalizarPaginacao(resposta, categoria, pagina, itensPorPagina))
      );
    }

    return forkJoin([
      this.buscarPorCategoria('figura', filtros),
      this.buscarPorCategoria('pelucia', filtros),
      this.buscarPorCategoria('box', filtros),
    ]).pipe(
      map(([figuras, pelucias, caixas]) => {
        const itens = [
          ...this.extrairItens(figuras, 'figura'),
          ...this.extrairItens(pelucias, 'pelucia'),
          ...this.extrairItens(caixas, 'box'),
        ];

        const filtrados = this.filtrarNoCliente(itens, filtros);
        return this.paginar(filtrados, pagina, itensPorPagina);
      })
    );
  }

  /** Busca um produto pelo ID */
  buscarProdutoPorId(id: number): Observable<Produto> {
    const fixture = this.fixtureService.obterProdutoPorId(id);
    const produtoCache = this.cacheProdutos.get(id);

    if (produtoCache) {
      return of(produtoCache);
    }

    if (this.fixtureService.estaAtivo() && fixture) {
      const produtoFixture = this.normalizarProduto(fixture);
      this.registrarNoCache([produtoFixture]);
      return of(produtoFixture);
    }

    return this.http.get<unknown>(`${this.rotasPorCategoria.figura}/${id}`).pipe(
      map((item) => this.mapearProduto(item, 'figura')),
      catchError(() =>
        this.http.get<unknown>(`${this.rotasPorCategoria.pelucia}/${id}`).pipe(
          map((item) => this.mapearProduto(item, 'pelucia')),
          catchError(() =>
            this.http
              .get<unknown>(`${this.rotasPorCategoria.box}/${id}`)
              .pipe(
                map((item) => this.mapearProduto(item, 'box')),
                catchError((erro) => {
                  if (this.fixtureService.estaAtivo() && fixture) {
                    return of(fixture);
                  }

                  return throwError(() => erro);
                })
              )
          )
        )
      )
    );
  }

  /** Lista as categorias disponíveis */
  buscarCategorias(): Observable<CategoriaProduto[]> {
    return of(['figura', 'pelucia', 'box', 'acessorio']);
  }

  private buscarPorCategoria(categoria: CategoriaProduto, filtros: FiltrosProduto): Observable<unknown> {
    if (categoria === 'acessorio') {
      return of([] as unknown[]);
    }

    let params = new HttpParams();
    if (filtros.busca) params = params.set('busca', filtros.busca);
    if (filtros.precoMin != null) params = params.set('precoMin', String(filtros.precoMin));
    if (filtros.precoMax != null) params = params.set('precoMax', String(filtros.precoMax));
    if (filtros.pagina != null) params = params.set('pagina', String(filtros.pagina));
    if (filtros.itensPorPagina != null) params = params.set('itensPorPagina', String(filtros.itensPorPagina));
    return this.http.get<unknown>(this.rotasPorCategoria[categoria], { params });
  }

  private normalizarPaginacao(
    resposta: unknown,
    categoria: CategoriaProduto,
    pagina: number,
    itensPorPagina: number
  ): RespostaPaginada<Produto> {
    if (Array.isArray(resposta)) {
      const dados = resposta.map((item) => this.mapearProduto(item, categoria));
      this.registrarNoCache(dados);
      return this.paginar(dados, pagina, itensPorPagina);
    }

    const paginada = normalizarRespostaPaginada<unknown>(resposta);
    const dados = paginada.dados.map((item) => this.mapearProduto(item, categoria));
    this.registrarNoCache(dados);
    return {
      dados,
      total: paginada.total,
      pagina: paginada.pagina,
      itensPorPagina: paginada.itensPorPagina,
      totalPaginas: paginada.totalPaginas,
    };
  }

  private extrairItens(resposta: unknown, categoria: CategoriaProduto): Produto[] {
    if (Array.isArray(resposta)) {
      const produtos = resposta.map((item) => this.mapearProduto(item, categoria));
      this.registrarNoCache(produtos);
      return produtos;
    }

    const paginada = normalizarRespostaPaginada<unknown>(resposta);
    const produtos = paginada.dados.map((item) => this.mapearProduto(item, categoria));
    this.registrarNoCache(produtos);
    return produtos;
  }

  private listarProdutosComFixtures(
    filtros: FiltrosProduto,
    pagina: number,
    itensPorPagina: number
  ): Observable<RespostaPaginada<Produto>> {
    const combinados = this.obterFixturesPorCategoria(filtros.categoria).map((produto) => this.normalizarProduto(produto));
    this.registrarNoCache(combinados);
    const filtrados = this.filtrarNoCliente(combinados, filtros);
    return of(this.paginar(filtrados, pagina, itensPorPagina));
  }

  private obterFixturesPorCategoria(categoria?: CategoriaProduto): Produto[] {
    return this.fixtureService.obterProdutos(categoria);
  }

  private filtrarNoCliente(itens: Produto[], filtros: FiltrosProduto): Produto[] {
    return itens.filter((item) => {
      const busca = filtros.busca?.toLowerCase().trim();
      const passaBusca = !busca || item.nome.toLowerCase().includes(busca);
      const passaCategoria = !filtros.categoria || item.categoria === filtros.categoria;
      const passaPrecoMin = filtros.precoMin == null || item.preco >= filtros.precoMin;
      const passaPrecoMax = filtros.precoMax == null || item.preco <= filtros.precoMax;
      return passaBusca && passaCategoria && passaPrecoMin && passaPrecoMax;
    });
  }

  private paginar(itens: Produto[], pagina: number, itensPorPagina: number): RespostaPaginada<Produto> {
    const inicio = (pagina - 1) * itensPorPagina;
    const dados = itens.slice(inicio, inicio + itensPorPagina);
    const total = itens.length;
    return {
      dados,
      total,
      pagina,
      itensPorPagina,
      totalPaginas: Math.max(1, Math.ceil(total / itensPorPagina)),
    };
  }

  private mapearProduto(item: unknown, categoria: CategoriaProduto): Produto {
    const dados = (item ?? {}) as Record<string, unknown>;
    return this.normalizarProduto({
      id: Number(dados['id']),
      nome: String(dados['nome'] ?? ''),
      descricao: String(dados['descricao'] ?? ''),
      preco: Number(dados['preco'] ?? 0),
      categoria,
      imagemUrl: String(dados['imagemUrl'] ?? ''),
      quantidadeEstoque: Number(dados['quantidadeEstoque'] ?? 0),
      destaque: Boolean(dados['destaque']),
    });
  }

  private normalizarProduto(produto: Produto): Produto {
    return {
      ...produto,
      imagemUrl: resolverUrlImagem(produto.imagemUrl, obterImagemFallbackProduto(produto.categoria)),
    };
  }

  private registrarNoCache(produtos: Produto[]): void {
    for (const produto of produtos) {
      this.cacheProdutos.set(produto.id, this.normalizarProduto(produto));
    }
  }
}
