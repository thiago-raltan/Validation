import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CarrinhoService } from '../../../core/servicos/carrinho.service';
import { AuthService } from '../../../core/servicos/auth.service';
import { AdminAuthService } from '../../../core/servicos/admin-auth.service';

/**
 * Componente do cabeçalho da aplicação.
 * Exibe a logo, navegação principal e ícone do carrinho.
 */
@Component({
  selector: 'app-cabecalho',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './cabecalho.component.html',
  styleUrls: ['./cabecalho.component.scss'],
})
export class CabecalhoComponent {
  private carrinhoService = inject(CarrinhoService);
  readonly authService = inject(AuthService);
  readonly adminAuthService = inject(AdminAuthService);

  /** Quantidade de itens no carrinho para exibir no badge */
  readonly quantidadeCarrinho = computed(() =>
    this.carrinhoService.quantidadeTotal()
  );

  /** Controla abertura do menu mobile */
  menuAberto = false;
  confirmarSaidaAberta = false;
  menuPerfilAberto = false;

  /** Alterna o estado do menu mobile */
  alternarMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  /** Fecha o menu ao clicar em um link */
  fecharMenu(): void {
    this.menuAberto = false;
    this.menuPerfilAberto = false;
  }

  /** Retorna o primeiro nome do usuário logado */
  get primeiroNome(): string {
    return this.authService.usuario()?.nome?.split(' ')[0] ?? '';
  }

  alternarMenuPerfil(): void {
    this.menuPerfilAberto = !this.menuPerfilAberto;
  }

  fecharMenuPerfil(): void {
    this.menuPerfilAberto = false;
  }

  solicitarLogout(): void {
    this.menuPerfilAberto = false;
    this.confirmarSaidaAberta = true;
  }

  fecharConfirmacaoLogout(): void {
    this.confirmarSaidaAberta = false;
  }

  /** Realiza logout do usuário/admin */
  logout(): void {
    this.confirmarSaidaAberta = false;

    if (this.adminAuthService.autenticado()) {
      this.adminAuthService.logout();
      this.fecharMenu();
      return;
    }

    this.authService.logout();
    this.fecharMenu();
  }
}
