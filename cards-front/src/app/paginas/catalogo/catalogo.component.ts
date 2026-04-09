import { ChangeDetectorRef, Component, OnInit, ViewRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { catchError, finalize, of, timeout } from 'rxjs';
import { CartaService } from '../../core/servicos/carta.service';
import { ColecaoService } from '../../core/servicos/colecao.service';
import { CarrinhoService } from '../../core/servicos/carrinho.service';
import { obterMensagemErroApi } from '../../core/servicos/api-error.util';
import { CardCartaComponent } from '../../compartilhado/componentes/card-carta/card-carta.component';
import { Carta, FiltrosCarta } from '../../core/modelos/carta.model';
import { Colecao } from '../../core/modelos/colecao.model';

/**
 * Página de catálogo de cartas com filtros e paginação.
 */
@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [ReactiveFormsModule, CardCartaComponent],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss'],
})
export class CatalogoComponent implements OnInit {
  private cartaService = inject(CartaService);
  private colecaoService = inject(ColecaoService);
  private carrinhoService = inject(CarrinhoService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  cartas: Carta[] = [];
  colecoes: Colecao[] = [];
  tipos: string[] = [];
  raridades: string[] = [];

  totalCartas = 0;
  paginaAtual = 1;
  itensPorPagina = 20;
  totalPaginas = 0;

  carregando = true;
  filtrosAbertos = false;
  mensagemSucesso = '';
  erroCarregamento = '';
  readonly mensagemSemProdutos = 'Aguarde estamos preparando os item, volte novamente amanha';
  readonly mensagemSemResultadoFiltro = 'Nenhuma carta encontrada com os filtros selecionados.';
  readonly mensagemSemOpcoesFiltro = 'Nenhuma opção de filtro disponível no momento.';

  /** Formulário de filtros */
  formularioFiltros!: FormGroup;

  ngOnInit(): void {
    this.inicializarFormulario();
    this.carregarOpcoesFiltros();

    // Verifica se veio com filtro de conjunto pela URL
    this.route.queryParams.subscribe((params) => {
      if (params['conjuntoId']) {
        this.formularioFiltros.patchValue({ conjuntoId: +params['conjuntoId'] });
      }
      this.buscarCartas();
    });
  }

  /** Inicializa o formulário com valores padrão */
  inicializarFormulario(): void {
    this.formularioFiltros = this.fb.group({
      busca: [''],
      conjuntoId: [null],
      tipo: [''],
      raridade: [''],
      precoMin: [null],
      precoMax: [null],
    });

    // Busca automática ao digitar (com debounce de 400ms)
    this.formularioFiltros.get('busca')?.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.paginaAtual = 1;
        this.buscarCartas();
      });

    // Busca imediata ao mudar qualquer filtro de seleção
    ['conjuntoId', 'tipo', 'raridade'].forEach((campo) => {
      this.formularioFiltros.get(campo)?.valueChanges.subscribe(() => {
        this.paginaAtual = 1;
        this.buscarCartas();
      });
    });
  }

  /** Carrega opções para os filtros (coleções, tipos, raridades) */
  carregarOpcoesFiltros(): void {
    this.colecaoService
      .listarColecoes()
      .pipe(timeout(5000), catchError(() => of([] as Colecao[])))
      .subscribe((colecoes) => {
        this.colecoes = colecoes;
        this.atualizarTela();
      });

    this.cartaService
      .buscarTipos()
      .pipe(timeout(5000), catchError(() => of([] as string[])))
      .subscribe((tipos) => {
        this.tipos = tipos;
        this.atualizarTela();
      });

    this.cartaService
      .buscarRaridades()
      .pipe(timeout(5000), catchError(() => of([] as string[])))
      .subscribe((raridades) => {
        this.raridades = raridades;
        this.atualizarTela();
      });
  }

  /** Busca cartas da API com os filtros atuais */
  buscarCartas(): void {
    this.carregando = true;
    this.erroCarregamento = '';
    const valores = this.formularioFiltros.value;

    const filtros: FiltrosCarta = {
      busca: valores.busca || undefined,
      conjuntoId: valores.conjuntoId || undefined,
      tipo: valores.tipo || undefined,
      raridade: valores.raridade || undefined,
      precoMin: valores.precoMin || undefined,
      precoMax: valores.precoMax || undefined,
      pagina: this.paginaAtual,
      itensPorPagina: this.itensPorPagina,
    };

    this.cartaService
      .listarCartas(filtros)
      .pipe(
        timeout(5000),
        catchError((erro) => {
          this.erroCarregamento = obterMensagemErroApi(erro);
          this.atualizarTela();
          return of({ dados: [], total: 0, pagina: this.paginaAtual, itensPorPagina: this.itensPorPagina, totalPaginas: 0 });
        }),
        finalize(() => {
          this.carregando = false;
          this.atualizarTela();
        })
      )
      .subscribe((resposta) => {
        this.cartas = resposta?.dados ?? [];
        this.totalCartas = resposta?.total ?? 0;
        this.totalPaginas = resposta?.totalPaginas ?? 0;
        this.atualizarTela();
      });
  }

  /** Navega para a página informada */
  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaAtual = pagina;
    this.buscarCartas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Retorna os números de páginas para exibir na paginação */
  get paginas(): number[] {
    const inicio = Math.max(1, this.paginaAtual - 2);
    const fim = Math.min(this.totalPaginas, this.paginaAtual + 2);
    return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  }

  /** Limpa todos os filtros */
  limparFiltros(): void {
    this.formularioFiltros.reset();
    this.paginaAtual = 1;
    this.buscarCartas();
  }

  /** Alterna a visibilidade do painel de filtros no mobile */
  alternarFiltros(): void {
    this.filtrosAbertos = !this.filtrosAbertos;
  }

  /** Adiciona carta ao carrinho */
  adicionarAoCarrinho(carta: Carta): void {
    this.carrinhoService.adicionarCarta(carta);
    this.mensagemSucesso = `"${carta.nome}" adicionado ao carrinho!`;
    setTimeout(() => (this.mensagemSucesso = ''), 3000);
  }

  get temFiltrosAtivos(): boolean {
    const valores = this.formularioFiltros?.value ?? {};
    return Boolean(
      valores.busca ||
      valores.conjuntoId ||
      valores.tipo ||
      valores.raridade ||
      valores.precoMin ||
      valores.precoMax
    );
  }

  get mensagemListaVazia(): string {
    return this.temFiltrosAtivos ? this.mensagemSemResultadoFiltro : this.mensagemSemProdutos;
  }

  get semOpcoesDeFiltro(): boolean {
    return this.colecoes.length === 0 && this.tipos.length === 0 && this.raridades.length === 0;
  }

  private atualizarTela(): void {
    if (!(this.cdr as ViewRef).destroyed) {
      this.cdr.detectChanges();
    }
  }
}
