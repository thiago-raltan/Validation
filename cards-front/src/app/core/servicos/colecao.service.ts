import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Colecao } from '../modelos/colecao.model';
import { Carta } from '../modelos/carta.model';
import { normalizarRespostaPaginada } from './api-normalizer.util';
import { mesclarListasPorId } from './dev-fixture.util';
import { FixtureService } from './fixture.service';

/**
 * Serviço responsável por buscar coleções/conjuntos de cartas na API.
 */
@Injectable({
  providedIn: 'root',
})
export class ColecaoService {
  private readonly urlBase = `${environment.apiUrl}/cartas`;

  constructor(private http: HttpClient, private fixtureService: FixtureService) {}

  /** Retorna todas as coleções disponíveis */
  listarColecoes(): Observable<Colecao[]> {
    if (this.fixtureService.estaAtivo()) {
      return of(this.mesclarColecoes([]));
    }

    return this.http
      .get<unknown>(this.urlBase, {
        params: { pagina: '1', itensPorPagina: '500' },
      })
      .pipe(
        map((resposta) => {
          return this.mapearColecoes(normalizarRespostaPaginada<Carta>(resposta).dados);
        }),
        catchError((erro) => {
          throw erro;
        })
      );
  }

  /** Retorna uma coleção pelo ID */
  buscarColecaoPorId(id: number): Observable<Colecao> {
    return this.listarColecoes().pipe(
      map((colecoes) => {
        const colecao = colecoes.find((item) => item.id === id);
        if (!colecao) {
          throw new Error('Colecao nao encontrada');
        }
        return colecao;
      })
    );
  }

  /** Retorna as coleções mais recentes para exibir na página inicial */
  buscarColecoesMaisRecentes(quantidade = 4): Observable<Colecao[]> {
    return this.listarColecoes().pipe(map((colecoes) => colecoes.slice(0, quantidade)));
  }

  private mapearColecoes(cartas: Carta[]): Colecao[] {
    const agrupado = new Map<number, Colecao>();

    for (const carta of cartas) {
      const id = carta.conjuntoId;
      if (!id) {
        continue;
      }

      const existente = agrupado.get(id);
      if (existente) {
        existente.totalCartas += 1;
        continue;
      }

      agrupado.set(id, {
        id,
        nome: carta.conjunto,
        descricao: `Colecao ${carta.conjunto}`,
        imagemUrl: carta.imagemUrl,
        logoUrl: '',
        dataLancamento: '',
        totalCartas: 1,
        serie: '',
      });
    }

    return Array.from(agrupado.values());
  }

  private mesclarColecoes(colecoesBackend: Colecao[]): Colecao[] {
    const combinadas = mesclarListasPorId(colecoesBackend, this.fixtureService.obterColecoes(), (backend, fixture) => ({
      ...backend,
      descricao: fixture.descricao || backend.descricao,
      imagemUrl: backend.imagemUrl || fixture.imagemUrl,
      logoUrl: backend.logoUrl || fixture.logoUrl,
      dataLancamento: backend.dataLancamento || fixture.dataLancamento,
      totalCartas: backend.totalCartas || fixture.totalCartas,
      serie: backend.serie || fixture.serie,
    }));

    return combinadas.sort((a, b) => {
      const porData = (b.dataLancamento || '').localeCompare(a.dataLancamento || '');
      if (porData !== 0) {
        return porData;
      }

      return a.nome.localeCompare(b.nome);
    });
  }
}
