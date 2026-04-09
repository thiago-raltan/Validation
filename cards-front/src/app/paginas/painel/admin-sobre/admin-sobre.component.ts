import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SobreService } from '../../../core/servicos/sobre.service';
import { SobreConteudo } from '../../../core/modelos/sobre.model';

/** Gerenciamento do conteúdo da página Sobre Nós no painel admin */
@Component({
  selector: 'app-admin-sobre',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-sobre.component.html',
  styleUrls: ['./admin-sobre.component.scss'],
})
export class AdminSobreComponent implements OnInit {
  private sobreService = inject(SobreService);
  private fb = inject(FormBuilder);

  sucesso = false;

  formulario: FormGroup = this.fb.group({
    titulo: ['', Validators.required],
    subtitulo: ['', Validators.required],
    missao: ['', Validators.required],
    vantagens: this.fb.array([]),
    numeros: this.fb.array([]),
    contato: this.fb.group({
      email: ['', Validators.required],
      telefone: ['', Validators.required],
      horario: ['', Validators.required],
    }),
  });

  get vantagens(): FormArray {
    return this.formulario.get('vantagens') as FormArray;
  }

  get numeros(): FormArray {
    return this.formulario.get('numeros') as FormArray;
  }

  ngOnInit(): void {
    this.preencherFormulario(this.sobreService.conteudo());
  }

  adicionarVantagem(): void {
    this.vantagens.push(this.criarGrupoVantagem('', '', ''));
  }

  removerVantagem(index: number): void {
    if (this.vantagens.length > 1) {
      this.vantagens.removeAt(index);
    }
  }

  adicionarNumero(): void {
    this.numeros.push(this.criarGrupoNumero('', ''));
  }

  removerNumero(index: number): void {
    if (this.numeros.length > 1) {
      this.numeros.removeAt(index);
    }
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.sucesso = false;
    this.sobreService.salvar(this.formulario.value as SobreConteudo);
    this.sucesso = true;
    setTimeout(() => (this.sucesso = false), 3000);
  }

  restaurarPadrao(): void {
    if (!confirm('Restaurar o conteúdo padrão da página Sobre? As alterações serão perdidas.')) return;
    this.sobreService.restaurarPadrao();
    this.preencherFormulario(this.sobreService.conteudo());
  }

  private preencherFormulario(conteudo: SobreConteudo): void {
    this.formulario.patchValue({
      titulo: conteudo.titulo,
      subtitulo: conteudo.subtitulo,
      missao: conteudo.missao,
      contato: conteudo.contato,
    });

    this.vantagens.clear();
    conteudo.vantagens.forEach((v) => {
      this.vantagens.push(this.criarGrupoVantagem(v.icone, v.titulo, v.descricao));
    });

    this.numeros.clear();
    conteudo.numeros.forEach((n) => {
      this.numeros.push(this.criarGrupoNumero(n.valor, n.rotulo));
    });
  }

  private criarGrupoVantagem(icone: string, titulo: string, descricao: string): FormGroup {
    return this.fb.group({
      icone: [icone, Validators.required],
      titulo: [titulo, Validators.required],
      descricao: [descricao, Validators.required],
    });
  }

  private criarGrupoNumero(valor: string, rotulo: string): FormGroup {
    return this.fb.group({
      valor: [valor, Validators.required],
      rotulo: [rotulo, Validators.required],
    });
  }
}
