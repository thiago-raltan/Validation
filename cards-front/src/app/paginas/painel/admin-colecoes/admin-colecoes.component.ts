import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import { AdminColecaoService } from '../../../core/servicos/admin-colecao.service';
import { Colecao } from '../../../core/modelos/colecao.model';

/** Gerenciamento de coleções no painel admin */
@Component({
  selector: 'app-admin-colecoes',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './admin-colecoes.component.html',
  styleUrls: ['./admin-colecoes.component.scss'],
})
export class AdminColecoesComponent implements OnInit, OnDestroy {
  private colecaoService = inject(AdminColecaoService);
  private fb = inject(FormBuilder);

  colecoes = signal<Colecao[]>([]);
  carregando = signal(true);
  modalAberto = signal(false);
  editando = signal<Colecao | null>(null);
  salvando = signal(false);
  arquivoImagem = signal<File | null>(null);
  previewImagem = signal('');
  erroImagem = signal('');
  arquivoLogo = signal<File | null>(null);
  previewLogo = signal('');
  erroLogo = signal('');

  formulario: FormGroup = this.fb.group({
    nome: ['', Validators.required],
    descricao: ['', Validators.required],
    serie: ['', Validators.required],
    imagemUrl: ['', Validators.required],
    logoUrl: [''],
    dataLancamento: ['', Validators.required],
  });

  ngOnInit(): void {
    this.carregarDados();
  }

  ngOnDestroy(): void {
    this.limparPreviewImagem();
    this.limparPreviewLogo();
  }

  private carregarDados(): void {
    this.carregando.set(true);
    this.colecaoService.listar().subscribe({
      next: (lista) => {
        this.colecoes.set(lista);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  abrirNova(): void {
    this.editando.set(null);
    this.resetarEstadoImagem();
    this.formulario.reset();
    this.modalAberto.set(true);
  }

  abrirEditar(colecao: Colecao): void {
    this.editando.set(colecao);
    this.resetarEstadoImagem();
    this.formulario.patchValue(colecao);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.resetarEstadoImagem();
    this.modalAberto.set(false);
  }

  selecionarImagem(event: Event): void {
    this.processarArquivo(event, {
      erro: this.erroImagem,
      arquivo: this.arquivoImagem,
      limparPreview: () => this.limparPreviewImagem(),
      definirPreview: (url) => this.definirPreviewImagem(url),
    });
  }

  selecionarLogo(event: Event): void {
    this.processarArquivo(event, {
      erro: this.erroLogo,
      arquivo: this.arquivoLogo,
      limparPreview: () => this.limparPreviewLogo(),
      definirPreview: (url) => this.definirPreviewLogo(url),
    });
  }

  removerImagemSelecionada(input?: HTMLInputElement): void {
    this.arquivoImagem.set(null);
    this.erroImagem.set('');
    this.limparPreviewImagem();
    if (!this.editando()) {
      this.formulario.patchValue({ imagemUrl: '' });
    }
    if (input) {
      input.value = '';
    }
  }

  removerLogoSelecionado(input?: HTMLInputElement): void {
    this.arquivoLogo.set(null);
    this.erroLogo.set('');
    this.limparPreviewLogo();
    if (!this.editando()) {
      this.formulario.patchValue({ logoUrl: '' });
    }
    if (input) {
      input.value = '';
    }
  }

  imagemPreviewAtual(): string {
    return this.previewImagem() || this.formulario.get('imagemUrl')?.value || '';
  }

  logoPreviewAtual(): string {
    return this.previewLogo() || this.formulario.get('logoUrl')?.value || '';
  }

  salvar(): void {
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    const imagemAtual = String(this.formulario.get('imagemUrl')?.value ?? '');
    if (!this.arquivoImagem() && !imagemAtual) {
      this.erroImagem.set('Envie uma imagem para a coleção antes de salvar.');
      return;
    }

    const logoAtual = String(this.formulario.get('logoUrl')?.value ?? '');

    this.salvando.set(true);
    const col = this.editando();

    forkJoin({
      imagemUrl: this.arquivoImagem() ? this.colecaoService.uploadImagem(this.arquivoImagem()!) : of(imagemAtual),
      logoUrl: this.arquivoLogo() ? this.colecaoService.uploadLogo(this.arquivoLogo()!) : of(logoAtual),
    })
      .pipe(
        switchMap(({ imagemUrl, logoUrl }) => {
          const dados = {
            ...this.formulario.getRawValue(),
            imagemUrl,
            logoUrl,
          };
          return col ? this.colecaoService.atualizar(col.id, dados) : this.colecaoService.criar(dados);
        }),
        finalize(() => this.salvando.set(false))
      )
      .subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: () => {
          this.erroImagem.set('Nao foi possivel enviar a imagem ou salvar a colecao.');
        },
      });
  }

  remover(colecao: Colecao): void {
    if (!confirm(`Remover a coleção "${colecao.nome}"?`)) return;
    this.colecaoService.remover(colecao.id).subscribe({ next: () => this.carregarDados() });
  }

  private resetarEstadoImagem(): void {
    this.arquivoImagem.set(null);
    this.erroImagem.set('');
    this.limparPreviewImagem();
    this.arquivoLogo.set(null);
    this.erroLogo.set('');
    this.limparPreviewLogo();
  }

  private definirPreviewImagem(url: string): void {
    this.limparPreviewImagem();
    this.previewImagem.set(url);
  }

  private limparPreviewImagem(): void {
    const previewAtual = this.previewImagem();
    if (previewAtual.startsWith('blob:')) {
      URL.revokeObjectURL(previewAtual);
    }
    this.previewImagem.set('');
  }

  private definirPreviewLogo(url: string): void {
    this.limparPreviewLogo();
    this.previewLogo.set(url);
  }

  private limparPreviewLogo(): void {
    const previewAtual = this.previewLogo();
    if (previewAtual.startsWith('blob:')) {
      URL.revokeObjectURL(previewAtual);
    }
    this.previewLogo.set('');
  }

  private processarArquivo(
    event: Event,
    opcoes: {
      erro: ReturnType<typeof signal<string>>;
      arquivo: ReturnType<typeof signal<File | null>>;
      limparPreview: () => void;
      definirPreview: (url: string) => void;
    },
  ): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;

    opcoes.erro.set('');

    if (!arquivo) {
      opcoes.arquivo.set(null);
      opcoes.limparPreview();
      return;
    }

    if (!arquivo.type.startsWith('image/')) {
      input.value = '';
      opcoes.arquivo.set(null);
      opcoes.limparPreview();
      opcoes.erro.set('Selecione um arquivo de imagem válido.');
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      input.value = '';
      opcoes.arquivo.set(null);
      opcoes.limparPreview();
      opcoes.erro.set('A imagem deve ter no máximo 5 MB.');
      return;
    }

    opcoes.arquivo.set(arquivo);
    opcoes.definirPreview(URL.createObjectURL(arquivo));
  }
}
