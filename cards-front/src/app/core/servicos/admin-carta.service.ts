import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Carta, FiltrosCarta, RespostaPaginada } from '../modelos/carta.model';
import { normalizarRespostaPaginada } from './api-normalizer.util';
import { gerarProximoId, lerArquivoComoDataUrl } from './admin-fixture.store';
import { paginarLista } from './dev-fixture.util';
import { FixtureService } from './fixture.service';

type RespostaUploadDireta = { url?: string; imagemUrl?: string; caminho?: string };
type RespostaUploadEncapsulada = { data?: RespostaUploadDireta };
type RespostaUpload = RespostaUploadDireta | RespostaUploadEncapsulada | string;

/**
 * Serviço para gerenciamento de cartas no painel admin (CRUD completo).
 */
@Injectable({ providedIn: 'root' })
export class AdminCartaService {
  private readonly urlBase = `${environment.apiUrl}/cartas`;

  constructor(private http: HttpClient, private fixtureService: FixtureService) {}

  listar(filtros: FiltrosCarta = {}): Observable<RespostaPaginada<Carta>> {
    if (this.fixtureService.estaAtivo()) {
      const cartas = this.filtrar(this.obterCartas(), filtros);
      return of(paginarLista(cartas, filtros.pagina ?? 1, filtros.itensPorPagina ?? 20));
    }

    const params: Record<string, string> = {};
    if (filtros.busca) params['busca'] = filtros.busca;
    if (filtros.conjuntoId) params['conjuntoId'] = String(filtros.conjuntoId);
    if (filtros.tipo) params['tipo'] = filtros.tipo;
    if (filtros.raridade) params['raridade'] = filtros.raridade;
    if (filtros.pagina !== undefined) params['pagina'] = String(filtros.pagina);
    if (filtros.itensPorPagina !== undefined) params['itensPorPagina'] = String(filtros.itensPorPagina);
    return this.http
      .get<unknown>(this.urlBase, { params })
      .pipe(map((resposta) => normalizarRespostaPaginada<Carta>(resposta)));
  }

  buscarPorId(id: number): Observable<Carta> {
    if (this.fixtureService.estaAtivo()) {
      const carta = this.obterCartas().find((item) => item.id === id);
      return carta ? of(carta) : throwError(() => new Error('Carta nao encontrada.'));
    }

    return this.http.get<Carta>(`${this.urlBase}/${id}`);
  }

  criar(carta: Partial<Carta>): Observable<Carta> {
    if (this.fixtureService.estaAtivo()) {
      const cartas = this.obterCartas();
      const novaCarta = {
        ...carta,
        id: gerarProximoId(cartas, 9101),
      } as Carta;
      cartas.unshift(novaCarta);
      this.salvarCartas(cartas);
      return of(novaCarta);
    }

    return this.http.post<Carta>(this.urlBase, carta);
  }

  atualizar(id: number, carta: Partial<Carta>): Observable<Carta> {
    if (this.fixtureService.estaAtivo()) {
      const cartas = this.obterCartas();
      const indice = cartas.findIndex((item) => item.id === id);
      if (indice < 0) {
        return throwError(() => new Error('Carta nao encontrada.'));
      }

      const atualizada = { ...cartas[indice], ...carta, id } as Carta;
      cartas[indice] = atualizada;
      this.salvarCartas(cartas);
      return of(atualizada);
    }

    return this.http.put<Carta>(`${this.urlBase}/${id}`, carta);
  }

  uploadImagem(arquivo: File): Observable<string> {
    if (this.fixtureService.estaAtivo()) {
      return lerArquivoComoDataUrl(arquivo);
    }

    const dados = new FormData();
    dados.append('arquivo', arquivo);

    return this.http
      .post<RespostaUpload>(
        `${environment.apiUrl}/uploads/cards`,
        dados,
      )
      .pipe(
        map((resposta) => {
          if (typeof resposta === 'string') {
            return resposta;
          }

          const data = ('data' in resposta ? resposta.data : resposta) as RespostaUploadDireta | undefined;
          return data?.url ?? data?.imagemUrl ?? data?.caminho ?? '';
        }),
      );
  }

  remover(id: number): Observable<void> {
    if (this.fixtureService.estaAtivo()) {
      this.salvarCartas(this.obterCartas().filter((item) => item.id !== id));
      return of(void 0);
    }

    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }

  private obterCartas(): Carta[] {
    return this.fixtureService.obterCartas();
  }

  private salvarCartas(cartas: Carta[]): void {
    this.fixtureService.salvarCartas(cartas);
  }

  private filtrar(cartas: Carta[], filtros: FiltrosCarta): Carta[] {
    const busca = filtros.busca?.trim().toLowerCase();
    const tipo = filtros.tipo?.trim().toLowerCase();
    const raridade = filtros.raridade?.trim().toLowerCase();

    return cartas.filter((carta) => {
      const passaBusca = !busca || carta.nome.toLowerCase().includes(busca) || carta.conjunto.toLowerCase().includes(busca);
      const passaConjunto = !filtros.conjuntoId || carta.conjuntoId === filtros.conjuntoId;
      const passaTipo = !tipo || carta.tipo.toLowerCase() === tipo;
      const passaRaridade = !raridade || carta.raridade.toLowerCase() === raridade;
      return passaBusca && passaConjunto && passaTipo && passaRaridade;
    });
  }
}
