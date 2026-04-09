import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Colecao } from '../modelos/colecao.model';
import { Carta } from '../modelos/carta.model';
import { normalizarRespostaPaginada } from './api-normalizer.util';
import { gerarProximoId, lerArquivoComoDataUrl } from './admin-fixture.store';
import { FixtureService } from './fixture.service';

type RespostaUploadDireta = { url?: string; imagemUrl?: string; caminho?: string };
type RespostaUploadEncapsulada = { data?: RespostaUploadDireta };
type RespostaUpload = RespostaUploadDireta | RespostaUploadEncapsulada | string;

/**
 * Serviço para gerenciamento de coleções no painel admin (CRUD completo).
 */
@Injectable({ providedIn: 'root' })
export class AdminColecaoService {
  private readonly urlBase = `${environment.apiUrl}/cartas`;

  constructor(private http: HttpClient, private fixtureService: FixtureService) {}

  listar(): Observable<Colecao[]> {
    if (this.fixtureService.estaAtivo()) {
      return of(this.obterColecoes());
    }

    return this.http
      .get<unknown>(this.urlBase, {
        params: { pagina: '1', itensPorPagina: '500' },
      })
      .pipe(map((resposta) => this.mapearColecoes(normalizarRespostaPaginada<Carta>(resposta).dados)));
  }

  buscarPorId(id: number): Observable<Colecao> {
    if (this.fixtureService.estaAtivo()) {
      const colecao = this.obterColecoes().find((item) => item.id === id);
      return colecao ? of(colecao) : throwError(() => new Error('Colecao nao encontrada'));
    }

    return this.listar().pipe(
      map((colecoes) => {
        const colecao = colecoes.find((item) => item.id === id);
        if (!colecao) {
          throw new Error('Colecao nao encontrada');
        }
        return colecao;
      })
    );
  }

  criar(colecao: Partial<Colecao>): Observable<Colecao> {
    if (this.fixtureService.estaAtivo()) {
      const colecoes = this.obterColecoes();
      const novaColecao = {
        totalCartas: 0,
        logoUrl: '',
        serie: '',
        dataLancamento: '',
        ...colecao,
        id: gerarProximoId(colecoes, 801),
      } as Colecao;
      colecoes.unshift(novaColecao);
      this.salvarColecoes(colecoes);
      return of(novaColecao);
    }

    return throwError(() => new Error('API atual nao possui rota para criar colecoes.'));
  }

  atualizar(id: number, colecao: Partial<Colecao>): Observable<Colecao> {
    if (this.fixtureService.estaAtivo()) {
      const colecoes = this.obterColecoes();
      const indice = colecoes.findIndex((item) => item.id === id);
      if (indice < 0) {
        return throwError(() => new Error('Colecao nao encontrada'));
      }

      const atualizada = { ...colecoes[indice], ...colecao, id } as Colecao;
      colecoes[indice] = atualizada;
      this.salvarColecoes(colecoes);
      return of(atualizada);
    }

    return throwError(() => new Error('API atual nao possui rota para atualizar colecoes.'));
  }

  uploadImagem(arquivo: File): Observable<string> {
    if (this.fixtureService.estaAtivo()) {
      return lerArquivoComoDataUrl(arquivo);
    }

    return this.uploadArquivo('colecoes', arquivo);
  }

  uploadLogo(arquivo: File): Observable<string> {
    if (this.fixtureService.estaAtivo()) {
      return lerArquivoComoDataUrl(arquivo);
    }

    return this.uploadArquivo('colecoes/logos', arquivo);
  }

  private uploadArquivo(destino: string, arquivo: File): Observable<string> {
    const dados = new FormData();
    dados.append('arquivo', arquivo);

    return this.http
      .post<RespostaUpload>(`${environment.apiUrl}/uploads/${destino}`, dados)
      .pipe(
        map((resposta) => {
          if (typeof resposta === 'string') {
            return resposta;
          }

          const data = ('data' in resposta ? resposta.data : resposta) as RespostaUploadDireta | undefined;

          return data?.url ?? data?.imagemUrl ?? data?.caminho ?? '';
        })
      );
  }

  remover(id: number): Observable<void> {
    if (this.fixtureService.estaAtivo()) {
      this.salvarColecoes(this.obterColecoes().filter((item) => item.id !== id));
      return of(void 0);
    }

    return throwError(() => new Error('API atual nao possui rota para remover colecoes.'));
  }

  private obterColecoes(): Colecao[] {
    return this.fixtureService.obterColecoes();
  }

  private salvarColecoes(colecoes: Colecao[]): void {
    this.fixtureService.salvarColecoes(colecoes);
  }

  private mapearColecoes(cartas: Carta[]): Colecao[] {
    const agrupado = new Map<number, Colecao>();

    for (const carta of cartas) {
      const id = carta.conjuntoId;
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
}
