import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { Carta } from '../../../core/modelos/carta.model';
import { IMAGEM_FALLBACK_CARTA, aplicarFallbackImagem } from '../../../core/servicos/imagem-fallback.util';

/**
 * Componente reutilizável que exibe o card de uma carta.
 * Pode ser usado no catálogo, página inicial e busca.
 */
@Component({
  selector: 'app-card-carta',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './card-carta.component.html',
  styleUrls: ['./card-carta.component.scss'],
})
export class CardCartaComponent {
  readonly imagemFallback = IMAGEM_FALLBACK_CARTA;

  /** Dados da carta a ser exibida */
  @Input({ required: true }) carta!: Carta;

  /** Emite evento ao clicar em "Adicionar ao carrinho" */
  @Output() adicionarAoCarrinho = new EventEmitter<Carta>();

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
    return mapa[this.carta.raridade] ?? 'raridade--comum';
  }

  /** Formata preço em Real Brasileiro */
  get precoFormatado(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.carta.preco);
  }

  /** Verifica se a carta está disponível em estoque */
  get emEstoque(): boolean {
    return this.carta.quantidadeEstoque > 0;
  }

  /** Dispara o evento de adicionar ao carrinho */
  onAdicionarCarrinho(evento: Event): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.adicionarAoCarrinho.emit(this.carta);
  }

  onErroImagem(evento: Event): void {
    aplicarFallbackImagem(evento, this.imagemFallback);
  }
}
