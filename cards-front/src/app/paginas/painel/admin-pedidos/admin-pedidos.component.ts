import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../../core/servicos/admin.service';
import { Pedido, STATUS_PEDIDO, COR_STATUS_PEDIDO, StatusPedido } from '../../../core/modelos/pedido.model';

/** Gerenciamento de pedidos no painel admin */
@Component({
  selector: 'app-admin-pedidos',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './admin-pedidos.component.html',
  styleUrls: ['./admin-pedidos.component.scss'],
})
export class AdminPedidosComponent implements OnInit {
  private adminService = inject(AdminService);

  pedidos = signal<Pedido[]>([]);
  carregando = signal(true);
  pagina = signal(1);
  total = signal(0);
  readonly itensPorPagina = 20;

  pedidoDetalhe = signal<Pedido | null>(null);
  carregandoDetalhe = signal(false);

  readonly statusOpcoes = Object.entries(STATUS_PEDIDO) as [StatusPedido, string][];

  ngOnInit(): void { this.carregarDados(); }

  carregarDados(): void {
    this.carregando.set(true);
    this.adminService.listarPedidos(this.pagina(), this.itensPorPagina).subscribe({
      next: (res) => {
        this.pedidos.set(res.dados);
        this.total.set(res.total);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  abrirDetalhe(pedido: Pedido): void {
    this.carregandoDetalhe.set(true);
    this.pedidoDetalhe.set(pedido);
    this.adminService.buscarPedidoPorId(pedido.id).subscribe({
      next: (p) => {
        this.pedidoDetalhe.set(p);
        this.carregandoDetalhe.set(false);
      },
      error: () => this.carregandoDetalhe.set(false),
    });
  }

  fecharDetalhe(): void {
    this.pedidoDetalhe.set(null);
  }

  atualizarStatus(pedido: Pedido, event: Event): void {
    const novoStatus = (event.target as HTMLSelectElement).value as StatusPedido;
    if (!novoStatus || novoStatus === pedido.status) return;
    this.adminService.atualizarStatusPedido(pedido.id, novoStatus).subscribe({
      next: () => this.carregarDados(),
    });
  }

  labelStatus(status: StatusPedido): string {
    return STATUS_PEDIDO[status] ?? status;
  }

  corStatus(status: StatusPedido): string {
    return COR_STATUS_PEDIDO[status] ?? '#6c757d';
  }

  totalPaginas(): number {
    return Math.ceil(this.total() / this.itensPorPagina);
  }

  irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas()) return;
    this.pagina.set(p);
    this.carregarDados();
  }

  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
