import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/servicos/auth.service';
import { TemaService } from '../../core/servicos/tema.service';
import { MARCA_CONFIG } from '../../core/config/marca.config';

/** Página de login / cadastro do usuário comum da loja */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly temaService = inject(TemaService);
  readonly slogan = MARCA_CONFIG.slogan;

  /** Alterna entre login e cadastro */
  modoAtivo: 'login' | 'cadastro' = 'login';
  carregando = false;
  erro = '';
  sucesso = '';

  formularioLogin: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  formularioCadastro: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  alternarModo(modo: 'login' | 'cadastro'): void {
    this.modoAtivo = modo;
    this.erro = '';
    this.sucesso = '';
  }

  submeterLogin(): void {
    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }
    this.carregando = true;
    this.erro = '';

    this.authService.login(this.formularioLogin.value).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.erro = 'Email ou senha incorretos. Tente novamente.';
        this.carregando = false;
      },
    });
  }

  submeterCadastro(): void {
    if (this.formularioCadastro.invalid) {
      this.formularioCadastro.markAllAsTouched();
      return;
    }
    this.carregando = true;
    this.erro = '';

    this.authService.registrar(this.formularioCadastro.value).subscribe({
      next: () => {
        this.sucesso = 'Conta criada com sucesso! Bem-vindo(a)!';
        setTimeout(() => this.router.navigate(['/']), 1500);
      },
      error: () => {
        this.erro = 'Não foi possível criar a conta. O email pode já estar em uso.';
        this.carregando = false;
      },
    });
  }

  /** Verifica se campo do formulário de login tem erro */
  campoLoginInvalido(campo: string): boolean {
    const ctrl = this.formularioLogin.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  /** Verifica se campo do formulário de cadastro tem erro */
  campoCadastroInvalido(campo: string): boolean {
    const ctrl = this.formularioCadastro.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
