import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/servicos/admin.service';
import { ResumoAdmin } from '../../../core/modelos/pedido.model';

/** Dashboard principal do painel administrativo */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  resumo = signal<ResumoAdmin | null>(null);
  carregando = signal(true);
  erro = signal('');

  readonly cards = [
    { chave: 'totalCartas' as keyof ResumoAdmin, label: 'Cartas', icone: '🃏', cor: '#e63946', rota: '/painel/cartas' },
    { chave: 'totalProdutos' as keyof ResumoAdmin, label: 'Produtos', icone: '📦', cor: '#457b9d', rota: '/painel/produtos' },
    { chave: 'totalPedidos' as keyof ResumoAdmin, label: 'Pedidos', icone: '🛒', cor: '#2a9d8f', rota: '/painel/pedidos' },
    { chave: 'pedidosPendentes' as keyof ResumoAdmin, label: 'Pendentes', icone: '⏳', cor: '#f59e0b', rota: '/painel/pedidos' },
    { chave: 'totalUsuarios' as keyof ResumoAdmin, label: 'Usuários', icone: '👥', cor: '#8b5cf6', rota: '/painel/usuarios' },
  ];

  ngOnInit(): void {
    this.adminService.obterResumo().subscribe({
      next: (dados) => {
        this.resumo.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar o resumo.');
        this.carregando.set(false);
      },
    });
  }

  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  obterValor(chave: keyof ResumoAdmin): number {
    return (this.resumo()?.[chave] as number) ?? 0;
  }
}
