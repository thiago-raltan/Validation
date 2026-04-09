import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/servicos/auth.service';
import { EnderecoUsuario, Usuario } from '../../core/modelos/usuario.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  carregando = true;
  salvando = false;
  erro = '';
  sucesso = '';
  indiceEnderecoPendenteExclusao: number | null = null;

  formulario: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    enderecos: this.fb.array([]),
  });

  ngOnInit(): void {
    this.carregarPerfil();
  }

  get enderecos(): FormArray<FormGroup> {
    return this.formulario.get('enderecos') as FormArray<FormGroup>;
  }

  adicionarEndereco(): void {
    if (this.enderecos.length >= 3) {
      return;
    }

    const endereco = this.criarFormularioEndereco();
    if (this.enderecos.length === 0) {
      endereco.patchValue({ principal: true });
    }
    this.enderecos.push(endereco);
  }

  solicitarRemocaoEndereco(indice: number): void {
    this.indiceEnderecoPendenteExclusao = indice;
  }

  cancelarRemocaoEndereco(): void {
    this.indiceEnderecoPendenteExclusao = null;
  }

  confirmarRemocaoEndereco(): void {
    if (this.indiceEnderecoPendenteExclusao == null) {
      return;
    }

    const indice = this.indiceEnderecoPendenteExclusao;
    const eraPrincipal = this.enderecos.at(indice)?.get('principal')?.value === true;
    this.enderecos.removeAt(indice);
    this.indiceEnderecoPendenteExclusao = null;

    if (eraPrincipal && this.enderecos.length > 0) {
      this.definirPrincipal(0);
    }
  }

  get enderecoPendenteExclusao(): string {
    if (this.indiceEnderecoPendenteExclusao == null) {
      return '';
    }

    const titulo = this.enderecos.at(this.indiceEnderecoPendenteExclusao)?.get('titulo')?.value;
    return String(titulo || 'este endereco');
  }

  definirPrincipal(indiceSelecionado: number): void {
    this.enderecos.controls.forEach((endereco, indice) => {
      endereco.get('principal')?.setValue(indice === indiceSelecionado);
    });
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.salvando = true;
    this.erro = '';
    this.sucesso = '';

    const valor = this.formulario.getRawValue() as {
      nome: string;
      email: string;
      enderecos: EnderecoUsuario[];
    };

    this.authService
      .atualizarPerfil({
        nome: valor.nome,
        email: valor.email,
        enderecos: valor.enderecos.map((endereco, indice) => ({
          ...endereco,
          id: endereco.id || indice + 1,
          titulo: endereco.titulo?.trim() || `Endereco ${indice + 1}`,
          uf: endereco.uf.toUpperCase(),
        })),
      })
      .subscribe({
        next: (perfil) => {
          this.hidratarFormulario(perfil);
          this.salvando = false;
          this.sucesso = 'Perfil atualizado com sucesso.';
        },
        error: () => {
          this.salvando = false;
          this.erro = 'Nao foi possivel atualizar seu perfil agora.';
        },
      });
  }

  campoInvalido(caminho: string): boolean {
    const controle = this.formulario.get(caminho);
    return !!(controle?.invalid && (controle.dirty || controle.touched));
  }

  campoEnderecoInvalido(indice: number, campo: string): boolean {
    const controle = this.enderecos.at(indice)?.get(campo);
    return !!(controle?.invalid && (controle.dirty || controle.touched));
  }

  private carregarPerfil(): void {
    this.authService.obterPerfil().subscribe({
      next: (perfil) => {
        this.hidratarFormulario(perfil);
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Nao foi possivel carregar os dados do seu perfil.';
      },
    });
  }

  private hidratarFormulario(perfil: Usuario): void {
    this.formulario.patchValue({
      nome: perfil.nome,
      email: perfil.email,
    });

    this.enderecos.clear();
    const enderecos = perfil.enderecos?.length ? perfil.enderecos : [];

    for (const endereco of enderecos) {
      this.enderecos.push(this.criarFormularioEndereco(endereco));
    }

    if (this.enderecos.length === 0) {
      this.adicionarEndereco();
    }
  }

  private criarFormularioEndereco(endereco?: Partial<EnderecoUsuario>): FormGroup {
    return this.fb.group({
      id: [endereco?.id ?? 0],
      titulo: [endereco?.titulo ?? '', [Validators.required, Validators.maxLength(30)]],
      cep: [endereco?.cep ?? '', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      logradouro: [endereco?.logradouro ?? '', Validators.required],
      numero: [endereco?.numero ?? '', Validators.required],
      complemento: [endereco?.complemento ?? ''],
      bairro: [endereco?.bairro ?? '', Validators.required],
      cidade: [endereco?.cidade ?? '', Validators.required],
      uf: [endereco?.uf ?? '', [Validators.required, Validators.maxLength(2)]],
      principal: [endereco?.principal ?? false],
    });
  }
}