import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { timeout } from 'rxjs';
import { PedidoService } from '../../core/servicos/pedido.service';
import { obterMensagemErroApi } from '../../core/servicos/api-error.util';
import { Pedido, STATUS_PEDIDO, COR_STATUS_PEDIDO, StatusPedido } from '../../core/modelos/pedido.model';

/**
 * Página de histórico de pedidos do usuário logado.
 */
@Component({
  selector: 'app-meus-pedidos',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './meus-pedidos.component.html',
  styleUrls: ['./meus-pedidos.component.scss'],
})
export class MeusPedidosComponent implements OnInit {
  private pedidoService = inject(PedidoService);

  pedidos = signal<Pedido[]>([]);
  carregando = signal(true);
  erro = signal('');
  pedidoExpandido = signal<number | null>(null);
  readonly mensagemSemPedidos = 'Você não possui pedidos no momento.';
  readonly mensagemErroHistorico = 'Erro ao carregar histórico de pedidos.';

  ngOnInit(): void {
    this.carregarPedidos();
  }

  carregarPedidos(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.pedidos.set([]);

    this.pedidoService
      .meusPedidos()
      .pipe(timeout(5000))
      .subscribe({
        next: (pedidos) => {
          this.pedidos.set(pedidos);
          this.carregando.set(false);
        },
        error: (erro) => {
          this.erro.set(obterMensagemErroApi(erro) || this.mensagemErroHistorico);
          this.carregando.set(false);
        },
      });
  }

  alternarDetalhe(id: number): void {
    this.pedidoExpandido.set(this.pedidoExpandido() === id ? null : id);
  }

  labelStatus(status: StatusPedido): string {
    return STATUS_PEDIDO[status] ?? status;
  }

  corStatus(status: StatusPedido): string {
    return COR_STATUS_PEDIDO[status] ?? '#6c757d';
  }

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);
  }
}
