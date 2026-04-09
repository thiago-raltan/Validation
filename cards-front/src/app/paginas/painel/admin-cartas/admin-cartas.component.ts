import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { finalize, of, switchMap } from 'rxjs';
import { AdminCartaService } from '../../../core/servicos/admin-carta.service';
import { AdminColecaoService } from '../../../core/servicos/admin-colecao.service';
import { Carta, RARIDADES_CARTA_SUGERIDAS } from '../../../core/modelos/carta.model';
import { Colecao } from '../../../core/modelos/colecao.model';

/** Gerenciamento de cartas no painel admin */
@Component({
  selector: 'app-admin-cartas',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './admin-cartas.component.html',
  styleUrls: ['./admin-cartas.component.scss'],
})
export class AdminCartasComponent implements OnInit, OnDestroy {
  private cartaService = inject(AdminCartaService);
  private colecaoService = inject(AdminColecaoService);
  private fb = inject(FormBuilder);

  cartas = signal<Carta[]>([]);
  colecoes = signal<Colecao[]>([]);
  carregando = signal(true);
  modalAberto = signal(false);
  editando = signal<Carta | null>(null);
  salvando = signal(false);
  buscaTexto = signal('');
  arquivoImagem = signal<File | null>(null);
  previewImagem = signal('');
  erroImagem = signal('');

  readonly raridadesSugeridas = RARIDADES_CARTA_SUGERIDAS;

  formulario: FormGroup = this.fb.group({
    nome: ['', Validators.required],
    descricao: ['', Validators.required],
    preco: [0, [Validators.required, Validators.min(0)]],
    raridade: ['', Validators.required],
    tipo: ['', Validators.required],
    conjuntoId: [null, Validators.required],
    imagemUrl: ['', Validators.required],
    quantidadeEstoque: [0, [Validators.required, Validators.min(0)]],
    numero: ['', Validators.required],
    codigoColecao: ['', Validators.required],
    artista: [''],
    hp: [null],
    destaque: [false],
  });

  ngOnInit(): void {
    this.carregarDados();
  }

  ngOnDestroy(): void {
    this.limparPreviewImagem();
  }

  private carregarDados(): void {
    this.carregando.set(true);
    this.cartaService.listar({ itensPorPagina: 100 }).subscribe({
      next: (res) => {
        this.cartas.set(res.dados);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
    this.colecaoService.listar().subscribe({
      next: (cols) => this.colecoes.set(cols),
    });
  }

  cartasFiltradas(): Carta[] {
    const busca = this.buscaTexto().toLowerCase();
    if (!busca) return this.cartas();
    return this.cartas().filter((c) => c.nome.toLowerCase().includes(busca));
  }

  identificacaoCarta(carta: Carta): string {
    return [carta.numero, carta.codigoColecao].filter(Boolean).join(' • ');
  }

  abrirNovaCarta(): void {
    this.editando.set(null);
    this.resetarEstadoImagem();
    this.formulario.reset(this.valorInicialFormulario());
    this.modalAberto.set(true);
  }

  abrirEditar(carta: Carta): void {
    this.editando.set(carta);
    this.resetarEstadoImagem();
    this.formulario.reset(this.valorInicialFormulario());
    this.formulario.patchValue(carta);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.resetarEstadoImagem();
    this.modalAberto.set(false);
  }

  selecionarImagem(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;

    this.erroImagem.set('');

    if (!arquivo) {
      this.arquivoImagem.set(null);
      this.limparPreviewImagem();
      return;
    }

    if (!arquivo.type.startsWith('image/')) {
      input.value = '';
      this.arquivoImagem.set(null);
      this.limparPreviewImagem();
      this.erroImagem.set('Selecione um arquivo de imagem válido.');
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      input.value = '';
      this.arquivoImagem.set(null);
      this.limparPreviewImagem();
      this.erroImagem.set('A imagem deve ter no máximo 5 MB.');
      return;
    }

    this.arquivoImagem.set(arquivo);
    this.definirPreviewImagem(URL.createObjectURL(arquivo));
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

  imagemPreviewAtual(): string {
    return this.previewImagem() || this.formulario.get('imagemUrl')?.value || '';
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const imagemAtual = String(this.formulario.get('imagemUrl')?.value ?? '');
    if (!this.arquivoImagem() && !imagemAtual) {
      this.erroImagem.set('Envie uma imagem para a carta antes de salvar.');
      return;
    }

    this.salvando.set(true);
    const carta = this.editando();

    const upload$ = this.arquivoImagem()
      ? this.cartaService.uploadImagem(this.arquivoImagem()!)
      : of(imagemAtual);

    upload$
      .pipe(
        switchMap((imagemUrl) => {
          if (!imagemUrl) {
            throw new Error('Upload da imagem não retornou uma URL válida.');
          }

          const dados = this.montarPayload(imagemUrl);
          return carta
            ? this.cartaService.atualizar(carta.id, dados)
            : this.cartaService.criar(dados);
        }),
        finalize(() => this.salvando.set(false)),
      )
      .subscribe({
        next: () => {
          this.fecharModal();
          this.carregarDados();
        },
        error: () => {
          this.erroImagem.set('Não foi possível enviar a imagem. Verifique a API de upload.');
        },
      });
  }

  remover(carta: Carta): void {
    if (!confirm(`Remover "${carta.nome}"?`)) return;
    this.cartaService.remover(carta.id).subscribe({
      next: () => this.carregarDados(),
    });
  }

  atualizarBusca(event: Event): void {
    this.buscaTexto.set((event.target as HTMLInputElement).value);
  }

  private montarPayload(imagemUrl: string): Partial<Carta> {
    const dados = this.formulario.getRawValue();
    const conjuntoId = Number(dados.conjuntoId);
    const colecao = this.colecoes().find((item) => item.id === conjuntoId);

    return {
      ...dados,
      imagemUrl,
      nome: dados.nome.trim(),
      descricao: dados.descricao.trim(),
      raridade: dados.raridade.trim(),
      tipo: dados.tipo.trim(),
      numero: dados.numero.trim(),
      codigoColecao: dados.codigoColecao.trim().toUpperCase(),
      artista: dados.artista?.trim() || undefined,
      hp: dados.hp || undefined,
      conjuntoId,
      conjunto: colecao?.nome ?? this.editando()?.conjunto ?? '',
    };
  }

  private valorInicialFormulario() {
    return {
      nome: '',
      descricao: '',
      preco: 0,
      raridade: '',
      tipo: '',
      conjuntoId: null,
      imagemUrl: '',
      quantidadeEstoque: 0,
      numero: '',
      codigoColecao: '',
      artista: '',
      hp: null,
      destaque: false,
    };
  }

  private resetarEstadoImagem(): void {
    this.arquivoImagem.set(null);
    this.erroImagem.set('');
    this.limparPreviewImagem();
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
}
