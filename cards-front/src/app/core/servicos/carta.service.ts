import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { normalizarRespostaPaginada } from './api-normalizer.util';
import { paginarLista, mesclarListasPorId } from './dev-fixture.util';
import { IMAGEM_FALLBACK_CARTA, resolverUrlImagem } from './imagem-fallback.util';
import { FixtureService } from './fixture.service';
import {
  Carta,
  FiltrosCarta,
  RespostaPaginada,
} from '../modelos/carta.model';

/**
 * Serviço responsável por buscar cartas na API.
 * Todos os métodos retornam Observables para uso assíncrono.
 */
@Injectable({
  providedIn: 'root',
})
export class CartaService {
  private readonly urlBase = `${environment.apiUrl}/cartas`;
  private readonly cacheCartas = new Map<number, Carta>();

  constructor(private http: HttpClient, private fixtureService: FixtureService) {}

  /** Busca lista paginada de cartas com filtros opcionais */
  listarCartas(filtros: FiltrosCarta = {}): Observable<RespostaPaginada<Carta>> {
    const pagina = filtros.pagina ?? 1;
    const itensPorPagina = filtros.itensPorPagina ?? 20;

    if (this.fixtureService.estaAtivo()) {
      return of(this.montarRespostaComFixtures([], filtros, pagina, itensPorPagina));
    }

    return this.http
      .get<unknown>(this.urlBase, { params: this.criarParams(filtros) })
      .pipe(
        map((resposta) => {
          return this.normalizarResposta(normalizarRespostaPaginada<Carta>(resposta));
        }),
        catchError((erro) => throwError(() => erro))
      );
  }

  /** Busca uma carta específica pelo ID */
  buscarCartaPorId(id: number): Observable<Carta> {
    const cartaCache = this.cacheCartas.get(id);
    if (cartaCache) {
      return of(cartaCache);
    }

    const fixture = this.fixtureService.obterCartaPorId(id);
    if (this.fixtureService.estaAtivo() && fixture) {
      this.registrarNoCache([fixture]);
      return of(fixture);
    }

    return this.http.get<Carta>(`${this.urlBase}/${id}`).pipe(
      map((carta) => {
        const cartaNormalizada = this.normalizarCarta(carta);
        this.registrarNoCache([cartaNormalizada]);
        return cartaNormalizada;
      }),
      catchError((erro) => {
        if (this.fixtureService.estaAtivo() && fixture) {
          return of(fixture);
        }

        return throwError(() => erro);
      })
    );
  }

  /** Busca cartas em destaque para a página inicial */
  buscarCartasDestaque(): Observable<Carta[]> {
    const cartasFixture = this.fixtureService.obterCartasDestaque();

    if (this.fixtureService.estaAtivo()) {
      this.registrarNoCache(cartasFixture);
      return of(cartasFixture);
    }

    return this.http.get<unknown>(`${this.urlBase}/destaque`).pipe(
      map((resposta) => {
        if (Array.isArray(resposta)) {
          const cartas = (resposta as Carta[]).map((carta) => this.normalizarCarta(carta));

          this.registrarNoCache(cartas);
          return cartas;
        }

        const cartas = this.normalizarResposta(normalizarRespostaPaginada<Carta>(resposta)).dados;
        this.registrarNoCache(cartas);
        return cartas;
      }),
      catchError((erro) => throwError(() => erro))
    );
  }

  /** Busca os tipos disponíveis (ex.: Fogo, Água, Planta...) */
  buscarTipos(): Observable<string[]> {
    return this.listarCartas({ pagina: 1, itensPorPagina: 300 }).pipe(
      map((resposta) => {
        const tipos = resposta.dados.map((carta) => carta.tipo).filter(Boolean);
        return Array.from(new Set(tipos)).sort((a, b) => a.localeCompare(b));
      })
    );
  }

  /** Busca as raridades disponíveis */
  buscarRaridades(): Observable<string[]> {
    return this.listarCartas({ pagina: 1, itensPorPagina: 300 }).pipe(
      map((resposta) => {
        const raridades = resposta.dados.map((carta) => carta.raridade).filter(Boolean);
        return Array.from(new Set(raridades)).sort((a, b) => a.localeCompare(b));
      })
    );
  }

  private criarParams(filtros: FiltrosCarta): HttpParams {
    let params = new HttpParams();

    if (filtros.busca) {
      params = params.set('busca', filtros.busca);
    }
    if (filtros.conjuntoId) {
      params = params.set('conjuntoId', filtros.conjuntoId.toString());
    }
    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros.raridade) {
      params = params.set('raridade', filtros.raridade);
    }
    if (filtros.precoMin !== undefined) {
      params = params.set('precoMin', filtros.precoMin.toString());
    }
    if (filtros.precoMax !== undefined) {
      params = params.set('precoMax', filtros.precoMax.toString());
    }
    if (filtros.pagina !== undefined) {
      params = params.set('pagina', filtros.pagina.toString());
    }
    if (filtros.itensPorPagina !== undefined) {
      params = params.set('itensPorPagina', filtros.itensPorPagina.toString());
    }

    return params;
  }

  private montarRespostaComFixtures(
    backend: Carta[],
    filtros: FiltrosCarta,
    pagina: number,
    itensPorPagina: number
  ): RespostaPaginada<Carta> {
    const combinadas = mesclarListasPorId(
      backend.map((carta) => this.normalizarCarta(carta)),
      this.fixtureService.obterCartas().map((carta) => this.normalizarCarta(carta))
    );
    this.registrarNoCache(combinadas);
    const filtradas = this.filtrarCartas(combinadas, filtros);
    return paginarLista(filtradas, pagina, itensPorPagina);
  }

  private normalizarResposta(resposta: RespostaPaginada<Carta>): RespostaPaginada<Carta> {
    return {
      ...resposta,
      dados: resposta.dados.map((carta) => this.normalizarCarta(carta)),
    };
  }

  private normalizarCarta(carta: Carta): Carta {
    return {
      ...carta,
      imagemUrl: resolverUrlImagem(carta.imagemUrl, IMAGEM_FALLBACK_CARTA),
    };
  }

  private registrarNoCache(cartas: Carta[]): void {
    for (const carta of cartas) {
      this.cacheCartas.set(carta.id, carta);
    }
  }

  private filtrarCartas(cartas: Carta[], filtros: FiltrosCarta): Carta[] {
    const busca = filtros.busca?.trim().toLowerCase();
    const tipo = filtros.tipo?.trim().toLowerCase();
    const raridade = filtros.raridade?.trim().toLowerCase();

    return cartas.filter((carta) => {
      const passaBusca =
        !busca ||
        carta.nome.toLowerCase().includes(busca) ||
        carta.descricao.toLowerCase().includes(busca) ||
        carta.conjunto.toLowerCase().includes(busca);
      const passaConjunto = !filtros.conjuntoId || carta.conjuntoId === filtros.conjuntoId;
      const passaTipo = !tipo || carta.tipo.toLowerCase() === tipo;
      const passaRaridade = !raridade || carta.raridade.toLowerCase() === raridade;
      const passaPrecoMin = filtros.precoMin == null || carta.preco >= filtros.precoMin;
      const passaPrecoMax = filtros.precoMax == null || carta.preco <= filtros.precoMax;
      return passaBusca && passaConjunto && passaTipo && passaRaridade && passaPrecoMin && passaPrecoMax;
    });
  }
}
