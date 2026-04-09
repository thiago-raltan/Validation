import { ChangeDetectorRef, Component, OnInit, ViewRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ColecaoService } from '../../core/servicos/colecao.service';
import { Colecao } from '../../core/modelos/colecao.model';
import { catchError, finalize, of, timeout } from 'rxjs';
import { obterMensagemErroApi } from '../../core/servicos/api-error.util';

/**
 * Página de coleções (conjuntos) disponíveis na loja.
 */
@Component({
  selector: 'app-colecoes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './colecoes.component.html',
  styleUrls: ['./colecoes.component.scss'],
})
export class ColecoesComponent implements OnInit {
  private colecaoService = inject(ColecaoService);
  private cdr = inject(ChangeDetectorRef);

  colecoes: Colecao[] = [];
  carregando = true;
  erroCarregamento = '';
  readonly mensagemSemProdutos = 'Aguarde estamos preparando os item, volte novamente amanhã';
  readonly mensagemSemColecoes = 'No momento nao ha colecoes para exibir.';

  ngOnInit(): void {
    this.erroCarregamento = '';
    this.colecaoService
      .listarColecoes()
      .pipe(
        timeout(5000),
        catchError((erro) => {
          this.erroCarregamento = obterMensagemErroApi(erro);
          this.atualizarTela();
          return of([] as Colecao[]);
        }),
        finalize(() => {
          this.carregando = false;
          this.atualizarTela();
        })
      )
      .subscribe((colecoes) => {
        this.colecoes = colecoes ?? [];
        this.atualizarTela();
      });
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  }

  get mensagemListaVazia(): string {
    return this.mensagemSemColecoes || this.mensagemSemProdutos;
  }

  private atualizarTela(): void {
    if (!(this.cdr as ViewRef).destroyed) {
      this.cdr.detectChanges();
    }
  }
}
