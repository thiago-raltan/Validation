import { ChangeDetectorRef, Component, OnInit, ViewRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { catchError, finalize, of, timeout } from 'rxjs';
import { ProdutoService } from '../../core/servicos/produto.service';
import { CarrinhoService } from '../../core/servicos/carrinho.service';
import { Produto, FiltrosProduto, CategoriaProduto, CATEGORIAS_PRODUTO } from '../../core/modelos/produto.model';
import { RespostaPaginada } from '../../core/modelos/carta.model';
import { obterMensagemErroApi } from '../../core/servicos/api-error.util';
import { aplicarFallbackImagem, obterImagemFallbackProduto } from '../../core/servicos/imagem-fallback.util';

/**
 * Página de produtos da loja (pelúcias, figuras, boxes, acessórios).
 */
@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss'],
})
export class ProdutosComponent implements OnInit {
  private produtoService = inject(ProdutoService);
  private carrinhoService = inject(CarrinhoService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  produtos: Produto[] = [];
  totalProdutos = 0;
  paginaAtual = 1;
  itensPorPagina = 20;
  totalPaginas = 0;

  carregando = true;
  mensagemSucesso = '';
  erroCarregamento = '';
  readonly mensagemSemProdutos = 'Aguarde estamos preparando os item, volte novamente amanha';
  readonly mensagemSemResultadoFiltro = 'Nenhum produto encontrado com os filtros selecionados.';

  readonly categorias = Object.entries(CATEGORIAS_PRODUTO) as [CategoriaProduto, string][];

  formularioFiltros!: FormGroup;

  ngOnInit(): void {
    this.inicializarFormulario();
    this.buscarProdutos();
  }

  inicializarFormulario(): void {
    this.formularioFiltros = this.fb.group({
      busca: [''],
      categoria: [''],
      precoMin: [null],
      precoMax: [null],
    });

    this.formularioFiltros.get('busca')?.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.paginaAtual = 1;
        this.buscarProdutos();
      });

    this.formularioFiltros.get('categoria')?.valueChanges.subscribe(() => {
      this.paginaAtual = 1;
      this.buscarProdutos();
    });
  }

  buscarProdutos(): void {
    this.carregando = true;
    this.erroCarregamento = '';
    const v = this.formularioFiltros.value;

    const filtros: FiltrosProduto = {
      busca: v.busca || undefined,
      categoria: v.categoria || undefined,
      precoMin: v.precoMin || undefined,
      precoMax: v.precoMax || undefined,
      pagina: this.paginaAtual,
      itensPorPagina: this.itensPorPagina,
    };

    this.produtoService
      .listarProdutos(filtros)
      .pipe(
        timeout(5000),
        catchError((erro) => {
          this.erroCarregamento = obterMensagemErroApi(erro);
          this.atualizarTela();
          return of({
            dados: [],
            total: 0,
            pagina: this.paginaAtual,
            itensPorPagina: this.itensPorPagina,
            totalPaginas: 0,
          } as RespostaPaginada<Produto>);
        }),
        finalize(() => {
          this.carregando = false;
          this.atualizarTela();
        })
      )
      .subscribe((resposta) => {
        this.produtos = resposta?.dados ?? [];
        this.totalProdutos = resposta?.total ?? 0;
        this.totalPaginas = resposta?.totalPaginas ?? 0;
        this.atualizarTela();
      });
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaAtual = pagina;
    this.buscarProdutos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get paginas(): number[] {
    const inicio = Math.max(1, this.paginaAtual - 2);
    const fim = Math.min(this.totalPaginas, this.paginaAtual + 2);
    return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  }

  limparFiltros(): void {
    this.formularioFiltros.reset();
    this.paginaAtual = 1;
    this.buscarProdutos();
  }

  adicionarAoCarrinho(produto: Produto, evento?: Event): void {
    evento?.stopPropagation();
    this.carrinhoService.adicionarProduto(produto);
    this.mensagemSucesso = `"${produto.nome}" adicionado ao carrinho!`;
    setTimeout(() => (this.mensagemSucesso = ''), 3000);
  }

  abrirDetalhe(produtoId: number): void {
    this.router.navigate(['/produto', produtoId]);
  }

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);
  }

  labelCategoria(categoria: CategoriaProduto): string {
    return CATEGORIAS_PRODUTO[categoria] ?? categoria;
  }

  imagemFallback(categoria: CategoriaProduto): string {
    return obterImagemFallbackProduto(categoria);
  }

  onErroImagem(evento: Event, categoria: CategoriaProduto): void {
    aplicarFallbackImagem(evento, this.imagemFallback(categoria));
  }

  get temFiltrosAtivos(): boolean {
    const valores = this.formularioFiltros?.value ?? {};
    return Boolean(
      valores.busca ||
      valores.categoria ||
      valores.precoMin ||
      valores.precoMax
    );
  }

  get mensagemListaVazia(): string {
    return this.temFiltrosAtivos ? this.mensagemSemResultadoFiltro : this.mensagemSemProdutos;
  }

  private atualizarTela(): void {
    if (!(this.cdr as ViewRef).destroyed) {
      this.cdr.detectChanges();
    }
  }
}
