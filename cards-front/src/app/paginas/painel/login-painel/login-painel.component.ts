import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../../core/servicos/admin-auth.service';

/** Página de login do painel administrativo (rota /painel) */
@Component({
  selector: 'app-login-painel',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-painel.component.html',
  styleUrls: ['./login-painel.component.scss'],
})
export class LoginPainelComponent {
  private fb = inject(FormBuilder);
  private adminAuth = inject(AdminAuthService);
  private router = inject(Router);

  carregando = false;
  erro = '';

  formulario: FormGroup = this.fb.group({
    usuario: ['', Validators.required],
    senha: ['', Validators.required],
  });

  submeter(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.carregando = true;
    this.erro = '';

    this.adminAuth.login(this.formulario.value).subscribe({
      next: () => {
        this.router.navigate(['/painel/dashboard']);
      },
      error: (erro: Error) => {
        this.erro = erro.message || 'Senha incorreta.';
        this.carregando = false;
      },
    });
  }

  campoInvalido(campo: string): boolean {
    const ctrl = this.formulario.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
