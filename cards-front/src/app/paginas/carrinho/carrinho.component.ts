import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CarrinhoService } from '../../core/servicos/carrinho.service';
import { ItemCarrinho } from '../../core/modelos/carrinho.model';

/**
 * Página do carrinho de compras.
 * Exibe os itens, permite alterar quantidades e calcular o total.
 * Suporta tanto cartas quanto produtos.
 */
@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrinho.component.html',
  styleUrls: ['./carrinho.component.scss'],
})
export class CarrinhoComponent {
  private carrinhoService = inject(CarrinhoService);
  private router = inject(Router);

  /** Itens do carrinho via Signal */
  readonly itens = this.carrinhoService.itens;

  /** Total calculado via Signal */
  readonly total = this.carrinhoService.total;

  /** Subtotal calculado via Signal */
  readonly subtotal = this.carrinhoService.subtotal;

  /** Quantidade total de itens */
  readonly quantidadeTotal = this.carrinhoService.quantidadeTotal;

  /** Retorna o nome exibível do item */
  nomeItem(item: ItemCarrinho): string {
    return item.carta?.nome ?? item.produto?.nome ?? '';
  }

  /** Retorna a imagem do item */
  imagemItem(item: ItemCarrinho): string {
    return item.carta?.imagemUrl ?? item.produto?.imagemUrl ?? 'assets/placeholder.png';
  }

  /** Retorna o preço do item */
  precoItem(item: ItemCarrinho): number {
    return this.carrinhoService.obterPrecoItem(item);
  }

  /** Retorna o estoque disponível do item */
  estoqueItem(item: ItemCarrinho): number {
    return this.carrinhoService.obterEstoqueItem(item);
  }

  /** Retorna a chave única do item */
  chaveItem(item: ItemCarrinho): string {
    return this.carrinhoService.obterChaveItem(item);
  }

  /** Retorna o subtítulo do item (conjunto da carta ou categoria do produto) */
  subtituloItem(item: ItemCarrinho): string {
    if (item.carta) return item.carta.conjunto ?? '';
    if (item.produto) return item.produto.categoria ?? '';
    return '';
  }

  /** Formata preço em Real Brasileiro */
  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  /** Aumenta a quantidade de um item */
  aumentarQuantidade(item: ItemCarrinho): void {
    this.carrinhoService.atualizarQuantidade(
      this.chaveItem(item),
      item.quantidade + 1
    );
  }

  /** Diminui a quantidade de um item */
  diminuirQuantidade(item: ItemCarrinho): void {
    this.carrinhoService.atualizarQuantidade(
      this.chaveItem(item),
      item.quantidade - 1
    );
  }

  /** Remove um item do carrinho */
  removerItem(item: ItemCarrinho): void {
    this.carrinhoService.atualizarQuantidade(this.chaveItem(item), 0);
  }

  /** Limpa todos os itens do carrinho */
  limparCarrinho(): void {
    if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
      this.carrinhoService.limparCarrinho();
    }
  }

  /** Navega para o checkout */
  finalizarPedido(): void {
    this.router.navigate(['/checkout']);
  }
}

