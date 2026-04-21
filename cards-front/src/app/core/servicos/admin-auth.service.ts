import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap, throwError } from 'rxjs';
import {
  LoginAdmin,
  PerfilAdmin,
  RespostaAuth,
  ROTULOS_PERFIL_ADMIN,
  UsuarioAdmin,
  obterPermissoesAdmin,
} from '../modelos/usuario.model';
import { FixtureService } from './fixture.service';

/**
 * Serviço de autenticação do administrador.
 * Token armazenado em sessionStorage (limpo ao fechar o browser/aba).
 * Totalmente separado do AuthService do usuário comum.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly CHAVE_TOKEN = 'admin_token';
  private readonly CHAVE_ADMIN = 'admin_dados';

  private _adminAtual = signal<RespostaAuth['usuario'] | null>(this.carregarAdminAtual());

  /** Indica se o admin está autenticado */
  readonly autenticado = computed(() => this._adminAtual() !== null);

  /** Dados do admin logado */
  readonly adminAtual = this._adminAtual.asReadonly();

  /** Nome do admin logado */
  readonly nomeAdmin = computed(() => this._adminAtual()?.nome ?? '');

  /** Perfil do admin logado */
  readonly perfilAdmin = computed<PerfilAdmin | null>(() => {
    const perfil = this._adminAtual()?.perfil;
    return perfil && perfil !== 'usuario' ? perfil : null;
  });

  /** Rotulo amigavel do perfil atual */
  readonly rotuloPerfilAdmin = computed(() => {
    const perfil = this.perfilAdmin();
    return perfil ? ROTULOS_PERFIL_ADMIN[perfil] : '';
  });

  /** Permissoes do perfil logado */
  readonly permissoesAdmin = computed(() => {
    const perfil = this.perfilAdmin();
    return perfil ? obterPermissoesAdmin(perfil) : null;
  });

  constructor(private router: Router, private fixtureService: FixtureService) {}

  /** Realiza login do administrador */
  login(dados: LoginAdmin): Observable<RespostaAuth> {
    const resposta = this.fixtureService.autenticarAdminTeste(dados);
    if (resposta) {
      return of(resposta).pipe(
        tap((resposta) => this.persistirSessao(resposta))
      );
    }

    return throwError(() => new Error('Credenciais invalidas. Verifique usuario e senha.'));
  }

  /** Realiza logout do admin e redireciona para o login do painel */
  logout(): void {
    sessionStorage.removeItem(this.CHAVE_TOKEN);
    sessionStorage.removeItem(this.CHAVE_ADMIN);
    this._adminAtual.set(null);
    this.router.navigate(['/painel']);
  }

  /** Retorna o token JWT de admin */
  obterToken(): string | null {
    return sessionStorage.getItem(this.CHAVE_TOKEN);
  }

  podeCriarUsuarios(): boolean {
    return this.permissoesAdmin()?.podeCadastrar ?? false;
  }

  podeAtribuirPerfil(perfilDestino: PerfilAdmin, alvoAtual?: UsuarioAdmin | null): boolean {
    const perfilAtual = this.perfilAdmin();
    if (!perfilAtual) {
      return false;
    }

    if (perfilAtual === 'desenvolvedor') {
      return true;
    }

    if (perfilAtual === 'administrador') {
      if (alvoAtual?.perfil === 'desenvolvedor') {
        return false;
      }

      return perfilDestino !== 'desenvolvedor';
    }

    return !alvoAtual && perfilDestino === 'mantenedor';
  }

  podeEditarUsuario(alvo: UsuarioAdmin, perfilDestino = alvo.perfil): boolean {
    const perfilAtual = this.perfilAdmin();
    if (!perfilAtual) {
      return false;
    }

    if (perfilAtual === 'desenvolvedor') {
      return true;
    }

    if (perfilAtual === 'administrador') {
      return alvo.perfil !== 'desenvolvedor' && perfilDestino !== 'desenvolvedor';
    }

    return false;
  }

  podeExcluirUsuario(alvo: UsuarioAdmin): boolean {
    const perfilAtual = this.perfilAdmin();
    const adminAtual = this._adminAtual();
    if (!perfilAtual || !adminAtual || adminAtual.id === alvo.id) {
      return false;
    }

    if (perfilAtual === 'desenvolvedor') {
      return true;
    }

    if (perfilAtual === 'administrador') {
      return alvo.perfil !== 'desenvolvedor';
    }

    return false;
  }

  podeGerenciarAparencia(): boolean {
    return this.permissoesAdmin()?.podeGerenciarAparencia ?? false;
  }

  sincronizarUsuarioAdmin(usuario: UsuarioAdmin): void {
    const adminAtual = this._adminAtual();
    if (!adminAtual || adminAtual.id !== usuario.id) {
      return;
    }

    const atualizado: RespostaAuth['usuario'] = {
      ...adminAtual,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };

    sessionStorage.setItem(this.CHAVE_ADMIN, JSON.stringify(atualizado));
    this._adminAtual.set(atualizado);
  }

  private carregarAdminAtual(): RespostaAuth['usuario'] | null {
    try {
      const token = sessionStorage.getItem(this.CHAVE_TOKEN);
      const dados = sessionStorage.getItem(this.CHAVE_ADMIN);
      return token && dados ? this.normalizarAdmin(JSON.parse(dados) as RespostaAuth['usuario']) : null;
    } catch {
      return null;
    }
  }

  private persistirSessao(resposta: RespostaAuth): void {
    const usuario = this.normalizarAdmin(resposta.usuario);
    sessionStorage.setItem(this.CHAVE_TOKEN, resposta.token);
    sessionStorage.setItem(this.CHAVE_ADMIN, JSON.stringify(usuario));
    this._adminAtual.set(usuario);
  }

  private normalizarAdmin(admin: RespostaAuth['usuario']): RespostaAuth['usuario'] {
    const nomes: Record<string, string> = {
      'Thiago Dev': 'Thiago Almeida',
    };
    const emails: Record<string, string> = {
      'dev@triade.local': 'thiago.almeida@triade.com.br',
      'admin@triade.local': 'marina.costa@triade.com.br',
      'mantenedor@triade.local': 'pedro.conteudo@triade.com.br',
    };

    return {
      ...admin,
      nome: nomes[admin.nome] ?? admin.nome,
      email: admin.email ? (emails[admin.email] ?? admin.email) : admin.email,
    };
  }
}
