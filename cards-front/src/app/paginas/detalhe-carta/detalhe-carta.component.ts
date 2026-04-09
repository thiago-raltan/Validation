import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { catchError, finalize, of, timeout } from 'rxjs';
import { CartaService } from '../../core/servicos/carta.service';
import { CarrinhoService } from '../../core/servicos/carrinho.service';
import { obterMensagemErroApi } from '../../core/servicos/api-error.util';
import { Carta } from '../../core/modelos/carta.model';
import { IMAGEM_FALLBACK_CARTA, aplicarFallbackImagem } from '../../core/servicos/imagem-fallback.util';

/**
 * Página de detalhe de uma carta específica.
 * Exibe todas as informações da carta e permite adicionar ao carrinho.
 */
@Component({
  selector: 'app-detalhe-carta',
  standalone: true,
  imports: [NgClass, RouterLink],
  templateUrl: './detalhe-carta.component.html',
  styleUrls: ['./detalhe-carta.component.scss'],
})
export class DetalheCartaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cartaService = inject(CartaService);
  private carrinhoService = inject(CarrinhoService);

  carta: Carta | null = null;
  carregando = true;
  erro = false;
  erroMensagem = '';
  quantidade = 1;
  mensagemSucesso = '';
  readonly imagemFallback = IMAGEM_FALLBACK_CARTA;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarCarta(id);
  }

  /** Carrega os dados da carta pelo ID */
  carregarCarta(id: number): void {
    this.erro = false;
    this.erroMensagem = '';
    this.cartaService
      .buscarCartaPorId(id)
      .pipe(
        timeout(5000),
        catchError((erro) => {
          this.erro = true;
          this.erroMensagem = obterMensagemErroApi(erro);
          return of(null);
        }),
        finalize(() => (this.carregando = false))
      )
      .subscribe((carta) => {
        this.carta = carta;
        if (!carta) {
          this.erro = true;
        }
      });
  }

  /** Incrementa a quantidade desejada */
  incrementarQuantidade(): void {
    if (this.carta && this.quantidade < this.carta.quantidadeEstoque) {
      this.quantidade++;
    }
  }

  /** Decrementa a quantidade desejada */
  decrementarQuantidade(): void {
    if (this.quantidade > 1) {
      this.quantidade--;
    }
  }

  /** Formata preço em Real Brasileiro */
  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  /** Adiciona a carta ao carrinho com a quantidade selecionada */
  adicionarAoCarrinho(): void {
    if (!this.carta) return;
    this.carrinhoService.adicionarCarta(this.carta, this.quantidade);
    this.router.navigate(['/catalogo']);
  }

  /** Retorna a classe CSS com a cor da raridade */
  get classeRaridade(): string {
    const mapa: Record<string, string> = {
      'C': 'raridade--comum',
      'Comum': 'raridade--comum',
      'U': 'raridade--incomum',
      'Incomum': 'raridade--incomum',
      'R': 'raridade--raro',
      'Raro': 'raridade--raro',
      'RR': 'raridade--raro-holo',
      'Raro Holo': 'raridade--raro-holo',
      'RRR': 'raridade--ultra-raro',
      'SR': 'raridade--ultra-raro',
      'AR': 'raridade--ultra-raro',
      'SAR': 'raridade--ultra-raro',
      'Ultra Raro': 'raridade--ultra-raro',
      'HR': 'raridade--secreto',
      'UR': 'raridade--secreto',
      'ACE SPEC': 'raridade--secreto',
      'Secreto': 'raridade--secreto',
    };
    return this.carta ? (mapa[this.carta.raridade] ?? 'raridade--comum') : '';
  }

  /** Verifica se a carta já está no carrinho */
  get jaNoCarrinho(): boolean {
    return this.carta ? this.carrinhoService.estaNoCarrinho(this.carta.id) : false;
  }

  onErroImagem(evento: Event): void {
    aplicarFallbackImagem(evento, this.imagemFallback);
  }
}
