import { ChangeDetectorRef, Component, OnInit, ViewRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartaService } from '../../core/servicos/carta.service';
import { ColecaoService } from '../../core/servicos/colecao.service';
import { CarrinhoService } from '../../core/servicos/carrinho.service';
import { CardCartaComponent } from '../../compartilhado/componentes/card-carta/card-carta.component';
import { Carta } from '../../core/modelos/carta.model';
import { Colecao } from '../../core/modelos/colecao.model';
import { catchError, finalize, of, timeout } from 'rxjs';
import { obterMensagemErroApi } from '../../core/servicos/api-error.util';

/**
 * Página inicial da aplicação.
 * Exibe banner, cartas em destaque e coleções recentes.
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, CommonModule, CardCartaComponent],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
})
export class InicioComponent implements OnInit {
  private cartaService = inject(CartaService);
  private colecaoService = inject(ColecaoService);
  private carrinhoService = inject(CarrinhoService);
  private cdr = inject(ChangeDetectorRef);

  cartasDestaque: Carta[] = [];
  colecoes: Colecao[] = [];
  carregandoCartas = true;
  carregandoColecoes = true;
  mensagemSucesso = '';
  erroCartas = '';
  erroColecoes = '';
  readonly mensagemSemProdutos = 'Aguarde estamos preparando os item, volte novamente amanha';
  readonly mensagemSemDestaques = 'No momento nao ha cartas em destaque.';
  readonly mensagemSemColecoes = 'No momento nao ha colecoes recentes para exibir.';

  ngOnInit(): void {
    this.carregarCartasDestaque();
    this.carregarColecoes();
  }

  /** Carrega cartas em destaque da API */
  carregarCartasDestaque(): void {
    this.erroCartas = '';
    this.cartaService
      .buscarCartasDestaque()
      .pipe(
        timeout(5000),
        catchError((erro) => {
          this.erroCartas = obterMensagemErroApi(erro);
          this.atualizarTela();
          return of([] as Carta[]);
        }),
        finalize(() => {
          this.carregandoCartas = false;
          this.atualizarTela();
        })
      )
      .subscribe((cartas) => {
        this.cartasDestaque = cartas;
        this.atualizarTela();
      });
  }

  /** Carrega coleções mais recentes da API */
  carregarColecoes(): void {
    this.erroColecoes = '';
    this.colecaoService
      .buscarColecoesMaisRecentes(4)
      .pipe(
        timeout(5000),
        catchError((erro) => {
          this.erroColecoes = obterMensagemErroApi(erro);
          this.atualizarTela();
          return of([] as Colecao[]);
        }),
        finalize(() => {
          this.carregandoColecoes = false;
          this.atualizarTela();
        })
      )
      .subscribe((colecoes) => {
        this.colecoes = colecoes;
        this.atualizarTela();
      });
  }

  /** Adiciona carta ao carrinho e exibe mensagem de sucesso */
  adicionarAoCarrinho(carta: Carta): void {
    this.carrinhoService.adicionarCarta(carta);
    this.mensagemSucesso = `"${carta.nome}" adicionado ao carrinho!`;
    setTimeout(() => (this.mensagemSucesso = ''), 3000);
  }

  get avisoCartasDestaque(): string {
    if (this.erroCartas) {
      return this.erroCartas;
    }

    if (this.colecoes.length > 0) {
      return `${this.mensagemSemDestaques} Veja as colecoes recentes abaixo.`;
    }

    return this.mensagemSemProdutos;
  }

  get avisoColecoesRecentes(): string {
    if (this.erroColecoes) {
      return this.erroColecoes;
    }

    return this.mensagemSemColecoes;
  }

  private atualizarTela(): void {
    if (!(this.cdr as ViewRef).destroyed) {
      this.cdr.detectChanges();
    }
  }
}
