import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EnderecoUsuario, LoginUsuario, RegistroUsuario, RespostaAuth, Usuario } from '../modelos/usuario.model';
import { FixtureService } from './fixture.service';

/**
 * Serviço de autenticação do usuário comum da loja.
 * Token armazenado em localStorage para persistir entre sessões.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly urlBase = `${environment.apiUrl}/autenticacao`;
  private readonly CHAVE_TOKEN = 'auth_token';
  private readonly CHAVE_USUARIO = 'auth_usuario';
  private readonly CHAVE_PERFIL = 'auth_perfil';

  private _usuario = signal<Usuario | null>(this.carregarPerfilStorage());

  /** Usuário logado (somente leitura) */
  readonly usuario = this._usuario.asReadonly();

  /** Indica se o usuário está autenticado */
  readonly autenticado = computed(() => this._usuario() !== null);

  constructor(private http: HttpClient, private router: Router, private fixtureService: FixtureService) {}

  /** Realiza login do usuário comum */
  login(dados: LoginUsuario): Observable<RespostaAuth> {
    if (this.fixtureService.estaAtivo() && this.fixtureService.ehLoginUsuarioTeste(dados)) {
      return of(this.fixtureService.criarRespostaLoginUsuarioTeste()).pipe(
        tap((resposta) => this.persistirSessao(resposta))
      );
    }

    return this.http.post<RespostaAuth>(`${this.urlBase}/login`, dados).pipe(
      tap((resposta) => this.persistirSessao(resposta))
    );
  }

  /** Registra novo usuário */
  registrar(dados: RegistroUsuario): Observable<RespostaAuth> {
    if (this.fixtureService.estaAtivo()) {
      const resposta: RespostaAuth = {
        token: 'usuario-token-registro-local',
        usuario: {
          id: Date.now(),
          nome: dados.nome,
          email: dados.email,
          perfil: 'usuario',
        },
      };

      return of(resposta).pipe(tap((resultado) => this.persistirSessao(resultado)));
    }

    return this.http.post<RespostaAuth>(`${this.urlBase}/registrar`, dados).pipe(
      tap((resposta) => this.persistirSessao(resposta))
    );
  }

  /** Realiza logout e redireciona para a página de login */
  logout(): void {
    localStorage.removeItem(this.CHAVE_TOKEN);
    localStorage.removeItem(this.CHAVE_USUARIO);
    localStorage.removeItem(this.CHAVE_PERFIL);
    this._usuario.set(null);
    this.router.navigate(['/login']);
  }

  /** Retorna o token JWT armazenado */
  obterToken(): string | null {
    return localStorage.getItem(this.CHAVE_TOKEN);
  }

  /** Busca os dados atualizados do perfil do usuário logado */
  obterPerfil(): Observable<Usuario> {
    const usuarioAtual = this._usuario();

    if (this.fixtureService.estaAtivo() && usuarioAtual?.id === 999) {
      const perfilTeste = this.fixtureService.criarPerfilUsuarioTeste();
      this.persistirPerfil(perfilTeste);
      return of(perfilTeste);
    }

    return this.http.get<Usuario>(`${this.urlBase}/perfil`).pipe(
      map((perfil) => this.normalizarPerfil(perfil)),
      tap((perfil) => this.persistirPerfil(perfil)),
      catchError((erro) => {
        const perfilSalvo = this.carregarPerfilStorage();
        if (perfilSalvo) {
          return of(perfilSalvo);
        }

        return throwError(() => erro);
      })
    );
  }

  obterUsuarioAtual(): Usuario | null {
    return this._usuario();
  }

  atualizarPerfil(dados: Partial<Usuario>): Observable<Usuario> {
    const perfilAtual = this._usuario();
    if (!perfilAtual) {
      return throwError(() => new Error('Usuario nao autenticado.'));
    }

    const perfilAtualizado = this.normalizarPerfil({
      ...perfilAtual,
      ...dados,
      id: perfilAtual.id,
      dataCadastro: perfilAtual.dataCadastro,
    });

    if (this.fixtureService.estaAtivo()) {
      this.persistirPerfil(perfilAtualizado);
      return of(perfilAtualizado);
    }

    return this.http.patch<Usuario>(`${this.urlBase}/perfil`, dados).pipe(
      map((perfil) => this.normalizarPerfil({ ...perfilAtualizado, ...perfil })),
      tap((perfil) => this.persistirPerfil(perfil)),
      catchError((erro) => throwError(() => erro))
    );
  }

  private carregarPerfilStorage(): Usuario | null {
    try {
      const perfil = localStorage.getItem(this.CHAVE_PERFIL);
      if (perfil) {
        return this.normalizarPerfil(JSON.parse(perfil) as Usuario);
      }

      const usuario = localStorage.getItem(this.CHAVE_USUARIO);
      if (usuario) {
        return this.normalizarPerfil(JSON.parse(usuario) as Partial<Usuario>);
      }

      return null;
    } catch {
      return null;
    }
  }

  private persistirSessao(resposta: RespostaAuth): void {
    localStorage.setItem(this.CHAVE_TOKEN, resposta.token);
    const perfilExistente = this.carregarPerfilStorage();
    const perfil = this.normalizarPerfil({
      ...perfilExistente,
      id: resposta.usuario.id,
      nome: resposta.usuario.nome,
      email: resposta.usuario.email ?? perfilExistente?.email ?? '',
      enderecos:
        this.fixtureService.estaAtivo() && resposta.usuario.id === 999
          ? this.fixtureService.criarEnderecosTeste()
          : perfilExistente?.enderecos,
    });

    this.persistirPerfil(perfil);
  }

  private persistirPerfil(perfil: Usuario): void {
    const perfilNormalizado = this.normalizarPerfil(perfil);
    localStorage.setItem(this.CHAVE_USUARIO, JSON.stringify(perfilNormalizado));
    localStorage.setItem(this.CHAVE_PERFIL, JSON.stringify(perfilNormalizado));
    this._usuario.set(perfilNormalizado);
  }

  private normalizarPerfil(perfil: Partial<Usuario>): Usuario {
    return {
      id: Number(perfil.id ?? 0),
      nome: this.normalizarNomePerfil(String(perfil.nome ?? 'Usuario')),
      email: this.normalizarEmailPerfil(String(perfil.email ?? '')),
      ativo: perfil.ativo ?? true,
      dataCadastro: String(perfil.dataCadastro ?? new Date().toISOString()),
      totalPedidos: perfil.totalPedidos,
      enderecos: this.normalizarEnderecos(perfil.enderecos ?? []),
    };
  }

  private normalizarEnderecos(enderecos: EnderecoUsuario[]): EnderecoUsuario[] {
    return enderecos
      .slice(0, 3)
      .map((endereco, indice) => ({
        id: Number(endereco.id ?? indice + 1),
        titulo: String(endereco.titulo ?? `Endereco ${indice + 1}`),
        cep: String(endereco.cep ?? ''),
        logradouro: String(endereco.logradouro ?? ''),
        numero: String(endereco.numero ?? ''),
        complemento: endereco.complemento ? String(endereco.complemento) : undefined,
        bairro: String(endereco.bairro ?? ''),
        cidade: String(endereco.cidade ?? ''),
        uf: String(endereco.uf ?? '').toUpperCase(),
        principal: endereco.principal ?? indice === 0,
      }));
  }

  private normalizarNomePerfil(nome: string): string {
    return nome === 'Usuario Teste' || nome === 'Usuario local' ? 'Ana Martins' : nome;
  }

  private normalizarEmailPerfil(email: string): string {
    if (email === 'teste@teste.com' || email === 'local@cartasvegeta.dev' || email === 'usuario@cartasvegeta.dev') {
      return 'ana.martins@cartasvegeta.com';
    }

    return email;
  }

}
