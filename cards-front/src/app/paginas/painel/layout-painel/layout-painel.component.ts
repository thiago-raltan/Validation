import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuthService } from '../../../core/servicos/admin-auth.service';

/** Shell do painel administrativo: sidebar + topbar + área de conteúdo */
@Component({
  selector: 'app-layout-painel',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout-painel.component.html',
  styleUrls: ['./layout-painel.component.scss'],
})
export class LayoutPainelComponent {
  private adminAuth = inject(AdminAuthService);

  readonly nomeAdmin = this.adminAuth.nomeAdmin;
  readonly rotuloPerfilAdmin = this.adminAuth.rotuloPerfilAdmin;
  sidebarAberta = signal(true);
  menuPerfilAberto = false;
  confirmarSaidaAberta = false;

  alternarSidebar(): void {
    this.sidebarAberta.update((v) => !v);
  }

  alternarMenuPerfil(): void {
    this.menuPerfilAberto = !this.menuPerfilAberto;
  }

  fecharMenuPerfil(): void {
    this.menuPerfilAberto = false;
  }

  solicitarSaida(): void {
    this.menuPerfilAberto = false;
    this.confirmarSaidaAberta = true;
  }

  fecharConfirmacaoSaida(): void {
    this.confirmarSaidaAberta = false;
  }

  sair(): void {
    this.confirmarSaidaAberta = false;
    this.menuPerfilAberto = false;
    this.adminAuth.logout();
  }

  readonly menus = [
    { rota: '/painel/dashboard', icone: '📊', label: 'Dashboard' },
    { rota: '/painel/cartas', icone: '🎴', label: 'Cartas' },
    { rota: '/painel/colecoes', icone: '🗂️', label: 'Coleções' },
    { rota: '/painel/produtos', icone: '📦', label: 'Produtos' },
    { rota: '/painel/pedidos', icone: '🛒', label: 'Pedidos' },
    { rota: '/painel/usuarios', icone: '👥', label: 'Usuários' },
    // { rota: '/painel/sobre', icone: '📄', label: 'Sobre Nós' },
  ];
}
