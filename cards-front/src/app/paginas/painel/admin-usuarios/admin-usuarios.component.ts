import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/servicos/admin.service';
import { AdminAuthService } from '../../../core/servicos/admin-auth.service';
import { PERFIS_ADMIN, PerfilAdmin, ROTULOS_PERFIL_ADMIN, UsuarioAdmin } from '../../../core/modelos/usuario.model';
import { DatePipe } from '@angular/common';

/** Gerenciamento de usuários no painel admin */
@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.scss'],
})
export class AdminUsuariosComponent implements OnInit {
  private adminService = inject(AdminService);
  protected adminAuth = inject(AdminAuthService);

  usuarios = signal<UsuarioAdmin[]>([]);
  carregando = signal(true);
  pagina = signal(1);
  total = signal(0);
  readonly itensPorPagina = 20;

  readonly perfis = PERFIS_ADMIN;
  readonly rotulosPerfil = ROTULOS_PERFIL_ADMIN;

  usuarioEdicao = signal<UsuarioAdmin | null>(null);
  modalAberto = signal(false);
  modoModal = signal<'criar' | 'editar'>('criar');
  salvando = signal(false);
  erro = signal('');
  sucesso = signal('');

  formulario = {
    nome: '',
    email: '',
    perfil: 'mantenedor' as PerfilAdmin,
    ativo: true,
    observacao: '',
  };

  ngOnInit(): void { this.carregarDados(); }

  carregarDados(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.adminService.listarUsuarios(this.pagina(), this.itensPorPagina).subscribe({
      next: (res) => {
        this.usuarios.set(res.dados);
        this.total.set(res.total);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Nao foi possivel carregar os usuarios do painel.');
      },
    });
  }

  abrirCriacao(): void {
    this.modoModal.set('criar');
    this.usuarioEdicao.set(null);
    this.formulario = {
      nome: '',
      email: '',
      perfil: this.perfisPermitidos()[0] ?? 'mantenedor',
      ativo: true,
      observacao: '',
    };
    this.erro.set('');
    this.modalAberto.set(true);
  }

  abrirEdicao(usuario: UsuarioAdmin): void {
    if (!this.podeEditar(usuario)) {
      return;
    }

    this.modoModal.set('editar');
    this.usuarioEdicao.set({ ...usuario });
    this.formulario = {
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
      observacao: usuario.observacao ?? '',
    };
    this.erro.set('');
    this.modalAberto.set(true);
  }

  fecharEdicao(): void {
    this.usuarioEdicao.set(null);
    this.modalAberto.set(false);
  }

  salvarEdicao(): void {
    const nome = this.formulario.nome.trim();
    const email = this.formulario.email.trim().toLowerCase();
    if (!nome || !email) {
      this.erro.set('Preencha nome e e-mail para continuar.');
      return;
    }

    this.salvando.set(true);
    this.erro.set('');
    this.sucesso.set('');

    const requisicao = this.modoModal() === 'criar'
      ? this.adminService.criarUsuario({
          nome,
          email,
          perfil: this.formulario.perfil,
          ativo: this.formulario.ativo,
          observacao: this.formulario.observacao.trim() || undefined,
        })
      : this.adminService.atualizarUsuario(this.usuarioEdicao()!.id, {
          nome,
          email,
          perfil: this.formulario.perfil,
          ativo: this.formulario.ativo,
          observacao: this.formulario.observacao.trim() || undefined,
        });

    requisicao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.sucesso.set(this.modoModal() === 'criar' ? 'Usuario cadastrado com sucesso.' : 'Usuario atualizado com sucesso.');
        this.fecharEdicao();
        this.carregarDados();
      },
      error: (erro: Error) => {
        this.salvando.set(false);
        this.erro.set(erro.message || 'Nao foi possivel salvar o usuario.');
      },
    });
  }

  remover(usuario: UsuarioAdmin): void {
    if (!this.podeExcluir(usuario)) {
      return;
    }

    if (!confirm(`Remover o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`)) return;
    this.adminService.removerUsuario(usuario.id).subscribe({
      next: () => {
        this.sucesso.set('Usuario removido com sucesso.');
        this.carregarDados();
      },
      error: (erro: Error) => this.erro.set(erro.message || 'Nao foi possivel remover o usuario.'),
    });
  }

  podeCriar(): boolean {
    return this.adminAuth.podeCriarUsuarios();
  }

  podeEditar(usuario: UsuarioAdmin): boolean {
    return this.adminAuth.podeEditarUsuario(usuario);
  }

  podeExcluir(usuario: UsuarioAdmin): boolean {
    return this.adminAuth.podeExcluirUsuario(usuario);
  }

  perfisPermitidos(): PerfilAdmin[] {
    const alvo = this.modoModal() === 'editar' ? this.usuarioEdicao() : null;
    return this.perfis.filter((perfil) => this.adminAuth.podeAtribuirPerfil(perfil, alvo));
  }

  rotuloPerfil(perfil: PerfilAdmin): string {
    return this.rotulosPerfil[perfil];
  }

  descricaoPermissoes(): string {
    const perfil = this.adminAuth.perfilAdmin();
    if (perfil === 'desenvolvedor') {
      return 'Acesso total ao painel, incluindo recursos futuros de identidade visual e manutencao global.';
    }

    if (perfil === 'administrador') {
      return 'Pode operar o painel inteiro e gerenciar usuarios, exceto recursos exclusivos de desenvolvedor.';
    }

    return 'Pode cadastrar usuarios e consultar o painel, mas nao pode excluir nem editar perfis existentes.';
  }

  totalPaginas(): number {
    return Math.ceil(this.total() / this.itensPorPagina);
  }

  irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas()) return;
    this.pagina.set(p);
    this.carregarDados();
  }
}
