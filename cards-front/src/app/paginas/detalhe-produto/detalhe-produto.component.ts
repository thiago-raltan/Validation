import { Component, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of, timeout } from 'rxjs';
import { Produto } from '../../core/modelos/produto.model';
import { CarrinhoService } from '../../core/servicos/carrinho.service';
import { obterMensagemErroApi } from '../../core/servicos/api-error.util';
import { aplicarFallbackImagem, obterImagemFallbackProduto } from '../../core/servicos/imagem-fallback.util';
import { ProdutoService } from '../../core/servicos/produto.service';

@Component({
  selector: 'app-detalhe-produto',
  standalone: true,
  imports: [NgClass, RouterLink],
  templateUrl: './detalhe-produto.component.html',
  styleUrls: ['./detalhe-produto.component.scss'],
})
export class DetalheProdutoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private produtoService = inject(ProdutoService);
  private carrinhoService = inject(CarrinhoService);

  produto: Produto | null = null;
  carregando = true;
  erro = false;
  erroMensagem = '';
  quantidade = 1;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarProduto(id);
  }

  carregarProduto(id: number): void {
    this.erro = false;
    this.erroMensagem = '';
    this.produtoService
      .buscarProdutoPorId(id)
      .pipe(
        timeout(5000),
        catchError((erro) => {
          this.erro = true;
          this.erroMensagem = obterMensagemErroApi(erro);
          return of(null);
        }),
        finalize(() => (this.carregando = false))
      )
      .subscribe((produto) => {
        this.produto = produto;
        if (!produto) {
          this.erro = true;
        }
      });
  }

  incrementarQuantidade(): void {
    if (this.produto && this.quantidade < this.produto.quantidadeEstoque) {
      this.quantidade++;
    }
  }

  decrementarQuantidade(): void {
    if (this.quantidade > 1) {
      this.quantidade--;
    }
  }

  adicionarAoCarrinho(): void {
    if (!this.produto) {
      return;
    }

    this.carrinhoService.adicionarProduto(this.produto, this.quantidade);
    this.router.navigate(['/produtos']);
  }

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  imagemFallback(): string {
    return obterImagemFallbackProduto(this.produto?.categoria);
  }

  onErroImagem(evento: Event): void {
    aplicarFallbackImagem(evento, this.imagemFallback());
  }

  get jaNoCarrinho(): boolean {
    return this.produto ? this.carrinhoService.produtoEstaNoCarrinho(this.produto.id) : false;
  }
}